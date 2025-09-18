import { BaseRepository } from './base.repository';
import { ChatSession } from '../types/chat.types';
import { logger } from '../utils/logger.util';

export class ChatRepository extends BaseRepository<ChatSession> {
    constructor() {
        super('assistant_chat_details', true); // Use admin client
    }

    async findActiveByUserId(userId: number): Promise<ChatSession | null> {
        try {
            const client = this.client;
            const { data, error } = await client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows found
                    return null;
                }
                logger.error('Error finding active chat by user id:', error);
                return null;
            }

            return data as ChatSession;
        } catch (error) {
            logger.error('Exception finding active chat by user id:', error);
            return null;
        }
    }


    async findActiveByAssistantId(assistantId: number): Promise<ChatSession | null> {
        try {
            const client = this.client;
            const { data, error } = await client
                .from(this.tableName)
                .select('*')
                .eq('assistant_id', assistantId)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger.error('Error finding active chat by assistant id:', error);
                return null;
            }

            return data as ChatSession;
        } catch (error) {
            logger.error('Exception finding active chat by assistant id:', error);
            return null;
        }
    }

    async inactivateUserSessions(userId: number): Promise<boolean> {
        try {
            const client = this.client;
            const { error } = await client
                .from(this.tableName)
                .update({
                    is_active: false,
                    inactivated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) {
                logger.error('Error inactivating user sessions:', error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Exception inactivating user sessions:', error);
            return false;
        }
    }

    async findActiveSession(userId: number, assistantId: string): Promise<ChatSession | null> {
        try {
            const client = this.client;
            const { data, error } = await client
                .from(this.tableName)
                .select('*')
                .eq('user_id', userId)
                .eq('assistant_id', assistantId)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger.error('Error finding active session by user and assistant id:', error);
                return null;
            }

            return data as ChatSession;
        } catch (error) {
            logger.error('Exception finding active session by user and assistant id:', error);
            return null;
        }
    }

    async createChat(sessionData: {
        user_id: number;
        prefecture_id: string;
        assistant_id: string;
    }): Promise<ChatSession | null> {
        const userIdString = sessionData.user_id.toString();
        try {
            const data = {
                ...sessionData,
                user_id: userIdString,
                is_active: true,
                created_at: new Date().toISOString()
            };

            return await this.create(data);
        } catch (error) {
            logger.error('Exception creating chat session:', error);
            return null;
        }
    }
}

export const chatRepository = new ChatRepository();
