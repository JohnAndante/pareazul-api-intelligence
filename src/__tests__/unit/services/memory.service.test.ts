import { jest } from '@jest/globals';
import { MemoryService } from '../../../services/memory.service';
import { redis } from '../../../config/redis.config';
import { messageRepository } from '../../../repositories/message.repository';
import { logger } from '../../../utils/logger.util';
import { ChatMessage, SessionCache } from '../../../types/chat.types';
import { MemoryBuffer } from '../../../types/session.types';

// Mock dependencies
jest.mock('../../../config/redis.config', () => ({
    redis: {
        setEx: jest.fn(),
        get: jest.fn(),
        on: jest.fn(),
        connect: jest.fn()
    }
}));

jest.mock('../../../repositories/message.repository', () => ({
    messageRepository: {
        createMessage: jest.fn(),
        getRecentMessages: jest.fn()
    }
}));

jest.mock('../../../utils/logger.util', () => ({
    logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    }
}));

const mockRedis = redis as jest.Mocked<typeof redis>;
const mockMessageRepository = messageRepository as jest.Mocked<typeof messageRepository>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('MemoryService', () => {
    let memoryService: MemoryService;

    beforeEach(() => {
        memoryService = new MemoryService();
        jest.clearAllMocks();
    });

    it('should handle Redis errors gracefully', async () => {
        const userId = 'user123';
        const sessionData: SessionCache = {
            assistant_id: 'assistant123',
            assistant_chat_id: 'chat123',
            payload: {
                usuario_id: 'user123',
                prefeitura_id: 'prefeitura123',
                prefeitura_sigla: 'prefeitura123',
                prefeitura_nome: 'prefeitura123',
                prefeitura_timezone: 'prefeitura123',
                usuario_nome: 'usuario123',
                usuario_email: 'usuario123',
                usuario_cpf: 'usuario123'
            },
            prefecture_user_token: 'token123',
            user_token: 'userToken123'
        };

        mockRedis.setEx.mockRejectedValue(new Error('Redis connection failed'));

        const result = await memoryService.setSessionCache(userId, sessionData);

        expect(result).toBe(true); // Should return true for fallback
        expect(mockLogger.warn).toHaveBeenCalledWith(
            'Redis unavailable for session cache, using memory fallback:',
            expect.any(Error)
        );
    });
});

describe('getSessionCache', () => {
    it('should retrieve session cache successfully', async () => {
        const userId = 'user123';
        const sessionData: SessionCache = {
            assistant_id: 'assistant123',
            assistant_chat_id: 'chat123',
            payload: {
                usuario_id: 'user123',
                prefeitura_id: 'prefeitura123',
                prefeitura_sigla: 'prefeitura123',
                prefeitura_nome: 'prefeitura123',
                prefeitura_timezone: 'prefeitura123',
                usuario_nome: 'usuario123',
                usuario_email: 'usuario123',
                usuario_cpf: 'usuario123'
            },
            prefecture_user_token: 'token123',
            user_token: 'userToken123'
        };

        mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

        const result = await memoryService.getSessionCache(userId);

        expect(result).toEqual(sessionData);
        expect(mockRedis.get).toHaveBeenCalledWith('chat_assistente_user123');
    });

    it('should return null when no cache found', async () => {
        const userId = 'user123';

        mockRedis.get.mockResolvedValue(null);

        const result = await memoryService.getSessionCache(userId);

        expect(result).toBeNull();
        expect(mockRedis.get).toHaveBeenCalledWith('chat_assistente_user123');
    });

    it('should handle Redis errors gracefully', async () => {
        const userId = 'user123';

        mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await memoryService.getSessionCache(userId);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error retrieving session cache:',
            expect.any(Error)
        );
    });
});

describe('setMemoryBuffer', () => {
    it('should store memory buffer successfully', async () => {
        const sessionId = 'session123';
        const messages: ChatMessage[] = [
            {
                id: 'msg1',
                assistant_chat_id: 'chat123',
                subject: 'user',
                content: 'Hello',
                created_at: '2023-01-01T00:00:00Z'
            },
            {
                id: 'msg2',
                assistant_chat_id: 'chat123',
                subject: 'assistant',
                content: 'Hi there!',
                created_at: '2023-01-01T00:01:00Z'
            }
        ];

        mockRedis.setEx.mockResolvedValue('OK');

        const result = await memoryService.setMemoryBuffer(sessionId, messages);

        expect(result).toBe(true);
        expect(mockRedis.setEx).toHaveBeenCalledWith(
            'memory_buffer_session123',
            3600,
            expect.stringContaining('"messages"')
        );
        expect(mockLogger.debug).toHaveBeenCalledWith('Memory buffer stored for session session123');
    });

    it('should handle Redis errors gracefully', async () => {
        const sessionId = 'session123';
        const messages: ChatMessage[] = [];

        mockRedis.setEx.mockRejectedValue(new Error('Redis connection failed'));

        const result = await memoryService.setMemoryBuffer(sessionId, messages);

        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error storing memory buffer:',
            expect.any(Error)
        );
    });
});

