import moment from 'moment';
import { formatCurrency } from './string.utils';
import type {
    FormattedOperatingHour, FormattedRule, FormattedValueTime, FormattedVehicleType,
    OperatingHour, ValueTimeRule, VehicleType,
} from '../types/prefecture.types';

export const formatOperatingHours = (hours: OperatingHour[]): FormattedOperatingHour[] => {
    return hours.map(hour => ({
        id: hour.id,
        startTime: hour.horario_inicio,
        endTime: hour.horario_final,
        dayOfWeek: hour.dia_semana,
        dayName: moment.weekdaysShort(hour.dia_semana + 1), // Convert from 0-6 to 1-7
    }));
};

export const formatVehicleTypes = (types: VehicleType[]): FormattedVehicleType[] => {
    return types.map(type => ({
        id: type.id,
        name: type.nome,
    }));
};

export const formatValueTimes = (
    valueTimes: ValueTimeRule[],
    vehicleTypes: FormattedVehicleType[]
): FormattedValueTime[] => {
    return valueTimes
        .filter(vt => vt.permitir_ativar)
        .map(vt => ({
            id: vt.id,
            duration: vt.tempo,
            value: vt.valor,
            vehicleType: vehicleTypes.find(t => t.id === vt.tipo_veiculo_id) || {
                id: vt.tipo_veiculo_id,
                name: "Unknown",
            },
        }));
};

export const buildResponseText = (prefectureId: string, rule: FormattedRule, ruleNumber?: number): string => {
    const operatingHoursText = rule.operatingHours
        .map(h => `- ${h.dayName}: ${h.startTime} to ${h.endTime} (ID: ${h.id})`)
        .join('\n');

    const valueTimesText = rule.valueTimes
        .map(vt => `- ${vt.vehicleType.name}: ${vt.duration} min for ${formatCurrency(vt.value)} (ID: ${vt.id})`)
        .join('\n');

    const ruleTitle = ruleNumber ? `RULE #${ruleNumber}` : 'RULE';

    return [
        `${ruleTitle} - ${rule.name} (ID: ${rule.id})`,
        `Prefecture ID: ${prefectureId}`,
        ``,
        `Max Duration: ${rule.maxDuration} minutes`,
        ``,
        `Operating Hours (local time):`,
        operatingHoursText,
        ``,
        `Value Times:`,
        valueTimesText,
        ``,
        `Vehicle Types: ${rule.vehicleTypes.map(vt => vt.name).join(', ')}`,
        ``,
        `Full Rule Data: ${JSON.stringify(rule, null, 2)}`,
    ].join('\n');
};
