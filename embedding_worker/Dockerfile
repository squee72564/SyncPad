# BASE IMAGE
FROM node:25-alpine3.21 AS base_stage

# Set working directory
WORKDIR /app/embedding_worker

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY embedding_worker/package.json embedding_worker/pnpm-lock.yaml ./

# Install deps
RUN pnpm install --frozen-lockfile

# Copy the rest of the code
COPY embedding_worker/. .

COPY prisma ../prisma

WORKDIR /app/prisma

RUN mkdir -p ./generated/prisma-postgres

RUN /usr/local/bin/npx prisma generate --schema ./schema.prisma

WORKDIR /app

COPY .env.* .

WORKDIR /app/embedding_worker

# BUILD STAGE
FROM base_stage AS build_stage

# RUN pnpm prisma generate
RUN pnpm build

# Runtime Stage
FROM node:25-alpine3.21 AS runtime_stage

WORKDIR /app/embedding_worker

RUN npm install -g pnpm

# Copy only whats needed for runtime
COPY embedding_worker/package.json embedding_worker/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy prisma folder from root context
COPY prisma ../prisma

# Copy compiled dist
COPY --from=build_stage /app/embedding_worker/dist ./dist

# Copy generated Prisma client files from build stage
COPY --from=build_stage /app/prisma/generated/prisma-postgres ./generated/prisma-postgres

COPY --from=build_stage /app/.env.* /app/

# Worker entrypoint
CMD ["node", "dist/index.cjs"]