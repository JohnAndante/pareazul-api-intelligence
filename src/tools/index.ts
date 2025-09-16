import { activationTools } from './activation.tools';
import { databaseTools } from './database.tool';
import { faqTools } from './faq.tool';

/**
 * Cria todas as tools disponíveis para o assistant agent
 */
export function createAllTools() {
    return [
        // Tools da assistente
        ...activationTools,

        // Tools de banco de dados (contexto e sessão)
        ...databaseTools,

        // Tools de FAQ (busca por vetores)
        ...faqTools,
    ];
}

/**
 * Cria apenas as tools de banco de dados
 */
export function createDatabaseTools() {
    return [...databaseTools];
}

// Exportar tools individuais para uso específico
export { activationTools, databaseTools, faqTools };
