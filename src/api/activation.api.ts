import axiosWebservice from "../helpers/axiosWebservice";
import { logger as loggerUtil } from "../utils/logger.util";
import { extractActivationData, parseActivationBody } from "../utils/activation.utils";

import { ActivateVehicleParams, RawVehicleActivation, VehicleActivation } from "../types/activation.types";

const logger = loggerUtil.child({ service: 'ActivationApi' });

export const fetchVehicleCurrentActivations = async (
    plate: string,
    prefectureId: string,
    timezone: string,
    prefectureToken: string
): Promise<VehicleActivation[]> => {
    const path = `/v4/prefeituras/${prefectureId}/ativacoes/validas?placa=${plate}`;

    return axiosWebservice.get(path, {
        headers: { 'x-access-key': prefectureToken },
    })
        .then(response => {
            if (!response.data || !Array.isArray(response.data)) {
                return [];
            }

            const { data: activations } = response;

            const orderedActivations = activations.sort((a, b) => {
                return new Date(b.data_inicio_ativacao).getTime() - new Date(a.data_inicio_ativacao).getTime();
            });

            const parsedActivations = orderedActivations.map(activation => {
                return extractActivationData(activation, timezone);
            });

            return parsedActivations
        })
        .catch(error => {
            logger.error("[fetchVehicleCurrentActivations] Error fetching vehicle activations:", error);
            throw error;
        });
};

export const activateVehicle = (input: ActivateVehicleParams): Promise<RawVehicleActivation> => {
    const { prefectureId, userToken } = input;

    const path = `/v4/prefeituras/${prefectureId}/ativar`;
    const data = parseActivationBody(input);

    return axiosWebservice.post(path, data, {
        headers: { 'x-access-key': userToken },
    })
        .then(({ data: { ativacao } }) => ativacao)
        .catch(error => {
            logger.error("[activateVehicle] Error registering vehicle activation:", error);
            throw error;
        });
}
