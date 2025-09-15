import { z } from 'zod';

export const CheckVehicleActivationSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    vehiclePlate: z
        .string()
        .trim()
        .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Vehicle plate must be a valid plate number')
        .min(7, 'Vehicle plate must be at least 7 characters')
        .max(8, 'Vehicle plate must be at most 8 characters')
});

export type CheckVehicleActivationInput = z.infer<typeof CheckVehicleActivationSchema>;

export const RegisterVehicleActivationSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    vehiclePlate: z
        .string()
        .trim()
        .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Vehicle plate must be a valid plate number')
        .min(7, 'Vehicle plate must be at least 7 characters')
        .max(8, 'Vehicle plate must be at most 8 characters'),
    timeValueRuleId: z
        .number()
        .int('Time value rule ID must be an integer')
        .positive('Time value rule ID must be positive'),
    previousActivationId: z
        .number()
        .int('Previous activation ID must be an integer')
        .positive('Previous activation ID must be positive')
        .optional(),
    extend: z.boolean()
});

export type RegisterVehicleActivationInput = z.infer<typeof RegisterVehicleActivationSchema>;
