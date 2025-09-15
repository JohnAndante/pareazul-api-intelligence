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
