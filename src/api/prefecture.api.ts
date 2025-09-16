import axiosWebservice from '../helpers/axiosWebservice';
import { logger } from '../utils/logger.util';
import type { Rule } from '../types/prefecture.types';

export const fetchPrefectureRules = async (
    prefectureId: string,
    prefectureToken: string
): Promise<Rule[]> => {
    return Promise.resolve()
        .then(async () => {
            const url = `/v4/regras?prefeitura_id=${prefectureId}`;

            const response = await axiosWebservice.get(url, {
                headers: { 'x-access-key': prefectureToken }
            });

            const data = response.data;

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`No rules found for prefecture ID ${prefectureId}.`);
            }

            return data;
        })
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error('[fetchPrefectureRules] Error fetching prefecture rules:', errorMessage);
            throw errorMessage;
        });
};
