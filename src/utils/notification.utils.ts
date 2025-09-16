import type { VehicleNotificationRaw, VehicleNotification, VehicleNotificationFormatted } from '../types/notification.types';

export const parseNotificationData = (notification: VehicleNotificationRaw): VehicleNotification => ({
    id: notification.id,
    code: notification.codigo,
    vehiclePlate: notification.veiculo_placa,
    vehicleModel: notification.veiculo_marca_modelo,
    vehicleType: notification.tipo_veiculo.nome,
    creationDate: notification.data_criacao,
    street: notification.endereco_logradouro,
    neighborhood: notification.endereco_bairro,
    number: notification.endereco_numero,
    fineValue: notification.valor_notificacao,
    state: notification.estado,
    observations: notification.observacoes,
});

export const transformNotificationsToFormatted = (
    notifications: VehicleNotification[],
    userVehicles: Array<{ plate: string; model: string; vehicle_type?: string | null }>
): VehicleNotificationFormatted[] => {
    return notifications.reduce((acc, notification) => {
        const vehicle = userVehicles.find(v => v.plate === notification.vehiclePlate);

        if (!vehicle) {
            return acc;
        }

        acc.push({
            vehiclePlate: vehicle.plate,
            vehicleModel: vehicle.model,
            vehicleType: vehicle.vehicle_type || null,
            notification: {
                state: notification.state,
                value: notification.fineValue,
                date: notification.creationDate,
                notifiedAt: `${notification.street}${notification.neighborhood ? ', ' + notification.neighborhood : ''}${notification.number ? ', ' + notification.number : ''}`,
                observations: notification.observations,
                notificationValue: notification.fineValue,
            }
        });

        return acc;
    }, [] as VehicleNotificationFormatted[]);
};
