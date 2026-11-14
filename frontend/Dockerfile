# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- build stage
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first (cached unless package files change).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# "/api" is proxied to the backend by nginx, so the browser only talks to one origin.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------------------------------------------------------------- runtime stage
# Unprivileged nginx image: runs as a non-root user and listens on port 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
