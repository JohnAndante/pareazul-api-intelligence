import axiosWebservice from "../helpers/axiosWebservice";
import { logger } from "../utils/logger.util";
import { APIVehicle, Vehicle } from "../types/vehicle.types";

export const fetchUserVehicles = async (
    userId: string,
    prefectureToken: string
): Promise<APIVehicle[]> => {
    return Promise.resolve()
        .then(async () => {
            const path = `/v4/usuarios/${userId}/veiculos`;

            const response = await axiosWebservice.get(path, {
                headers: { 'x-access-key': prefectureToken },
            });

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
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error('[fetchUserVehicles] Error fetching user vehicles:', errorMessage);
            throw errorMessage;
        });
};

export const postCreateVehicle = async (
    userId: string,
    vehicle: { plate: string; model: string; vehicle_type_id: number },
    prefectureToken: string
): Promise<any> => {
    return Promise.resolve()
        .then(async () => {
            const path = `/v4/usuarios/${userId}/veiculos`;

            const vehicleData = {
                placa: vehicle.plate.toUpperCase(),
                modelo: vehicle.model,
                tipo_veiculo_id: vehicle.vehicle_type_id
            };

            const response = await axiosWebservice.post(path, vehicleData, {
                headers: { 'x-access-key': prefectureToken },
            });

            return response.data;
        })
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error('[postCreateVehicle] Error creating vehicle:', errorMessage);
            throw errorMessage;
        });
};
