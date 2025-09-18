import { z } from 'zod';
import {
    userIdValidator,
    vehiclePlateValidator,
} from './shared.schema';

export const CheckVehicleActivationSchema = z.object({
    userId: userIdValidator,
    vehiclePlate: vehiclePlateValidator,
});

export type CheckVehicleActivationInput = z.infer<typeof CheckVehicleActivationSchema>;

export const RegisterVehicleActivationSchema = z.object({
    userId: userIdValidator,
    vehiclePlate: vehiclePlateValidator,

    timeValueRuleId: z
        .number()
        .int('Time value rule ID must be an integer')
        .positive('Time value rule ID must be positive')
        .describe('The time value rule ID'),

    previousActivationId: z
        .number()
        .int('Previous activation ID must be an integer')
        .positive('Previous activation ID must be positive')
        .optional()
        .describe('The previous activation ID (optional)'),

    extend: z
        .boolean()
        .describe('Whether this is an extension of a previous activation'),
});

export type RegisterVehicleActivationInput = z.infer<typeof RegisterVehicleActivationSchema>;
