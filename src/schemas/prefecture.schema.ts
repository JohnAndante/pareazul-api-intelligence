import { z } from 'zod';
import { userIdValidator } from './shared.schema';

export const GetPrefectureRulesSchema = z.object({
    userId: userIdValidator,
});

export const GetPrefectureZoneRulesSchema = z.object({
    userId: userIdValidator,
    zoneId: z
        .number()
        .positive('Zone ID must be positive')
        .int('Zone ID must be an integer')
        .describe('The unique identifier for the zone'),
});

export type GetPrefectureRulesInput = z.infer<typeof GetPrefectureRulesSchema>;
export type GetPrefectureZoneRulesInput = z.infer<typeof GetPrefectureZoneRulesSchema>;
