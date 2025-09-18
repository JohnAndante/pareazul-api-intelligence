/**
 * 📊 Token Metrics Routes
 *
 * Rotas para consultar métricas de consumo de tokens
 */

import { Router } from 'express';
import { tokenTrackingService } from '../services/token-tracking.service';
import { webserviceAuth } from '../middleware/auth.middleware';
import { logger } from '../utils/logger.util';
import moment from 'moment';

const router = Router();

/**
 * GET /api/metrics/session/:sessionId
 * Recupera métricas de uma sessão específica
 */
router.get('/session/:sessionId', webserviceAuth, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const sessionSummary = await tokenTrackingService.getSessionSummary(sessionId);

        if (!sessionSummary) {
            return res.status(404).json({
                error: 'Session not found or no token usage data available'
            });
        }

        res.json({
            success: true,
            data: sessionSummary
        });

    } catch (error) {
        logger.error('Error fetching session metrics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/metrics/user/:userId
 * Recupera métricas de um usuário específico
 */
router.get('/user/:userId', webserviceAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;

        const userMetrics = await tokenTrackingService.getUserUsageMetrics(
            userId,
            parseInt(days as string)
        );

        if (!userMetrics) {
            return res.status(404).json({
                error: 'User not found or no token usage data available'
            });
        }

        res.json({
            success: true,
            data: userMetrics
        });

    } catch (error) {
        logger.error('Error fetching user metrics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/metrics/daily
 * Recupera métricas diárias agregadas
 */
router.get('/daily', webserviceAuth, async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            prefecture_id
        } = req.query;

        const startDate = start_date
            ? moment(start_date as string).toISOString()
            : moment().subtract(7, 'days').toISOString();

        const endDate = end_date
            ? moment(end_date as string).toISOString()
            : moment().toISOString();

        // Buscar dados diários do Supabase usando view
        const { supabaseAdmin } = require('../config/database.config');

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
            logger.error('Error fetching daily metrics:', error);
            return res.status(500).json({
                error: 'Failed to fetch daily metrics'
            });
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
        const result = Object.values(dailyAggregated).map((day: any) => ({
            ...day,
            unique_users: day.unique_users.size,
            unique_sessions: day.unique_sessions.size,
            models_used: Array.from(day.models_used),
            prefectures: Array.from(day.prefectures),
            avg_tokens_per_message: day.total_messages > 0
                ? Math.round(day.total_tokens / day.total_messages)
                : 0
        }));

        res.json({
            success: true,
            data: result,
            period: {
                start_date: startDate,
                end_date: endDate
            }
        });

    } catch (error) {
        logger.error('Error fetching daily metrics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/metrics/summary
 * Recupera resumo geral de métricas
 */
router.get('/summary', webserviceAuth, async (req, res) => {
    try {
        const { days = 30, prefecture_id } = req.query;
        const daysNum = parseInt(days as string);

        const { supabaseAdmin } = require('../config/database.config');

        // Buscar métricas gerais
        let query = supabaseAdmin
            .rpc('get_usage_metrics', {
                start_date: moment().subtract(daysNum, 'days').toISOString(),
                end_date: moment().toISOString(),
                filter_prefecture_id: prefecture_id || null
            });

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching summary metrics:', error);
            return res.status(500).json({
                error: 'Failed to fetch summary metrics'
            });
        }

        const summary = data?.[0] || {
            total_messages: 0,
            unique_users: 0,
            unique_sessions: 0,
            total_tokens: 0,
            total_cost: 0,
            avg_tokens_per_message: 0,
            most_used_model: null,
            most_active_prefecture: null
        };

        res.json({
            success: true,
            data: {
                ...summary,
                period_days: daysNum,
                generated_at: moment().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error fetching summary metrics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/metrics/cleanup
 * Limpa dados antigos de token usage (manutenção)
 */
router.post('/cleanup', webserviceAuth, async (req, res) => {
    try {
        const { days_to_keep = 90 } = req.body;

        await tokenTrackingService.cleanupOldData(days_to_keep);

        res.json({
            success: true,
            message: `Token usage data older than ${days_to_keep} days has been cleaned up`
        });

    } catch (error) {
        logger.error('Error during cleanup:', error);
        res.status(500).json({
            error: 'Failed to cleanup old data'
        });
    }
});

/**
 * GET /api/metrics/prefecture/:prefectureId
 * Recupera métricas detalhadas de uma prefeitura específica
 */
router.get('/prefecture/:prefectureId', webserviceAuth, async (req, res) => {
    try {
        const { prefectureId } = req.params;
        const { days = 30 } = req.query;
        const daysNum = parseInt(days as string);

        const { supabaseAdmin } = require('../config/database.config');

        // Métricas gerais da prefeitura
        const startDate = moment().subtract(daysNum, 'days').toISOString();

        const { data: prefectureData, error: prefectureError } = await supabaseAdmin
            .from('message_token_usage')
            .select('*')
            .eq('prefecture_id', prefectureId)
            .gte('timestamp', startDate)
            .order('timestamp', { ascending: false });

        if (prefectureError) {
            logger.error('Error fetching prefecture metrics:', prefectureError);
            return res.status(500).json({
                error: 'Failed to fetch prefecture metrics'
            });
        }

        if (!prefectureData || prefectureData.length === 0) {
            return res.json({
                success: true,
                data: {
                    prefecture_id: prefectureId,
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
            });
        }

        // Calcular métricas agregadas
        const uniqueUsers = new Set(prefectureData.map((item: any) => item.user_id));
        const uniqueSessions = new Set(prefectureData.map((item: any) => item.session_id));
        const totalTokens = prefectureData.reduce((sum: number, item: any) => sum + item.total_tokens, 0);
        const totalCost = prefectureData.reduce((sum: number, item: any) => sum + (item.estimated_cost || 0), 0);

        // Breakdown diário
        const dailyBreakdown: { [key: string]: any } = {};
        prefectureData.forEach((item: any) => {
            const date = moment(item.timestamp).format('YYYY-MM-DD');
            if (!dailyBreakdown[date]) {
                dailyBreakdown[date] = {
                    date,
                    messages: 0,
                    tokens: 0,
                    cost: 0,
                    unique_users: new Set()
                };
            }
            dailyBreakdown[date].messages += 1;
            dailyBreakdown[date].tokens += item.total_tokens;
            dailyBreakdown[date].cost += (item.estimated_cost || 0);
            dailyBreakdown[date].unique_users.add(item.user_id);
        });

        // Converter Set para count
        const dailyBreakdownArray = Object.values(dailyBreakdown).map((day: any) => ({
            ...day,
            unique_users: day.unique_users.size
        })).sort((a, b) => moment(b.date).unix() - moment(a.date).unix());

        // Breakdown por usuário (top 10)
        const userBreakdown: { [key: string]: any } = {};
        prefectureData.forEach((item: any) => {
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

        const userBreakdownArray = Object.values(userBreakdown)
            .sort((a: any, b: any) => b.tokens - a.tokens)
            .slice(0, 10);

        // Breakdown por tipo de agente
        const agentTypeBreakdown: { [key: string]: any } = {};
        prefectureData.forEach((item: any) => {
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

        // Horários de pico (análise por hora)
        const hourlyBreakdown: { [key: string]: number } = {};
        prefectureData.forEach((item: any) => {
            const hour = moment(item.timestamp).format('HH');
            hourlyBreakdown[hour] = (hourlyBreakdown[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourlyBreakdown)
            .map(([hour, count]) => ({ hour: `${hour}:00`, messages: count }))
            .sort((a, b) => b.messages - a.messages)
            .slice(0, 5);

        // Tendência de custo (últimos 7 dias)
        const costTrend = dailyBreakdownArray
            .slice(0, 7)
            .reverse()
            .map(day => ({
                date: day.date,
                cost: day.cost
            }));

        res.json({
            success: true,
            data: {
                prefecture_id: prefectureId,
                period: `${daysNum} days`,
                total_messages: prefectureData.length,
                unique_users: uniqueUsers.size,
                unique_sessions: uniqueSessions.size,
                total_tokens: totalTokens,
                total_cost: totalCost,
                avg_tokens_per_message: Math.round(totalTokens / prefectureData.length),
                daily_breakdown: dailyBreakdownArray,
                user_breakdown: userBreakdownArray,
                agent_type_breakdown: Object.values(agentTypeBreakdown),
                peak_hours: peakHours,
                cost_trend: costTrend
            }
        });

    } catch (error) {
        logger.error('Error fetching prefecture metrics:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/metrics/prefectures/ranking
 * Recupera ranking das prefeituras por uso
 */
router.get('/prefectures/ranking', webserviceAuth, async (req, res) => {
    try {
        const { days = 30, orderBy = 'tokens' } = req.query;
        const daysNum = parseInt(days as string);
        const orderByField = orderBy as string;

        const { supabaseAdmin } = require('../config/database.config');

        const startDate = moment().subtract(daysNum, 'days').toISOString();

        const { data: rankingData, error: rankingError } = await supabaseAdmin
            .from('message_token_usage')
            .select('prefecture_id, total_tokens, estimated_cost')
            .gte('timestamp', startDate)
            .not('prefecture_id', 'is', null);

        if (rankingError) {
            logger.error('Error fetching prefectures ranking:', rankingError);
            return res.status(500).json({
                error: 'Failed to fetch prefectures ranking'
            });
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
        let sortedPrefectures = Object.values(prefectureStats);

        switch (orderByField) {
            case 'cost':
                sortedPrefectures.sort((a: any, b: any) => b.cost - a.cost);
                break;
            case 'messages':
                sortedPrefectures.sort((a: any, b: any) => b.messages - a.messages);
                break;
            case 'tokens':
            default:
                sortedPrefectures.sort((a: any, b: any) => b.tokens - a.tokens);
                break;
        }

        res.json({
            success: true,
            data: {
                period: `${daysNum} days`,
                order_by: orderByField,
                ranking: sortedPrefectures
            }
        });

    } catch (error) {
        logger.error('Error fetching prefectures ranking:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

export { router as tokenMetricsRouter };
