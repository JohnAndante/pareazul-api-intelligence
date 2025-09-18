import { z } from 'zod';

/**
 * 📊 Metrics Route Validation Validators
 *
 * Validators para validação de rotas de métricas
 */

export class MetricsRouteValidator {
    /**
     * Schema para GET /metrics/session/:sessionId
     */
    static getSessionMetrics() {
        return {
            params: z.object({
                sessionId: z.string().min(1, 'User ID is required'),
            }),
        };
    }

    /**
     * Schema para GET /metrics/user/:userId
     */
    static getUserMetrics() {
        return {
            params: z.object({
                userId: z.string().min(1, 'User ID is required'),
            }),
            query: z.object({
                days: z.string()
                    .optional()
                    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
                        message: 'Days must be a positive number'
                    })
                    .transform((val) => val ? Number(val) : undefined),
            }),
        };
    }

    /**
     * Schema para GET /metrics/daily
     */
    static getDailyMetrics() {
        return {
            query: z.object({
                start_date: z.string().datetime('Invalid start date format').optional(),
                end_date: z.string().datetime('Invalid end date format').optional(),
                prefecture_id: z.string().min(1, 'Prefecture ID is required').optional(),
            }),
        };
    }

    /**
     * Schema para GET /metrics/summary
     */
    static getSummaryMetrics() {
        return {
            query: z.object({
                days: z.string()
                    .optional()
                    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
                        message: 'Days must be a positive number'
                    })
                    .transform((val) => val ? Number(val) : undefined),
                prefecture_id: z.string().min(1, 'Prefecture ID is required').optional(),
            }),
        };
    }

    /**
     * Schema para GET /metrics/prefecture/:prefectureId
     */
    static getPrefectureMetrics() {
        return {
            params: z.object({
                prefectureId: z.string().min(1, 'Prefecture ID is required'),
            }),
            query: z.object({
                days: z.string()
                    .optional()
                    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
                        message: 'Days must be a positive number'
                    })
                    .transform((val) => val ? Number(val) : undefined),
            }),
        };
    }

    /**
     * Schema para GET /metrics/prefectures/ranking
     */
    static getPrefecturesRanking() {
        return {
            query: z.object({
                days: z.string()
                    .optional()
                    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
                        message: 'Days must be a positive number'
                    })
                    .transform((val) => val ? Number(val) : undefined),
                orderBy: z.enum(['tokens', 'cost', 'messages'])
                    .optional()
                    .default('tokens'),
            }),
        };
    }

    /**
     * Schema para POST /metrics/cleanup
     */
    static cleanupMetrics() {
        return {
            body: z.object({
                days_to_keep: z.number()
                    .int('Days to keep must be an integer')
                    .positive('Days to keep must be positive')
                    .min(1, 'Days to keep must be at least 1')
                    .max(365, 'Days to keep cannot exceed 365')
                    .optional()
                    .default(90),
            }),
        };
    }
}
