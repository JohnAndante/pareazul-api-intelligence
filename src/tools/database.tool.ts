import { DynamicStructuredTool } from '@langchain/core/tools';
import { memoryService } from '../services/memory.service';
import { chatRepository } from '../repositories/chat.repository';
import { messageRepository } from '../repositories/message.repository';
import { logger } from '../utils/logger.util';
import { GetMessageHistorySchema, GetSessionStatusSchema, GetUserInfoSchema } from '../validators/database.validator';


// Tool para buscar informações do usuário
const getUserInfoTool = new DynamicStructuredTool({
    name: 'get_user_info',
    description: 'Search for basic information about the current user.' +
        'Required information: user ID to identify the user in the system.' +
        'You can retrieve it from the session cache using the memory service.',
    schema: GetUserInfoSchema,
    func: async (input: { userId: number }) => {
        try {
            const { userId } = input;
            logger.info(`[get_user_info] Buscando informações para userId: ${userId}`);

            const sessionCache = await memoryService.getSessionCache(userId);
            if (!sessionCache) {
                logger.warn(`[get_user_info] SessionCache não encontrado para userId: ${userId}`);
                return 'Usuário não encontrado ou sessão expirada';
            }

            logger.info(`[get_user_info] SessionCache encontrado para userId: ${userId}, assistant_chat_id: ${sessionCache.assistant_chat_id}`);

            const session = await chatRepository.findById(parseInt(sessionCache.assistant_chat_id));
            if (!session) {
                logger.warn(`[get_user_info] Sessão não encontrada no banco para assistant_chat_id: ${sessionCache.assistant_chat_id}`);
                return 'Sessão não encontrada';
            }

            logger.info(`[get_user_info] Sessão encontrada para userId: ${userId}, session_id: ${session.id}`);

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
            const session = await chatRepository.findById(parseInt(sessionId));
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
