/**
 * 🧠 Token Tracking Service
 *
 * Serviço responsável por:
 * - Rastrear consumo de tokens por mensagem e sessão
 * - Calcular custos estimados
 * - Armazenar métricas de uso
 * - Gerar relatórios de consumo
 */

import { supabaseAdmin } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import {
    TokenUsage,
    MessageTokenUsage,
    SessionTokenSummary,
    OPENAI_PRICING
} from '../types/token-usage.types';
import moment from 'moment';

export class TokenTrackingService {
    private readonly logger = logger.child({ service: 'TokenTrackingService' });

    /**
     * Calcula o custo estimado baseado no modelo e tokens usados
     */
    calculateEstimatedCost(usage: TokenUsage, model: string): number {
        const pricing = OPENAI_PRICING[model];
        if (!pricing) {
            this.logger.warn(`Pricing not found for model: ${model}`);
            return 0;
        }

        const promptCost = (usage.prompt_tokens / 1000) * pricing.prompt_price_per_1k;
        const completionCost = (usage.completion_tokens / 1000) * pricing.completion_price_per_1k;

        return promptCost + completionCost;
    }

    /**
     * Registra o uso de tokens para uma mensagem específica
     */
    async trackMessageUsage(data: {
        messageId: string;
        sessionId: string;
        userId: string;
        prefectureId?: string;
        agentType?: string;
        usage: TokenUsage;
        modelUsed: string;
        toolsUsed?: string[];
        processingTimeMs?: number;
    }): Promise<void> {
        try {
            const estimatedCost = this.calculateEstimatedCost(data.usage, data.modelUsed);

            const messageUsage: MessageTokenUsage = {
                message_id: data.messageId,
                session_id: data.sessionId,
                user_id: data.userId,
                prefecture_id: data.prefectureId,
                agent_type: data.agentType,
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens,
                estimated_cost: estimatedCost,
                timestamp: moment().toISOString(),
                model_used: data.modelUsed,
                tools_used: data.toolsUsed,
                processing_time_ms: data.processingTimeMs
            };

            // Salvar no Supabase
            await this.saveMessageUsage(messageUsage);

            // Atualizar cache Redis com métricas da sessão
            await this.updateSessionCache(data.sessionId, messageUsage);

            // Atualizar métricas diárias no Redis
            await this.updateDailyMetrics(messageUsage);

            this.logger.info(`Token usage tracked for message ${data.messageId}`, {
                tokens: data.usage.total_tokens,
                cost: estimatedCost,
                model: data.modelUsed
            });

        } catch (error) {
            this.logger.error('Error tracking message usage:', error);
            throw error;
        }
    }

    /**
     * Salva o uso de tokens no Supabase
     */
    private async saveMessageUsage(usage: MessageTokenUsage): Promise<void> {
        if (!supabaseAdmin) {
            throw new Error('Supabase admin client not initialized');
        }

        const { error } = await supabaseAdmin
            .from('message_token_usage')
            .insert([{
                message_id: usage.message_id,
                session_id: usage.session_id,
                user_id: usage.user_id,
                prefecture_id: usage.prefecture_id,
                agent_type: usage.agent_type,
                prompt_tokens: usage.prompt_tokens,
                completion_tokens: usage.completion_tokens,
                total_tokens: usage.total_tokens,
                estimated_cost: usage.estimated_cost,
                timestamp: usage.timestamp,
                model_used: usage.model_used,
                tools_used: usage.tools_used,
                processing_time_ms: usage.processing_time_ms
            }]);

        if (error) {
            this.logger.error('Error saving message token usage:', error);
            throw error;
        }
    }

    /**
     * Atualiza o cache de métricas da sessão no Redis
     */
    private async updateSessionCache(sessionId: string, usage: MessageTokenUsage): Promise<void> {
        try {
            const cacheKey = `token_session:${sessionId}`;
            const existingData = await redis.get(cacheKey);

            let sessionSummary: Partial<SessionTokenSummary>;

            if (existingData) {
                sessionSummary = JSON.parse(existingData);
                sessionSummary.total_messages = (sessionSummary.total_messages || 0) + 1;
                sessionSummary.total_prompt_tokens = (sessionSummary.total_prompt_tokens || 0) + usage.prompt_tokens;
                sessionSummary.total_completion_tokens = (sessionSummary.total_completion_tokens || 0) + usage.completion_tokens;
                sessionSummary.total_tokens = (sessionSummary.total_tokens || 0) + usage.total_tokens;
                sessionSummary.total_estimated_cost = (sessionSummary.total_estimated_cost || 0) + (usage.estimated_cost || 0);
            } else {
                sessionSummary = {
                    session_id: sessionId,
                    user_id: usage.user_id,
                    prefecture_id: usage.prefecture_id,
                    agent_type: usage.agent_type,
                    total_messages: 1,
                    total_prompt_tokens: usage.prompt_tokens,
                    total_completion_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                    total_estimated_cost: usage.estimated_cost || 0,
                    session_started_at: usage.timestamp
                };
            }

            sessionSummary.average_tokens_per_message = Math.round(
                (sessionSummary.total_tokens || 0) / (sessionSummary.total_messages || 1)
            );

            // Cache por 24 horas
            await redis.setEx(cacheKey, 86400, JSON.stringify(sessionSummary));

        } catch (error) {
            this.logger.error('Error updating session cache:', error);
            // Não propaga o erro para não quebrar o fluxo principal
        }
    }

