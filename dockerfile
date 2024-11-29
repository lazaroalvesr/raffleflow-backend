FROM node:20-alpine AS builder

RUN apk add --no-cache python3 build-base

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm cache clean --force && \
    npm install && \
    npx prisma generate

COPY . .

RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache libstdc++ libgcc

WORKDIR /app

COPY .env* ./

COPY package*.json ./
COPY prisma ./prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN npx prisma generate

EXPOSE 3027

CMD ["npm", "run", "start:prod"]