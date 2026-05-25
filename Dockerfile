# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Final Unified Image (DB + Backend + Frontend)
FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies (Nginx and MariaDB/MySQL)
RUN apt-get update && apt-get install -y \
    default-mysql-server \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy built frontend assets to Nginx default html directory
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/sites-available/default

# Set up Backend directory
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .

# Copy database assets and CSV output data for migration/import
COPY database.sql /app/database.sql
COPY Output_DB /app/Output_DB

# Copy and setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


# Expose port 80 for Nginx
EXPOSE 80

# Run entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
