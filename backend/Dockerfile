# backend/Dockerfile
FROM node:20-slim

# Install OpenSSL — required by Prisma schema + query engine
RUN apt-get update -y \
    && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client with correct binary for this container
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Verify dist was created
RUN echo "=== dist contents ===" && ls -la dist/

EXPOSE 3000

# Run migrations then start
CMD ["node", "dist/main.js"]
