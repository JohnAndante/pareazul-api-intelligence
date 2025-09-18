// Service parameter types
export interface GetSessionMetricsParams {
    sessionId: string;
}

export interface GetUserMetricsParams {
    userId: string;
    days?: number;
}

export interface GetDailyMetricsParams {
    start_date?: string;
    end_date?: string;
    prefecture_id?: string;
}

export interface GetSummaryMetricsParams {
    days?: number;
    prefecture_id?: string;
}

export interface GetPrefectureMetricsParams {
    prefectureId: string;
    days?: number;
}

export interface GetPrefecturesRankingParams {
    days?: number;
    orderBy?: 'tokens' | 'cost' | 'messages';
}

export interface CleanupMetricsParams {
    days_to_keep?: number;
}

// Service response types
export interface GetSessionMetricsResponse {
    success: boolean;
    data?: SessionTokenSummary;
    error?: string;
}

export interface GetUserMetricsResponse {
    success: boolean;
    data?: UserMetricsData;
    error?: string;
}

export interface GetDailyMetricsResponse {
    success: boolean;
    data?: DailyMetricsData[];
    period?: {
        start_date: string;
        end_date: string;
    };
    error?: string;
}

export interface GetSummaryMetricsResponse {
    success: boolean;
    data?: SummaryMetricsData;
    error?: string;
}

export interface GetPrefectureMetricsResponse {
    success: boolean;
    data?: PrefectureMetricsData;
    error?: string;
}

export interface GetPrefecturesRankingResponse {
    success: boolean;
    data?: {
        period: string;
        order_by: string;
        ranking: PrefectureRankingData[];
    };
    error?: string;
}

export interface CleanupMetricsResponse {
    success: boolean;
    message?: string;
    error?: string;
}

// Data types
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

export interface UserMetricsData {
    user_id: string;
    total_tokens: number;
    total_cost: number;
    message_count: number;
    sessions_count: number;
    last_activity: string | null;
    daily_breakdown?: DailyBreakdownData[];
}

export interface DailyMetricsData {
    date: string;
    total_messages: number;
    unique_users: number;
    unique_sessions: number;
    total_tokens: number;
    total_cost: number;
    models_used: string[];
    prefectures: string[];
    avg_tokens_per_message: number;
}

export interface SummaryMetricsData {
    total_messages: number;
    unique_users: number;
    unique_sessions: number;
    total_tokens: number;
    total_cost: number;
    avg_tokens_per_message: number;
    most_used_model: string | null;
    most_active_prefecture: string | null;
    period_days: number;
    generated_at: string;
}

export interface PrefectureMetricsData {
    prefecture_id: string;
    period: string;
    total_messages: number;
    unique_users: number;
    unique_sessions: number;
    total_tokens: number;
    total_cost: number;
    avg_tokens_per_message: number;
    daily_breakdown: DailyBreakdownData[];
    user_breakdown: UserBreakdownData[];
    agent_type_breakdown: AgentTypeBreakdownData[];
    peak_hours: PeakHourData[];
    cost_trend: CostTrendData[];
}

export interface PrefectureRankingData {
    prefecture_id: string;
    messages: number;
    tokens: number;
    cost: number;
}

export interface DailyBreakdownData {
    date: string;
    messages: number;
    tokens: number;
    cost: number;
    unique_users: number;
}

export interface UserBreakdownData {
    user_id: string;
    messages: number;
    tokens: number;
    cost: number;
}

export interface AgentTypeBreakdownData {
    agent_type: string;
    messages: number;
    tokens: number;
    cost: number;
}

export interface PeakHourData {
    hour: string;
    messages: number;
}

export interface CostTrendData {
    date: string;
    cost: number;
}
