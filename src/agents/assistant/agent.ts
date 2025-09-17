import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { BaseChatMessageHistory, InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createAllTools } from "../../tools";
import { createPromptTemplate } from "./prompt";
import { AgentContext } from "./schemas";
import { logger } from "../../utils/logger.util";
import { memoryService } from "../../services/memory.service";

// Configuração do LLM
const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    topP: 0.9,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Template de prompt dinâmico com memória conversacional
const createDynamicPrompt = (payload: Record<string, unknown>) => {
    const currentDate = new Date().toISOString();
    const systemPrompt = createPromptTemplate(payload, currentDate);

    logger.debug(`[AssistantAgent] Creating prompt template with memory support`);

    // Inclui histórico de conversa no prompt
    return ChatPromptTemplate.fromMessages([
        ["system", systemPrompt],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
    ]);
};

// Cache inteligente para agentes por sessão com TTL
interface CachedAgent {
    agent: RunnableWithMessageHistory<Record<string, unknown>, Record<string, unknown>>;
    createdAt: number;
    lastUsed: number;
}

const agentCache = new Map<string, CachedAgent>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const MAX_CACHE_SIZE = 50;

// Criação do agente com memória conversacional
export const createAssistantAgent = async (payload: Record<string, unknown>, sessionId?: string): Promise<RunnableWithMessageHistory<Record<string, unknown>, Record<string, unknown>> | AgentExecutor> => {
    try {
        // Se não tiver sessionId, cria agente sem memória (fallback)
        if (!sessionId) {
            logger.warn('[AssistantAgent] No sessionId provided, creating agent without memory');
            return await createBasicAgent(payload);
        }

        // Limpa cache expirado antes de verificar
        cleanExpiredAgents();

        // Verifica se já existe um agente válido para esta sessão
        if (agentCache.has(sessionId)) {
            const cachedData = agentCache.get(sessionId);
            if (!cachedData) {
                agentCache.delete(sessionId);
                return await createAssistantAgent(payload, sessionId);
            }

            const now = Date.now();

            // Verifica se não expirou
            if (now - cachedData.lastUsed < CACHE_TTL) {
                logger.debug(`[AssistantAgent] Reusing cached agent for session: ${sessionId}`);
                // Atualiza último uso
                cachedData.lastUsed = now;
                agentCache.set(sessionId, cachedData);
                return cachedData.agent;
            } else {
                // Remove agente expirado
                logger.debug(`[AssistantAgent] Removing expired agent for session: ${sessionId}`);
                agentCache.delete(sessionId);
            }
        }

        logger.info(`[AssistantAgent] Creating new agent with memory for session: ${sessionId}`);

        const promptTemplate = createDynamicPrompt(payload);
        const tools = createAllTools();

        const agent = await createOpenAIToolsAgent({
            llm,
            tools,
            prompt: promptTemplate,
        });

        const agentExecutor = new AgentExecutor({
            agent,
            tools,
            verbose: process.env.NODE_ENV === 'development',
            returnIntermediateSteps: process.env.NODE_ENV === 'development',
            maxIterations: 24,
            earlyStoppingMethod: 'generate',
            handleParsingErrors: true,
        });

        // Cria histórico de mensagens
        const messageHistory = new InMemoryChatMessageHistory();

        // Carrega histórico existente
        await loadExistingHistory(sessionId, messageHistory);

        // Cria agente com memória
        const agentWithMemory = new RunnableWithMessageHistory({
            runnable: agentExecutor,
            getMessageHistory: () => messageHistory,
            inputMessagesKey: "input",
            historyMessagesKey: "chat_history",
        });

        // Limpa cache se necessário antes de adicionar novo agente
        if (agentCache.size >= MAX_CACHE_SIZE) {
            cleanOldestAgent();
        }

        // Armazena no cache com timestamp
        const now = Date.now();
        agentCache.set(sessionId, {
            agent: agentWithMemory,
            createdAt: now,
            lastUsed: now
        });

        return agentWithMemory;

    } catch (error) {
        logger.error('Error creating assistant agent:', error);
        throw error;
    }
};

// Função auxiliar para criar agente básico sem memória
async function createBasicAgent(payload: Record<string, unknown>) {
    const promptTemplate = createDynamicPrompt(payload);
    const tools = createAllTools();

    const agent = await createOpenAIToolsAgent({
        llm,
        tools,
        prompt: promptTemplate,
    });

    return new AgentExecutor({
        agent,
        tools,
        verbose: process.env.NODE_ENV === 'development',
        returnIntermediateSteps: process.env.NODE_ENV === 'development',
        maxIterations: 12,
        handleParsingErrors: true,
    });
}

