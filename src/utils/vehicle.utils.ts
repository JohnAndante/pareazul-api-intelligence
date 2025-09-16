import type { FormattedVehicle } from '../types/vehicle.types';

export const vehicleTypes: Record<number, string> = {
    1: "Carro",
    2: "Moto",
    3: "Caminhão",
};

export const filterVehicles = (vehicles: FormattedVehicle[], plate?: string, model?: string): FormattedVehicle[] => {
    let filtered = [...vehicles];

    if (plate) {
        const plateSearch = plate.toUpperCase();
        filtered = filtered.filter(v => v.plate.toUpperCase().includes(plateSearch));
    }

    if (model) {
        const modelSearch = model.toLowerCase();
        filtered = filtered.filter(v => v.model.toLowerCase().includes(modelSearch));
    }

    return filtered;
};
