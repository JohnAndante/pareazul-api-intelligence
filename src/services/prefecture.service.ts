import { MemoryService } from './memory.service';
import { fetchPrefectureRules } from '../api/prefecture.api';
import { buildResponseText, formatOperatingHours, formatValueTimes, formatVehicleTypes } from '../utils/prefecture.utils';
import { vehicleTypes } from '../utils/vehicle.utils';
import { logger } from '../utils/logger.util';
import type { FormattedRule, PrefectureRulesParams, PrefectureZoneRulesParams } from '../types/prefecture.types';

export class PrefectureService {
    private readonly memoryService: MemoryService;

    constructor() {
        this.memoryService = new MemoryService();
    }

    async getPrefectureRules(params: PrefectureRulesParams): Promise<{ text: string }> {
        const { userId } = params;

        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.warn('[PrefectureService] No session data found for user:', userId);
                    return { text: "User session not found." };
                }

                const {
                    payload: { prefeitura_id: prefectureId },
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const rules = await fetchPrefectureRules(prefectureId, prefectureUserToken);

                if (!Array.isArray(rules) || rules.length === 0) {
                    logger.warn(`[PrefectureService] No rules found for prefecture ID: ${prefectureId}`);
                    return { text: `No rules found for prefecture ID ${prefectureId}.` };
                }

                const rulesTexts = rules.map((rule, index) => {
                    const vehicleTypesFormatted = formatVehicleTypes(rule.tipo_veiculos);

                    const formattedRule: FormattedRule = {
                        id: rule.id,
                        name: rule.nome,
                        maxDuration: rule.tempo_maximo,
                        operatingHours: formatOperatingHours(rule.horario_funcionamentos),
                        valueTimes: formatValueTimes(rule.regra_valor_tempos, vehicleTypesFormatted),
                        vehicleTypes: vehicleTypesFormatted,
                    };

                    return buildResponseText(prefectureId, formattedRule, index + 1);
                });

                const finalText = [
                    `Found ${rules.length} rule(s) for prefecture ID ${prefectureId}:`,
                    ...rulesTexts
                ].join('\n\n' + '---' + '\n\n');

                return {
                    text: finalText,
                };
            })
            .catch(error => {
                const errorMessage = error.response?.data?.message || error.message;
                logger.error('[PrefectureService] Error fetching prefecture rules:', errorMessage);
                return { text: "An error occurred while fetching the prefecture rules. Please try again later." };
            });
    }

    async getPrefectureZones(params: PrefectureRulesParams): Promise<{ text: string }> {
        const { userId } = params;

        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.warn('[PrefectureService] No session data found for user:', userId);
                    return { text: "User session not found." };
                }

                const {
                    payload: { prefeitura_id: prefectureId },
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const rules = await fetchPrefectureRules(prefectureId, prefectureUserToken);

                if (!Array.isArray(rules) || rules.length === 0) {
                    logger.warn(`[PrefectureService] No rules found for prefecture ID: ${prefectureId}`);
                    return { text: `No rules found for prefecture ID ${prefectureId}.` };
                }

                const zones = rules.map(rule => ({
                    id: rule.id,
                    name: rule.nome,
                    activation_max_duration: rule.tempo_maximo,
                }));

                const finalText = [
                    `Found ${zones.length} zone(s) for prefecture ID ${prefectureId}:`,
                    JSON.stringify(zones, null, 2)
                ].join('\n\n' + '---' + '\n\n');

                return { text: finalText };
            })
            .catch(error => {
                const errorMessage = error.response?.data?.message || error.message;
                logger.error('[PrefectureService] Error fetching prefecture zones:', errorMessage);
                return { text: "An error occurred while fetching the prefecture zones. Please try again later." };
            });
    }

    async getPrefectureZoneRules(params: PrefectureZoneRulesParams): Promise<{ text: string }> {
        const { userId, zoneId } = params;

        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.warn('[PrefectureService] No session data found for user:', userId);
                    return { text: "User session not found." };
                }

                const {
                    payload: { prefeitura_id: prefectureId },
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const rules = await fetchPrefectureRules(prefectureId, prefectureUserToken);

                if (!Array.isArray(rules) || rules.length === 0) {
                    logger.warn(`[PrefectureService] No rules found for prefecture ID: ${prefectureId}`);
                    return { text: `No rules found for prefecture ID ${prefectureId}.` };
                }

                const rule = rules.find(rule => rule.id === zoneId);

                if (!rule) {
                    logger.warn(`[PrefectureService] No rules found for zone ID: ${zoneId}`);
                    return { text: `No rules found for zone ID ${zoneId}.` };
                }

                const timeValueRules = rule.regra_valor_tempos.map(timeValueRule => ({
                    id: timeValueRule.id,
                    duration: timeValueRule.tempo,
                    value: timeValueRule.valor,
                    vehicleType: {
                        id: timeValueRule.tipo_veiculo_id,
                        name: vehicleTypes[timeValueRule.tipo_veiculo_id] || 'Unknown'
                    }
                }));

                const formattedRule = {
                    id: rule.id,
                    name: rule.nome,
                    maxDuration: rule.tempo_maximo,
                };

                const finalText = [
                    `Found ${timeValueRules.length} time value rule(s) for zone ID ${zoneId}:`,
                    `Rule: ${JSON.stringify(formattedRule, null, 2)}`,
                    `Time value rules: ${JSON.stringify(timeValueRules, null, 2)}`,
                ].join('\n\n' + '---' + '\n\n');

                return { text: finalText };
            })
            .catch(error => {
                const errorMessage = error.response?.data?.message || error.message;
                logger.error('[PrefectureService] Error fetching prefecture zone rules:', errorMessage);
                return { text: "An error occurred while fetching the prefecture zone rules. Please try again later." };
            });
    }
}

export const prefectureService = new PrefectureService();
