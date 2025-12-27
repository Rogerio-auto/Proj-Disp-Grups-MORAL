import { Request, Response } from 'express';
import { prisma } from '../server';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

export const getSettings = async (req: Request, res: Response) => {
  try {
    // Retorna as configurações da Z-API (mascaradas)
    return res.json({
      success: true,
      data: {
        zapi_instance_id: process.env.ZAPI_INSTANCE_ID,
        zapi_token: process.env.ZAPI_TOKEN?.substring(0, 4) + '...',
        zapi_client_token: process.env.ZAPI_CLIENT_TOKEN?.substring(0, 4) + '...',
        zapi_base_url: process.env.ZAPI_BASE_URL
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar configurações' });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    const isMatch = await bcrypt.compare(currentPassword, user.senha_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Senha atual incorreta' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.usuario.update({
      where: { id: userId },
      data: { senha_hash: hashedNewPassword }
    });

    return res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar senha' });
  }
};
