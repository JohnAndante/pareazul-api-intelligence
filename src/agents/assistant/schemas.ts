import { z } from 'zod';

export const AssistantQuerySchema = z.object({
    message: z.string().min(1, 'Message cannot be empty'),
    payload: z.object({
        prefeitura_id: z.string().or(z.number().transform(String)),
        prefeitura_sigla: z.string(),
        prefeitura_nome: z.string(),
        prefeitura_timezone: z.string(),
        usuario_id: z.string().or(z.number().transform(String)),
        usuario_nome: z.string(),
        usuario_email: z.string(),
        usuario_cpf: z.string(),
    }),
    assistant_id: z.string().optional(),
    session_id: z.string().optional(),
    prefecture_user_token: z.string().optional(),
    user_token: z.string().optional(),
    new_chat: z.boolean().optional(),
});

export const WebhookRequestSchema = z.object({
    session_id: z.string(),
    payload: z.object({
        prefeitura_id: z.string(),
        prefeitura_sigla: z.string(),
        prefeitura_nome: z.string(),
        prefeitura_timezone: z.string(),
        usuario_id: z.string(),
        usuario_nome: z.string(),
        usuario_email: z.string(),
        usuario_cpf: z.string(),
    }),
    prefecture_user_token: z.string(),
    user_token: z.string(),
    message: z.string(),
    message_date: z.string(),
    message_date_local: z.string(),
    assistant_id: z.string().optional(),
    new_chat: z.boolean().optional(),
});

export const WebhookResponseSchema = z.object({
    message: z.string(),
    message_date: z.string(),
    assistant_id: z.string(),
    message_id: z.string().optional(),
});

export const AgentContextSchema = z.object({
    sessionId: z.string(),
    userId: z.string(),
    prefectureId: z.string(),
    prefectureUserToken: z.string(),
    payload: z.object({
        prefeitura_id: z.string(),
        prefeitura_sigla: z.string(),
        prefeitura_nome: z.string(),
        prefeitura_timezone: z.string(),
        usuario_id: z.string(),
        usuario_nome: z.string(),
        usuario_email: z.string(),
        usuario_cpf: z.string(),
    }),
    metadata: z.record(
        z.any(),
        z.any()
    ),
});

export type AssistantQuery = z.infer<typeof AssistantQuerySchema>;
export type WebhookRequest = z.infer<typeof WebhookRequestSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
export type AgentContext = z.infer<typeof AgentContextSchema>;
