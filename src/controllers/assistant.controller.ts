import { Request, Response } from 'express';
import { processAssistantMessage, processWebhookRequest } from '../agents/assistant/assistant.index';
import { logger } from '../utils/logger.util';

export class AssistantController {
    /**
     * Endpoint para processar mensagem de chat
     */
    async processMessage(req: Request, res: Response): Promise<void> {
        try {
            const { message, payload, assistant_id } = req.body;

            if (!message || !payload) {
                res.status(400).json({
                    error: 'Missing required fields: message and payload are required'
                });
                return;
            }

            logger.info(`[AssistantController] Processing message from user ${payload.usuario_id}`);

            const result = await processAssistantMessage(message, payload, assistant_id);

            res.json(result);
        } catch (error) {
            logger.error('[AssistantController] Error processing message:', error);

            const message = error instanceof Error ? error.message : 'An internal server error occurred.';

            if (message.includes('validation')) {
                res.status(400).json({ error: 'Invalid request data' });
            } else {
                res.status(500).json({ error: 'An internal server error occurred.' });
            }
        }
    }

    /**
     * Endpoint para webhook (replicando fluxo n8n)
     */
    async webhook(req: Request, res: Response): Promise<void> {
        try {
            logger.info(`[AssistantController] Processing webhook request`);

            const result = await processWebhookRequest(req.body);

            res.json(result);
        } catch (error) {
            logger.error('[AssistantController] Error processing webhook:', error);

            res.status(500).json({
                error: 'An internal server error occurred.',
                message: "Desculpe, houve um erro interno e não consegui completar sua solicitação. Por favor, tente novamente.",
                message_date: new Date().toISOString(),
                assistant_id: req.body.assistant_id || 'error'
            });
        }
    }

    /**
     * Endpoint para health check específico do chat
     */
    async health(req: Request, res: Response): Promise<void> {
        res.json({
            status: 'ok',
            service: 'assistant-agent',
            timestamp: new Date().toISOString(),
        });
    }
}

export const assistantController = new AssistantController();
