import axiosWebservice from "../helpers/axiosWebservice";
import { logger as loggerUtil } from "../utils/logger.util";
import { Rule } from "../types/prefecture.types";

const logger = loggerUtil.child({ service: 'PrefectureApi' });

export const fetchPrefectureRules = (
    prefectureId: string,
    prefectureToken: string
) => new Promise<Rule[]>((resolve, reject) => {
    const path = `/v4/prefeituras/${prefectureId}/regras`;

    return axiosWebservice.get(path, {
        headers: { 'x-access-key': prefectureToken },
    })
        .then(response => {
            const { data: rules } = response;

            if (!Array.isArray(rules) || rules.length === 0) {
                throw new Error("No rules found for prefecture.");
            }

            return rules;
        })
        .then(resolve)
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error("[fetchPrefectureRules] Error fetching prefecture rules:", error);
            reject(errorMessage);
        });
});
