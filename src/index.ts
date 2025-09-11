import express from 'express';
import 'dotenv/config'; // Carrega as variáveis do .env
import routes from './routes/index';

// Cria a aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear o corpo da requisição como JSON
app.use(express.json());

// Rota principal da nossa API
app.use('/api', routes);

// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`🚀 Calculator Agent server is running at http://localhost:${PORT}`);
});
