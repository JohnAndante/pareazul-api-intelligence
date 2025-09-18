-- 🧠 Token Usage Tracking Tables
-- Tabelas para rastrear consumo de tokens do sistema de IA

-- Tabela principal para rastrear uso de tokens por mensagem
CREATE TABLE IF NOT EXISTS message_token_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    prefecture_id TEXT,
    agent_type TEXT,

    -- Token usage details
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10,6) DEFAULT 0.0,

    -- Metadata
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_used TEXT NOT NULL,
    tools_used TEXT[],
    processing_time_ms INTEGER,

    -- Indexes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_message_token_usage_session_id ON message_token_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_user_id ON message_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_timestamp ON message_token_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_prefecture_id ON message_token_usage(prefecture_id);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_agent_type ON message_token_usage(agent_type);

-- Índice composto para consultas por usuário e período
CREATE INDEX IF NOT EXISTS idx_message_token_usage_user_timestamp
ON message_token_usage(user_id, timestamp DESC);

-- Índice composto para consultas por prefeitura e período
CREATE INDEX IF NOT EXISTS idx_message_token_usage_prefecture_timestamp
ON message_token_usage(prefecture_id, timestamp DESC);

-- View para resumo diário de uso de tokens
CREATE OR REPLACE VIEW daily_token_usage AS
SELECT
    DATE(timestamp) as usage_date,
    prefecture_id,
    agent_type,
    model_used,
    COUNT(*) as total_messages,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    SUM(prompt_tokens) as total_prompt_tokens,
    SUM(completion_tokens) as total_completion_tokens,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_estimated_cost,
    AVG(total_tokens) as avg_tokens_per_message,
    AVG(processing_time_ms) as avg_processing_time_ms
FROM message_token_usage
GROUP BY DATE(timestamp), prefecture_id, agent_type, model_used
ORDER BY usage_date DESC;

-- View para resumo por sessão
CREATE OR REPLACE VIEW session_token_summary AS
SELECT
    session_id,
    user_id,
    prefecture_id,
    agent_type,
    COUNT(*) as total_messages,
    MIN(timestamp) as session_started_at,
    MAX(timestamp) as session_ended_at,
    SUM(prompt_tokens) as total_prompt_tokens,
    SUM(completion_tokens) as total_completion_tokens,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_estimated_cost,
    AVG(total_tokens) as avg_tokens_per_message,
    AVG(processing_time_ms) as avg_processing_time_ms,
    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration_seconds
FROM message_token_usage
GROUP BY session_id, user_id, prefecture_id, agent_type
ORDER BY session_started_at DESC;

-- View para métricas de usuário
CREATE OR REPLACE VIEW user_token_metrics AS
SELECT
    user_id,
    prefecture_id,
    COUNT(*) as total_messages,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT DATE(timestamp)) as active_days,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_estimated_cost,
    AVG(total_tokens) as avg_tokens_per_message,
    MIN(timestamp) as first_activity,
    MAX(timestamp) as last_activity
FROM message_token_usage
GROUP BY user_id, prefecture_id
ORDER BY total_tokens DESC;

-- Função para buscar métricas de uso por período
CREATE OR REPLACE FUNCTION get_usage_metrics(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW(),
    filter_user_id TEXT DEFAULT NULL,
    filter_prefecture_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    total_messages BIGINT,
    unique_users BIGINT,
    unique_sessions BIGINT,
    total_tokens BIGINT,
    total_cost DECIMAL,
    avg_tokens_per_message DECIMAL,
    most_used_model TEXT,
    most_active_prefecture TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        start_date as period_start,
        end_date as period_end,
        COUNT(*)::BIGINT as total_messages,
        COUNT(DISTINCT mtu.user_id)::BIGINT as unique_users,
        COUNT(DISTINCT mtu.session_id)::BIGINT as unique_sessions,
        SUM(mtu.total_tokens)::BIGINT as total_tokens,
        SUM(mtu.estimated_cost)::DECIMAL as total_cost,
        AVG(mtu.total_tokens)::DECIMAL as avg_tokens_per_message,
        (
            SELECT model_used
            FROM message_token_usage
            WHERE timestamp BETWEEN start_date AND end_date
            AND (filter_user_id IS NULL OR user_id = filter_user_id)
            AND (filter_prefecture_id IS NULL OR prefecture_id = filter_prefecture_id)
            GROUP BY model_used
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_used_model,
        (
            SELECT prefecture_id
            FROM message_token_usage
            WHERE timestamp BETWEEN start_date AND end_date
            AND prefecture_id IS NOT NULL
            AND (filter_user_id IS NULL OR user_id = filter_user_id)
            AND (filter_prefecture_id IS NULL OR prefecture_id = filter_prefecture_id)
            GROUP BY prefecture_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_active_prefecture
    FROM message_token_usage mtu
    WHERE mtu.timestamp BETWEEN start_date AND end_date
    AND (filter_user_id IS NULL OR mtu.user_id = filter_user_id)
    AND (filter_prefecture_id IS NULL OR mtu.prefecture_id = filter_prefecture_id);
END;
$$;

-- Função para limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_token_usage(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM message_token_usage
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

-- Trigger para atualizar created_at automaticamente
CREATE OR REPLACE FUNCTION update_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_message_token_usage_created_at
BEFORE UPDATE ON message_token_usage
FOR EACH ROW EXECUTE FUNCTION update_created_at_column();

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE message_token_usage IS 'Tabela para rastrear o consumo de tokens por mensagem do sistema de IA';
COMMENT ON COLUMN message_token_usage.message_id IS 'ID único da mensagem processada';
COMMENT ON COLUMN message_token_usage.session_id IS 'ID da sessão de chat';
COMMENT ON COLUMN message_token_usage.user_id IS 'ID do usuário que enviou a mensagem';
COMMENT ON COLUMN message_token_usage.prefecture_id IS 'ID da prefeitura (opcional)';
COMMENT ON COLUMN message_token_usage.agent_type IS 'Tipo do agente (ASSISTENTE, SUPORTE, etc.)';
COMMENT ON COLUMN message_token_usage.prompt_tokens IS 'Número de tokens do prompt enviado';
COMMENT ON COLUMN message_token_usage.completion_tokens IS 'Número de tokens da resposta gerada';
COMMENT ON COLUMN message_token_usage.total_tokens IS 'Total de tokens consumidos (prompt + completion)';
COMMENT ON COLUMN message_token_usage.estimated_cost IS 'Custo estimado em USD baseado no modelo usado';
COMMENT ON COLUMN message_token_usage.model_used IS 'Modelo de IA usado (ex: gpt-4o-mini)';
COMMENT ON COLUMN message_token_usage.tools_used IS 'Array de tools/ferramentas utilizadas na resposta';
COMMENT ON COLUMN message_token_usage.processing_time_ms IS 'Tempo de processamento em milissegundos';

-- Grants para o service role (ajuste conforme necessário)
-- GRANT ALL ON message_token_usage TO service_role;
-- GRANT ALL ON daily_token_usage TO service_role;
-- GRANT ALL ON session_token_summary TO service_role;
-- GRANT ALL ON user_token_metrics TO service_role;
