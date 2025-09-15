import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { memoryService } from '../services/memory.service';
import { chatRepository } from '../repositories/chat.repository';
import { messageRepository } from '../repositories/message.repository';
import { logger } from '../utils/logger.util';

// Schemas para as tools
const GetUserInfoSchema = z.object({
    userId: z.string().describe('ID do usuário')
});

const GetMessageHistorySchema = z.object({
    sessionId: z.string().describe('ID da sessão'),
    limit: z.number().optional().describe('Número máximo de mensagens a retornar (padrão: 20)')
});

const GetSessionStatusSchema = z.object({
    sessionId: z.string().describe('ID da sessão')
});

// Tool para buscar informações do usuário
const getUserInfoTool = new DynamicStructuredTool({
    name: 'get_user_info',
    description: 'Busca informações básicas do usuário atual',
    schema: GetUserInfoSchema,
    func: async (input: { userId: string }) => {
        try {
            const { userId } = input;
            const sessionCache = await memoryService.getSessionCache(userId);
            if (!sessionCache) {
                return 'Usuário não encontrado ou sessão expirada';
            }

            const session = await chatRepository.findById(sessionCache.assistant_chat_id);
            if (!session) {
                return 'Sessão não encontrada';
            }

            return JSON.stringify({
                user_id: session.user_id,
                prefecture_id: session.prefecture_id,
                assistant_id: session.assistant_id,
                session_active: session.is_active,
                created_at: session.created_at
            });
        } catch (error) {
            logger.error('Error in getUserInfoTool:', error);
            return 'Erro ao buscar informações do usuário';
        }
    }
});

// Tool para buscar histórico de mensagens
const getMessageHistoryTool = new DynamicStructuredTool({
    name: 'get_message_history',
    description: 'Busca o histórico de mensagens da conversa atual',
    schema: GetMessageHistorySchema,
    func: async (input: { sessionId: string; limit?: number }) => {
        try {
            const { sessionId, limit = 20 } = input;
            const messages = await messageRepository.getRecentMessages(sessionId, limit);

            const formattedMessages = messages.map(msg => ({
                role: msg.subject,
                content: msg.content,
                timestamp: msg.created_at
            }));

            return JSON.stringify(formattedMessages);
        } catch (error) {
            logger.error('Error in getMessageHistoryTool:', error);
            return 'Erro ao buscar histórico de mensagens';
        }
    }
});

// Tool para verificar status da sessão
const getSessionStatusTool = new DynamicStructuredTool({
    name: 'get_session_status',
    description: 'Verifica o status atual da sessão',
    schema: GetSessionStatusSchema,
    func: async (input: { sessionId: string }) => {
        try {
            const { sessionId } = input;
            const session = await chatRepository.findById(sessionId);
            if (!session) {
                return 'Sessão não encontrada';
            }

            const messageCount = await messageRepository.findByChatId(sessionId);

            return JSON.stringify({
                session_id: session.id,
                is_active: session.is_active,
                created_at: session.created_at,
                message_count: messageCount.length,
                assistant_id: session.assistant_id
            });
        } catch (error) {
            logger.error('Error in getSessionStatusTool:', error);
            return 'Erro ao verificar status da sessão';
        }
    }
});

export const databaseTools = [
    getUserInfoTool,
    getMessageHistoryTool,
    getSessionStatusTool
];
