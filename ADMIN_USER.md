# Gestão de Usuário Admin

## Criação Automática

O sistema cria automaticamente um usuário administrador na inicialização baseado nas variáveis de ambiente:

- `ADMIN_EMAIL` - Email do usuário admin (padrão: admin@sistema.com)
- `ADMIN_PASSWORD` - Senha do usuário admin (padrão: admin123)  
- `ADMIN_NAME` - Nome do usuário admin (padrão: Administrador)

## Como Funcionar

### 1. Via Seed do Prisma

Durante o deploy, o comando `npx prisma db seed` é executado automaticamente e cria/atualiza o usuário admin.

### 2. Via Inicialização do Servidor

Como fallback, o servidor verifica na inicialização se o usuário admin existe. Se não existir, ele é criado automaticamente.

## Personalização

Para personalizar o usuário admin, defina as variáveis de ambiente no seu `.env` ou `docker-compose.yml`:

```yaml
environment:
  ADMIN_EMAIL: seuemail@empresa.com
  ADMIN_PASSWORD: sua_senha_segura
  ADMIN_NAME: Seu Nome
```

## Alteração de Senha

Se você alterar a senha do admin nas variáveis de ambiente e reiniciar o container, o seed irá atualizar a senha do usuário existente.

## Segurança

⚠️ **IMPORTANTE**: Em produção, sempre defina valores personalizados e seguros para estas variáveis. Nunca use os valores padrão em ambiente de produção.
