import { z } from 'zod';
import { userIdValidator } from './shared.validator';

export const GetUserBalanceValidator = z.object({
    userId: userIdValidator,
});

export type GetUserBalanceInput = z.infer<typeof GetUserBalanceValidator>;
