import { z } from 'zod';
import {
    userIdValidator,
    vehiclePlateValidator
} from './shared.validator';

export const GetUserVehiclesValidator = z.object({
    userId: userIdValidator,

    plate: vehiclePlateValidator
        .optional()
        .describe('The plate of the vehicle (optional filter)'),

    model: z
        .string()
        .trim()
        .toLowerCase()
        .optional()
        .describe('The model of the vehicle (optional filter)'),
});

export const RegisterUserVehicleValidator = z.object({
    userId: userIdValidator,
    vehicle: z.object({
        plate: vehiclePlateValidator,
        model: z
            .string()
            .trim()
            .regex(/^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÒÖÚÇÑ0-9- ]+$/, 'Model must contain only letters, digits, spaces, and hyphens')
            .max(50, 'Model must be at most 50 characters'),
        vehicle_type_id: z
            .number()
            .int('Vehicle type ID must be an integer')
            .positive('Vehicle type ID must be positive')
            .refine(id => [1, 2, 3].includes(id), 'Vehicle type ID must be 1, 2, or 3')
    })
});

export type GetUserVehiclesInput = z.infer<typeof GetUserVehiclesValidator>;
export type RegisterUserVehicleInput = z.infer<typeof RegisterUserVehicleValidator>;
