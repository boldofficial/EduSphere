# --- STAGE 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .

# Environment variables for build time
ENV NEXT_TELEMETRY_DISABLED 1
ARG DJANGO_API_URL=http://backend:8000
ENV DJANGO_API_URL=${DJANGO_API_URL}

RUN npm run build

# --- STAGE 2: Run ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
