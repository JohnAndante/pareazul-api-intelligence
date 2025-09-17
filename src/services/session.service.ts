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
     * Cria ou recupera uma sessão com validação robusta
     */
    createSession(input: {
        payload: Record<string, unknown>;
        assistant_id?: string;
    }): Promise<SessionResult | null> {
        const { payload, assistant_id } = input;
        const userId = payload.usuario_id as string;
        const prefectureId = payload.prefeitura_id as string;

        return Promise.resolve()
            .then(async () => {
                logger.info(`[SessionService] Processing session for user ${userId} in prefecture ${prefectureId}`);

                if (!assistant_id) {
                    await this.inactivateOldSessions(userId);

                    // Cria nova sessão
                    const newAssistantId = assistant_id || uuidv4();
                    const newSession = await chatRepository.createChat({
                        user_id: userId,
                        prefecture_id: prefectureId,
                        assistant_id: newAssistantId
                    });

                    if (!newSession) {
                        logger.error('[SessionService] Failed to create new session');
                        return null;
                    }

                    logger.info(`[SessionService] New session created: ${newSession.id} with assistant_id: ${newAssistantId}`);

                    return {
                        session: newSession,
                        assistantId: newAssistantId,
                        isNewSession: true
                    };
                }

                const existingUserSession = await chatRepository.findActiveByUserId(userId);

                if (existingUserSession && existingUserSession.assistant_id === assistant_id) {
                    // Mesmo assistant_id = continua o chat existente
                    logger.info(`[SessionService] Using existing session with same assistant_id: ${existingUserSession.id}`);
                    return {
                        session: existingUserSession,
                        assistantId: assistant_id,
                        isNewSession: false
                    };
                }

                // Se não tem assistant_id = NOVO CHAT (inativa anterior)
                await this.inactivateOldSessions(userId);

                // Continua para criar nova sessão
                logger.info(`[SessionService] Creating new session for user ${userId} in prefecture ${prefectureId}`);

                // SEMPRE inativa todas as sessões antigas do usuário (garante apenas 1 ativa)
                await this.inactivateOldSessions(userId);

                // Cria nova sessão
                const newAssistantId = assistant_id || uuidv4();
                const newSession = await chatRepository.createChat({
                    user_id: userId,
                    prefecture_id: prefectureId,
                    assistant_id: newAssistantId
                });

                if (!newSession) {
                    logger.error('[SessionService] Failed to create new session');
                    return null;
                }

                logger.info(`[SessionService] New session created: ${newSession.id} with assistant_id: ${newAssistantId}`);

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
