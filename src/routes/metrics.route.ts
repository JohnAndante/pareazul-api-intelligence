/**
 * 📊 Metrics Routes
 *
 * Rotas para consultar métricas de consumo de tokens
 */

import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';
import { webserviceAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { MetricsRouteValidator } from '../validators/metrics.validator';

const router = Router();

// Session metrics
router.get(
    '/session/:sessionId',
    webserviceAuth,
    validate(MetricsRouteValidator.getSessionMetrics()),
    metricsController.getSessionMetrics.bind(metricsController)
);

// User metrics
router.get(
    '/user/:userId',
    webserviceAuth,
    validate(MetricsRouteValidator.getUserMetrics()),
    metricsController.getUserMetrics.bind(metricsController)
);

// Daily metrics
router.get(
    '/daily',
    webserviceAuth,
    validate(MetricsRouteValidator.getDailyMetrics()),
    metricsController.getDailyMetrics.bind(metricsController)
);

// Summary metrics
router.get(
    '/summary',
    webserviceAuth,
    validate(MetricsRouteValidator.getSummaryMetrics()),
    metricsController.getSummaryMetrics.bind(metricsController)
);

// Prefecture metrics
router.get(
    '/prefecture/:prefectureId',
    webserviceAuth,
    validate(MetricsRouteValidator.getPrefectureMetrics()),
    metricsController.getPrefectureMetrics.bind(metricsController)
);

// Prefectures ranking
router.get(
    '/prefectures/ranking',
    webserviceAuth,
    validate(MetricsRouteValidator.getPrefecturesRanking()),
    metricsController.getPrefecturesRanking.bind(metricsController)
);

// Cleanup (maintenance)
router.post(
    '/cleanup',
    webserviceAuth,
    validate(MetricsRouteValidator.cleanupMetrics()),
    metricsController.cleanupMetrics.bind(metricsController)
);

export default router;
