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
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# External APIs
PAREAZUL_API_URL=your_pareazul_api_url
PAREAZUL_API_KEY=your_pareazul_api_key
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

### Chat Agent (Em desenvolvimento)
- **Endpoint**: `POST /api/chat`
- **Função**: Conversação geral + orquestração de outros agentes
- **Tools**: MCP, Database, External APIs

### Transcription Agent (Em desenvolvimento)
- **Endpoint**: `POST /api/transcription`
- **Função**: Conversão de áudio para texto
- **Tools**: Whisper API, processamento de arquivos

## 🛡️ Segurança

- **Rate Limiting**: Redis-based com limites configuráveis
- **Authentication**: HeaderAuth compatível com n8n
- **Input Validation**: Schemas Zod em todos os endpoints
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

## 📈 Status do Projeto

### ✅ Completo
- [x] Infraestrutura base (configurações, utils, middleware)
- [x] Calculator Agent funcional
- [x] Sistema de logging e monitoramento
- [x] Linting e formatação automática
- [x] Repositório Git configurado

### 🚧 Em Desenvolvimento
- [ ] Chat Agent principal
- [ ] Memory Service (vetorização)
- [ ] Session Service
- [ ] Transcription Agent
- [ ] Webhook system
- [ ] External API integrations

### 📋 Roadmap
- [ ] Testes automatizados (unit + integration)
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] API documentation (OpenAPI)
- [ ] Performance optimization

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Execute `bun run pre-commit` antes de fazer commit
4. Commit suas mudanças (`git commit -m 'Add nova feature'`)
5. Push para a branch (`git push origin feature/nova-feature`)
6. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário da Pareazul.

## 📞 Suporte

Para dúvidas e suporte, entre em contato com a equipe de desenvolvimento Pareazul.
