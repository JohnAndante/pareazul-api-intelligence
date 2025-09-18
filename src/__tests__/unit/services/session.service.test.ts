import { SessionService } from '../../../services/session.service';

// Mock das dependências externas
jest.mock('../../../repositories/chat.repository', () => ({
    chatRepository: {
        findActiveSession: jest.fn(),
        findActiveByUserId: jest.fn(),
        inactivateUserSessions: jest.fn(),
        createChat: jest.fn(),
        findById: jest.fn(),
    },
}));

jest.mock('../../../utils/logger.util', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'generated-uuid-123'),
}));

describe('SessionService', () => {
    let sessionService: SessionService;
    let mockChatRepository: any;

    beforeEach(() => {
        sessionService = new SessionService();

        // Importar o mock após a criação da instância
        const { chatRepository } = require('../../../repositories/chat.repository');
        mockChatRepository = chatRepository;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createSession', () => {
        it('should create new session when none exists', async () => {
            // Arrange
            const payload = {
                usuario_id: 'user123',
                prefeitura_id: '1'
            };
            const assistantId = 'assistant123';

            const mockSession = {
                id: 'session123',
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: assistantId,
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockChatRepository.findActiveSession.mockResolvedValue(null);
            mockChatRepository.findActiveByUserId.mockResolvedValue(null);
            mockChatRepository.inactivateUserSessions.mockResolvedValue(true);
            mockChatRepository.createChat.mockResolvedValue(mockSession);

            // Act
            const result = await sessionService.createSession({ payload, assistant_id: assistantId });

            // Assert
            expect(result).toBeTruthy();
            expect(result!.isNewSession).toBe(true);
            expect(result!.session.id).toBe('session123');
            expect(result!.assistantId).toBe(assistantId);
            expect(mockChatRepository.createChat).toHaveBeenCalledWith({
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: assistantId,
            });
        });

        it('should return existing session when found by assistant_id', async () => {
            // Arrange
            const payload = {
                usuario_id: 'user123',
                prefeitura_id: '1'
            };
            const assistantId = 'assistant123';

            const existingSession = {
                id: 'existing123',
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: assistantId,
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockChatRepository.findActiveSession.mockResolvedValue(existingSession);

            // Act
            const result = await sessionService.createSession({ payload, assistant_id: assistantId });

            // Assert
            expect(result).toBeTruthy();
            expect(result!.isNewSession).toBe(false);
            expect(result!.session.id).toBe('existing123');
            expect(result!.assistantId).toBe(assistantId);
            expect(mockChatRepository.createChat).not.toHaveBeenCalled();
        });

        it('should return existing user session when no assistant_id provided', async () => {
            // Arrange
            const payload = {
                usuario_id: 'user123',
                prefeitura_id: '1'
            };

            const existingSession = {
                id: 'user-session123',
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: 'user-assistant123',
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockChatRepository.findActiveSession.mockResolvedValue(null);
            mockChatRepository.findActiveByUserId.mockResolvedValue(existingSession);

            // Act
            const result = await sessionService.createSession({ payload });

            // Assert
            expect(result).toBeTruthy();
            expect(result!.isNewSession).toBe(false);
            expect(result!.session.id).toBe('user-session123');
            expect(result!.assistantId).toBe('user-assistant123');
            expect(mockChatRepository.createChat).not.toHaveBeenCalled();
        });

        it('should handle repository errors gracefully', async () => {
            // Arrange
            const payload = {
                usuario_id: 'user123',
                prefeitura_id: '1'
            };

            // Mock all repository methods to reject
            mockChatRepository.findActiveSession.mockRejectedValue(new Error('Database error'));
            mockChatRepository.findActiveByUserId.mockRejectedValue(new Error('Database error'));
            mockChatRepository.inactivateUserSessions.mockRejectedValue(new Error('Database error'));
            mockChatRepository.createChat.mockRejectedValue(new Error('Database error'));

            // Act
            const result = await sessionService.createSession({ payload, assistant_id: 'assistant123' });

            // Assert
            expect(result).toBeNull();
        });

        it('should generate new assistant_id when not provided', async () => {
            // Arrange
            const payload = {
                usuario_id: 'user123',
                prefeitura_id: '1'
            };

            const mockSession = {
                id: 'session123',
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: 'generated-uuid-123',
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockChatRepository.findActiveSession.mockResolvedValue(null);
            mockChatRepository.findActiveByUserId.mockResolvedValue(null);
            mockChatRepository.inactivateUserSessions.mockResolvedValue(true);
            mockChatRepository.createChat.mockResolvedValue(mockSession);

            // Act
            const result = await sessionService.createSession({ payload });

            // Assert
            expect(result).toBeTruthy();
            expect(result!.isNewSession).toBe(true);
            expect(mockChatRepository.createChat).toHaveBeenCalledWith({
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: 'generated-uuid-123',
            });
        });
    });

    describe('findActiveSession', () => {
        it('should return session when found', async () => {
            // Arrange
            const userId = 123;
            const assistantId = 'assistant123';
            const mockSession = {
                id: 'session123',
                user_id: userId,
                prefecture_id: '1',
                assistant_id: assistantId,
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockChatRepository.findActiveSession.mockResolvedValue(mockSession);

            // Act
            const result = await sessionService.findActiveSession(userId, assistantId);

            // Assert
            expect(result).toEqual(mockSession);
            expect(mockChatRepository.findActiveSession).toHaveBeenCalledWith(userId, assistantId);
        });

        it('should return null when session not found', async () => {
            // Arrange
            const userId = 123;
            const assistantId = 'assistant123';

            mockChatRepository.findActiveSession.mockResolvedValue(null);

            // Act
            const result = await sessionService.findActiveSession(userId, assistantId);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle repository errors gracefully', async () => {
            // Arrange
            const userId = 123;
            const assistantId = 'assistant123';

            mockChatRepository.findActiveSession.mockRejectedValue(new Error('Database error'));

            // Act
            const result = await sessionService.findActiveSession(userId, assistantId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('inactivateOldSessions', () => {
        it('should inactivate old sessions successfully', async () => {
            // Arrange
            const userId = 123;

            mockChatRepository.inactivateUserSessions.mockResolvedValue(true);

            // Act
            await sessionService.inactivateOldSessions(userId);

            // Assert
            expect(mockChatRepository.inactivateUserSessions).toHaveBeenCalledWith(userId);
        });

        it('should handle repository errors gracefully', async () => {
            // Arrange
            const userId = 123;

            mockChatRepository.inactivateUserSessions.mockRejectedValue(new Error('Database error'));

            // Act
            await sessionService.inactivateOldSessions(userId);

            // Assert
            expect(mockChatRepository.inactivateUserSessions).toHaveBeenCalledWith(userId);
        });
    });

    describe('getSessionById', () => {
        it('should return session when found', async () => {
            // Arrange
            const sessionId = 123;
            const mockSession = {
                id: sessionId,
                user_id: 'user123',
                prefecture_id: '1',
                assistant_id: 'assistant123',
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockChatRepository.findById.mockResolvedValue(mockSession);

            // Act
            const result = await sessionService.getSessionById(sessionId);

            // Assert
            expect(result).toEqual(mockSession);
            expect(mockChatRepository.findById).toHaveBeenCalledWith(sessionId);
        });

        it('should return null when session not found', async () => {
            // Arrange
            const sessionId = 123;

            mockChatRepository.findById.mockResolvedValue(null);

            // Act
            const result = await sessionService.getSessionById(sessionId);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle repository errors gracefully', async () => {
            // Arrange
            const sessionId = 123;

            mockChatRepository.findById.mockRejectedValue(new Error('Database error'));

            // Act
            const result = await sessionService.getSessionById(sessionId);

            // Assert
            expect(result).toBeNull();
        });
    });
});
