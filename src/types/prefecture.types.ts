import { VehicleType } from "./vehicle.types";

export interface OperatingHour {
    id: number;
    dia_semana: number;
    horario_inicio: string;
    horario_final: string;
}

export interface ValueTimeRule {
    id: number;
    tempo: number;
    valor: number;
    tipo_veiculo_id: number;
    permitir_ativar: boolean;
}

export interface Rule {
    id: number;
    nome: string;
    tempo_maximo: number;
    horario_funcionamentos: OperatingHour[];
    regra_valor_tempos: ValueTimeRule[];
    tipo_veiculos: VehicleType[];
}
