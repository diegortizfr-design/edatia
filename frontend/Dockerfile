# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage (Nginx-Free / Caddy)
FROM caddy:2-alpine

# Copiar la configuración personalizada de Caddy
COPY Caddyfile /etc/caddy/Caddyfile

# Copiar el build del frontend a la raíz de Caddy
COPY --from=build /app/dist /usr/share/caddy

EXPOSE 80
EXPOSE 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
