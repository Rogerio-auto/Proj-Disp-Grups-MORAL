FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias para o Prisma e builds
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

# Gerar o cliente do Prisma
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
