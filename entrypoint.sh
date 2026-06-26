#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== VLU Enterprise Link Unified Container Setup ==="

# Global DB environment variables for container runtime
export DB_HOST=127.0.0.1
export DB_USER=root
export DB_PASSWORD=rootpassword
export DB_NAME=vlu_enterprise_link

# Create runtime directories if missing
mkdir -p /var/run/mysqld /var/log/mysql
chown -R mysql:mysql /var/run/mysqld /var/log/mysql

# Ensure datadir exists and has correct permissions
mkdir -p /var/lib/mysql
chown -R mysql:mysql /var/lib/mysql

# Initialize database if empty
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "Initializing database..."
    if command -v mysql_install_db >/dev/null 2>&1; then
        mysql_install_db --user=mysql --datadir=/var/lib/mysql
    elif command -v mariadb-install-db >/dev/null 2>&1; then
        mariadb-install-db --user=mysql --datadir=/var/lib/mysql
    else
        echo "❌ Could not find database installation tool!"
        exit 1
    fi
fi

# Start MySQL/MariaDB service
echo "Starting database server..."
# Try starting using mysqld_safe directly to bypass init.d partition check (recommended for Docker)
if command -v mysqld_safe >/dev/null 2>&1; then
    echo "✔ Starting mariadb via mysqld_safe..."
    mysqld_safe --user=mysql --datadir=/var/lib/mysql --skip-syslog --log-error=/var/log/mysql/error.log --skip-name-resolve &
else
    echo "mysqld_safe not found, falling back to service scripts..."
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
fi

# Wait for MySQL to be ready (robust to both blank and set passwords)
echo "Waiting for database server to start..."
counter=0
while true; do
    if mysqladmin -u root ping --silent || mysqladmin -u root -prootpassword ping --silent; do
        break
    fi
    echo "Database is starting up..."
    # Print the actual error output to see why ping is failing (denied, socket error, etc.)
    mysqladmin -u root ping || true
    sleep 1
    counter=$((counter+1))
    if [ $counter -gt 30 ]; then
        echo "❌ Database startup is taking too long! Showing last 30 lines of MySQL/MariaDB error log:"
        if [ -f /var/log/mysql/error.log ]; then
            tail -n 30 /var/log/mysql/error.log
        elif [ -f /var/lib/mysql/error.log ]; then
            tail -n 30 /var/lib/mysql/error.log
        else
            echo "No error log file found."
        fi
        echo "Exiting..."
        exit 1
    fi
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



# Ensure backend .env exists
if [ ! -f /app/backend/.env ]; then
    echo "Creating backend .env configuration..."
    cp /app/backend/.envsample /app/backend/.env
fi

# Ensure JWT_SECRET is generated if missing or empty
if ! grep -q "JWT_SECRET=[a-zA-Z0-9]" /app/backend/.env; then
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    if grep -q "JWT_SECRET=" /app/backend/.env; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" /app/backend/.env
    else
        echo "JWT_SECRET=${JWT_SECRET}" >> /app/backend/.env
    fi
fi

# Always update DB credentials in .env to match container MySQL setup
sed -i 's/^DB_HOST=.*/DB_HOST=127.0.0.1/' /app/backend/.env
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=rootpassword/' /app/backend/.env
sed -i 's/^DB_USER=.*/DB_USER=root/' /app/backend/.env
sed -i 's/^DB_NAME=.*/DB_NAME=vlu_enterprise_link/' /app/backend/.env
echo "✔ Backend environment variables synced in .env."

# Ensure frontend .env exists
if [ ! -f /app/frontend/.env ]; then
    echo "Creating frontend .env..."
    echo "VITE_API_URL=" > /app/frontend/.env
fi

# Run migrations and seed data inside container only if not already initialized
TABLE_COUNT=$(mysql -uroot -prootpassword -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'vlu_enterprise_link';" 2>/dev/null || echo 0)

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✔ Database is already initialized. Skipping migrations to preserve data."
else
    echo "Running setup script..."
    node /app/setup.js

    echo "✔ Database migrations, seed and setup completed."
fi

# Start Node.js Backend Server in foreground
echo "Starting Unified Application on port 5000..."
cd /app/backend
node src/index.js
