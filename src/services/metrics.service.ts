import { supabaseAdmin } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import moment from 'moment';
import {
    GetSessionMetricsParams,
    GetSessionMetricsResponse,
    GetUserMetricsParams,
    GetUserMetricsResponse,
    GetDailyMetricsParams,
    GetDailyMetricsResponse,
    GetSummaryMetricsParams,
    GetSummaryMetricsResponse,
    GetPrefectureMetricsParams,
    GetPrefectureMetricsResponse,
    GetPrefecturesRankingParams,
    GetPrefecturesRankingResponse,
    CleanupMetricsParams,
    CleanupMetricsResponse,
    SessionTokenSummary,
    UserMetricsData,
    DailyMetricsData,
    SummaryMetricsData,
    PrefectureMetricsData,
    PrefectureRankingData,
    DailyBreakdownData,
    UserBreakdownData,
    AgentTypeBreakdownData,
    PeakHourData,
    CostTrendData
} from '../types/metrics.types';

export class MetricsService {
    private readonly logger = logger.child({ service: 'MetricsService' });

    /**
     * Recupera métricas de uma sessão específica
     */
    async getSessionMetrics(params: GetSessionMetricsParams): Promise<GetSessionMetricsResponse> {
        const { sessionId } = params;

        return Promise.resolve()
            .then(async () => {
                // Tenta primeiro do cache Redis
                const cacheKey = `token_session:${sessionId}`;
                const cachedData = await redis.get(cacheKey);

                if (cachedData) {
                    const sessionSummary = JSON.parse(cachedData) as SessionTokenSummary;
                    return {
                        success: true,
                        data: sessionSummary
                    };
                }

                // Se não estiver no cache, busca no banco e reconstrói
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                const { data, error } = await supabaseAdmin
                    .from('message_token_usage')
                    .select('*')
                    .eq('session_id', sessionId)
                    .order('timestamp', { ascending: true });

                if (error) {
                    this.logger.error('Error fetching session summary:', error);
                    return {
                        success: false,
                        error: 'Failed to fetch session data'
                    };
                }

                if (!data || data.length === 0) {
                    return {
                        success: false,
                        error: 'Session not found or no token usage data available'
                    };
                }

                // Reconstrói o resumo da sessão
                const summary: SessionTokenSummary = {
                    session_id: sessionId,
                    user_id: data[0].user_id,
                    prefecture_id: data[0].prefecture_id,
                    agent_type: data[0].agent_type,
                    total_messages: data.length,
                    total_prompt_tokens: data.reduce((sum, item) => sum + item.prompt_tokens, 0),
                    total_completion_tokens: data.reduce((sum, item) => sum + item.completion_tokens, 0),
                    total_tokens: data.reduce((sum, item) => sum + item.total_tokens, 0),
                    total_estimated_cost: data.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
                    session_started_at: data[0].timestamp,
                    session_ended_at: data[data.length - 1].timestamp,
                    average_tokens_per_message: 0
                };

                summary.average_tokens_per_message = Math.round(summary.total_tokens / summary.total_messages);

                // Salva no cache para próximas consultas
                await redis.setEx(cacheKey, 86400, JSON.stringify(summary));

                return {
                    success: true,
                    data: summary
                };

            })
            .catch(error => {
                this.logger.error('Error getting session metrics:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            });
    }

    /**
     * Recupera métricas de um usuário específico
     */
    async getUserMetrics(params: GetUserMetricsParams): Promise<GetUserMetricsResponse> {
        const { userId, days = 30 } = params;

        return Promise.resolve()
            .then(async () => {
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                const startDate = moment().subtract(days, 'days').toISOString();

                const { data, error } = await supabaseAdmin
                    .from('message_token_usage')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('timestamp', startDate)
                    .order('timestamp', { ascending: false });

                if (error) {
                    this.logger.error('Error fetching user usage metrics:', error);
                    return {
                        success: false,
                        error: 'Failed to fetch user data'
                    };
                }

                if (!data || data.length === 0) {
                    return {
                        success: true,
                        data: {
                            user_id: userId,
                            total_tokens: 0,
                            total_cost: 0,
                            message_count: 0,
                            sessions_count: 0,
                            last_activity: null
                        }
                    };
                }

                const uniqueSessions = new Set(data.map(item => item.session_id));

                const userMetrics: UserMetricsData = {
                    user_id: userId,
                    total_tokens: data.reduce((sum, item) => sum + item.total_tokens, 0),
                    total_cost: data.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
                    message_count: data.length,
                    sessions_count: uniqueSessions.size,
                    last_activity: data[0].timestamp,
                    daily_breakdown: this.calculateDailyBreakdown(data)
                };

                return {
                    success: true,
                    data: userMetrics
                };

            })
            .catch(error => {
                this.logger.error('Error getting user metrics:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            });
    }

    /**
     * Recupera métricas diárias agregadas
     */
    async getDailyMetrics(params: GetDailyMetricsParams): Promise<GetDailyMetricsResponse> {
        const { start_date, end_date, prefecture_id } = params;

        return Promise.resolve()
            .then(async () => {
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                const startDate = start_date
                    ? moment(start_date).toISOString()
                    : moment().subtract(7, 'days').toISOString();

                const endDate = end_date
                    ? moment(end_date).toISOString()
                    : moment().toISOString();

                // Buscar dados diários do Supabase usando view
                let query = supabaseAdmin
                    .from('daily_token_usage')
                    .select('*')
                    .gte('usage_date', moment(startDate).format('YYYY-MM-DD'))
                    .lte('usage_date', moment(endDate).format('YYYY-MM-DD'))
                    .order('usage_date', { ascending: false });

                if (prefecture_id) {
                    query = query.eq('prefecture_id', prefecture_id);
                }

                const { data, error } = await query;

                if (error) {
                    this.logger.error('Error fetching daily metrics:', error);
                    return {
                        success: false,
                        error: 'Failed to fetch daily metrics'
                    };
                }

                // Agregar dados por dia
                const dailyAggregated: { [key: string]: any } = {};

                data?.forEach((row: any) => {
                    const date = row.usage_date;

                    if (!dailyAggregated[date]) {
                        dailyAggregated[date] = {
                            date,
                            total_messages: 0,
                            unique_users: new Set(),
                            unique_sessions: new Set(),
                            total_tokens: 0,
                            total_cost: 0,
                            models_used: new Set(),
                            prefectures: new Set()
                        };
                    }

                    dailyAggregated[date].total_messages += row.total_messages;
                    dailyAggregated[date].total_tokens += row.total_tokens;
                    dailyAggregated[date].total_cost += parseFloat(row.total_estimated_cost || 0);
                    dailyAggregated[date].models_used.add(row.model_used);

                    if (row.prefecture_id) {
                        dailyAggregated[date].prefectures.add(row.prefecture_id);
                    }
                });

                // Converter Sets para arrays e calcular contadores
                const result: DailyMetricsData[] = Object.values(dailyAggregated).map((day: any) => ({
                    ...day,
                    unique_users: day.unique_users.size,
                    unique_sessions: day.unique_sessions.size,
                    models_used: Array.from(day.models_used),
                    prefectures: Array.from(day.prefectures),
                    avg_tokens_per_message: day.total_messages > 0
                        ? Math.round(day.total_tokens / day.total_messages)
                        : 0
                }));

                return {
                    success: true,
                    data: result,
                    period: {
                        start_date: startDate,
                        end_date: endDate
                    }
                };

            })
            .catch(error => {
                this.logger.error('Error getting daily metrics:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            });
    }

    /**
     * Recupera resumo geral de métricas
     */
    async getSummaryMetrics(params: GetSummaryMetricsParams): Promise<GetSummaryMetricsResponse> {
        const { days = 30, prefecture_id } = params;

        return Promise.resolve()
            .then(async () => {
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                // Buscar métricas gerais
                let query = supabaseAdmin
                    .rpc('get_usage_metrics', {
                        start_date: moment().subtract(days, 'days').toISOString(),
                        end_date: moment().toISOString(),
                        filter_prefecture_id: prefecture_id || null
                    });

                const { data, error } = await query;

                if (error) {
                    this.logger.error('Error fetching summary metrics:', error);
                    return {
                        success: false,
                        error: 'Failed to fetch summary metrics'
                    };
                }

                const summary: SummaryMetricsData = {
                    ...(data?.[0] || {
                        total_messages: 0,
                        unique_users: 0,
                        unique_sessions: 0,
                        total_tokens: 0,
                        total_cost: 0,
                        avg_tokens_per_message: 0,
                        most_used_model: null,
                        most_active_prefecture: null
                    }),
                    period_days: days,
                    generated_at: moment().toISOString()
                };

                return {
                    success: true,
                    data: summary
                };

            })
            .catch(error => {
                this.logger.error('Error getting summary metrics:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            });
    }

    /**
     * Recupera métricas detalhadas de uma prefeitura específica
     */
    async getPrefectureMetrics(params: GetPrefectureMetricsParams): Promise<GetPrefectureMetricsResponse> {
        const { prefectureId, days = 30 } = params;

        return Promise.resolve()
            .then(async () => {
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                const startDate = moment().subtract(days, 'days').toISOString();

                const { data: prefectureData, error: prefectureError } = await supabaseAdmin
                    .from('message_token_usage')
                    .select('*')
                    .eq('prefecture_id', prefectureId)
                    .gte('timestamp', startDate)
                    .order('timestamp', { ascending: false });

                if (prefectureError) {
                    this.logger.error('Error fetching prefecture metrics:', prefectureError);
                    return {
                        success: false,
                        error: 'Failed to fetch prefecture metrics'
                    };
                }

                if (!prefectureData || prefectureData.length === 0) {
                    return {
                        success: true,
                        data: {
                            prefecture_id: prefectureId,
                            period: `${days} days`,
                            total_messages: 0,
                            unique_users: 0,
                            unique_sessions: 0,
                            total_tokens: 0,
                            total_cost: 0,
                            avg_tokens_per_message: 0,
                            daily_breakdown: [],
                            user_breakdown: [],
                            agent_type_breakdown: [],
                            peak_hours: [],
                            cost_trend: []
                        }
                    };
                }

                // Calcular métricas agregadas
                const uniqueUsers = new Set(prefectureData.map((item: any) => item.user_id));
                const uniqueSessions = new Set(prefectureData.map((item: any) => item.session_id));
                const totalTokens = prefectureData.reduce((sum: number, item: any) => sum + item.total_tokens, 0);
                const totalCost = prefectureData.reduce((sum: number, item: any) => sum + (item.estimated_cost || 0), 0);

                const prefectureMetrics: PrefectureMetricsData = {
                    prefecture_id: prefectureId,
                    period: `${days} days`,
                    total_messages: prefectureData.length,
                    unique_users: uniqueUsers.size,
                    unique_sessions: uniqueSessions.size,
                    total_tokens: totalTokens,
                    total_cost: totalCost,
                    avg_tokens_per_message: Math.round(totalTokens / prefectureData.length),
                    daily_breakdown: this.calculatePrefectureDailyBreakdown(prefectureData),
                    user_breakdown: this.calculateUserBreakdown(prefectureData),
                    agent_type_breakdown: this.calculateAgentTypeBreakdown(prefectureData),
                    peak_hours: this.calculatePeakHours(prefectureData),
                    cost_trend: this.calculateCostTrend(prefectureData)
                };

                return {
                    success: true,
                    data: prefectureMetrics
                };

            })
            .catch(error => {
                this.logger.error('Error getting prefecture metrics:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            });
    }

    /**
     * Recupera ranking das prefeituras por uso
     */
    async getPrefecturesRanking(params: GetPrefecturesRankingParams): Promise<GetPrefecturesRankingResponse> {
        const { days = 30, orderBy = 'tokens' } = params;

        return Promise.resolve()
            .then(async () => {
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                const startDate = moment().subtract(days, 'days').toISOString();

                const { data: rankingData, error: rankingError } = await supabaseAdmin
                    .from('message_token_usage')
                    .select('prefecture_id, total_tokens, estimated_cost')
                    .gte('timestamp', startDate)
                    .not('prefecture_id', 'is', null);

                if (rankingError) {
                    this.logger.error('Error fetching prefectures ranking:', rankingError);
                    return {
                        success: false,
                        error: 'Failed to fetch prefectures ranking'
                    };
                }

                // Agregar por prefeitura
                const prefectureStats: { [key: string]: any } = {};

                rankingData?.forEach((item: any) => {
                    const prefId = item.prefecture_id;
                    if (!prefectureStats[prefId]) {
                        prefectureStats[prefId] = {
                            prefecture_id: prefId,
                            messages: 0,
                            tokens: 0,
                            cost: 0
                        };
                    }
                    prefectureStats[prefId].messages += 1;
                    prefectureStats[prefId].tokens += item.total_tokens;
                    prefectureStats[prefId].cost += (item.estimated_cost || 0);
                });

                // Ordenar conforme solicitado
                let sortedPrefectures = Object.values(prefectureStats) as PrefectureRankingData[];

                switch (orderBy) {
                    case 'cost':
                        sortedPrefectures.sort((a, b) => b.cost - a.cost);
                        break;
                    case 'messages':
                        sortedPrefectures.sort((a, b) => b.messages - a.messages);
                        break;
                    case 'tokens':
                    default:
                        sortedPrefectures.sort((a, b) => b.tokens - a.tokens);
                        break;
                }

                return {
                    success: true,
                    data: {
                        period: `${days} days`,
                        order_by: orderBy,
                        ranking: sortedPrefectures
                    }
                };

            })
            .catch(error => {
                this.logger.error('Error getting prefectures ranking:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            });
    }

    /**
     * Limpa dados antigos de tracking (manutenção)
     */
    async cleanupMetrics(params: CleanupMetricsParams): Promise<CleanupMetricsResponse> {
        const { days_to_keep = 90 } = params;

        return Promise.resolve()
            .then(async () => {
                if (!supabaseAdmin) {
                    this.logger.error('Supabase admin client not initialized');
                    return {
                        success: false,
                        error: 'Database not available'
                    };
                }

                const cutoffDate = moment().subtract(days_to_keep, 'days').toISOString();

                const { error } = await supabaseAdmin
                    .from('message_token_usage')
                    .delete()
                    .lt('timestamp', cutoffDate);

                if (error) {
                    this.logger.error('Error cleaning up old token data:', error);
                    return {
                        success: false,
                        error: 'Failed to cleanup old data'
                    };
                }

                this.logger.info(`Token usage data older than ${days_to_keep} days cleaned up`);

                return {
                    success: true,
                    message: `Token usage data older than ${days_to_keep} days has been cleaned up`
                };

            })
            .catch(error => {
                this.logger.error('Error during token data cleanup:', error);
                return {
                    success: false,
                    error: 'Failed to cleanup old data'
                };
            });
    }

    // Métodos auxiliares privados
    private calculateDailyBreakdown(data: any[]): DailyBreakdownData[] {
        const dailyData: { [key: string]: any } = {};

        data.forEach((item: any) => {
            const date = moment(item.timestamp).format('YYYY-MM-DD');

            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    messages: 0,
                    tokens: 0,
                    cost: 0,
                    unique_users: new Set()
                };
            }

            dailyData[date].messages += 1;
            dailyData[date].tokens += item.total_tokens;
            dailyData[date].cost += (item.estimated_cost || 0);
            dailyData[date].unique_users.add(item.user_id);
        });

        return Object.values(dailyData).map((day: any) => ({
            ...day,
            unique_users: day.unique_users.size
        })).sort((a: any, b: any) => moment(b.date).unix() - moment(a.date).unix());
    }

    private calculatePrefectureDailyBreakdown(data: any[]): DailyBreakdownData[] {
        return this.calculateDailyBreakdown(data);
    }

    private calculateUserBreakdown(data: any[]): UserBreakdownData[] {
        const userBreakdown: { [key: string]: any } = {};

        data.forEach((item: any) => {
            if (!userBreakdown[item.user_id]) {
                userBreakdown[item.user_id] = {
                    user_id: item.user_id,
                    messages: 0,
                    tokens: 0,
                    cost: 0
                };
            }
            userBreakdown[item.user_id].messages += 1;
            userBreakdown[item.user_id].tokens += item.total_tokens;
            userBreakdown[item.user_id].cost += (item.estimated_cost || 0);
        });

        return Object.values(userBreakdown)
            .sort((a: any, b: any) => b.tokens - a.tokens)
            .slice(0, 10);
    }

    private calculateAgentTypeBreakdown(data: any[]): AgentTypeBreakdownData[] {
        const agentTypeBreakdown: { [key: string]: any } = {};

        data.forEach((item: any) => {
            const agentType = item.agent_type || 'UNKNOWN';
            if (!agentTypeBreakdown[agentType]) {
                agentTypeBreakdown[agentType] = {
                    agent_type: agentType,
                    messages: 0,
                    tokens: 0,
                    cost: 0
                };
            }
            agentTypeBreakdown[agentType].messages += 1;
            agentTypeBreakdown[agentType].tokens += item.total_tokens;
            agentTypeBreakdown[agentType].cost += (item.estimated_cost || 0);
        });

        return Object.values(agentTypeBreakdown);
    }

    private calculatePeakHours(data: any[]): PeakHourData[] {
        const hourlyBreakdown: { [key: string]: number } = {};

        data.forEach((item: any) => {
            const hour = moment(item.timestamp).format('HH');
            hourlyBreakdown[hour] = (hourlyBreakdown[hour] || 0) + 1;
        });

        return Object.entries(hourlyBreakdown)
            .map(([hour, count]) => ({ hour: `${hour}:00`, messages: count }))
            .sort((a, b) => b.messages - a.messages)
            .slice(0, 5);
    }

    private calculateCostTrend(data: any[]): CostTrendData[] {
        const dailyBreakdown = this.calculateDailyBreakdown(data);

        return dailyBreakdown
            .slice(0, 7)
            .reverse()
            .map(day => ({
                date: day.date,
                cost: day.cost
            }));
    }
}

export const metricsService = new MetricsService();
