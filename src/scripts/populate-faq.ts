import OpenAI from "openai";
import { supabaseAdmin } from "../config/database.config";
import { logger } from "../utils/logger.util";
import { faqData } from "./faq-data";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error("[PopulateFAQ] Error generating embedding:", error);
        throw error;
    }
}

async function populateFAQ() {
    try {
        logger.info("[PopulateFAQ] Starting FAQ population...");

        if (!supabaseAdmin) {
            throw new Error("Supabase admin client not initialized");
        }

        for (const faq of faqData) {
            logger.info(`[PopulateFAQ] Processing: "${faq.question}"`);

            // Gera embedding para a pergunta
            const embedding = await generateEmbedding(faq.question);

            // Insere no Supabase
            const { error } = await supabaseAdmin
                .from('faq_vectors')
                .insert({
                    question: faq.question,
                    answer: faq.answer,
                    embedding: embedding
                });

            if (error) {
                logger.error(`[PopulateFAQ] Error inserting FAQ:`, error);
                continue;
            }

            logger.info(`[PopulateFAQ] Successfully inserted: "${faq.question}"`);
        }

        logger.info("[PopulateFAQ] FAQ population completed successfully!");
    } catch (error) {
        logger.error("[PopulateFAQ] Error populating FAQ:", error);
        throw error;
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    populateFAQ()
        .then(() => {
            logger.info("[PopulateFAQ] Script completed");
            process.exit(0);
        })
        .catch((error) => {
            logger.error("[PopulateFAQ] Script failed:", error);
            process.exit(1);
        });
}

export { populateFAQ };
