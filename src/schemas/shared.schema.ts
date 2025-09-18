import { z } from 'zod';

/**
 * Schemas compartilhados para evitar repetição de validações
 * Padrões comuns usados em múltiplos schemas
 */

/**
 * @name userIdValidator
 * @description The unique identifier for the user
 * @example '1234567890'
 */
export const userIdValidator = z
    .number()
    .int('User ID must be an integer')
    .positive('User ID must be positive')
    .min(1, 'User ID is required')
    .describe('The unique identifier for the user');

/**
 * @name vehiclePlateValidator
 * @description The plate of the vehicle
 * @example 'ABC1234' or 'ABC1D23'
 */
export const vehiclePlateValidator = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Vehicle plate must be a valid plate number')
    .min(7, 'Vehicle plate must be at least 7 characters')
    .max(8, 'Vehicle plate must be at most 8 characters')
    .describe('The plate of the vehicle');
