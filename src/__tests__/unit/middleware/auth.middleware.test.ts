import { jest } from '@jest/globals';
import { Response, NextFunction } from 'express';
import {
    createAuthMiddleware,
    simpleAuth,
    optionalAuth,
    requireAuth,
    extractUserId,
    type AuthenticatedRequest,
} from '../../../middleware/auth.middleware';
import { logger } from '../../../utils/logger.util';

// Mock logger
jest.mock('../../../utils/logger.util');
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AuthMiddleware', () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            ip: '127.0.0.1',
            path: '/test',
            method: 'GET',
            body: {},
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis() as jest.MockedFunction<Response['status']>,
            json: jest.fn().mockReturnThis() as jest.MockedFunction<Response['json']>
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('createAuthMiddleware', () => {
        describe('requiredAuth: true', () => {
            it('should reject request without authorization header', async () => {
                const middleware = createAuthMiddleware({ requiredAuth: true });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockResponse.status).toHaveBeenCalledWith(401);
                expect(mockResponse.json).toHaveBeenCalledWith({
                    error: 'Authorization header required',
                    code: 'MISSING_AUTH_HEADER'
                });
                expect(mockNext).not.toHaveBeenCalled();
                expect(mockLogger.warn).toHaveBeenCalledWith('Missing authorization header', {
                    ip: '127.0.0.1',
                    path: '/test',
                    method: 'GET'
                });
            });

            it('should reject request with invalid Bearer token format', async () => {
                mockRequest.headers = { authorization: 'Bearer ' }; // Empty token after Bearer
                const middleware = createAuthMiddleware({ requiredAuth: true });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockResponse.status).toHaveBeenCalledWith(401);
                expect(mockResponse.json).toHaveBeenCalledWith({
                    error: 'Invalid authorization header format',
                    code: 'INVALID_AUTH_FORMAT'
                });
                expect(mockNext).not.toHaveBeenCalled();
            });

            it('should accept request with valid Bearer token', async () => {
                mockRequest.headers = { authorization: 'Bearer valid-token-123' };
                const middleware = createAuthMiddleware({ requiredAuth: true });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockRequest.user).toEqual({
                    id: 'valid-token-123',
                    token: 'valid-token-123'
                });
                expect(mockNext).toHaveBeenCalled();
                expect(mockResponse.status).not.toHaveBeenCalled();
            });

            it('should accept request with direct token', async () => {
                mockRequest.headers = { authorization: 'direct-token-123' };
                const middleware = createAuthMiddleware({ requiredAuth: true });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockRequest.user).toEqual({
                    id: 'direct-token-123',
                    token: 'direct-token-123'
                });
                expect(mockNext).toHaveBeenCalled();
            });

            it('should validate token with custom validator', async () => {
                const mockUser = { id: 'user123', name: 'Test User' };
                // @ts-expect-error - Mock function type compatibility
                const validateToken = jest.fn().mockResolvedValue(mockUser);

                mockRequest.headers = { authorization: 'Bearer valid-token' };
                const middleware = createAuthMiddleware({
                    requiredAuth: true,
                    validateToken: validateToken as unknown as (token: string) => Promise<{ id: string; name: string }>
                });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(validateToken).toHaveBeenCalledWith('valid-token');
                expect(mockRequest.user).toEqual(mockUser);
                expect(mockNext).toHaveBeenCalled();
                expect(mockLogger.debug).toHaveBeenCalledWith('User authenticated', {
                    userId: 'user123',
                    path: '/test',
                    method: 'GET'
                });
            });

            it('should reject request when token validation fails', async () => {
                // @ts-expect-error - Mock function type compatibility
                const validateToken = jest.fn().mockRejectedValue(new Error('Invalid token'));

                mockRequest.headers = { authorization: 'Bearer invalid-token' };
                const middleware = createAuthMiddleware({
                    requiredAuth: true,
                    validateToken: validateToken as unknown as (token: string) => Promise<never>
                });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockResponse.status).toHaveBeenCalledWith(401);
                expect(mockResponse.json).toHaveBeenCalledWith({
                    error: 'Invalid authentication token',
                    code: 'INVALID_TOKEN'
                });
                expect(mockNext).not.toHaveBeenCalled();
                expect(mockLogger.warn).toHaveBeenCalledWith('Token validation failed', {
                    error: 'Invalid token',
                    ip: '127.0.0.1',
                    path: '/test',
                    method: 'GET'
                });
            });
        });

        describe('requiredAuth: false', () => {
            it('should allow request without authorization header', async () => {
                const middleware = createAuthMiddleware({ requiredAuth: false });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
                expect(mockResponse.status).not.toHaveBeenCalled();
            });

            it('should process request with authorization header', async () => {
                mockRequest.headers = { authorization: 'Bearer valid-token' };
                const middleware = createAuthMiddleware({ requiredAuth: false });

                await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

                expect(mockRequest.user).toEqual({
                    id: 'valid-token',
                    token: 'valid-token'
                });
                expect(mockNext).toHaveBeenCalled();
            });
        });

        it('should handle middleware errors gracefully', async () => {
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            const middleware = createAuthMiddleware({
                requiredAuth: true,
                validateToken: jest.fn().mockImplementation(() => {
                    throw new Error('Unexpected error');
                }) as unknown as (token: string) => Promise<never>
            });

            await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid authentication token',
                code: 'INVALID_TOKEN'
            });
            expect(mockLogger.warn).toHaveBeenCalledWith('Token validation failed', {
                error: 'Unexpected error',
                ip: '127.0.0.1',
                path: '/test',
                method: 'GET'
            });
        });
    });

    describe('simpleAuth', () => {
        it('should require authorization header', async () => {
            await simpleAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authorization header required',
                code: 'MISSING_AUTH_HEADER'
            });
        });
    });

    describe('optionalAuth', () => {
        it('should allow request without authorization header', async () => {
            await optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('requireAuth', () => {
        it('should allow request with authenticated user', () => {
            mockRequest.user = { id: 'user123' };

            requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should reject request without authenticated user', () => {
            requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('extractUserId', () => {
        it('should extract userId from req.user.id', () => {
            mockRequest.user = { id: 'user123' };

            extractUserId(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockRequest.user?.id).toBe('user123');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should extract userId from authorization header', () => {
            mockRequest.headers = { authorization: 'Bearer user123' };

            extractUserId(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockRequest.user?.id).toBe('user123');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should extract userId from body.userId', () => {
            mockRequest.body = { userId: 'user123' };

            extractUserId(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockRequest.user?.id).toBe('user123');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should extract userId from query.userId', () => {
            mockRequest.query = { userId: 'user123' };

            extractUserId(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockRequest.user?.id).toBe('user123');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should prioritize req.user.id over other sources', () => {
            mockRequest.user = { id: 'user123' };
            mockRequest.headers = { authorization: 'Bearer user456' };
            mockRequest.body = { userId: 'user789' };
            mockRequest.query = { userId: 'user000' };

            extractUserId(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockRequest.user?.id).toBe('user123');
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle errors gracefully', () => {
            // Create a request that will cause an error in the try block
            mockRequest.headers = { authorization: 'Bearer token' };
            mockRequest.body = { userId: null as unknown as string }; // This will cause an error when accessing

            extractUserId(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            // The error handling in extractUserId doesn't log the error, it just calls next()
        });
    });
});
