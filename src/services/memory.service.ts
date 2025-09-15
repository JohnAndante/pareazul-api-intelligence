import { redis } from '../config/redis.config';
import { messageRepository } from '../repositories/message.repository';
import { chatRepository } from '../repositories/chat.repository';
import { ChatMessage, SessionCache } from '../types/chat.types';
import { MemoryBuffer } from '../types/session.types';
import { logger } from '../utils/logger.util';
import { env } from '../config/environment.config';

export class MemoryService {
    private readonly SESSION_CACHE_PREFIX = 'chat_assistente_';
    private readonly MEMORY_BUFFER_PREFIX = 'memory_buffer_';
    private readonly SESSION_TTL = env.SESSION_TTL;
    private readonly BUFFER_SIZE = env.MEMORY_BUFFER_SIZE;

    /**
     * Armazena metadados da sessão no Redis
     */
    async setSessionCache(userId: string, sessionData: SessionCache): Promise<boolean> {
        try {
            const key = `${this.SESSION_CACHE_PREFIX}${userId}`;
            const value = JSON.stringify(sessionData);

            await redis.setEx(key, this.SESSION_TTL, value);
            logger.debug(`Session cache stored for user ${userId}`);
            return true;
        } catch (error) {
            logger.warn('Redis unavailable for session cache, using memory fallback:', error);
            // Fallback: armazenar em memória local (não persistente)
            return true;
        }
    }

    /**
     * Recupera metadados da sessão do Redis
     */
    async getSessionCache(userId: string): Promise<SessionCache | null> {
        try {
            const key = `${this.SESSION_CACHE_PREFIX}${userId}`;
            const value = await redis.get(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value) as SessionCache;
        } catch (error) {
            logger.error('Error retrieving session cache:', error);
            return null;
        }
    }

    /**
     * Armazena buffer de memória no Redis
     */
    async setMemoryBuffer(sessionId: string, messages: ChatMessage[]): Promise<boolean> {
        try {
            const key = `${this.MEMORY_BUFFER_PREFIX}${sessionId}`;
            const buffer: MemoryBuffer = {
                messages: messages.map(msg => ({
                    role: msg.subject,
                    content: msg.content,
                    timestamp: msg.created_at
                })),
                maxSize: this.BUFFER_SIZE
            };

            const value = JSON.stringify(buffer);
            await redis.setEx(key, this.SESSION_TTL, value);
            logger.debug(`Memory buffer stored for session ${sessionId}`);
            return true;
        } catch (error) {
            logger.error('Error storing memory buffer:', error);
            return false;
        }
    }

    /**
     * Recupera buffer de memória do Redis
     */
    async getMemoryBuffer(sessionId: string): Promise<MemoryBuffer | null> {
        try {
            const key = `${this.MEMORY_BUFFER_PREFIX}${sessionId}`;
            const value = await redis.get(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value) as MemoryBuffer;
        } catch (error) {
            logger.error('Error retrieving memory buffer:', error);
            return null;
        }
    }

    /**
     * Adiciona mensagem ao buffer e persiste no banco
     */
    async addMessage(
        chatId: string,
        subject: 'user' | 'assistant',
        content: string
    ): Promise<ChatMessage | null> {
        try {
            // Persiste no banco
            const message = await messageRepository.createMessage({
                assistant_chat_id: chatId,
                subject,
                content
            });

            if (!message) {
                logger.error('Failed to create message in database');
                return null;
            }

            // Atualiza buffer de memória
            await this.updateMemoryBuffer(chatId);

            return message;
        } catch (error) {
            logger.error('Error adding message:', error);
            return null;
        }
    }

    /**
     * Atualiza buffer de memória com mensagens recentes
     */
    async updateMemoryBuffer(chatId: string): Promise<boolean> {
        try {
            const recentMessages = await messageRepository.getRecentMessages(chatId, this.BUFFER_SIZE);
            return await this.setMemoryBuffer(chatId, recentMessages);
        } catch (error) {
            logger.error('Error updating memory buffer:', error);
            return false;
        }
    }

    /**
     * Recupera contexto completo para o agente
     */
    async getAgentContext(sessionId: string): Promise<{
        recentMessages: ChatMessage[];
        sessionMeta: SessionCache | null;
    }> {
        try {
            // Busca mensagens recentes do banco
            const recentMessages = await messageRepository.getRecentMessages(sessionId, this.BUFFER_SIZE);

            // Busca metadados da sessão
            const session = await chatRepository.findById(sessionId);
            const sessionMeta = session ? {
                assistant_id: session.assistant_id,
                assistant_chat_id: session.id,
                user_id: session.user_id,
                prefecture_id: session.prefecture_id,
                created_at: session.created_at,
                last_activity: new Date().toISOString()
            } : null;

            return {
                recentMessages,
                sessionMeta
            };
        } catch (error) {
            logger.error('Error getting agent context:', error);
            return {
                recentMessages: [],
                sessionMeta: null
            };
        }
    }

    /**
     * Limpa cache de uma sessão
     */
    async clearSessionCache(userId: string): Promise<boolean> {
        try {
            const sessionKey = `${this.SESSION_CACHE_PREFIX}${userId}`;
            await redis.del(sessionKey);
            logger.debug(`Session cache cleared for user ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error clearing session cache:', error);
            return false;
        }
    }

    /**
     * Limpa buffer de memória de uma sessão
     */
    async clearMemoryBuffer(sessionId: string): Promise<boolean> {
        try {
            const bufferKey = `${this.MEMORY_BUFFER_PREFIX}${sessionId}`;
            await redis.del(bufferKey);
            logger.debug(`Memory buffer cleared for session ${sessionId}`);
            return true;
        } catch (error) {
            logger.error('Error clearing memory buffer:', error);
            return false;
        }
    }
}

export const memoryService = new MemoryService();
