import OpenAI from "openai";
import { supabaseAdmin } from "../config/database.config";
import { logger } from "./logger.util";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface VectorSearchResult {
    id: string;
    question: string;
    answer: string;
    similarity: number;
}

export async function searchVectors(query: string): Promise<string> {
    try {
        logger.info(`[VectorSearch] Searching for: "${query}"`);

        // Gera embedding da query
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });

        const embedding = embeddingResponse.data[0].embedding;

        if (!supabaseAdmin) {
            throw new Error("Supabase admin client not initialized");
        }

        // Consulta no Supabase usando a função RPC
        const { data, error } = await supabaseAdmin.rpc("match_faq", {
            query_embedding: embedding,
            match_threshold: 0.75,
            match_count: 3,
        });

        if (error) {
            logger.error("[VectorSearch] Error in RPC call:", error);
            return "";
        }

        if (!data || data.length === 0) {
            logger.info("[VectorSearch] No matching results found");
            return "";
        }

        const results = data.map((d: any) => d.answer).join("\n\n");
        logger.info(`[VectorSearch] Found ${data.length} matching results`);

        return results;
    } catch (error) {
        logger.error("[VectorSearch] Error searching vectors:", error);
        return "";
    }
}

export async function searchVectorsWithDetails(query: string): Promise<VectorSearchResult[]> {
    try {
        logger.info(`[VectorSearch] Searching with details for: "${query}"`);

        // Gera embedding da query
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });

        const embedding = embeddingResponse.data[0].embedding;

        if (!supabaseAdmin) {
            throw new Error("Supabase admin client not initialized");
        }

        // Consulta no Supabase usando a função RPC
        const { data, error } = await supabaseAdmin.rpc("match_faq", {
            query_embedding: embedding,
            match_threshold: 0.75,
            match_count: 3,
        });

        if (error) {
            logger.error("[VectorSearch] Error in RPC call:", error);
            return [];
        }

        if (!data || data.length === 0) {
            logger.info("[VectorSearch] No matching results found");
            return [];
        }

        const results: VectorSearchResult[] = data.map((d: any) => ({
            id: d.id,
            question: d.question,
            answer: d.answer,
            similarity: d.similarity || 0,
        }));

        logger.info(`[VectorSearch] Found ${results.length} matching results with details`);
        return results;
    } catch (error) {
        logger.error("[VectorSearch] Error searching vectors with details:", error);
        return [];
    }
}
