# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# URL del API que Vite incrusta en el bundle (build-time).
# Ojo: manager/src/lib/api.ts usa `??`, así que un valor vacío NO cae al default;
# por eso el ARG trae el valor de producción ya puesto.
ARG VITE_API_URL=https://api.edatia.com
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage (Caddy)
FROM caddy:2-alpine

# Permite elegir el Caddyfile por ambiente sin bind mounts.
# Default = Caddyfile (produccion); staging pasa Caddyfile.staging.
ARG CADDYFILE=Caddyfile
COPY ${CADDYFILE} /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
