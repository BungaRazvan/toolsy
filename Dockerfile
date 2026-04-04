# Stage 1: Build
FROM node:18.20.8-bullseye AS builder

WORKDIR /app

# Only copy package files first to leverage cache
COPY package.json package-lock.json ./

# Use npm cache mount for speed
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit

# Copy rest of source
COPY . .

# Run build (needs devDependencies)
RUN npm run build

# Stage 2: Production
FROM node:18.20.8-bullseye-slim

WORKDIR /app

# Install system dependencies needed at runtime
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3

RUN apt-get install -y python3-pip \
 && pip3 install yt-dlp \
 && rm -rf /var/lib/apt/lists/*

# Only copy package files first to leverage cache
COPY package.json package-lock.json ./

# Only production dependencies, with npm cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --prefer-offline --no-audit

# Copy the bundled files from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
