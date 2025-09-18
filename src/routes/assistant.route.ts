import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';
import { webserviceAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { WebhookRequestSchema } from '../agents/assistant/schemas';

const router = Router();

// Health check
router.get('/health', assistantController.health.bind(assistantController));

// Webhook endpoint (replicando fluxo n8n) - Usa Bearer token do webservice
router.post(
    '/webhook',
    webserviceAuth,
    validate({ body: WebhookRequestSchema }),
    assistantController.webhook.bind(assistantController)
);

// Endpoint para processar mensagem diretamente - Usa Bearer token do webservice
router.post(
    '/message',
    webserviceAuth,
    assistantController.processMessage.bind(assistantController)
);

export default router;
