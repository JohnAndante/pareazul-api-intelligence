import { Request, Response } from 'express';
import { metricsService } from '../services/metrics.service';
import { logger } from '../utils/logger.util';

class MetricsController {
    /**
     * GET /api/metrics/session/:sessionId
     * Recupera métricas de uma sessão específica
     */
    async getSessionMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;

            const result = await metricsService.getSessionMetrics({ sessionId });

            if (result.success) {
                res.json(result);
            } else {
                res.status(404).json(result);
            }

        } catch (error) {
            logger.error('Error in getSessionMetrics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * GET /api/metrics/user/:userId
     * Recupera métricas de um usuário específico
     */
    async getUserMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { days = 30 } = req.query;

            const result = await metricsService.getUserMetrics({
                userId,
                days: parseInt(days as string)
            });

            if (result.success) {
                res.json(result);
            } else {
                res.status(404).json(result);
            }

        } catch (error) {
            logger.error('Error in getUserMetrics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * GET /api/metrics/daily
     * Recupera métricas diárias agregadas
     */
    async getDailyMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { start_date, end_date, prefecture_id } = req.query;

            const result = await metricsService.getDailyMetrics({
                start_date: start_date as string,
                end_date: end_date as string,
                prefecture_id: prefecture_id as string
            });

            res.json(result);

        } catch (error) {
            logger.error('Error in getDailyMetrics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * GET /api/metrics/summary
     * Recupera resumo geral de métricas
     */
    async getSummaryMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { days = 30, prefecture_id } = req.query;

            const result = await metricsService.getSummaryMetrics({
                days: parseInt(days as string),
                prefecture_id: prefecture_id as string
            });

            res.json(result);

        } catch (error) {
            logger.error('Error in getSummaryMetrics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * GET /api/metrics/prefecture/:prefectureId
     * Recupera métricas detalhadas de uma prefeitura específica
     */
    async getPrefectureMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { prefectureId } = req.params;
            const { days = 30 } = req.query;

            const result = await metricsService.getPrefectureMetrics({
                prefectureId,
                days: parseInt(days as string)
            });

            res.json(result);

        } catch (error) {
            logger.error('Error in getPrefectureMetrics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * GET /api/metrics/prefectures/ranking
     * Recupera ranking das prefeituras por uso
     */
    async getPrefecturesRanking(req: Request, res: Response): Promise<void> {
        try {
            const { days = 30, orderBy = 'tokens' } = req.query;

            const result = await metricsService.getPrefecturesRanking({
                days: parseInt(days as string),
                orderBy: orderBy as 'tokens' | 'cost' | 'messages'
            });

            res.json(result);

        } catch (error) {
            logger.error('Error in getPrefecturesRanking controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * POST /api/metrics/cleanup
     * Limpa dados antigos de token usage (manutenção)
     */
    async cleanupMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { days_to_keep = 90 } = req.body;

            const result = await metricsService.cleanupMetrics({
                days_to_keep: parseInt(days_to_keep as string)
            });

            res.json(result);

        } catch (error) {
            logger.error('Error in cleanupMetrics controller:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

export const metricsController = new MetricsController();
