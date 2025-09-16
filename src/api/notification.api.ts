import moment from 'moment';
import axiosWebservice from '../helpers/axiosWebservice';
import { parseNotificationData } from '../utils/notification.utils';
import { logger } from '../utils/logger.util';
import type { VehicleNotification } from '../types/notification.types';

export const fetchVehiclesNotifications = async (
    vehiclePlates: string[],
    prefectureId: string,
    prefectureToken: string
): Promise<VehicleNotification[]> => {
    return Promise.resolve()
        .then(async () => {
            const url = `/v4/prefeituras/${prefectureId}/notificacoes`;
            const states = 'ABERTA|TOLERANCIA|PAGA|CANCELADA|VENCIDA';

            const headers = {
                'x-access-key': prefectureToken,
                'Content-Type': 'application/json',
            };

            const queryParams = {
                estados: states,
                placas: vehiclePlates.join('|'),
                data_inicial: moment().subtract(14, 'days').format('YYYY-MM-DD'),
            };

            const queryString = new URLSearchParams(queryParams).toString();
            const fullUrl = `${url}?${queryString}`;

            const response = await axiosWebservice.get(fullUrl, { headers });

            if (!response.data?.resultado || !Array.isArray(response.data.resultado)) {
                return [];
            }

            const { resultado: notifications } = response.data;

            return notifications.map(parseNotificationData);
        })
        .catch(error => {
            logger.error('[fetchVehiclesNotifications] Error fetching vehicles notifications:', error);
            throw error;
        });
};
