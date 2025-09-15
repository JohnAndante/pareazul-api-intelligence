export interface UserPayload {
    prefeitura_id: string;
    prefeitura_nome: string;
    prefeitura_sigla: string;
    prefeitura_timezone: string;
    usuario_id: string;
    usuario_nome: string;
    usuario_email: string;
    usuario_cpf: string;
}


export interface SessionMeta {
    assistant_id: string;
    assistant_chat_id: string;
    user_id: string;
    prefecture_id: string;
    created_at: string;
    last_activity: string;
}

export interface MemoryBuffer {
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
    }>;
    maxSize: number;
}

export interface SessionConfig {
    ttl: number; // Time to live in seconds
    maxMessages: number; // Buffer size
    autoInactivate: boolean; // Auto inactivate previous sessions
}
