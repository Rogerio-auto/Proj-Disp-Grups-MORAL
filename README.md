# Sistema de Gerenciamento de Campanhas para Grupos do WhatsApp

Este projeto é um sistema para criação e gerenciamento de campanhas de mensagens para grupos do WhatsApp via Z-API.

## Estrutura do Projeto

- `backend/`: API Node.js com Express, TypeScript e Prisma.
- `frontend/`: Aplicação React com TypeScript, Vite e TailwindCSS.

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker (opcional)

## Configuração do Backend

1. Acesse a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` com suas credenciais do banco de dados e JWT.
4. Execute as migrações do Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Gere o Prisma Client:
   ```bash
   npx prisma generate
   ```
6. Execute o seed para criar o usuário admin padrão:
   ```bash
   npm run seed
   ```
7. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Configuração do Frontend

1. Acesse a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Credenciais Padrão (após seed)

- **Email:** `admin@sistema.com`
- **Senha:** `admin123`

## Tecnologias Utilizadas

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, Bcrypt, Zod, Multer.
- **Frontend:** React, TypeScript, Vite, TailwindCSS, Axios, Zod, Zustand.
