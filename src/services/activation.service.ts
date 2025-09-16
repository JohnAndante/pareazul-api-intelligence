import { memoryService } from "./memory.service";
import { activateVehicle, fetchVehicleCurrentActivations } from "../api/activation.api";
import { fetchUserVehicles } from "../api/vehicle.api";
import { fetchPrefectureRules } from "../api/prefecture.api";
import { extractActivationData } from "../utils/activation.utils";
import { StringUtil } from '../utils/string.util';
import { logger } from "../utils/logger.util";

import { HandleRegisterVehicleActivationParams, CheckVehicleActivationParams } from '../types/activation.types';

class ActivationService {
    private readonly logger = logger.child({ service: 'ActivationService' });

    checkCurrentVehicleActivation(params: CheckVehicleActivationParams): Promise<{ text: string }> {
        const { userId, vehiclePlate } = params;

        return memoryService.getSessionCache(userId)
            .then(async userPayload => {
                if (!userPayload) {
                    this.logger.error(`User session not found for userId: ${userId}`);
                    return { text: "User session not found. Wrong userId provided or user session expired." };
                }

                const {
                    payload: {
                        prefeitura_id: prefectureId,
                        prefeitura_timezone: prefectureTimezone,
                    },
                    prefecture_user_token: prefectureUserToken,
                } = userPayload;

                const clearPlateValue = StringUtil.clearPlate(vehiclePlate);

                const activations = await fetchVehicleCurrentActivations(
                    clearPlateValue, prefectureId, prefectureTimezone, prefectureUserToken
                );

                if (!activations || activations.length === 0) {
                    return { text: `No activation found for vehicle plate ${vehiclePlate}.` };
                }

                const latestActivation = activations[0];

                const responseText = `Vehicle plate ${vehiclePlate} is currently activated.`
                    + `\n The current activation will expire on ${latestActivation.remaining_time} minutes.`
                    + `\n Precisely, it will expire on ${latestActivation.end_date} (prefecture local time).`
                    + `${latestActivation.is_extended ? '\n This activation is an extension of a previous one.' : ''}`
                    + `\n More details: ${JSON.stringify(activations, null)}`;

                return { text: responseText };
            })
            .catch(error => {
                this.logger.error('Error getting user payload:', error);
                return { text: "Error getting user payload." };
            });
    }

