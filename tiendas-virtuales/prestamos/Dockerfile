# --- STAGE 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- STAGE 2: Build Node Backend and Run App ---
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Copy root configurations and install backend dependencies
COPY package*.json tsconfig.json ./
RUN npm install

# Copy source and prisma configuration
COPY src/ ./src/
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build the backend TS code
RUN npm run build:backend

# Copy the built static frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port and run DB migration + start app
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss && node dist/server.js"]
