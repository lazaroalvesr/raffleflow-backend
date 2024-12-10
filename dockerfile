# Etapa de Build
FROM node:20-alpine AS builder

# Instala dependências necessárias para construir o projeto
RUN apk add --no-cache \
    python3 \
    build-base \
    postgresql-client \
    openssl \
    ca-certificates

WORKDIR /app

# Copia pacotes e arquivos do Prisma
COPY package*.json ./
COPY prisma ./prisma

# Instala dependências e gera os arquivos do Prisma
RUN npm ci && npx prisma generate

# Copia o restante do código e constrói o projeto
COPY . .
RUN npm run build

# Etapa Final
FROM node:20-alpine

# Instala dependências necessárias para execução
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    postgresql-client \
    openssl

WORKDIR /app
ENV NODE_ENV=production

# Copia os artefatos da etapa de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY .env* ./
COPY wait-for-db.sh ./

# Dá permissão de execução ao script
RUN chmod +x ./wait-for-db.sh

# Gera os arquivos do Prisma na etapa final
RUN npx prisma generate

# Define a porta exposta
EXPOSE ${PORT}

# Comando de inicialização
CMD ["sh", "-c", "./wait-for-db.sh && npx prisma migrate deploy && npm run start:prod"]