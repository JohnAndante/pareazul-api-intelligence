import moment from "moment-timezone";
import { ActivateVehicleParams, RawVehicleActivation, VehicleActivation } from "../types/activation.types";

export const parseActivationBody = (input: ActivateVehicleParams) => ({
    estender: input.extend,
    veiculo_usuario_placa: input.vehiclePlate,
    regra_valor_tempo_id: input.timeValueRuleId,
    uuid_ativacao: crypto.randomUUID(),
    usuario_id: input.userId,
    latitude: input.latitude,
    longitude: input.longitude,
    ativacao_anterior_id: input.previousActivationId,
    tipo_veiculo_id: input.vehicleTypeId,
});


export const extractActivationData = (
    data: RawVehicleActivation,
    prefectureTimezone: string,
): VehicleActivation => {
    const activationStartDate = data.data_inicio_ativacao;
    const activationEndDate = data.data_final_ativacao;
    const totalDuration = moment(activationEndDate).diff(moment(activationStartDate), 'minutes');

    const remainingTime = moment(activationEndDate).diff(moment(), 'minutes');
    const formattedStartDate = moment(activationStartDate).tz(prefectureTimezone).format();
    const formattedEndDate = moment(activationEndDate).tz(prefectureTimezone).format();

    return {
        currently_active: true,
        remaining_time: remainingTime,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        value: data.valor,
        activation_time: data.tempo,
        is_extended: data.ativacao_anterior_id !== null,
        total_duration_minutes: totalDuration,
    };
}
