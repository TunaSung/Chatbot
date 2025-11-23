# syntax=docker/dockerfile:1

# ==== Build client ====
FROM node:20-alpine AS clientbuild
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ==== Build server ====
FROM node:20-alpine AS serverbuild
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ==== Runtime ====
FROM node:20-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production PORT=8080

# 只帶 production deps
COPY server/package*.json ./
RUN npm ci --omit=dev

# server dist
COPY --from=serverbuild /app/server/dist ./dist
COPY --from=clientbuild /app/client/dist ./public

EXPOSE 8080
CMD ["node", "dist/server.js"]
