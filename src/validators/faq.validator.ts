import { z } from 'zod';

export const FaqSearchValidator = z.object({
    query: z.string().describe('The question or query to search for in the FAQ database'),
});

export type FaqSearchInput = z.infer<typeof FaqSearchValidator>;
