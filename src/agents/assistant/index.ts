import { invokeAssistantAgent } from "./agent";
import { AssistantQuerySchema, WebhookRequestSchema, AgentContext } from "./schemas";
import { memoryService } from "../../services/memory.service";
import { logger } from "../../utils/logger.util";
import { uuidv4 } from "zod";

/**
 * Função principal que processa uma mensagem de chat
 */
export async function processAssistantMessage(
    message: string,
    payload: any,
    assistantId?: string
): Promise<{
    message: string;
    message_date: string;
    assistant_id: string;
    message_id?: string;
}> {
    try {
        logger.info(`[AssistantAgent] Processing message: "${message}"`);

        // Valida a entrada
        const validatedInput = AssistantQuerySchema.parse({
            message,
            payload,
            assistant_id: assistantId,
            prefecture_user_token: payload.prefecture_user_token,
        });

        if (!validatedInput.assistant_id) {
            validatedInput.assistant_id = uuidv4().toString();
            validatedInput.new_chat = true;
        }

        // Processa a sessão
        const sessionResult = await sessionService.createSession({
            payload: validatedInput.payload,
            assistant_id: validatedInput.assistant_id,
        });

        if (!sessionResult) {
            throw new Error('Failed to process session');
        }

        const { session, assistantId: finalAssistantId, isNewSession } = sessionResult;

        // Cria contexto para o agente
        const context: AgentContext = {
            sessionId: session.id,
            userId: validatedInput.payload.usuario_id,
            prefectureId: validatedInput.payload.prefeitura_id,
            prefectureUserToken: validatedInput.prefecture_user_token,
            payload: validatedInput.payload,
            metadata: {
                isNewSession,
                sessionCreatedAt: session.created_at,
            },
        };

        // Registra mensagem do usuário
        const userMessage = await memoryService.addMessage(
            session.id,
            'user',
            message
        );

        if (!userMessage) {
            throw new Error('Failed to save user message');
        }

        // Invoca o agente
        const agentResponse = await invokeAssistantAgent(message, context);

        // Registra resposta do agente
        const assistantMessage = await memoryService.addMessage(
            session.id,
            'assistant',
            agentResponse
        );

        if (!assistantMessage) {
            logger.warn('Failed to save assistant message, but continuing');
        }

        // Atualiza cache da sessão
        await memoryService.setSessionCache(validatedInput.payload.usuario_id, {
            assistant_id: finalAssistantId,
            assistant_chat_id: session.id,
            payload: validatedInput.payload,
            prefecture_user_token: validatedInput.prefecture_user_token,
            user_token: validatedInput.user_token,
        });

        logger.info(`[AssistantAgent] Message processed successfully`);

        return {
            message: agentResponse,
            message_date: new Date().toISOString(),
            assistant_id: finalAssistantId,
            message_id: assistantMessage?.id,
        };
    } catch (error) {
        logger.error('[AssistantAgent] Error processing message:', error);

        // Retorna resposta de erro
        return {
            message: "Desculpe, houve um erro interno e não consegui completar sua solicitação. Por favor, tente novamente.",
            message_date: new Date().toISOString(),
            assistant_id: assistantId || 'error',
        };
    }
}

/**
 * Função para processar webhook completo (replicando fluxo n8n)
 */
export async function processWebhookRequest(request: any): Promise<{
    message: string;
    message_date: string;
    assistant_id: string;
    message_id?: string;
}> {
    try {
        // Valida entrada do webhook
        const validatedRequest = WebhookRequestSchema.parse(request);

        // Processa a mensagem
        return await processAssistantMessage(
            validatedRequest.message,
            validatedRequest.payload,
            validatedRequest.assistant_id
        );
    } catch (error) {
        logger.error('[AssistantAgent] Error processing webhook request:', error);

        return {
            message: "Desculpe, houve um erro interno e não consegui completar sua solicitação. Por favor, tente novamente.",
            message_date: new Date().toISOString(),
            assistant_id: request.assistant_id || 'error',
        };
    }
}

// Re-exports
export { invokeAssistantAgent } from "./agent";
export { databaseTools } from "../../tools/database.tool";
export * from "./schemas";
