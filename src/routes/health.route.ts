import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { webserviceAuth } from '../middleware/auth.middleware';

const router = Router();

router.get(
    '',
    webserviceAuth,
    healthController.getHealth.bind(healthController)
);

export default router;
