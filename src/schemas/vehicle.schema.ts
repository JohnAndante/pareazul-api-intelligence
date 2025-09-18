import { z } from 'zod';
import {
    userIdValidator,
    vehiclePlateValidator
} from './shared.schema';

export const GetUserVehiclesSchema = z.object({
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

export const RegisterUserVehicleSchema = z.object({
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

export type GetUserVehiclesInput = z.infer<typeof GetUserVehiclesSchema>;
export type RegisterUserVehicleInput = z.infer<typeof RegisterUserVehicleSchema>;
