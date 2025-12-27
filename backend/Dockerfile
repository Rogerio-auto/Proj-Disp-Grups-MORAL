FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias para o Prisma e compilação de módulos nativos (bcrypt)
RUN apk add --no-cache openssl make gcc g++ python3

COPY package*.json ./
RUN npm install && npm rebuild bcrypt --build-from-source

COPY . .

# Gerar o cliente do Prisma
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

EXPOSE 3000

CMD npx prisma migrate deploy && npx prisma db seed && npm run start
