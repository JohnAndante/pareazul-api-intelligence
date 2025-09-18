#!/usr/bin/env bun

/**
 * 🗃️ Create Token Tracking Table
 *
 * Script simples para criar a tabela de tracking de tokens
 */

import { supabaseAdmin } from '../config/database.config';
import { logger } from '../utils/logger.util';

async function createTokenTable() {
    try {
        logger.info('🗃️ Creating message_token_usage table...');

        if (!supabaseAdmin) {
            throw new Error('Supabase admin client not initialized');
        }

        // Criar a tabela diretamente usando o client
        const { error } = await supabaseAdmin
            .from('message_token_usage')
            .select('id')
            .limit(1);

        if (error && error.message.includes('does not exist')) {
            logger.info('📊 Table does not exist, please create it manually in Supabase:');
            logger.info('');
            logger.info('SQL to execute in Supabase SQL Editor:');
            logger.info('');
            console.log(`
CREATE TABLE IF NOT EXISTS message_token_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    prefecture_id TEXT,
    agent_type TEXT,

    -- Token usage
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10,6) DEFAULT 0.0,

    -- Metadata
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_used TEXT NOT NULL,
    tools_used TEXT[],
    processing_time_ms INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_message_token_usage_session_id ON message_token_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_user_id ON message_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_timestamp ON message_token_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_user_timestamp ON message_token_usage(user_id, timestamp DESC);
            `);
            logger.info('');
            logger.info('✨ After creating the table, run this script again to test!');
        } else if (error) {
            logger.error('Error checking table:', error);
        } else {
            logger.info('✅ Table message_token_usage already exists!');

            // Testar inserção de dados
            await testTokenTracking();
        }

    } catch (error) {
        logger.error('❌ Error:', error);
        process.exit(1);
    }
}

async function testTokenTracking() {
    try {
        logger.info('🧪 Testing token tracking...');

        const testData = {
            message_id: 'test-' + Date.now(),
            session_id: 'session-test-' + Date.now(),
            user_id: 'user-123',
            prefecture_id: 'prefecture-456',
            agent_type: 'ASSISTENTE',
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
            estimated_cost: 0.000225,
            model_used: 'gpt-4o-mini',
            tools_used: ['faq_search', 'getUserVehicles'],
            processing_time_ms: 1500
        };

        const { data, error } = await supabaseAdmin!
            .from('message_token_usage')
            .insert([testData])
            .select();

        if (error) {
            logger.error('❌ Error inserting test data:', error);
        } else {
            logger.info('✅ Test data inserted successfully:', data?.[0]?.id);

            // Testar consulta
            const { data: queryData, error: queryError } = await supabaseAdmin!
                .from('message_token_usage')
                .select('*')
                .eq('message_id', testData.message_id);

            if (queryError) {
                logger.error('❌ Error querying test data:', queryError);
            } else {
                logger.info('✅ Test data retrieved successfully:', {
                    id: queryData?.[0]?.id,
                    total_tokens: queryData?.[0]?.total_tokens,
                    estimated_cost: queryData?.[0]?.estimated_cost
                });
            }

            // Limpar dados de teste
            await supabaseAdmin!
                .from('message_token_usage')
                .delete()
                .eq('message_id', testData.message_id);

            logger.info('🧹 Test data cleaned up');
        }

        logger.info('🎉 Token tracking system is ready!');
        logger.info('');
        logger.info('📋 You can now:');
        logger.info('  1. Use the AI agent normally - token tracking is automatic');
        logger.info('  2. Check metrics via API endpoints');
        logger.info('  3. View data in Supabase dashboard');

    } catch (error) {
        logger.error('❌ Error testing token tracking:', error);
    }
}

// Executar se chamado diretamente
if (import.meta.main) {
    createTokenTable();
}
