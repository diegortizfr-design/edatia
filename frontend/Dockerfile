# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# URL del API que Vite incrusta en el bundle (es build-time, no runtime).
# El default es producción, así que un build sin argumentos no cambia de comportamiento.
ARG VITE_API_URL=https://api.edatia.com
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage (Nginx-Free / Caddy)
FROM caddy:2-alpine

# Copiar la configuración personalizada de Caddy
# Permite elegir el Caddyfile por ambiente sin bind mounts.
# Default = Caddyfile (produccion); staging pasa Caddyfile.staging.
ARG CADDYFILE=Caddyfile
COPY ${CADDYFILE} /etc/caddy/Caddyfile

# Copiar el build del frontend a la raíz de Caddy
COPY --from=build /app/dist /usr/share/caddy

EXPOSE 80
EXPOSE 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
