import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { comparePassword } from '../utils/password.util';
import { loginSchema } from '../utils/validators';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = loginSchema.parse(req.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario || !(await comparePassword(senha, usuario.senha_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        success: false,
        message: 'Usuário desativado'
      });
    }

    // Criar sessão
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 24);

    const sessao = await prisma.sessao.create({
      data: {
        usuario_id: usuario.id,
        token: '', // Será atualizado após gerar o JWT ou usado como identificador
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        expira_em: expiraEm
      }
    });

    const token = jwt.sign(
      { userId: usuario.id, sessionId: sessao.id },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    // Atualizar sessão com o token (opcional, dependendo da estratégia)
    await prisma.sessao.update({
      where: { id: sessao.id },
      data: { token }
    });

    return res.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          papel: usuario.papel
        },
        token,
        expiresIn: '24h'
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao realizar login'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await prisma.sessao.deleteMany({
        where: { token }
      });
    }
    return res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao realizar logout' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      usuario: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        papel: req.user.papel
      }
    }
  });
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessoes = await prisma.sessao.findMany({
      where: { usuario_id: req.user.id },
      orderBy: { criado_em: 'desc' }
    });
    return res.json({ success: true, data: sessoes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao buscar sessões' });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sessao.delete({
      where: { id, usuario_id: req.user.id }
    });
    return res.json({ success: true, message: 'Sessão encerrada' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao encerrar sessão' });
  }
};
