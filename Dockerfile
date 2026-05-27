FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./.next/standalone/scripts
COPY --from=builder /app/src/env.mjs ./.next/standalone/src/env.mjs
COPY --from=builder /app/src/db ./.next/standalone/src/db
COPY --from=builder /app/node_modules/better-sqlite3 ./.next/standalone/node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./.next/standalone/node_modules/bindings
COPY --from=builder /app/node_modules/drizzle-orm ./.next/standalone/node_modules/drizzle-orm
COPY --from=builder /app/node_modules/file-uri-to-path ./.next/standalone/node_modules/file-uri-to-path
COPY --from=builder /app/docker ./docker

RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker/entrypoint.sh"]
