import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createAllTools } from "../../tools";
import { createPromptTemplate } from "./prompt";
import { AgentContext } from "./schemas";
import { logger } from "../../utils/logger.util";

// Configuração do LLM
const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    topP: 0.9,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Template de prompt dinâmico - processa completamente o prompt
const createDynamicPrompt = (payload: any) => {
    const currentDate = new Date().toISOString();

    const systemPrompt = createPromptTemplate(payload, currentDate);

    logger.info(`[AssistantAgent] System prompt:`, systemPrompt);

    // Processa o prompt completamente antes de usar no LangChain
    return ChatPromptTemplate.fromMessages([
        ["system", systemPrompt],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
    ]);
};

// Criação do agente
export const createAssistantAgent = async (payload: any) => {
    try {
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
            earlyStoppingMethod: 'generate',
            handleParsingErrors: true,
        });
    } catch (error) {
        logger.error('Error creating assistant agent:', error);
        throw error;
    }
};

// Função para invocar o agente
export const invokeAssistantAgent = async (
    input: string,
    context: AgentContext
): Promise<string> => {
    try {
        logger.info(`[AssistantAgent] Invoking with input: "${input}"`);
        logger.debug(`[AssistantAgent] Context:`, context);

        // Cria o agente com o payload do contexto
        const agentExecutor = await createAssistantAgent(context.payload);

        // Invoca o agente
        const result = await agentExecutor.invoke({
            input: input,
            currentDate: new Date().toISOString(),
            context: JSON.stringify(context),
        });

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