    handleRegisterVehicleActivation(input: HandleRegisterVehicleActivationParams): Promise<{ text: string }> {
        const { userId, vehiclePlate, timeValueRuleId, previousActivationId, extend } = input;

        return memoryService.getSessionCache(userId)
            .then(async userPayload => {
                if (!userPayload) {
                    this.logger.error(`User session not found for userId: ${userId}`);
                    return { text: "User session not found. Wrong userId provided or user session expired." };
                }

                const {
                    payload: {
                        prefeitura_id: prefectureId,
                        prefeitura_timezone: prefectureTimezone,
                    },
                    prefecture_user_token: prefectureUserToken,
                } = userPayload;

                // Verificando se o veículo está registrado para o usuário
                const userVehicles = await fetchUserVehicles(userId, prefectureUserToken);

                const vehicle = userVehicles.find(v => StringUtil.clearPlate(v.plate) === StringUtil.clearPlate(vehiclePlate));

                if (!vehicle) {
                    return { text: `Vehicle plate ${vehiclePlate} not registered for user ${userId}.` };
                }

                // Verificando se o veículo está ativado
                const currentActivations = await fetchVehicleCurrentActivations(
                    vehicle.plate, prefectureId, prefectureTimezone, prefectureUserToken
                );

                if (currentActivations && currentActivations.length > 0 && !extend) {
                    return {
                        text: `❌ ACTIVATION BLOCKED: Vehicle plate ${vehicle.plate} is already activated.`
                            + `\n Current activation will expire on ${currentActivations[0].end_date} (prefecture local time).`
                            + `\n If you want to extend the current activation, please call this tool again with 'extend' parameter set to true.`
                            + `\n Do NOT retry this activation without the extend parameter.`
                    };
                }

                if (extend && !previousActivationId) {
                    return { text: "To extend an activation, 'previousActivationId' must be provided." };
                }

                // Verificando se a regra de valor do tempo existe
                const rules = await fetchPrefectureRules(prefectureId, prefectureUserToken);

                const timeValueRule = rules.find(rule => rule.regra_valor_tempos.some(timeValueRule => timeValueRule.id === timeValueRuleId));
                if (!timeValueRule) {
                    return {
                        text: `Time value rule ID ${timeValueRuleId} not found in the prefecture rules.`
                            + `\n Please check if the time value rule ID is valid.`
                    };
                }

                // Registrando a ativação
                const registerInput = {
                    vehiclePlate: vehicle.plate,
                    prefectureId,
                    timeValueRuleId: timeValueRuleId,
                    vehicleTypeId: vehicle.vehicle_type_id,
                    userId,
                    userToken: prefectureUserToken,
                    extend: extend,
                    previousActivationId: previousActivationId?.toString() || undefined,
                };

                const activation = await activateVehicle(registerInput);

                if (!activation) {
                    return { text: "Failed to register vehicle activation." };
                }

                const parsedActivation = extractActivationData(activation, prefectureTimezone);

                const responseText = `Vehicle with plate ${vehicle.plate} has been successfully activated.`
                    + `\n Activation will expire on ${parsedActivation.end_date} (prefecture local time).`
                    + `\n Activation total time: ${parsedActivation.total_duration_minutes} minutes.`
                    + `\n More details: ${JSON.stringify(parsedActivation, null)}`;

                return { text: responseText };
            })
            .catch(error => {
                if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { data?: { code?: number; message?: string } } };

                    if (axiosError.response?.data?.code === 606) {
                        return {
                            text: `❌ ACTIVATION BLOCKED: Maximum number of active plates reached.`
                                + `\n The user already has the maximum number of active vehicle plates allowed by the prefecture.`
                                + `\n To activate this vehicle, the user must first wait for one of their current activations to expire.`
                                + `\n Use the 'checkVehicleCurrentActivations' tool to see all current activations and their expiration times.`
                        };
                    }

                    // Handle insufficient balance error
                    if (axiosError.response?.data?.code === 400 &&
                        axiosError.response?.data?.message?.toLowerCase().includes('saldo')) {
                        return {
                            text: `❌ ACTIVATION BLOCKED: Insufficient balance.`
                                + `\n The user does not have enough balance to activate the vehicle.`
                                + `\n Use the 'getUserBalance' tool to check the current balance.`
                        };
                    }

                    // Handle vehicle not found error (code 3002)
                    if (axiosError.response?.data?.code === 3002) {
                        return {
                            text: `❌ ACTIVATION BLOCKED: Vehicle not found in user's registration.`
                                + `\n The vehicle plate "${vehiclePlate}" is not registered for this user.`
                                + `\n Use the 'getUserVehicles' tool to check registered vehicles.`
                        };
                    }

                    // Handle extension error - no active activation to extend (code 2801)
                    if (axiosError.response?.data?.code === 2801) {
                        return {
                            text: `❌ EXTENSION BLOCKED: No active activation to extend.`
                                + `\n There is no current active activation for this vehicle to extend.`
                                + `\n The previous activation may have already expired or doesn't exist.`
                                + `\n Use the 'checkVehicleCurrentActivations' tool to check current activations.`
                        };
                    }

                    // Handle other specific error codes
                    if (axiosError.response?.data?.code) {
                        const errorMessage = axiosError.response.data.message || 'Unknown error';
                        return {
                            text: `❌ ACTIVATION FAILED: ${errorMessage}`
                                + `\n Error code: ${axiosError.response.data.code}`
                        };
                    }

                    this.logger.error('Error registering vehicle activation:', error);
                    return {
                        text: `❌ ACTIVATION FAILED: An error occurred while registering the vehicle activation.`
                            + `\n Please try again later or contact support if the problem persists.`
                    };
                }

                this.logger.error('Error registering vehicle activation:', error);
                return {
                    text: `❌ ACTIVATION FAILED: An error occurred while registering the vehicle activation.`
                        + `\n Please try again later or contact support if the problem persists.`
                };
            });
    }
}

export const activationService = new ActivationService();
