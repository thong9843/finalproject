FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed (e.g. for bcrypt)
RUN apk add --no-cache make gcc g++ python3

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Copy database schema from project root (injected at build time via docker-compose build context)
# database.sql is expected to exist at /app/database.sql
# If not present, seed.js will fall back gracefully

EXPOSE 5000

CMD ["node", "src/index.js"]
