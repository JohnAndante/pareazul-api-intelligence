import { activationTools } from './activation/activation.tools';
import { userTools } from './user.tools';
import { vehicleTools } from './vehicle.tools';
import { prefectureTools } from './prefecture.tools';
import { notificationTools } from './notification.tools';
import { databaseTools } from './database.tool';

/**
 * Cria todas as tools disponíveis para o assistant agent
 */
export function createAllTools() {
    return [
        // Tools do MCP (principais funcionalidades)
        ...activationTools,
        ...userTools,
        ...vehicleTools,
        ...prefectureTools,
        ...notificationTools,

        // Tools de banco de dados (contexto e sessão)
        ...databaseTools,
    ];
}

/**
 * Cria apenas as tools do MCP (para uso específico)
 */
export function createMCPTools() {
    return [
        ...activationTools,
        ...userTools,
        ...vehicleTools,
        ...prefectureTools,
        ...notificationTools
    ];
}

/**
 * Cria apenas as tools de banco de dados
 */
export function createDatabaseTools() {
    return [...databaseTools];
}

// Exportar tools individuais para uso específico
export { activationTools, userTools, vehicleTools, prefectureTools, notificationTools, databaseTools };
