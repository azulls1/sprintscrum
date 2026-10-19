# Contexto de build: raíz del repo (las figuras viven en docs/figuras y se publican en /figuras).
FROM node:24-alpine AS build
WORKDIR /repo/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# nginx sin privilegios: corre como uid 101 y escucha en 8080
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/seguridad-headers.conf /etc/nginx/seguridad-headers.conf
COPY frontend/seguridad-headers-figura.conf /etc/nginx/seguridad-headers-figura.conf
COPY --from=build /repo/frontend/dist/frontend/browser /usr/share/nginx/html
COPY docs/figuras /usr/share/nginx/html/figuras
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
