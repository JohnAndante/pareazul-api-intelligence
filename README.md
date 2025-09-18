# Pareazul Assistant Server

🤖 Servidor Node.js/Express para sistema de assistente IA conversacional com agentes especializados, gerenciamento de sessões, memória vetorizada e integração com APIs externas.

## 🎯 Características Principais

- **Agentes IA Especializados**: Sistema modular com agentes para cálculos, conversa e transcrição
- **Memória Inteligente**: Buffer de memória Redis + armazenamento vetorizado para contexto
- **Sessões Robustas**: Gerenciamento de sessões de usuário com cache distribuído
- **APIs Integradas**: Supabase, OpenAI, Whisper e APIs externas do Pareazul
- **Segurança Enterprise**: Rate limiting, autenticação, detecção de ataques
- **Arquitetura Escalável**: Microserviços, middleware modulares, type-safe

## 🏗️ Arquitetura

```
├── 🤖 agents/          # Agentes IA especializados
├── 💼 services/        # Lógica de negócio
├── 🗃️ repositories/    # Acesso a dados
├── 🛣️ routes/          # Roteamento da API
├── 🎮 controllers/     # Controladores HTTP
├── 🛡️ middleware/      # Middlewares de segurança
├── 🔧 utils/           # Utilitários e helpers
├── 📝 types/           # Definições TypeScript
└── ⚙️ config/          # Configurações do sistema
```

## 🚀 Quick Start

### Pré-requisitos

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18
- Redis Server
- Supabase Account

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd pareazul-assistant-server

# Instalar dependências
bun install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Iniciar servidor de desenvolvimento
bun run dev
```

### Variáveis de Ambiente

```env
# Server
PORT=3000
NODE_ENV=development

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Security
CORS_ORIGINS=http://localhost:3000

# Auth
API_SECRET_KEY=your_api_secret_key

# File upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
TEMP_DIR=temp

# Audio processing
AUDIO_MAX_DURATION=300
AUDIO_ALLOWED_FORMATS=mp3,wav,m4a,ogg,flac

# Session management
SESSION_TTL=3600
MEMORY_BUFFER_SIZE=20
VECTOR_DIMENSIONS=1536

# External services Health Check URLs
OPENAI_HEALTH_URL=https://status.openai.com/api/v2/summary.json
```

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev          # Servidor com hot reload
bun run start        # Servidor de produção

# Qualidade de código
bun run lint         # Verificar problemas ESLint
bun run lint:fix     # Corrigir problemas automaticamente
bun run format       # Formatar código com Prettier
bun run type-check   # Verificar tipos TypeScript
bun run check        # Verificação completa (tipos + lint)

# Utilitários
bun run pre-commit   # Script de pré-commit (format + check)
```

## 🤖 Agentes Disponíveis

### Calculator Agent

- **Endpoint**: `POST /api/calculator`
- **Função**: Operações matemáticas avançadas
- **Tools**: Operações básicas, funções trigonométricas, logaritmos

### Chat Agent ✅

- **Endpoint**: `POST /api/chat/webhook` (replica fluxo n8n)
- **Endpoint**: `POST /api/chat/message` (processamento direto)
- **Função**: Conversação geral com contexto de sessão
- **Tools**: Database tools, session management
- **Memória**: Sistema híbrido Redis + Supabase
- **Sessões**: Gerenciamento automático de sessões ativas

### Transcription Agent (Em desenvolvimento)

- **Endpoint**: `POST /api/transcription`
- **Função**: Conversão de áudio para texto
- **Tools**: Whisper API, processamento de arquivos

## 🛡️ Segurança

- **Rate Limiting**: Redis-based com limites configuráveis
- **Authentication**: HeaderAuth compatível com n8n
- **Input Validation**: Validators Zod em todos os endpoints
- **Attack Detection**: SQL injection, XSS, path traversal
- **Security Headers**: Helmet.js + headers customizados

## 📊 Monitoramento

- **Logging**: Winston structured logging
- **Health Checks**: `/health` e `/ready` endpoints
- **Metrics**: Request timing, error rates, cache hit rates
- **Request Tracing**: UUID tracking em todas as requests

## 🔧 Tecnologias

- **Runtime**: Bun + Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: LangChain + OpenAI GPT-4
- **Cache**: Redis
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Logging**: Winston
- **Linting**: ESLint + Prettier

## 📄 Licença

Este projeto é privado e proprietário da Pareazul.

## 📞 Suporte

Para dúvidas e suporte, entre em contato com a equipe de desenvolvimento Pareazul.
