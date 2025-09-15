// Script de teste para o servidor
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
    try {
        console.log('🔍 Testing health check...');
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', response.data);
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function testChatWebhook() {
    try {
        console.log('🤖 Testing chat webhook...');

        const webhookData = {
            session_id: "chat_assistente_369449",
            payload: {
                prefeitura_id: "1",
                prefeitura_sigla: "CPM",
                prefeitura_nome: "Campo Mourão",
                prefeitura_timezone: "America/Sao_Paulo",
                usuario_id: "369449",
                usuario_nome: "Walker Silvestre",
                usuario_email: "wlksilvestre@gmail.com",
                usuario_cpf: "11743457995"
            },
            prefecture_user_token: "abc-123456987-123",
            message: "Olá! Como posso ativar meu veículo?",
            message_date: new Date().toISOString(),
            message_date_local: new Date().toISOString(),
            assistant_id: null,
            new_chat: true
        };

        const response = await axios.post(`${BASE_URL}/api/chat/webhook`, webhookData, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'abc-123456789-zyx' // Simulando header de auth
            }
        });

        console.log('✅ Chat webhook test passed:', response.data);
    } catch (error) {
        console.error('❌ Chat webhook test failed:', error.response?.data || error.message);
    }
}

async function testCalculator() {
    try {
        console.log('🧮 Testing calculator...');

        const response = await axios.post(`${BASE_URL}/api/calculator`, {
            query: "Quanto é 2 + 2?"
        });

        console.log('✅ Calculator test passed:', response.data);
    } catch (error) {
        console.error('❌ Calculator test failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting server tests...\n');

    await testHealthCheck();
    console.log('');

    await testCalculator();
    console.log('');

    await testChatWebhook();
    console.log('');

    console.log('✨ Tests completed!');
}

runTests().catch(console.error);
