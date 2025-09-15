import { z } from 'zod';

export const GetUserBalanceSchema = z.object({
    userId: z.string().min(1, 'User ID is required')
});

export type GetUserBalanceInput = z.infer<typeof GetUserBalanceSchema>;
