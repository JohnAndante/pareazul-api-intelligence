import { z } from 'zod';
import {
    userIdValidator,
} from './shared.validator';

export const GetUserInfoSchema = z.object({
    userId: userIdValidator
});

export const GetMessageHistorySchema = z.object({
    sessionId: z
        .uuid('sessionId must be a valid UUID')
        .describe('The session ID'),

    limit: z
        .number()
        .optional()
        .describe('Maximum number of messages to return (default: 20)')
});

export const GetSessionStatusSchema = z.object({
    sessionId: z
        .uuid('sessionId must be a valid UUID')
        .describe('The session ID')
});
