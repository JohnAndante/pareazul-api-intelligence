import axiosWebservice from "../helpers/axiosWebservice";
import { logger } from "../utils/logger.util";
import { APIVehicle, Vehicle } from "../types/vehicle.types";

export const fetchUserVehicles = async (
    userId: number,
    prefectureToken: string
): Promise<APIVehicle[]> => new Promise((resolve, reject) => {
    const path = `/v4/usuarios/${userId}/veiculos`;
    const headers = { 'x-access-key': prefectureToken };

    axiosWebservice.get(path, { headers })
        .then(response => {

            if (response.status !== 200) {
                return [];
            }

            const vehicles: Vehicle[] = response.data;

            if (!Array.isArray(vehicles)) {
                return [];
            }

            const parsedVehicles: APIVehicle[] = vehicles.map(v => ({
                plate: v.placa,
                model: v.modelo.toLowerCase(),
                vehicle_type: v.tipo_veiculo,
                vehicle_type_id: v.tipo_veiculo_id,
            }));

            return parsedVehicles;
        })
        .then(resolve)
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error('[fetchUserVehicles] Error fetching user vehicles:', errorMessage);
            reject(errorMessage);
        });
});
export const postCreateVehicle = async (
    userId: number,
    vehicle: { plate: string; model: string; vehicle_type_id: number },
    prefectureToken: string
) => new Promise((resolve, reject) => {
    const path = `/v4/usuarios/${userId}/veiculos`;
    const headers = { 'x-access-key': prefectureToken };

    const vehicleData = {
        placa: vehicle.plate.toUpperCase(),
        modelo: vehicle.model,
        tipo_veiculo_id: vehicle.vehicle_type_id
    };

    axiosWebservice.post(path, vehicleData, { headers })
        .then(response => {
            return response.data;
        })
        .then(resolve)
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error('[postCreateVehicle] Error creating vehicle:', errorMessage);
            reject(errorMessage);
        });
});
