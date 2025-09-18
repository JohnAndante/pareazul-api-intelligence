import { z } from 'zod';

/**
 * 📋 Assistant Route Validation Validators
 *
 * Validators para validação de rotas do assistant
 * Seguem o padrão de validação inline nas rotas
 */

export class AssistantRouteValidator {
    /**
     * Schema para POST /assistant/webhook
     */
    static postWebhook() {
        return {
            body: z.object({
                session_id: z.string().uuid('Session ID must be a valid UUID'),
                payload: z.object({
                    prefeitura_id: z.number().int().positive('Prefecture ID must be positive'),
                    prefeitura_sigla: z.string().min(1, 'Prefecture acronym is required'),
                    prefeitura_nome: z.string().min(1, 'Prefecture name is required'),
                    prefeitura_timezone: z.string().min(1, 'Prefecture timezone is required'),
                    usuario_id: z.number().int().positive('User ID must be positive'),
                    usuario_nome: z.string().min(1, 'User name is required'),
                    usuario_email: z.string().email('Invalid email format'),
                    usuario_cpf: z.string().min(11, 'CPF must have at least 11 characters'),
                }),
                prefecture_user_token: z.string().min(1, 'Prefecture user token is required'),
                user_token: z.string().min(1, 'User token is required'),
                message: z.string().min(1, 'Message is required'),
                message_date: z.string().datetime('Invalid message date format'),
                message_date_local: z.string().datetime('Invalid local message date format'),
                assistant_id: z.string().uuid('Assistant ID must be a valid UUID').optional(),
                new_chat: z.boolean().optional(),
            }),
        };
    }

    /**
     * Schema para POST /assistant/message
     */
    static postMessage() {
        return {
            body: z.object({
                message: z.string().min(1, 'Message is required'),
                payload: z.object({
                    prefeitura_id: z.number().int().positive('Prefecture ID must be positive'),
                    prefeitura_sigla: z.string().min(1, 'Prefecture acronym is required'),
                    prefeitura_nome: z.string().min(1, 'Prefecture name is required'),
                    prefeitura_timezone: z.string().min(1, 'Prefecture timezone is required'),
                    usuario_id: z.number().int().positive('User ID must be positive'),
                    usuario_nome: z.string().min(1, 'User name is required'),
                    usuario_email: z.string().email('Invalid email format'),
                    usuario_cpf: z.string().min(11, 'CPF must have at least 11 characters'),
                }),
            }),
        };
    }
}
