import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET! 
    ) as JwtPayload;
    
    // Verificar se sessão está ativa
    const sessao = await prisma.sessao.findUnique({
      where: { id: decoded.sessionId },
      include: { usuario: true }
    });
    
    if (!sessao || sessao.expira_em < new Date()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sessão expirada' 
      });
    }
    
    if (!sessao.usuario.ativo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuário desativado' 
      });
    }
    
    req.user = sessao.usuario;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

export const requireAdmin = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (req.user?.papel !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado' 
    });
  }
  next();
};
