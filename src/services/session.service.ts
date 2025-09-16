import { chatRepository } from '../repositories/chat.repository';
import { logger } from '../utils/logger.util';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from '../types/chat.types';

export interface SessionResult {
    session: ChatSession;
    assistantId: string;
    isNewSession: boolean;
}

export class SessionService {
    /**
     * Cria ou recupera uma sessão seguindo a lógica do n8n
     */
    createSession(input: {
        payload: Record<string, unknown>;
        assistant_id?: string;
    }): Promise<SessionResult | null> {
        const { payload, assistant_id } = input;
        const userId = payload.usuario_id as string;

        return Promise.resolve()
            .then(async () => {
                // 1. Se tem assistant_id, tenta recuperar sessão existente
                if (assistant_id) {
                    const existingSession = await this.findActiveSession(userId, assistant_id);
                    if (existingSession) {
                        logger.info(`[SessionService] Using existing session: ${existingSession.id}`);
                        return {
                            session: existingSession,
                            assistantId: assistant_id,
                            isNewSession: false
                        };
                    }
                }

                // 2. Se não tem assistant_id, verifica se existe alguma sessão ativa do usuário
                if (!assistant_id) {
                    const existingUserSession = await chatRepository.findActiveByUserId(userId);
                    if (existingUserSession) {
                        logger.info(`[SessionService] Using existing user session: ${existingUserSession.id}`);
                        return {
                            session: existingUserSession,
                            assistantId: existingUserSession.assistant_id,
                            isNewSession: false
                        };
                    }
                }

                // 3. Se não encontrou nenhuma sessão, cria nova
                logger.info(`[SessionService] Creating new session for user: ${userId}`);

                // 4. Inativa sessões antigas do usuário (como no n8n)
                await this.inactivateOldSessions(userId);

                // 5. Cria nova sessão
                const newAssistantId = assistant_id || uuidv4();
                const newSession = await chatRepository.createChat({
                    user_id: userId,
                    prefecture_id: payload.prefeitura_id as string,
                    assistant_id: newAssistantId
                });

                if (!newSession) {
                    logger.error('[SessionService] Failed to create new session');
                    return null;
                }

                logger.info(`[SessionService] New session created: ${newSession.id}`);

                return {
                    session: newSession,
                    assistantId: newAssistantId,
                    isNewSession: true
                };
            })
            .catch(error => {
                logger.error('[SessionService] Error creating session:', error);
                return null;
            });
    }

    /**
     * Busca sessão ativa por userId e assistantId
     */
    findActiveSession(userId: string, assistantId: string): Promise<ChatSession | null> {
        return chatRepository.findActiveSession(userId, assistantId)
            .then(session => session)
            .catch(error => {
                logger.error('[SessionService] Error finding active session:', error);
                return null;
            });
    }

    /**
     * Inativa sessões antigas do usuário (replicando lógica do n8n)
     */
    inactivateOldSessions(userId: string): Promise<void> {
        return chatRepository.inactivateUserSessions(userId)
            .then(() => {
                logger.debug(`[SessionService] Inactivated old sessions for user: ${userId}`);
            })
            .catch(error => {
                logger.error('[SessionService] Error inactivating old sessions:', error);
            });
    }

    /**
     * Recupera sessão por ID
     */
    getSessionById(sessionId: string): Promise<ChatSession | null> {
        return chatRepository.findById(sessionId)
            .then(session => session)
            .catch(error => {
                logger.error('[SessionService] Error getting session by ID:', error);
                return null;
            });
    }
}

export const sessionService = new SessionService();
