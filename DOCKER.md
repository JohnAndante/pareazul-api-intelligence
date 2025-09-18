# 🐳 **Docker Setup - Pareazul API Intelligence**

## 🚀 **Quick Start**

### **Desenvolvimento**

```bash
# 1. Configure o ambiente
cp env.example .env
# Edite o .env com suas configurações

# 2. Suba o ambiente de desenvolvimento
bun run docker:dev

# Ou com rebuild da imagem
bun run docker:dev --build
```

### **Produção**

```bash
# 1. Configure o ambiente de produção
cp env.example .env
# Configure todas as variáveis de produção

# 2. Suba o ambiente de produção
bun run docker:prod
```

## 📋 **Comandos Úteis**

```bash
# Build da imagem
bun run docker:build

# Subir serviços
bun run docker:up

# Parar serviços
bun run docker:down

# Ver logs em tempo real
bun run docker:logs

# Ver status dos containers
docker-compose ps

# Entrar no container da API
docker exec -it pareazul-api-intelligence sh
```

## 🔧 **Configuração**

### **Variáveis Críticas**

Essas variáveis **DEVEM** ser configuradas no `.env`:

```bash
# Autenticação (CRÍTICO)
API_BEARER_TOKEN=seu-token-super-secreto-aqui

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Pareazul APIs
PAREAZUL_API_WEBSERVICE=https://api.pareazul.com.br
PAREAZUL_API_BACKEND=https://backend.pareazul.com.br
```

## 🌐 **Endpoints Disponíveis**

Após subir o container:

- **API Principal**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📊 **Monitoramento**

### **Health Checks**

O container tem health check configurado:

```bash
# Verificar status do health check
docker-compose ps

# Ver logs de health check
docker-compose logs pareazul-api-intelligence | grep health
```

### **Logs**

```bash
# Logs da API
docker-compose logs -f pareazul-api-intelligence
```

## 🔒 **Segurança**

### **Produção**

- Container roda com usuário não-root (`bun:1001`)
- Volumes são montados com permissões corretas
- Health checks impedem containers unhealthy
- Logs persistem em volumes

### **Rede**

- Container fica na rede `pareazul-network`
- API exposta apenas na porta configurada

## 🛠️ **Troubleshooting**

### **Container não sobe**

```bash
# Ver logs detalhados
docker-compose logs pareazul-api-intelligence

# Verificar configurações
docker-compose config

# Rebuild sem cache
docker-compose build --no-cache
```

### **API não responde**

```bash
# Verificar health check
curl http://localhost:3000/health

# Ver logs da API
docker-compose logs -f pareazul-api-intelligence

# Verificar variáveis de ambiente
docker exec -it pareazul-api-intelligence env | grep API
```

## 🚀 **Deploy em Produção**

### **1. Preparar Servidor**

```bash
# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Bun (para scripts)
curl -fsSL https://bun.sh/install | bash
```

### **2. Deploy**

```bash
# Clonar repositório
git clone <repo-url>
cd pareazul-api-intelligence

# Configurar ambiente
cp env.example .env
# Editar .env com configurações de produção

# Deploy
bun run docker:prod
```

### **3. Monitoramento**

```bash
# Verificar se está rodando
docker-compose ps

# Monitorar logs
bun run docker:logs

# Health check
curl http://localhost:3000/health
```

## 🔄 **Updates**

### **Atualizar Código**

```bash
# Pull das mudanças
git pull

# Rebuild e restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verificar se está funcionando
curl http://localhost:3000/health
```

---

## 🦧 **Dicas do Mister Mamaco**

- **Sempre teste localmente** antes de fazer deploy
- **Configure logs** para rotacionar automaticamente
- **Monitor health checks** em produção
- **Use HTTPS** em produção com proxy reverso
- **Configure firewall** para expor apenas portas necessárias

**Qualquer problema, verifica os logs primeiro!** 🚀
