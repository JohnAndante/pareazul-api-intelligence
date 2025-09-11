import { calculatorAgentExecutor } from "./calculator.agent";
import { CalculatorQuerySchema } from "./calculator.schemas";

/**
 * Função principal que invoca o agente calculadora.
 * @param input A pergunta do usuário em linguagem natural.
 * @returns A resposta final do agente.
 */
export async function invokeCalculatorAgent(input: string): Promise<string> {
    console.log(`[CalculatorAgent] Invoking with input: "${input}"`);

    try {
        // Valida a entrada usando Zod
        const validatedInput = CalculatorQuerySchema.parse(input);

        // Invoca o agente
        const result = await calculatorAgentExecutor.invoke({
            input: validatedInput
        });

        return result.output;
    } catch (error) {
        console.error("[CalculatorAgent] Error invoking agent:", error);

        if (error instanceof Error && error.message.includes('Query cannot be empty')) {
            return "Sorry, I need a valid mathematical question to help you.";
        }

        return "Sorry, I encountered an error while trying to calculate that.";
    }
}

// Re-exporta para compatibilidade
export { calculatorAgentExecutor } from "./calculator.agent";
export { calculatorTools } from "./calculator.tools";
export { promptTemplate, SYSTEM_PROMPT } from "./calculator.prompt";
export * from "./calculator.schemas";
