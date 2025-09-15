export interface ChatSession {
    id: string;
    user_id: string;
    prefecture_id: string;
    assistant_id: string;
    is_active: boolean;
    created_at: string;
    inactivated_at?: string;
}

export interface ChatMessage {
    id: string;
    assistant_chat_id: string;
    subject: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface ChatPayload {
    prefeitura_id: string;
    prefeitura_sigla: string;
    prefeitura_nome: string;
    prefeitura_timezone: string;
    usuario_id: string;
    usuario_nome: string;
    usuario_email: string;
    usuario_cpf: string;
}

export interface WebhookRequest {
    session_id: string;
    payload: ChatPayload;
    prefecture_user_token: string;
    message: string;
    message_date: string;
    message_date_local: string;
    assistant_id?: string;
    new_chat?: boolean;
}

export interface WebhookResponse {
    message: string;
    message_date: string;
    assistant_id: string;
    message_id?: string;
}

export interface SessionCache {
    assistant_id: string;
    assistant_chat_id: string;
    payload: ChatPayload;
    prefecture_user_token: string;
    user_token: string;
}

export interface AgentContext {
    sessionId: string;
    userId: string;
    prefectureId: string;
    payload: ChatPayload;
    metadata: Record<string, any>;
}
