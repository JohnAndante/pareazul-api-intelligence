import { z } from 'zod';

export const GetPrefectureRulesSchema = z.object({
    userId: z.string().min(1, 'User ID is required')
});

export const GetPrefectureZonesSchema = z.object({
    userId: z.string().min(1, 'User ID is required')
});

export const GetPrefectureZoneRulesSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    zoneId: z
        .number()
        .int('Zone ID must be an integer')
        .positive('Zone ID must be positive')
});

export type GetPrefectureRulesInput = z.infer<typeof GetPrefectureRulesSchema>;
export type GetPrefectureZonesInput = z.infer<typeof GetPrefectureZonesSchema>;
export type GetPrefectureZoneRulesInput = z.infer<typeof GetPrefectureZoneRulesSchema>;
