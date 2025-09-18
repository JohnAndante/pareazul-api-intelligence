import { z } from 'zod';
import { userIdValidator } from './shared.schema';

export const GetUserBalanceSchema = z.object({
    userId: userIdValidator,
});

export type GetUserBalanceInput = z.infer<typeof GetUserBalanceSchema>;
