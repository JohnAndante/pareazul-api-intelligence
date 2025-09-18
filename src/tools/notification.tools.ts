import { DynamicStructuredTool } from '@langchain/core/tools';
import { notificationService } from '../services/notification.service';
import {
    GetAllUserVehiclesCurrentNotificationsSchema,
    GetCurrentNotificationsForVehicleSchema,
    GetAllUserVehiclesCurrentNotificationsInput,
    GetCurrentNotificationsForVehicleInput
} from '../schemas/notification.schema';

export const getAllUserVehiclesCurrentNotificationsTool = new DynamicStructuredTool({
    name: 'getAllUserVehiclesCurrentNotifications',
    description: 'Get all notifications in tolerance and open for all user vehicles.',
    schema: GetAllUserVehiclesCurrentNotificationsSchema,
    func: async (input: GetAllUserVehiclesCurrentNotificationsInput) => {
        const result = await notificationService.getAllUserVehiclesCurrentNotifications(input);
        return result.text;
    }
});

export const getCurrentNotificationsForVehicleTool = new DynamicStructuredTool({
    name: 'getCurrentNotificationsForVehicle',
    description: 'Get all notifications for a specific vehicle.',
    schema: GetCurrentNotificationsForVehicleSchema,
    func: async (input: GetCurrentNotificationsForVehicleInput) => {
        const result = await notificationService.getCurrentNotificationsForVehicle(input);
        return result.text;
    }
});

export const notificationTools = [
    getAllUserVehiclesCurrentNotificationsTool,
    getCurrentNotificationsForVehicleTool
];
