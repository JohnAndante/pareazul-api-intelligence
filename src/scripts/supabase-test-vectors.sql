-- Script de teste para verificar se a funcionalidade de vetores está funcionando
-- Execute este script no Supabase após executar o supabase-vector-function-fix.sql

-- 1. Verifica se a tabela existe e tem a estrutura correta
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'faq_vectors'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verifica se a função match_faq existe
SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'match_faq'
AND routine_schema = 'public';

-- 3. Verifica se o índice existe
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'faq_vectors'
AND schemaname = 'public';

-- 4. Testa a função com um vetor de exemplo (1536 zeros)
-- Este teste deve retornar vazio se não houver dados, mas não deve dar erro
SELECT * FROM match_faq(
    array_fill(0.0, ARRAY[1536])::vector(1536),
    0.5,
    1
);

-- 5. Verifica se há dados na tabela
SELECT COUNT(*) as total_records FROM public.faq_vectors;

-- 6. Se houver dados, mostra uma amostra
SELECT
    id,
    LEFT(question, 50) as question_preview,
    LEFT(answer, 50) as answer_preview,
    created_at
FROM public.faq_vectors
LIMIT 5;
