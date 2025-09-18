import { z } from 'zod';
import {
    userIdValidator,
    vehiclePlateValidator,
} from './shared.schema';

export const GetAllUserVehiclesCurrentNotificationsSchema = z.object({
    userId: userIdValidator,
});

export const GetCurrentNotificationsForVehicleSchema = z.object({
    userId: userIdValidator,
    vehiclePlate: vehiclePlateValidator,
});

export type GetAllUserVehiclesCurrentNotificationsInput = z.infer<typeof GetAllUserVehiclesCurrentNotificationsSchema>;
export type GetCurrentNotificationsForVehicleInput = z.infer<typeof GetCurrentNotificationsForVehicleSchema>;
