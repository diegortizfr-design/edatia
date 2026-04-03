# ---- Build stage ----
FROM node:18-alpine AS build

WORKDIR /app

# Instalar dependencias primero (aprovecha caché de Docker)
COPY package*.json ./
RUN npm install

# Copiar fuente y compilar
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:18-alpine

WORKDIR /app

# Solo copiar lo necesario para producción
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

EXPOSE 4000

CMD ["node", "dist/main"]
