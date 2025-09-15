import { chatRepository } from '../repositories/chat.repository';
import { logger } from '../utils/logger.util';
import { v4 as uuidv4 } from 'uuid';

export interface SessionResult {
    session: any;
    assistantId: string;
    isNewSession: boolean;
}

export class SessionService {
    /**
     * Cria ou recupera uma sessão seguindo a lógica do n8n
     */
    async createSession(input: {
        payload: any;
        assistant_id?: string;
    }): Promise<SessionResult | null> {
        try {
            const { payload, assistant_id } = input;
            const userId = payload.usuario_id;

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

            // 2. Se não tem assistant_id ou não encontrou sessão, cria nova
            logger.info(`[SessionService] Creating new session for user: ${userId}`);

            // 3. Inativa sessões antigas do usuário (como no n8n)
            await this.inactivateOldSessions(userId);

            // 4. Cria nova sessão
            const newAssistantId = assistant_id || uuidv4();
            const newSession = await chatRepository.createChat({
                user_id: userId,
                prefecture_id: payload.prefeitura_id,
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

        } catch (error) {
            logger.error('[SessionService] Error creating session:', error);
            return null;
        }
    }

    /**
     * Busca sessão ativa por userId e assistantId
     */
    async findActiveSession(userId: string, assistantId: string): Promise<any | null> {
        try {
            const session = await chatRepository.findActiveSession(userId, assistantId);
            return session;
        } catch (error) {
            logger.error('[SessionService] Error finding active session:', error);
            return null;
        }
    }

    /**
     * Inativa sessões antigas do usuário (replicando lógica do n8n)
     */
    async inactivateOldSessions(userId: string): Promise<void> {
        try {
            await chatRepository.inactivateUserSessions(userId);
            logger.debug(`[SessionService] Inactivated old sessions for user: ${userId}`);
        } catch (error) {
            logger.error('[SessionService] Error inactivating old sessions:', error);
        }
    }

    /**
     * Recupera sessão por ID
     */
    async getSessionById(sessionId: string): Promise<any | null> {
        try {
            return await chatRepository.findById(sessionId);
        } catch (error) {
            logger.error('[SessionService] Error getting session by ID:', error);
            return null;
        }
    }
}

export const sessionService = new SessionService();
