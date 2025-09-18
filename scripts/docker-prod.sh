#!/bin/bash

# Script para produção com Docker
echo "🚀 Iniciando ambiente de produção..."

# Verifica se o .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📋 Copie env.example para .env e configure as variáveis de produção."
    exit 1
fi

# Verifica variáveis críticas
echo "🔍 Verificando configurações críticas..."

required_vars=(
    "API_BEARER_TOKEN"
    "OPENAI_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=your-" .env; then
        echo "❌ Variável ${var} não configurada corretamente no .env"
        exit 1
    fi
done

echo "✅ Configurações verificadas!"

# Para containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Build da imagem de produção
echo "🔨 Building imagem de produção..."
docker-compose build --no-cache

# Sobe apenas os serviços essenciais (sem Redis Commander)
echo "🐳 Subindo serviços de produção..."
docker-compose up -d

# Aguarda os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

# Testa se a API está respondendo
echo "🏥 Testando health check..."
if curl -f http://localhost:${PORT:-3000}/health > /dev/null 2>&1; then
    echo "✅ API está respondendo!"
else
    echo "❌ API não está respondendo. Verificando logs..."
    docker-compose logs --tail=50 pareazul-api-intelligence
    exit 1
fi

# Mostra status dos containers
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "🎉 Ambiente de produção pronto!"
echo "🌐 API: http://localhost:${PORT:-3000}"
echo "🏥 Health Check: http://localhost:${PORT:-3000}/health"
echo ""
echo "📝 Para monitorar logs:"
echo "   docker-compose logs -f"
echo ""
echo "🔄 Para restart:"
echo "   docker-compose restart pareazul-api-intelligence"
