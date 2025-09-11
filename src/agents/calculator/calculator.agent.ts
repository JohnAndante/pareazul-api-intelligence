import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { calculatorTools } from "./calculator.tools";
import { promptTemplate } from "./calculator.prompt";

// Configuração do LLM
const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
});

// Criação do agente
const agent = await createOpenAIToolsAgent({
    llm,
    tools: calculatorTools,
    prompt: promptTemplate
});

// Configuração do executor
export const calculatorAgentExecutor = new AgentExecutor({
    agent,
    tools: calculatorTools,
    verbose: true, // Para ver o raciocínio do agente
    maxIterations: 5, // Evita loops infinitos
});
