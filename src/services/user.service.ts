import { MemoryService } from './memory.service';
import { fetchUserBalance } from '../api/user.api';
import { formatCurrency } from '../utils/string.utils';
import { logger } from '../utils/logger.util';

export class UserService {
    private readonly memoryService: MemoryService;

    constructor() {
        this.memoryService = new MemoryService();
    }

    async getUserBalance({ userId }: { userId: number }): Promise<{ text: string }> {
        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId.toString());

                if (!sessionData) {
                    logger.warn('[UserService] No session data found for user:', userId);
                    return { text: "User session not found." };
                }

                const {
                    payload: { prefeitura_id: prefectureId },
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const balance = await fetchUserBalance({ userId: userId.toString(), prefectureId, prefectureToken: prefectureUserToken });

                if (balance === null) {
                    return {
                        text: `No balance found for user ID ${userId} in prefecture ID ${prefectureId}.`
                    };
                }

                return {
                    text: `User balance for ID ${userId} in prefecture ID ${prefectureId}: ${formatCurrency(balance)}`
                };
            })
            .catch(error => {
                logger.error('[UserService] Error fetching user balance:', error);
                return {
                    text: "An error occurred while fetching the user balance. Please try again later."
                };
            });
    }
}

export const userService = new UserService();
