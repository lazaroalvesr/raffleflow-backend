# Build stage
FROM node:20-alpine AS builder

# Install dependencies for building
RUN apk add --no-cache python3 build-base postgresql-client

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies and generate Prisma client
RUN npm ci && \
    npx prisma generate

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache libstdc++ libgcc postgresql-client

WORKDIR /app

# Set default environment
ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY .env* ./
COPY wait-for-db.sh ./
RUN chmod +x ./wait-for-db.sh

# Generate Prisma client
RUN npx prisma generate

# Expose application port
EXPOSE ${PORT}

# Use wait-for-db script with dynamic host and port
CMD ["sh", "-c", "./wait-for-db.sh ${DB_HOST} ${DB_PORT} && npm run start:prod"]