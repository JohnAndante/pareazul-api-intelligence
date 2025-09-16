import { Request, Response } from 'express';
import { AssistantController } from '../../../controllers/assistant.controller';

// Mock das dependências
jest.mock('../../../agents/assistant', () => ({
    processAssistantMessage: jest.fn(),
    processWebhookRequest: jest.fn(),
}));

jest.mock('../../../utils/logger.util', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('AssistantController - Simple Tests', () => {
    let controller: AssistantController;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        controller = new AssistantController();
        mockReq = {
            body: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('processMessage', () => {
        it('should return 400 for missing message', async () => {
            // Arrange
            mockReq.body = {
                payload: { usuario_id: 'user123' },
            };

            // Act
            await controller.processMessage(mockReq as Request, mockRes as Response);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Missing required fields: message and payload are required',
            });
        });

        it('should return 400 for missing payload', async () => {
            // Arrange
            mockReq.body = {
                message: 'Hello',
            };

            // Act
            await controller.processMessage(mockReq as Request, mockRes as Response);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Missing required fields: message and payload are required',
            });
        });
    });

    describe('health', () => {
        it('should return health status', async () => {
            // Act
            await controller.health(mockReq as Request, mockRes as Response);

            // Assert
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'ok',
                service: 'assistant-agent',
                timestamp: expect.any(String),
            });
        });
    });
});
