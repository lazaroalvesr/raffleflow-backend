# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

# Instalar dependências de sistema necessárias
RUN apk add --no-cache python3 build-base

# Criação da pasta de trabalho no contêiner
WORKDIR /app

# Copiar arquivos necessários
COPY package*.json ./
COPY prisma ./prisma

# Instalar todas as dependências (produção e desenvolvimento)
RUN npm cache clean --force && \
    npm install && \
    npx prisma generate

# Copiar o restante dos arquivos da aplicação
COPY . .

# Build da aplicação em modo de produção
RUN npm run build

# Etapa 2: Imagem final para execução
FROM node:20-alpine

# Instalar dependências de sistema necessárias
RUN apk add --no-cache libstdc++ libgcc

# Criação da pasta de trabalho no contêiner
WORKDIR /app

# Copiar apenas os arquivos necessários do build
COPY package*.json ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN npm install @css-inline/css-inline-linux-x64-musl
# Gerar cliente Prisma novamente
RUN npx prisma generate

# Expor a porta utilizada pela aplicação
EXPOSE 3001

# Comando para rodar a aplicação
CMD ["node", "dist/main"]