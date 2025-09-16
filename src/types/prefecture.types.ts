export interface OperatingHour {
    id: number;
    dia_semana: number;
    horario_inicio: string;
    horario_final: string;
}

export interface VehicleType {
    id: number;
    nome: string;
}

export interface Rule {
    id: number;
    nome: string;
    tempo_maximo: number;
    horario_funcionamentos: OperatingHour[];
    regra_valor_tempos: ValueTimeRule[];
    tipo_veiculos: VehicleType[];
}

export interface FormattedOperatingHour {
    id: number;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    dayName: string;
}

export interface FormattedVehicleType {
    id: number;
    name: string;
}

export interface FormattedValueTime {
    id: number;
    duration: number;
    value: number;
    vehicleType: FormattedVehicleType;
}

export interface FormattedRule {
    id: number;
    name: string;
    maxDuration: number;
    operatingHours: FormattedOperatingHour[];
    valueTimes: FormattedValueTime[];
    vehicleTypes: FormattedVehicleType[];
}

export interface PrefectureRulesParams {
    userId: string;
}

export interface ValueTimeRule {
    id: number;
    tempo: number;
    valor: number;
    tipo_veiculo_id: number;
    permitir_ativar: boolean;
}

export interface PrefectureZoneRulesParams {
    userId: string;
    zoneId: number;
}
