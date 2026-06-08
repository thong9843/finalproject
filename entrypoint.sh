#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== VLU Enterprise Link Unified Container Setup ==="

# Create runtime directories if missing
mkdir -p /var/run/mysqld
chown -R mysql:mysql /var/run/mysqld

# Start MySQL/MariaDB service
echo "Starting database server..."
if service mariadb start; then
    echo "✔ Started mariadb service."
elif service mysql start; then
    echo "✔ Started mysql service."
elif /etc/init.d/mariadb start; then
    echo "✔ Started mariadb init script."
elif /etc/init.d/mysql start; then
    echo "✔ Started mysql init script."
else
    echo "❌ Could not start database server!"
    exit 1
fi

# Wait for MySQL to be ready
echo "Waiting for database server to start..."
until mysqladmin ping -u root --silent; do
    echo "Database is starting up..."
    sleep 1
done
echo "✔ Database is running."


# Configure MySQL credentials and Database
echo "Configuring database..."
mysql -e "
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'rootpassword';
  CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'rootpassword';
  GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
  FLUSH PRIVILEGES;
" || mysql -uroot -prootpassword -e "FLUSH PRIVILEGES;"

# Wait for privileges to apply
sleep 1

mysql -uroot -prootpassword -e "CREATE DATABASE IF NOT EXISTS vlu_enterprise_link CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true



# Generate backend .env if it does not exist
if [ ! -f /app/backend/.env ]; then
    echo "Creating backend .env configuration..."
    cp /app/backend/.envsample /app/backend/.env
    # Generate random JWT secret
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    sed -i "s/JWT_SECRET=/JWT_SECRET=${JWT_SECRET}/" /app/backend/.env
    
    # Update MySQL credentials in .env to match container MySQL setup
    sed -i "s/DB_HOST=localhost/DB_HOST=127.0.0.1/" /app/backend/.env
    sed -i "s/DB_PASSWORD=/DB_PASSWORD=rootpassword/" /app/backend/.env
    echo "✔ Created /app/backend/.env successfully."
fi

# Run migrations and seed data inside container only if not already initialized
TABLE_COUNT=$(mysql -uroot -prootpassword -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'vlu_enterprise_link';" 2>/dev/null || echo 0)

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✔ Database is already initialized. Skipping migrations to preserve data."
else
    echo "Running database migrations..."
    export DB_HOST=127.0.0.1
    export DB_USER=root
    export DB_PASSWORD=rootpassword
    export DB_NAME=vlu_enterprise_link

    node /app/backend/migrations/run-sql.js
    node /app/backend/seed.js
    echo "✔ Database migrations completed."
fi

# Start Node.js Backend Server in background
echo "Starting Backend API on port 5000..."
cd /app/backend
node src/index.js &

# Start Frontend (Vite Dev Server) in foreground
echo "Starting Frontend Vite Dev Server on port 8080..."
cd /app/frontend
npm run dev -- --host 0.0.0.0 --port 8080


