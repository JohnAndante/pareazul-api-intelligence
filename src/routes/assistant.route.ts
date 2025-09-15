import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';
import { simpleAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { WebhookRequestSchema } from '../agents/assistant/assistant.schemas';

const router = Router();

// Health check
router.get('/health', assistantController.health.bind(assistantController));

// Webhook endpoint (replicando fluxo n8n)
router.post(
    '/webhook',
    simpleAuth,
    validate({ body: WebhookRequestSchema }),
    assistantController.webhook.bind(assistantController)
);

// Endpoint para processar mensagem diretamente
router.post(
    '/message',
    simpleAuth,
    assistantController.processMessage.bind(assistantController)
);

export default router;
