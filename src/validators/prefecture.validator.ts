import { z } from 'zod';
import { userIdValidator } from './shared.validator';

export const GetPrefectureRulesValidator = z.object({
    userId: userIdValidator,
});

export const GetPrefectureZoneRulesValidator = z.object({
    userId: userIdValidator,
    zoneId: z
        .number()
        .positive('Zone ID must be positive')
        .int('Zone ID must be an integer')
        .describe('The unique identifier for the zone'),
});

export type GetPrefectureRulesInput = z.infer<typeof GetPrefectureRulesValidator>;
export type GetPrefectureZoneRulesInput = z.infer<typeof GetPrefectureZoneRulesValidator>;