describe('getMemoryBuffer', () => {
    it('should retrieve memory buffer successfully', async () => {
        const sessionId = 'session123';
        const buffer: MemoryBuffer = {
            messages: [
                { role: 'user', content: 'Hello', timestamp: '2023-01-01T00:00:00Z' },
                { role: 'assistant', content: 'Hi there!', timestamp: '2023-01-01T00:01:00Z' }
            ],
            maxSize: 20
        };

        mockRedis.get.mockResolvedValue(JSON.stringify(buffer));

        const result = await memoryService.getMemoryBuffer(sessionId);

        expect(result).toEqual(buffer);
        expect(mockRedis.get).toHaveBeenCalledWith('memory_buffer_session123');
    });

    it('should return null when no buffer found', async () => {
        const sessionId = 'session123';

        mockRedis.get.mockResolvedValue(null);

        const result = await memoryService.getMemoryBuffer(sessionId);

        expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
        const sessionId = 'session123';

        mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await memoryService.getMemoryBuffer(sessionId);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error retrieving memory buffer:',
            expect.any(Error)
        );
    });
});

describe('addMessage', () => {
    it('should add message successfully', async () => {
        const chatId = 'chat123';
        const subject = 'user' as const;
        const content = 'Hello world';

        const mockMessage: ChatMessage = {
            id: 'msg123',
            assistant_chat_id: chatId,
            subject,
            content,
            created_at: '2023-01-01T00:00:00Z'
        };

        mockMessageRepository.createMessage.mockResolvedValue(mockMessage);
        mockMessageRepository.getRecentMessages.mockResolvedValue([mockMessage]);
        mockRedis.setEx.mockResolvedValue('OK');

        const result = await memoryService.addMessage(chatId, subject, content);

        expect(result).toEqual(mockMessage);
        expect(mockMessageRepository.createMessage).toHaveBeenCalledWith({
            assistant_chat_id: chatId,
            subject,
            content
        });
        expect(mockMessageRepository.getRecentMessages).toHaveBeenCalledWith(chatId, 20);
    });

    it('should return null when message creation fails', async () => {
        const chatId = 'chat123';
        const subject = 'user' as const;
        const content = 'Hello world';

        mockMessageRepository.createMessage.mockResolvedValue(null);

        const result = await memoryService.addMessage(chatId, subject, content);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to create message in database');
    });

    it('should handle errors gracefully', async () => {
        const chatId = 'chat123';
        const subject = 'user' as const;
        const content = 'Hello world';

        mockMessageRepository.createMessage.mockRejectedValue(new Error('Database error'));

        const result = await memoryService.addMessage(chatId, subject, content);

        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error adding message:',
            expect.any(Error)
        );
    });
});

describe('updateMemoryBuffer', () => {
    it('should update memory buffer successfully', async () => {
        const chatId = 'chat123';
        const messages: ChatMessage[] = [
            {
                id: 'msg1',
                assistant_chat_id: chatId,
                subject: 'user',
                content: 'Hello',
                created_at: '2023-01-01T00:00:00Z'
            }
        ];

        mockMessageRepository.getRecentMessages.mockResolvedValue(messages);
        mockRedis.setEx.mockResolvedValue('OK');

        const result = await memoryService.updateMemoryBuffer(chatId);

        expect(result).toBe(true);
        expect(mockMessageRepository.getRecentMessages).toHaveBeenCalledWith(chatId, 20);
        expect(mockRedis.setEx).toHaveBeenCalledWith(
            'memory_buffer_chat123',
            3600,
            expect.stringContaining('"messages"')
        );
    });

    it('should handle errors gracefully', async () => {
        const chatId = 'chat123';

        mockMessageRepository.getRecentMessages.mockRejectedValue(new Error('Database error'));

        const result = await memoryService.updateMemoryBuffer(chatId);

        expect(result).toBe(false);
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error updating memory buffer:',
            expect.any(Error)
        );
    });
});
});