// Carrega histórico existente da base de dados
async function loadExistingHistory(sessionId: string, messageHistory: BaseChatMessageHistory): Promise<void> {
    try {
        const memoryBuffer = await memoryService.getMemoryBuffer(sessionId);
        if (memoryBuffer && memoryBuffer.messages.length > 0) {
            logger.info(`[AssistantAgent] Loading ${memoryBuffer.messages.length} messages from memory buffer for session ${sessionId}`);

            for (const msg of memoryBuffer.messages) {
                if (msg.role === 'user') {
                    await messageHistory.addMessage(new HumanMessage(msg.content));
                } else if (msg.role === 'assistant') {
                    await messageHistory.addMessage(new AIMessage(msg.content));
                }
            }
        } else {
            logger.debug(`[AssistantAgent] No memory buffer found for session ${sessionId}`);
        }
    } catch (error) {
        logger.warn(`[AssistantAgent] Could not load existing history for session ${sessionId}:`, error);
    }
}

// Limpa agentes expirados do cache
function cleanExpiredAgents(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [sessionId, cachedData] of agentCache.entries()) {
        if (now - cachedData.lastUsed > CACHE_TTL) {
            agentCache.delete(sessionId);
            removedCount++;
        }
    }

    if (removedCount > 0) {
        logger.info(`[AgentCache] Cleaned ${removedCount} expired agents`);
    }
}

// Remove o agente mais antigo (por lastUsed)
function cleanOldestAgent(): void {
    let oldestSessionId: string | null = null;
    let oldestTime = Date.now();

    for (const [sessionId, cachedData] of agentCache.entries()) {
        if (cachedData.lastUsed < oldestTime) {
            oldestTime = cachedData.lastUsed;
            oldestSessionId = sessionId;
        }
    }

    if (oldestSessionId) {
        agentCache.delete(oldestSessionId);
        logger.info(`[AgentCache] Removed oldest agent for session: ${oldestSessionId}`);
    }
}

// Função para obter estatísticas do cache (útil para debugging)
export function getAgentCacheStats(): {
    size: number;
    maxSize: number;
    ttlMinutes: number;
    oldestAge: number;
    newestAge: number;
} {
    const now = Date.now();
    let oldestAge = 0;
    let newestAge = 0;

    if (agentCache.size > 0) {
        const ages = Array.from(agentCache.values()).map(cached => now - cached.createdAt);
        oldestAge = Math.max(...ages);
        newestAge = Math.min(...ages);
    }

    return {
        size: agentCache.size,
        maxSize: MAX_CACHE_SIZE,
        ttlMinutes: CACHE_TTL / (60 * 1000),
        oldestAge: Math.floor(oldestAge / (60 * 1000)), // em minutos
        newestAge: Math.floor(newestAge / (60 * 1000))  // em minutos
    };
}

// Função para invocar o agente com memória conversacional
export const invokeAssistantAgent = async (
    input: string,
    context: AgentContext
): Promise<string> => {
    try {
        logger.info(`[AssistantAgent] Invoking with input: "${input}"`);
        logger.debug(`[AssistantAgent] Context:`, context);

        // Cria o agente com o payload do contexto
        const agentExecutor = await createAssistantAgent(context.payload, context.sessionId);

        // Invoca o agente (com ou sem memória dependendo do tipo)
        const result = await agentExecutor.invoke(
            {
                input: input,
                currentDate: new Date().toISOString(),
                context: JSON.stringify(context),
            },
            context.sessionId ? {
                configurable: {
                    sessionId: context.sessionId
                }
            } : undefined
        );

        logger.info(`[AssistantAgent] Response generated successfully`);
        return result.output;
    } catch (error) {
        logger.error("[AssistantAgent] Error invoking agent:", error);

        // Fallback para erros
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                return "Desculpe, houve um timeout ao processar sua solicitação. Tente novamente.";
            }
            if (error.message.includes('rate limit')) {
                return "Desculpe, estou com muitas solicitações no momento. Tente novamente em alguns instantes.";
            }
        }

        return "Desculpe, houve um erro interno e não consegui completar sua solicitação. Por favor, tente novamente.";
    }
};
