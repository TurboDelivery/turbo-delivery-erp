FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

FROM base AS deps
WORKDIR /app

# Définir le store pnpm (cacheable)
ENV PNPM_STORE_PATH=/pnpm/store

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

ENV PNPM_STORE_PATH=/pnpm/store

ARG NODE_ENV=production
ARG NEXT_PUBLIC_BACKEND_PROTOCOL
ARG NEXT_PUBLIC_API_ERP_URL
ARG NEXT_PUBLIC_API_RESTO_URL
ARG NEXT_PUBLIC_API_CLIENT_URL
ARG NEXT_PUBLIC_API_DELIVERY_URL
ARG NEXT_PUBLIC_API_BACKEND_URL
ARG NEXT_PUBLIC_API_SOCKET_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_BACKEND_PROTOCOL=${NEXT_PUBLIC_BACKEND_PROTOCOL}
ENV NEXT_PUBLIC_API_ERP_URL=${NEXT_PUBLIC_API_ERP_URL}
ENV NEXT_PUBLIC_API_RESTO_URL=${NEXT_PUBLIC_API_RESTO_URL}
ENV NEXT_PUBLIC_API_CLIENT_URL=${NEXT_PUBLIC_API_CLIENT_URL}
ENV NEXT_PUBLIC_API_DELIVERY_URL=${NEXT_PUBLIC_API_DELIVERY_URL}
ENV NEXT_PUBLIC_API_BACKEND_URL=${NEXT_PUBLIC_API_BACKEND_URL}
ENV NEXT_PUBLIC_API_SOCKET_URL=${NEXT_PUBLIC_API_SOCKET_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
