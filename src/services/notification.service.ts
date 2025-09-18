import moment from 'moment-timezone';
import { MemoryService } from './memory.service';
import { fetchUserVehicles } from '../api/vehicle.api';
import { fetchVehiclesNotifications } from '../api/notification.api';
import { transformNotificationsToFormatted } from '../utils/notification.utils';
import { formatCurrency } from '../utils/string.utils';
import { logger } from '../utils/logger.util';
import type {
    VehicleNotificationFormatted,
    GetAllUserVehiclesCurrentNotificationsParams,
    GetAllUserVehiclesCurrentNotificationsResponse,
    GetCurrentNotificationsForVehicleParams,
    GetCurrentNotificationsForVehicleResponse
} from '../types/notification.types';

export class NotificationService {
    private readonly memoryService: MemoryService;

    constructor() {
        this.memoryService = new MemoryService();
    }

    async getAllUserVehiclesCurrentNotifications(params: GetAllUserVehiclesCurrentNotificationsParams): Promise<GetAllUserVehiclesCurrentNotificationsResponse> {
        const { userId } = params;

        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.error(`[NotificationService] User session not found for userId: ${userId}`);
                    return { text: "User session not found." };
                }

                const {
                    payload: {
                        prefeitura_id: prefectureId,
                        prefeitura_timezone: prefectureTimezone,
                    },
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const userVehicles = await fetchUserVehicles(userId, prefectureUserToken);

                const vehiclePlates = userVehicles.map(vehicle => vehicle.plate);

                const notifications = await fetchVehiclesNotifications(vehiclePlates, prefectureId, prefectureUserToken);

                const vehicleNotifications: VehicleNotificationFormatted[] = transformNotificationsToFormatted(notifications, userVehicles);

                let responseText = `User ${userId} vehicles current notifications:\n`;
                vehicleNotifications.forEach(vehicleNotification => {
                    responseText += `\n Vehicle plate: ${vehicleNotification.vehiclePlate}${vehicleNotification.vehicleModel ? ` - ${vehicleNotification.vehicleModel}` : ''}${vehicleNotification.vehicleType ? ` - ${vehicleNotification.vehicleType}` : ''}`;
                    responseText += `\n Notification state: ${vehicleNotification.notification.state}`;
                    responseText += `\n Notification date (prefecture local time): ${moment(vehicleNotification.notification.date).tz(prefectureTimezone).format('DD/MM/YYYY HH:mm:ss')}`;
                    responseText += `\n Notified at: ${vehicleNotification.notification.notifiedAt}`;
                    responseText += `\n Notification value: ${formatCurrency(vehicleNotification.notification.notificationValue)}`;
                    responseText += `\n\n`;
                });

                return { text: responseText };
            })
            .catch(error => {
                logger.error('[NotificationService] Error fetching user vehicles current notifications:', error);
                return { text: "An error occurred while fetching user vehicles current notifications." };
            });
    }

    async getCurrentNotificationsForVehicle(params: GetCurrentNotificationsForVehicleParams): Promise<GetCurrentNotificationsForVehicleResponse> {
        const { userId, vehiclePlate } = params;
        const vehiclePlateFormatted = vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.error(`[NotificationService] User session not found for userId: ${userId}`);
                    return { text: "User session not found." };
                }

                const {
                    payload: {
                        prefeitura_id: prefectureId,
                        prefeitura_timezone: prefectureTimezone,
                    },
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const userVehicles = await fetchUserVehicles(userId, prefectureUserToken);

                if (!userVehicles.some(vehicle => vehicle.plate === vehiclePlateFormatted)) {
                    return { text: `Vehicle ${vehiclePlateFormatted} not found for user ${userId}.` };
                }

                const vehicleNotifications = await fetchVehiclesNotifications([vehiclePlateFormatted], prefectureId, prefectureUserToken);

                if (vehicleNotifications.length === 0) {
                    return { text: `No notifications found for vehicle ${vehiclePlateFormatted}.` };
                }

                const vehicleNotificationsFormatted = transformNotificationsToFormatted(vehicleNotifications, userVehicles);

                let responseText = `User ${userId} vehicle ${vehiclePlateFormatted} current notifications:\n`;
                vehicleNotificationsFormatted.forEach(vehicleNotification => {
                    responseText += `\n Notification state: ${vehicleNotification.notification.state}`;
                    responseText += `\n Notification date (prefecture local time): ${moment(vehicleNotification.notification.date).tz(prefectureTimezone).format('DD/MM/YYYY HH:mm:ss')}`;
                    responseText += `\n Notified at: ${vehicleNotification.notification.notifiedAt}`;
                    responseText += `\n Notification value: ${formatCurrency(vehicleNotification.notification.notificationValue)}`;
                    responseText += `\n\n`;
                });

                return { text: responseText };
            })
            .catch(error => {
                logger.error('[NotificationService] Error fetching user vehicles current notifications:', error);
                return { text: "An error occurred while fetching user vehicles current notifications." };
            });
    }
}

export const notificationService = new NotificationService();
