import { z } from 'zod';
import {
    userIdValidator,
    vehiclePlateValidator,
} from './shared.validator';

export const GetAllUserVehiclesCurrentNotificationsValidator = z.object({
    userId: userIdValidator,
});

export const GetCurrentNotificationsForVehicleValidator = z.object({
    userId: userIdValidator,
    vehiclePlate: vehiclePlateValidator,
});

export type GetAllUserVehiclesCurrentNotificationsInput = z.infer<typeof GetAllUserVehiclesCurrentNotificationsValidator>;
export type GetCurrentNotificationsForVehicleInput = z.infer<typeof GetCurrentNotificationsForVehicleValidator>;
