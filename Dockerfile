FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Install MariaDB/MySQL Server
RUN apt-get update && apt-get install -y \
    default-mysql-server \
    && rm -rf /var/lib/apt/lists/*

# Set up Frontend directory (install devDependencies for Vite)
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Set up Backend directory
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .

# Copy database assets and CSV output data for migration/import
COPY database.sql /app/database.sql
COPY Output_DB /app/Output_DB

# Copy and setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy setup file

COPY setup.js /app/setup.js
RUN chmod +x /app/setup.js

# Expose ports: 5000 (Unified App)
EXPOSE 5000


# Run entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
