# Stage 1: Build
FROM --platform=linux/arm/v7 node:18.20.8-bullseye AS builder
WORKDIR /usr/src/app

# Copy only package files to cache dependencies
COPY package*.json ./

# Install deps (cached if package.json doesn't change)
RUN npm ci --prefer-offline --no-audit

# Copy source files
COPY . .

# Build TS
RUN npm run build