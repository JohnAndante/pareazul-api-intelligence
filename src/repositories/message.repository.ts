import { BaseRepository } from './base.repository';
import { ChatMessage } from '../types/chat.types';
import { logger } from '../utils/logger.util';

export class MessageRepository extends BaseRepository<ChatMessage> {
    constructor() {
        super('assistant_chat_messages', true); // Use admin client
    }

    async findByChatId(chatId: string, limit?: number): Promise<ChatMessage[]> {
        try {
            let query = this.client
                .from(this.tableName)
                .select('*')
                .eq('assistant_chat_id', chatId)
                .order('created_at', { ascending: true });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error finding messages by chat id:', error);
                return [];
            }

            return data as ChatMessage[];
        } catch (error) {
            logger.error('Exception finding messages by chat id:', error);
            return [];
        }
    }

    async createMessage(messageData: {
        assistant_chat_id: string;
        subject: 'user' | 'assistant';
        content: string;
    }): Promise<ChatMessage | null> {
        try {
            const data = {
                ...messageData,
                created_at: new Date().toISOString()
            };

            return await this.create(data);
        } catch (error) {
            logger.error('Exception creating message:', error);
            return null;
        }
    }

    async getRecentMessages(chatId: string, limit: number = 20): Promise<ChatMessage[]> {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('*')
                .eq('assistant_chat_id', chatId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('Error getting recent messages:', error);
                return [];
            }

            return (data as ChatMessage[]).reverse(); // Reverse to get chronological order
        } catch (error) {
            logger.error('Exception getting recent messages:', error);
            return [];
        }
    }
}

export const messageRepository = new MessageRepository();
