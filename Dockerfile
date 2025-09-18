# Multi-stage build para otimizar o tamanho da imagem final
FROM oven/bun:1.1.29-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb ./

# Stage para instalar dependências
FROM base AS deps
RUN bun install --frozen-lockfile --production

# Stage para build (se necessário)
FROM base AS builder
COPY . .
RUN bun install --frozen-lockfile
RUN bun run type-check

# Stage final de produção
FROM base AS runner

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bun -u 1001 -G nodejs

# Copiar dependências instaladas
COPY --from=deps --chown=bun:nodejs /app/node_modules ./node_modules

# Copiar código fonte
COPY --chown=bun:nodejs . .

# Criar diretórios necessários
RUN mkdir -p logs temp uploads && \
    chown -R bun:nodejs logs temp uploads

# Definir usuário
USER bun

# Expor porta
EXPOSE 3000

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --version > /dev/null || exit 1

# Comando para iniciar a aplicação
CMD ["bun", "run", "start"]
