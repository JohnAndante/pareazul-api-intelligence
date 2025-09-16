import { jest } from '@jest/globals';
import { CryptoUtil } from '../../../utils/crypto.util';

describe('CryptoUtil', () => {
    describe('generateUUID', () => {
        it('should generate a valid UUID v4', () => {
            const uuid = CryptoUtil.generateUUID();

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(uuid).toMatch(uuidRegex);
            expect(uuid).toHaveLength(36);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = CryptoUtil.generateUUID();
            const uuid2 = CryptoUtil.generateUUID();

            expect(uuid1).not.toBe(uuid2);
        });

        it('should generate multiple unique UUIDs', () => {
            const uuids = Array.from({ length: 100 }, () => CryptoUtil.generateUUID());
            const uniqueUuids = new Set(uuids);

            expect(uniqueUuids.size).toBe(100);
        });
    });

    describe('generateSessionId', () => {
        it('should generate session ID without userId', () => {
            const sessionId = CryptoUtil.generateSessionId();

            expect(sessionId).toMatch(/^\d+-[a-z0-9]+$/);
            expect(sessionId).toContain('-');
        });

        it('should generate session ID with userId', () => {
            const userId = 'user123';
            const sessionId = CryptoUtil.generateSessionId(userId);

            expect(sessionId).toMatch(/^user123-\d+-[a-z0-9]+$/);
            expect(sessionId.startsWith('user123-')).toBe(true);
        });

        it('should generate unique session IDs', () => {
            const sessionId1 = CryptoUtil.generateSessionId('user123');
            const sessionId2 = CryptoUtil.generateSessionId('user123');

            expect(sessionId1).not.toBe(sessionId2);
        });

        it('should handle different userIds', () => {
            const sessionId1 = CryptoUtil.generateSessionId('user123');
            const sessionId2 = CryptoUtil.generateSessionId('user456');

            expect(sessionId1.startsWith('user123-')).toBe(true);
            expect(sessionId2.startsWith('user456-')).toBe(true);
            expect(sessionId1).not.toBe(sessionId2);
        });

        it('should include timestamp in session ID', () => {
            const before = Date.now();
            const sessionId = CryptoUtil.generateSessionId('user123');
            const after = Date.now();

            const timestamp = parseInt(sessionId.split('-')[1]);

            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('hash', () => {
        it('should generate SHA-256 hash', () => {
            const input = 'test string';
            const hash = CryptoUtil.hash(input);

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash).toHaveLength(64);
        });

        it('should generate consistent hash for same input', () => {
            const input = 'test string';
            const hash1 = CryptoUtil.hash(input);
            const hash2 = CryptoUtil.hash(input);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different inputs', () => {
            const hash1 = CryptoUtil.hash('input1');
            const hash2 = CryptoUtil.hash('input2');

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty string', () => {
            const hash = CryptoUtil.hash('');

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash).toHaveLength(64);
        });

        it('should handle special characters', () => {
            const input = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const hash = CryptoUtil.hash(input);

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash).toHaveLength(64);
        });

        it('should handle unicode characters', () => {
            const input = 'café 🚀 ñoño';
            const hash = CryptoUtil.hash(input);

            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(hash).toHaveLength(64);
        });
    });

    describe('generateAuthToken', () => {
        it('should generate auth token with correct length', () => {
            const token = CryptoUtil.generateAuthToken();

            expect(token).toMatch(/^[a-f0-9]{32}$/);
            expect(token).toHaveLength(32);
        });

        it('should generate unique auth tokens', () => {
            const token1 = CryptoUtil.generateAuthToken();
            const token2 = CryptoUtil.generateAuthToken();

            expect(token1).not.toBe(token2);
        });

        it('should generate multiple unique tokens', () => {
            const tokens = Array.from({ length: 100 }, () => CryptoUtil.generateAuthToken());
            const uniqueTokens = new Set(tokens);

            expect(uniqueTokens.size).toBe(100);
        });

        it('should generate hex characters only', () => {
            const token = CryptoUtil.generateAuthToken();

            expect(token).toMatch(/^[a-f0-9]+$/);
        });
    });

    describe('isValidUUID', () => {
        it('should validate correct UUID v4', () => {
            const validUuid = '123e4567-e89b-42d3-a456-426614174000'; // Fixed version to 4

            expect(CryptoUtil.isValidUUID(validUuid)).toBe(true);
        });

        it('should validate UUID with uppercase letters', () => {
            const validUuid = '123E4567-E89B-42D3-A456-426614174000'; // Fixed version to 4

            expect(CryptoUtil.isValidUUID(validUuid)).toBe(true);
        });

        it('should reject invalid UUID format', () => {
            const invalidUuids = [
                '123e4567-e89b-12d3-a456-42661417400', // Too short
                '123e4567-e89b-12d3-a456-4266141740000', // Too long
                '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
                '123e4567-e89b-12d3-a456', // Missing parts
                '123e4567e89b12d3a456426614174000', // Missing hyphens
                '123e4567-e89b-12d3-a456-42661417400-', // Extra hyphen
                '', // Empty string
                'not-a-uuid' // Not a UUID
            ];

            invalidUuids.forEach(invalidUuid => {
                expect(CryptoUtil.isValidUUID(invalidUuid)).toBe(false);
            });
        });

        it('should reject UUID v1', () => {
            const uuidV1 = '123e4567-e89b-11d3-a456-426614174000'; // Version 1

            expect(CryptoUtil.isValidUUID(uuidV1)).toBe(false);
        });

        it('should reject UUID v3', () => {
            const uuidV3 = '123e4567-e89b-13d3-a456-426614174000'; // Version 3

            expect(CryptoUtil.isValidUUID(uuidV3)).toBe(false);
        });

        it('should accept valid UUID v4 variants', () => {
            const validUuids = [
                '123e4567-e89b-42d3-8456-426614174000', // Variant 8 (8xxx)
                '123e4567-e89b-42d3-9456-426614174000', // Variant 9 (9xxx)
                '123e4567-e89b-42d3-a456-426614174000', // Variant A (axxx)
                '123e4567-e89b-42d3-b456-426614174000'  // Variant B (bxxx)
            ];

            validUuids.forEach(validUuid => {
                expect(CryptoUtil.isValidUUID(validUuid)).toBe(true);
            });
        });
    });

    describe('sanitizeId', () => {
        it('should sanitize basic string', () => {
            const input = 'Hello World 123';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('helloworld123'); // Spaces are removed
        });

        it('should remove special characters', () => {
            const input = 'Hello@World#123!';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('helloworld123');
        });

        it('should keep allowed characters', () => {
            const input = 'hello-world_123';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('hello-world_123');
        });

        it('should convert to lowercase', () => {
            const input = 'HELLO WORLD';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('helloworld'); // Spaces are removed
        });

        it('should limit length to 50 characters', () => {
            const input = 'a'.repeat(100);
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toHaveLength(50);
            expect(sanitized).toBe('a'.repeat(50));
        });

        it('should handle empty string', () => {
            const input = '';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('');
        });

        it('should handle string with only special characters', () => {
            const input = '@#$%^&*()';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('');
        });

        it('should handle unicode characters', () => {
            const input = 'café ñoño';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('cafoo'); // Unicode chars are removed, spaces too
        });

        it('should preserve numbers', () => {
            const input = 'user123';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('user123');
        });

        it('should handle mixed case and special characters', () => {
            const input = 'User@123_Test-Name';
            const sanitized = CryptoUtil.sanitizeId(input);

            expect(sanitized).toBe('user123_test-name');
        });
    });
});
