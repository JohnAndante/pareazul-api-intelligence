import axiosWebservice from "../helpers/axiosWebservice";
import { APIVehicle, Vehicle } from "../types/vehicle.types";

export const fetchUserVehicles = (
    userId: string,
    prefectureToken: string
) => new Promise<APIVehicle[]>((resolve, reject) => {
    const path = `/v4/usuarios/${userId}/veiculos`;

    return axiosWebservice.get(path, {
        headers: { 'x-access-key': prefectureToken },
    })
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
            reject(errorMessage);
        });
});
