import type { FormattedVehicle } from '../types/vehicle.types';
import { normalizePlate, normalizeText, createFlexibleRegex } from './string.utils';

export const vehicleTypes: Record<number, string> = {
    1: "Carro",
    2: "Moto",
    3: "Caminhão",
};

export const filterVehicles = (vehicles: FormattedVehicle[], plate?: string, model?: string): FormattedVehicle[] => {
    let filtered = [...vehicles];

    if (plate) {
        const plateSearch = normalizePlate(plate);
        filtered = filtered.filter(v => {
            const vehiclePlate = normalizePlate(v.plate);
            return vehiclePlate.includes(plateSearch);
        });
    }

    if (model) {
        const modelRegex = createFlexibleRegex(model);
        filtered = filtered.filter(v => {
            const vehicleModel = normalizeText(v.model);
            return modelRegex.test(vehicleModel);
        });
    }

    return filtered;
};