    /**
     * Atualiza métricas diárias no Redis
     */
    private async updateDailyMetrics(usage: MessageTokenUsage): Promise<void> {
        try {
            const today = moment().format('YYYY-MM-DD');
            const cacheKey = `token_daily:${today}`;

            const existingData = await redis.get(cacheKey);
            let dailyMetrics: Record<string, unknown> = {};

            if (existingData) {
                dailyMetrics = JSON.parse(existingData);
            }

            dailyMetrics.date = today;
            dailyMetrics.total_tokens = (parseInt(dailyMetrics.total_tokens as string) || 0) + usage.total_tokens;
            dailyMetrics.total_cost = (parseInt(dailyMetrics.total_cost as string) || 0) + (usage.estimated_cost || 0);
            dailyMetrics.total_messages = (parseInt(dailyMetrics.total_messages as string) || 0) + 1;

            // Rastrear usuários únicos
            if (!dailyMetrics.unique_users) {
                dailyMetrics.unique_users = new Set<string>();
            } else {
                dailyMetrics.unique_users = new Set(dailyMetrics.unique_users as string[]);
            }
            (dailyMetrics.unique_users as Set<string>).add(usage.user_id);

            // Converter Set para array para serialização JSON
            const uniqueUsersArray = Array.from(dailyMetrics.unique_users as Set<string>);
            dailyMetrics.unique_users_count = uniqueUsersArray.length;
            dailyMetrics.unique_users = uniqueUsersArray;

            // Cache por 48 horas
            await redis.setEx(cacheKey, 172800, JSON.stringify(dailyMetrics));

        } catch (error) {
            this.logger.error('Error updating daily metrics:', error);
        }
    }

    /**
     * Recupera o resumo de tokens de uma sessão
     */
    async getSessionSummary(sessionId: string): Promise<SessionTokenSummary | null> {
        try {
            // Tenta primeiro do cache Redis
            const cacheKey = `token_session:${sessionId}`;
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                return JSON.parse(cachedData);
            }

            // Se não estiver no cache, busca no banco e reconstrói
            if (!supabaseAdmin) {
                this.logger.error('Supabase admin client not initialized');
                return null;
            }

            const { data, error } = await supabaseAdmin
                .from('message_token_usage')
                .select('*')
                .eq('session_id', sessionId)
                .order('timestamp', { ascending: true });

            if (error) {
                this.logger.error('Error fetching session summary:', error);
                return null;
            }

            if (!data || data.length === 0) {
                return null;
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

            return summary;

        } catch (error) {
            this.logger.error('Error getting session summary:', error);
            return null;
        }
    }

    /**
     * Recupera métricas de uso por usuário
     */
    async getUserUsageMetrics(userId: string, days: number = 30): Promise<Record<string, unknown> | null> {
        try {
            if (!supabaseAdmin) {
                this.logger.error('Supabase admin client not initialized');
                return null;
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
                return null;
            }

            if (!data || data.length === 0) {
                return {
                    user_id: userId,
                    total_tokens: 0,
                    total_cost: 0,
                    message_count: 0,
                    sessions_count: 0,
                    last_activity: null
                };
            }

            const uniqueSessions = new Set(data.map(item => item.session_id));

            return {
                user_id: userId,
                total_tokens: data.reduce((sum, item) => sum + item.total_tokens, 0),
                total_cost: data.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
                message_count: data.length,
                sessions_count: uniqueSessions.size,
                last_activity: data[0].timestamp,
                daily_breakdown: this.calculateDailyBreakdown(data)
            };

        } catch (error) {
            this.logger.error('Error getting user usage metrics:', error);
            return null;
        }
    }

    /**
     * Calcula breakdown diário de uso
     */
    private calculateDailyBreakdown(data: Record<string, unknown>[]): Record<string, unknown>[] {
        const dailyData: { [key: string]: Record<string, unknown> } = {};

        data.forEach((item: Record<string, unknown>) => {
            const date = moment(item.timestamp as string).format('YYYY-MM-DD');

            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    tokens: 0,
                    cost: 0,
                    messages: 0
                };
            }

            dailyData[date].tokens = (dailyData[date].tokens as number) + (item.total_tokens as number);
            dailyData[date].cost = (dailyData[date].cost as number) + ((item.estimated_cost as number) || 0);
            dailyData[date].messages = (dailyData[date].messages as number) + 1;
        });

        return Object.values(dailyData).sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
            moment(b.date as string).unix() - moment(a.date as string).unix()
        );
    }

    /**
     * Limpa dados antigos de tracking (manutenção)
     */
    async cleanupOldData(daysToKeep: number = 90): Promise<void> {
        try {
            if (!supabaseAdmin) {
                throw new Error('Supabase admin client not initialized');
            }

            const cutoffDate = moment().subtract(daysToKeep, 'days').toISOString();

            const { error } = await supabaseAdmin
                .from('message_token_usage')
                .delete()
                .lt('timestamp', cutoffDate);

            if (error) {
                this.logger.error('Error cleaning up old token data:', error);
                throw error;
            }

            this.logger.info(`Token usage data older than ${daysToKeep} days cleaned up`);

        } catch (error) {
            this.logger.error('Error during token data cleanup:', error);
            throw error;
        }
    }
}

export const tokenTrackingService = new TokenTrackingService();
