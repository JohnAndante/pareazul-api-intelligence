// src/routes/index.ts

import { Router } from 'express';
import calculatorRoutes from './calculator.route';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'pareazul-assistant-server',
  });
});

// Calculator routes
router.use('/calculator', calculatorRoutes);

export default router;
