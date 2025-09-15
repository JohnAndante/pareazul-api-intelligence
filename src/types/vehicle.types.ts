export interface APIVehicle {
    plate: string;
    model: string;
    vehicle_type?: string | null;
    vehicle_type_id: number;
}

export interface VehicleType {
    id: number;
    nome: string;
}

export interface Vehicle {
    placa: string;
    modelo: string;
    tipo_veiculo: string | null;
    tipo_veiculo_id: number;
}

export interface APIVehicleLookup {
    id?: number;
    marca_modelo?: string;
    placa: string;
    tipo_veiculo: string;
    marca?: string;
    modelo: string;
    tipo_veiculo_id: number | null;
}

export interface UserVehiclesParams {
    userId: string;
    plate?: string;
    model?: string;
}

export interface FormattedVehicle {
    plate: string;
    model: string;
    type?: {
        id: number;
        name: string;
    } | null;
}

export interface InputVehicle {
    plate: string;
    model: string;
    vehicle_type_id: number;
}

export interface RegisterVehicleParams {
    userId: string;
    vehicle: InputVehicle;
}
