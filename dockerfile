FROM node:20-alpine AS builder

RUN apk add --no-cache python3 build-base

WORKDIR /app

# Copiar apenas package e prisma primeiro para otimizar cache
COPY package*.json ./
COPY prisma ./prisma

RUN npm cache clean --force && \
    npm install && \
    npx prisma generate

# Agora copiar todo o resto
COPY . .

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache libstdc++ libgcc

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Copiar dist e node_modules do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Chave: gerar cliente Prisma na imagem final
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/main"]