import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  console.log('🌱 Iniciando seed do banco de dados...');
  console.log(`📧 Email do admin: ${adminEmail}`);

  // Criar usuário admin padrão
  const senhaHash = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      senha_hash: senhaHash,
      nome: adminName,
      papel: 'admin',
      ativo: true
    },
    create: {
      email: adminEmail,
      senha_hash: senhaHash,
      nome: adminName,
      papel: 'admin',
      ativo: true
    }
  });
  
  console.log('✅ Seed completo! Usuário admin criado/atualizado:', adminEmail);
  console.log(`🔑 Use a senha definida na env ADMIN_PASSWORD para fazer login.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
