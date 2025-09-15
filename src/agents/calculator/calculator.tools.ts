import { DynamicStructuredTool } from "@langchain/core/tools";
import { mathTool } from "../../tools/math.tool";
import { MathInputSchema, MathInput } from "./calculator.schemas";

export const calculatorTools = [
    new DynamicStructuredTool({
        name: "add",
        description: "Calculates the sum of two numbers",
        schema: MathInputSchema,
        func: async (input: MathInput) => {
            try {
                const result = mathTool.add(input);
                return result.toString();
            } catch (error) {
                if (error instanceof Error) {
                    return `Error: ${error.message}`;
                }
                return "Error: Failed to perform addition";
            }
        },
    }),
    new DynamicStructuredTool({
        name: "subtract",
        description: "Calculates the difference between two numbers",
        schema: MathInputSchema,
        func: async (input: MathInput) => {
            try {
                const result = mathTool.subtract(input);
                return result.toString();
            } catch (error) {
                if (error instanceof Error) {
                    return `Error: ${error.message}`;
                }
                return "Error: Failed to perform subtraction";
            }
        },
    }),
    new DynamicStructuredTool({
        name: "multiply",
        description: "Calculates the product of two numbers",
        schema: MathInputSchema,
        func: async (input: MathInput) => {
            try {
                const result = mathTool.multiply(input);
                return result.toString();
            } catch (error) {
                if (error instanceof Error) {
                    return `Error: ${error.message}`;
                }
                return "Error: Failed to perform multiplication";
            }
        },
    }),
    new DynamicStructuredTool({
        name: "divide",
        description: "Calculates the division of two numbers",
        schema: MathInputSchema,
        func: async (input: MathInput) => {
            try {
                const result = mathTool.divide(input);
                return result.toString();
            } catch (error) {
                if (error instanceof Error) {
                    return `Error: ${error.message}`;
                }
                return "Error: Failed to perform division";
            }
        },
    }),
    new DynamicStructuredTool({
        name: "power",
        description: "Calculates the power of a number raised to an exponent (a^b)",
        schema: MathInputSchema,
        func: async (input: MathInput) => {
            try {
                const result = mathTool.power(input);
                return result.toString();
            } catch (error) {
                if (error instanceof Error) {
                    return `Error: ${error.message}`;
                }
                return "Error: Failed to perform power operation";
            }
        },
    }),
];
