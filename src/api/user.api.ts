import axiosWebservice from '../helpers/axiosWebservice';
import { logger } from '../utils/logger.util';
import type { BalanceParams, BalanceResponse } from '../types/user.types';

export const fetchUserBalance = async (
    { userId, prefectureId, prefectureToken }: BalanceParams & { prefectureToken: string }
): Promise<number> => {
    return Promise.resolve()
        .then(async () => {
            const url = `/v4/prefeituras/${prefectureId}/usuarios/${userId}`;

            const response = await axiosWebservice.get<BalanceResponse>(
                url,
                { headers: { 'x-access-key': prefectureToken } }
            );

            const { saldo = 0 } = response.data;
            return saldo;
        })
        .catch(error => {
            const errorMessage = error.response?.data?.message || error.message || error;
            logger.error('[fetchUserBalance] Error fetching user balance:', errorMessage);
            throw errorMessage;
        });
};
