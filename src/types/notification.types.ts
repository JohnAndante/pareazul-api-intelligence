export interface VehicleNotificationRaw {
    id: number;
    codigo: string;
    veiculo_placa: string;
    data_criacao: string;
    mensagem: string | null;
    endereco_logradouro: string;
    endereco_bairro: string;
    endereco_numero: string;
    valor_notificacao: number;
    estado: string;
    observacoes: string | null;
    veiculo_marca_modelo: string;
    tipo_veiculo: {
        nome: string;
    }
}

export interface VehicleNotification {
    id: number;
    code: string;
    vehiclePlate: string;
    vehicleModel: string;
    vehicleType: string;
    creationDate: string;
    street: string;
    neighborhood: string;
    number: string;
    fineValue: number;
    state: string;
    observations: string | null;
}

export interface VehicleNotificationFormatted {
    vehiclePlate: string;
    vehicleModel: string;
    vehicleType: string | null;
    notification: {
        state: string;
        value: number;
        date: string;
        notifiedAt: string;
        observations: string | null;
        notificationValue: number;
    };
}

// Service parameter types
export interface GetAllUserVehiclesCurrentNotificationsParams {
    userId: number;
}

export interface GetCurrentNotificationsForVehicleParams {
    userId: number;
    vehiclePlate: string;
}

// Service response types
export interface GetAllUserVehiclesCurrentNotificationsResponse {
    text: string;
}

export interface GetCurrentNotificationsForVehicleResponse {
    text: string;
}
