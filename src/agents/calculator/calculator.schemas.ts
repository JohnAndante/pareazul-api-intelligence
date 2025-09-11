import { z } from 'zod';

export const MathInputSchema = z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
});

export type MathInput = z.infer<typeof MathInputSchema>;

export const CalculatorQuerySchema = z.string()
    .min(1, 'Query cannot be empty')
    .describe('Mathematical question in natural language');

export type CalculatorQuery = z.infer<typeof CalculatorQuerySchema>;
