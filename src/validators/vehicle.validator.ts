import { z } from 'zod';

export const GetUserVehiclesSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    plate: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Plate number must be a valid format')
        .max(8, 'Plate number must be at most 8 characters')
        .optional(),
    model: z
        .string()
        .trim()
        .toLowerCase()
        .optional()
});

export const RegisterUserVehicleSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    vehicle: z.object({
        plate: z
            .string()
            .trim()
            .toUpperCase()
            .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Plate number must be a valid format')
            .max(8, 'Plate number must be at most 8 characters'),
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
