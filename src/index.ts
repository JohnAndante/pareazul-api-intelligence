import express from 'express';
import 'dotenv/config'; // Carrega as variáveis do .env
import routes from './routes/index';
import { connectRedis } from './config/redis.config';
import { logger } from './utils/logger.util';

// Cria a aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear o corpo da requisição como JSON
app.use(express.json({ limit: '10mb' }));

// Rota principal da nossa API
app.use('/api', routes);

// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Inicialização do servidor
async function startServer() {
    try {
        // Conecta ao Redis
        await connectRedis();

        // Inicia o servidor
        app.listen(PORT, () => {
            logger.info(`🚀 Pareazul Assistant Server is running at http://localhost:${PORT}`);
            logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
            logger.info(`🤖 Chat API available at http://localhost:${PORT}/api/chat`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Inicia o servidor
startServer();
