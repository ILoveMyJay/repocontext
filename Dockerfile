FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json tsup.config.ts ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

ENTRYPOINT [ node, dist/mcp/server.js]
