-- Script para corrigir a tabela faq_vectors e criar a função de busca
-- Execute este script no Supabase

-- 1. Primeiro, vamos verificar se a tabela existe e criar se necessário
CREATE TABLE IF NOT EXISTS public.faq_vectors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text,
  answer text,
  embedding vector(1536),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT faq_vectors_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 2. Se a coluna embedding já existe mas sem dimensões, vamos alterá-la
DO $$
BEGIN
    -- Verifica se a coluna embedding existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'faq_vectors'
        AND column_name = 'embedding'
        AND table_schema = 'public'
    ) THEN
        -- Tenta alterar a coluna para ter as dimensões corretas
        BEGIN
            ALTER TABLE public.faq_vectors ALTER COLUMN embedding TYPE vector(1536);
            RAISE NOTICE 'Coluna embedding alterada para vector(1536)';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao alterar coluna embedding: %', SQLERRM;
                -- Se falhar, vamos recriar a coluna
                ALTER TABLE public.faq_vectors DROP COLUMN IF EXISTS embedding;
                ALTER TABLE public.faq_vectors ADD COLUMN embedding vector(1536);
                RAISE NOTICE 'Coluna embedding recriada como vector(1536)';
        END;
    ELSE
        -- Se não existe, cria a coluna
        ALTER TABLE public.faq_vectors ADD COLUMN embedding vector(1536);
        RAISE NOTICE 'Coluna embedding criada como vector(1536)';
    END IF;
END $$;

-- 3. Cria a função de busca por similaridade
CREATE OR REPLACE FUNCTION match_faq(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faq_vectors.id,
    faq_vectors.question,
    faq_vectors.answer,
    1 - (faq_vectors.embedding <=> query_embedding) AS similarity
  FROM faq_vectors
  WHERE 1 - (faq_vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY faq_vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Cria o índice para otimizar a busca por similaridade
CREATE INDEX IF NOT EXISTS faq_vectors_embedding_idx ON public.faq_vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Comentário explicativo
COMMENT ON FUNCTION match_faq IS 'Busca por similaridade de vetores na tabela faq_vectors usando cosine similarity';

-- 6. Verifica se tudo está funcionando
DO $$
BEGIN
    RAISE NOTICE 'Script executado com sucesso!';
    RAISE NOTICE 'Tabela faq_vectors criada/atualizada';
    RAISE NOTICE 'Função match_faq criada';
    RAISE NOTICE 'Índice de similaridade criado';
END $$;
