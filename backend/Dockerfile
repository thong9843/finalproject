FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed (e.g. for bcrypt)
RUN apk add --no-cache make gcc g++ python3

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
