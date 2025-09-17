export interface VehicleActivation {
    currently_active: boolean;
    remaining_time: number;
    start_date: string;
    end_date: string;
    value: number;
    activation_time: number;
    is_extended: boolean;
    total_duration_minutes: number;
}

// Service types

export interface HandleRegisterVehicleActivationParams {
    userId: number;
    vehiclePlate: string;
    timeValueRuleId: number;
    previousActivationId?: number;
    extend: boolean;
};

export interface CheckVehicleActivationParams {
    userId: number;
    vehiclePlate: string;
}

// Util types

export interface ActivateVehicleParams {
    vehiclePlate: string,
    prefectureId: string,
    timeValueRuleId: number,
    vehicleTypeId: number,
    userId: string,
    userToken: string,
    latitude?: number,
    longitude?: number,
    extend: boolean,
    previousActivationId?: string,
}

export interface RawVehicleActivation {
    id: number;
    codigo: string;
    veiculo_usuario_placa: string;
    data_criacao: string;
    data_inicio_ativacao: string;
    data_final_ativacao: string;
    motivo_atualizacao: string;
    informacao_adicional: string;
    endereco_logradouro: string;
    endereco_numero: string;
    endereco_bairro: string;
    estado: string;
    latitude: number;
    longitude: number;
    ativacao_anterior_id: number;
    prefeitura_id: number;
    regra_valor_tempo_id: number;
    vendedor_id: number;
    conta_usuario_id: number;
    tipo_veiculo_id: number;
    uuid_ativacao: string;
    imei_dispositivo: string;
    uuid_dispositivo: string;
    numero_vaga: string;
    origem: string;
    valor: number;
    tempo: number;
}
