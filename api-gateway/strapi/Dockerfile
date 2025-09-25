FROM node:20-alpine

# Install libc6-compat and Python for better-sqlite3
RUN apk add --no-cache libc6-compat python3 python3-dev make g++

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

RUN npm install

# 🔧 Rebuild native modules for Node.js 20 - The compatibility ritual! ✨
RUN npm rebuild sqlite3

COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]