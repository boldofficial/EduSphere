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

ARG NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}

ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}

ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

ARG R2_ACCOUNT_ID
ENV R2_ACCOUNT_ID=${R2_ACCOUNT_ID}

ARG R2_ACCESS_KEY_ID
ENV R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}

ARG R2_SECRET_ACCESS_KEY
ENV R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}

ARG R2_BUCKET_NAME
ENV R2_BUCKET_NAME=${R2_BUCKET_NAME}

ARG R2_PUBLIC_URL
ENV R2_PUBLIC_URL=${R2_PUBLIC_URL}

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
