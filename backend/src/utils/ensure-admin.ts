import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function ensureAdminExists() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    // Verificar se já existe admin
    const existingAdmin = await prisma.usuario.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      console.log('⚠️  Nenhum usuário admin encontrado. Criando admin padrão...');
      
      const senhaHash = await bcrypt.hash(adminPassword, 10);
      
      await prisma.usuario.create({
        data: {
          email: adminEmail,
          senha_hash: senhaHash,
          nome: adminName,
          papel: 'admin',
          ativo: true
        }
      });
      
      console.log(`✅ Usuário admin criado: ${adminEmail}`);
      console.log(`🔑 Use a senha definida na env ADMIN_PASSWORD para fazer login.`);
    } else {
      console.log(`✅ Usuário admin já existe: ${adminEmail}`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar usuário admin:', error);
  }
}
