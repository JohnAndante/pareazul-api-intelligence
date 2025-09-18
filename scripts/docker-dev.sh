#!/bin/bash

# Script para desenvolvimento com Docker
echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verifica se o .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📋 Copiando env.example para .env..."
    cp env.example .env
    echo "✏️  Por favor, edite o arquivo .env com suas configurações antes de continuar."
    exit 1
fi

# Para todos os containers se estiverem rodando
echo "🛑 Parando containers existentes..."
docker-compose down

# Rebuild da imagem se necessário
if [ "$1" = "--build" ]; then
    echo "🔨 Rebuilding imagem..."
    docker-compose build --no-cache
fi

# Sobe os serviços incluindo o Redis Commander
echo "🐳 Subindo serviços de desenvolvimento..."
docker-compose --profile dev up -d

# Aguarda os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Mostra status dos containers
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "✅ Ambiente de desenvolvimento pronto!"
echo "🌐 API: http://localhost:3000"
echo "🔍 Redis Commander: http://localhost:8081"
echo "🏥 Health Check: http://localhost:3000/health"
echo ""
echo "📝 Para ver logs em tempo real:"
echo "   docker-compose logs -f pareazul-api-intelligence"
echo ""
echo "🛑 Para parar os serviços:"
echo "   docker-compose down"
