import { Router } from 'express';
import healthRouter from './health.route';
import assistantRoutes from './assistant.route';
import metricsRouter from './metrics.route';

const router = Router();

// Health check route
router.get('/health', healthRouter);

// Chat routes
router.use('/assistant', assistantRoutes);

// Metrics routes
router.use('/metrics', metricsRouter);

export default router;
