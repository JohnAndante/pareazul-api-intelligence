import { invokeAssistantAgent } from "./agent";
import { AssistantQuerySchema, WebhookRequestSchema, AgentContext } from "./schemas";
import { memoryService } from "../../services/memory.service";
import { sessionService } from "../../services/session.service";
import { logger } from "../../utils/logger.util";
import { ChatPayload } from "../../types/chat.types";

/**
 * Função principal que processa uma mensagem de chat
 */
export async function processAssistantMessage(
    message: string,
    payload: ChatPayload,
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
        });

        // Processa a sessão, criando uma nova sessão se não existir
        const sessionResult = await sessionService.createSession({
            payload: validatedInput.payload,
            assistant_id: validatedInput.assistant_id,
        });

        if (!sessionResult) {
            throw new Error('Failed to process session');
        }

        const { session, assistantId: finalAssistantId, isNewSession } = sessionResult;

        // Cria contexto para o agente, passando o payload e o token do usuário
        const context: AgentContext = {
            sessionId: session.id,
            userId: validatedInput.payload.usuario_id,
            prefectureId: validatedInput.payload.prefeitura_id,
            prefectureUserToken: validatedInput.prefecture_user_token || '',
            payload: validatedInput.payload,
            metadata: {
                isNewSession,
                sessionCreatedAt: session.created_at,
            },
        };

        // Registra mensagem do usuário, salvando na memória
        const userMessage = await memoryService.addMessage(
            session.id,
            'user',
            message
        );

        if (!userMessage) {
            throw new Error('Failed to save user message');
        }

        // Invoca o agente, passando a mensagem e o contexto
        const agentResponse = await invokeAssistantAgent(message, context);

        // Registra resposta do agente, salvando na memória
        const assistantMessage = await memoryService.addMessage(
            session.id,
            'assistant',
            agentResponse
        );

        if (!assistantMessage) {
            logger.warn('Failed to save assistant message, but continuing');
        }

        logger.info(`[AssistantAgent] Message processed successfully`);

        return {
            message: agentResponse,
            message_date: new Date().toISOString(),
            assistant_id: finalAssistantId,
            message_id: assistantMessage?.id,
        };
    } catch (error) {
        logger.error('[AssistantAgent] Error processing message:', error);

        // Retorna resposta de erro, caso ocorra algum erro
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
export async function processWebhookRequest(request: {
    message: string;
    payload: ChatPayload;
    assistant_id?: string;
    prefecture_user_token?: string;
}): Promise<{
    message: string;
    message_date: string;
    assistant_id: string;
    message_id?: string;
}> {
    try {
        // Valida entrada do webhook, garantindo que o payload é válido
        const validatedRequest = WebhookRequestSchema.parse(request);

        // Processa a mensagem, criando uma nova sessão se não existir
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
export { databaseTools } from "../../tools/database.tool";
export * from "./schemas";
