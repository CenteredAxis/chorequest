# Stage 1: Build frontend
FROM node:20-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: Build server (with native module compilation)
FROM node:20-slim AS server-builder
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ .

# Stage 3: Final image
FROM node:20-slim
WORKDIR /app
COPY --from=server-builder /app/server ./
COPY --from=client-builder /app/server/public ./public

ENV NODE_ENV=production
ENV DB_PATH=/data/chorequest.db

EXPOSE 3000
CMD ["node", "index.js"]
