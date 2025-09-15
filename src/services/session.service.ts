import { v4 as uuidv4 } from 'uuid';
import { chatRepository } from '../repositories/chat.repository';
import { memoryService } from './memory.service';
import { ChatPayload, SessionCache } from '../types/chat.types';
import { logger } from '../utils/logger.util';

export class SessionService {
    /**
     * Gera um novo assistant_id único
     */
    generateAssistantId(): string {
        return uuidv4();
    }

    /**
     * Verifica se o usuário tem uma sessão ativa
     */
    async getActiveSession(userId: string): Promise<{
        session: any;
        assistantId: string;
    } | null> {
        try {
            // Busca no cache primeiro
            const sessionCache = await memoryService.getSessionCache(userId);

            if (sessionCache) {
                // Verifica se a sessão ainda está ativa no banco
                const activeSession = await chatRepository.findActiveByAssistantId(sessionCache.assistant_id);

                if (activeSession) {
                    return {
                        session: activeSession,
                        assistantId: sessionCache.assistant_id
                    };
                } else {
                    // Sessão expirou, limpa cache
                    await memoryService.clearSessionCache(userId);
                }
            }

            return null;
        } catch (error) {
            logger.error('Error getting active session:', error);
            return null;
        }
    }

    /**
     * Cria uma nova sessão para o usuário
     */
    async createSession(
        userId: string,
        prefectureId: string,
        assistantId?: string
    ): Promise<{
        session: any;
        assistantId: string;
    } | null> {
        try {
            // Inativa sessões anteriores do usuário
            await chatRepository.inactivateUserSessions(userId);

            // Gera novo assistant_id se não fornecido
            const newAssistantId = assistantId || this.generateAssistantId();

            // Cria nova sessão no banco
            const session = await chatRepository.createSession({
                user_id: userId,
                prefecture_id: prefectureId,
                assistant_id: newAssistantId
            });

            if (!session) {
                logger.error('Failed to create session in database');
                return null;
            }

            // Armazena no cache
            const sessionCache: SessionCache = {
                assistant_id: newAssistantId,
                assistant_chat_id: session.id
            };

            await memoryService.setSessionCache(userId, sessionCache);

            logger.info(`New session created for user ${userId} with assistant ${newAssistantId}`);

            return {
                session,
                assistantId: newAssistantId
            };
        } catch (error) {
            logger.error('Error creating session:', error);
            return null;
        }
    }

    /**
     * Processa entrada do webhook e determina ação da sessão
     */
    async processWebhookRequest(request: {
        payload: ChatPayload;
        assistant_id?: string;
    }): Promise<{
        session: any;
        assistantId: string;
        isNewSession: boolean;
    } | null> {
        try {
            const { payload, assistant_id } = request;
            const userId = payload.usuario_id;
            const prefectureId = payload.prefeitura_id;

            // Se tem assistant_id, tenta recuperar sessão existente
            if (assistant_id) {
                const activeSession = await chatRepository.findActiveByAssistantId(assistant_id);

                if (activeSession) {
                    // Atualiza cache
                    const sessionCache: SessionCache = {
                        assistant_id,
                        assistant_chat_id: activeSession.id
                    };
                    await memoryService.setSessionCache(userId, sessionCache);

                    return {
                        session: activeSession,
                        assistantId: assistant_id,
                        isNewSession: false
                    };
                }
            }

            // Se não tem assistant_id ou sessão não existe, cria nova
            const result = await this.createSession(userId, prefectureId, assistant_id);

            if (!result) {
                return null;
            }

            return {
                ...result,
                isNewSession: true
            };
        } catch (error) {
            logger.error('Error processing webhook request:', error);
            return null;
        }
    }

    /**
     * Inativa uma sessão específica
     */
    async inactivateSession(sessionId: string): Promise<boolean> {
        try {
            const session = await chatRepository.findById(sessionId);
            if (!session) {
                return false;
            }

            // Inativa no banco
            const updated = await chatRepository.update(sessionId, {
                is_active: false,
                inactivated_at: new Date().toISOString()
            });

            if (!updated) {
                return false;
            }

            // Limpa cache
            await memoryService.clearSessionCache(session.user_id);
            await memoryService.clearMemoryBuffer(sessionId);

            logger.info(`Session ${sessionId} inactivated`);
            return true;
        } catch (error) {
            logger.error('Error inactivating session:', error);
            return false;
        }
    }

    /**
     * Recupera contexto completo da sessão para o agente
     */
    async getSessionContext(sessionId: string): Promise<{
        session: any;
        recentMessages: any[];
        sessionMeta: SessionCache | null;
    } | null> {
        try {
            const session = await chatRepository.findById(sessionId);
            if (!session) {
                return null;
            }

            const context = await memoryService.getAgentContext(sessionId);

            return {
                session,
                recentMessages: context.recentMessages,
                sessionMeta: context.sessionMeta
            };
        } catch (error) {
            logger.error('Error getting session context:', error);
            return null;
        }
    }
}

export const sessionService = new SessionService();
