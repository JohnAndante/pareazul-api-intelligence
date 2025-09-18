import { DynamicStructuredTool } from "@langchain/core/tools";
import { searchVectors } from "../utils/vector-search.util";
import { logger } from "../utils/logger.util";
import { FaqSearchSchema, type FaqSearchInput } from "../schemas/faq.schema";

export const faqSearchTool = new DynamicStructuredTool({
    name: "faq_search",
    description: "Search for frequently asked questions and answers in the knowledge base using vector similarity",
    schema: FaqSearchSchema,
    func: async ({ query }: FaqSearchInput) => {
        try {
            logger.info(`[FaqTool] Searching FAQ for: "${query}"`);

            const results = await searchVectors(query);

            if (!results) {
                return "No relevant FAQ entries found for your query.";
            }

            logger.info(`[FaqTool] Found FAQ results for: "${query}"`);
            return `Here are some relevant FAQ entries that might help:\n\n${results}`;
        } catch (error) {
            logger.error("[FaqTool] Error searching FAQ:", error);
            return "I encountered an error while searching the FAQ database. Please try again.";
        }
    },
});

export const faqTools = [faqSearchTool];
