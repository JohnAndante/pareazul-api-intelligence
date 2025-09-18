
export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost?: number;
}

export interface MessageTokenUsage extends TokenUsage {
    message_id: string;
    session_id: string;
    user_id: string;
    prefecture_id?: string;
    agent_type?: string;
    timestamp: string;
    model_used: string;
    tools_used?: string[];
    processing_time_ms?: number;
}

export interface SessionTokenSummary {
    session_id: string;
    user_id: string;
    prefecture_id?: string;
    agent_type?: string;
    total_messages: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_estimated_cost: number;
    session_started_at: string;
    session_ended_at?: string;
    average_tokens_per_message: number;
}

export interface TokenTrackingMetrics {
    daily_usage: {
        date: string;
        total_tokens: number;
        total_cost: number;
        unique_users: number;
        total_messages: number;
    };
    user_usage: {
        user_id: string;
        total_tokens: number;
        total_cost: number;
        message_count: number;
        last_activity: string;
    };
    prefecture_usage: {
        prefecture_id: string;
        total_tokens: number;
        total_cost: number;
        unique_users: number;
        message_count: number;
    };
}

export interface TokenPricing {
    model: string;
    prompt_price_per_1k: number;
    completion_price_per_1k: number;
}

export const OPENAI_PRICING: Record<string, TokenPricing> = {
    'gpt-4o-mini': {
        model: 'gpt-4o-mini',
        prompt_price_per_1k: 0.00015,      // $0.15 per 1M tokens
        completion_price_per_1k: 0.0006,   // $0.60 per 1M tokens
    },
    'gpt-4o': {
        model: 'gpt-4o',
        prompt_price_per_1k: 0.0025,       // $2.50 per 1M tokens
        completion_price_per_1k: 0.01,     // $10.00 per 1M tokens
    },
    'gpt-4-turbo': {
        model: 'gpt-4-turbo',
        prompt_price_per_1k: 0.01,         // $10.00 per 1M tokens
        completion_price_per_1k: 0.03,     // $30.00 per 1M tokens
    }
};
