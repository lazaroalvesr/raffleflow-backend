# Build stage
FROM node:20-alpine AS builder

# Install dependencies for building native modules (if needed)
RUN apk add --no-cache python3 build-base

WORKDIR /app

# Copy package.json and prisma folder
COPY package*.json ./ 
COPY prisma ./prisma

# Install dependencies and generate Prisma client
RUN npm cache clean --force && \
    npm install && \
    npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the application (compile TypeScript to JavaScript)
RUN npm run build

# Production stage
FROM node:20-alpine

# Install necessary libraries for running Node.js apps in production
RUN apk add --no-cache libstdc++ libgcc

WORKDIR /app

# Copy environment variables
COPY .env* ./

# Copy package.json and prisma folder for production
COPY package*.json ./
COPY prisma ./prisma

# Copy the built application and node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy the wait-for-db script into the container and make it executable
COPY wait-for-db.sh ./wait-for-db.sh
RUN chmod +x ./wait-for-db.sh

# Generate Prisma client in the production stage
RUN npx prisma generate

# Expose the port the app will run on
EXPOSE 3026

# Start the app in production
CMD ["npm", "run", "start:prod"]
