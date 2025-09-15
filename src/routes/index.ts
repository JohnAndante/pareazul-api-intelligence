import { Router } from 'express';
import assistantRoutes from './assistant.route';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'pareazul-assistant-server',
  });
});

// Chat routes
router.use('/assistant', assistantRoutes);

export default router;
