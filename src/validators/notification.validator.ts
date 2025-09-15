import { z } from 'zod';

export const GetAllUserVehiclesCurrentNotificationsSchema = z.object({
    userId: z.string().min(1, 'User ID is required')
});

export const GetCurrentNotificationsForVehicleSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    vehiclePlate: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Vehicle plate must be a valid format')
        .max(8, 'Vehicle plate must be at most 8 characters')
});

export type GetAllUserVehiclesCurrentNotificationsInput = z.infer<typeof GetAllUserVehiclesCurrentNotificationsSchema>;
export type GetCurrentNotificationsForVehicleInput = z.infer<typeof GetCurrentNotificationsForVehicleSchema>;
