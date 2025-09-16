import { MemoryService } from './memory.service';
import { fetchUserVehicles, postCreateVehicle } from '../api/vehicle.api';
import { filterVehicles } from '../utils/vehicle.utils';
import { logger } from '../utils/logger.util';

export class VehicleService {
    private readonly memoryService: MemoryService;

    constructor() {
        this.memoryService = new MemoryService();
    }

    async getUserVehicles({ userId, plate, model }: { userId: string; plate?: string; model?: string }): Promise<{ text: string }> {
        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.warn('[VehicleService] No session data found for user:', userId);
                    return { text: "User session not found." };
                }

                const {
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                const vehicles = await fetchUserVehicles(userId, prefectureUserToken);

                if (!Array.isArray(vehicles) || vehicles.length === 0) {
                    return { text: `No vehicles found for user ${userId}.` };
                }

                // Aplicar filtros se fornecidos
                const filteredVehicles = filterVehicles(vehicles, plate, model);

                if (filteredVehicles.length === 0) {
                    return { text: `No vehicles found matching the specified criteria for user ${userId}.` };
                }

                const vehiclesText = filteredVehicles.map(vehicle =>
                    `- Plate: ${vehicle.plate}, Model: ${vehicle.model}, Type: ${vehicle.type?.name || 'Unknown'}`
                ).join('\n');

                return {
                    text: `Found ${filteredVehicles.length} vehicle(s) for user ${userId}:\n${vehiclesText}`
                };
            })
            .catch(error => {
                logger.error('[VehicleService] Error fetching user vehicles:', error);
                return {
                    text: "An error occurred while fetching user vehicles. Please try again later."
                };
            });
    }

    async registerUserVehicle({ userId, vehicle }: { userId: string; vehicle: { plate: string; model: string; vehicle_type_id: number } }): Promise<{ text: string }> {
        return Promise.resolve()
            .then(async () => {
                // Busca dados da sessão no cache
                const sessionData = await this.memoryService.getSessionCache(userId);

                if (!sessionData) {
                    logger.warn('[VehicleService] No session data found for user:', userId);
                    return { text: "User session not found." };
                }

                const {
                    prefecture_user_token: prefectureUserToken
                } = sessionData;

                await postCreateVehicle(userId, vehicle, prefectureUserToken);

                return {
                    text: `Vehicle ${vehicle.plate} (${vehicle.model}) successfully registered for user ${userId}.`
                };
            })
            .catch(error => {
                logger.error('[VehicleService] Error registering user vehicle:', error);
                return {
                    text: "An error occurred while registering the vehicle. Please try again later."
                };
            });
    }
}

export const vehicleService = new VehicleService();
