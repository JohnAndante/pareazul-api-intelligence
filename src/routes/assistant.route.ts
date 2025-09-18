import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';
import { webserviceAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { AssistantRouteValidator } from '../validators/assistant.validator';

const router = Router();

// Health check
router.get(
    '/health',
    webserviceAuth,
    assistantController.health.bind(assistantController)
);

// Webhook endpoint (replicando fluxo n8n) - Usa Bearer token do webservice
router.post(
    '/webhook',
    webserviceAuth,
    validate(AssistantRouteValidator.postWebhook()),
    assistantController.webhook.bind(assistantController)
);

// Endpoint para processar mensagem diretamente - Usa Bearer token do webservice
router.post(
    '/message',
    webserviceAuth,
    validate(AssistantRouteValidator.postMessage()),
    assistantController.processMessage.bind(assistantController)
);

export default router;
