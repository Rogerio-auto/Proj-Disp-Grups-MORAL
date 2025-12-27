import { Request, Response } from 'express';
import { prisma } from '../server';
import { createMessageSchema } from '../utils/validators';

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { titulo, conteudo, conteudo_formatado, tem_midia } = req.body;
    const file = req.file;

    const mensagem = await prisma.mensagem.create({
      data: {
        titulo,
        conteudo: (file && file.mimetype.startsWith('audio/')) ? '' : (conteudo || ''),
        conteudo_formatado,
        tem_midia: !!file,
        midias: file ? {
          create: {
            tipo: file.mimetype.split('/')[0],
            nome_arquivo: file.originalname,
            url: `/uploads/${file.filename}`,
            mime_type: file.mimetype,
            tamanho_bytes: BigInt(file.size)
          }
        } : undefined
      },
      include: { midias: true }
    });

    return res.status(201).json({
      success: true,
      data: mensagem,
      message: 'Mensagem criada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar mensagem:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar mensagem'
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const mensagens = await prisma.mensagem.findMany({
      orderBy: { criado_em: 'desc' },
      include: { midias: true }
    });

    return res.json({
      success: true,
      data: mensagens
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens'
    });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mensagem = await prisma.mensagem.findUnique({
      where: { id },
      include: { midias: true }
    });

    if (!mensagem) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada'
      });
    }

    return res.json({
      success: true,
      data: mensagem
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagem'
    });
  }
};

export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, conteudo, conteudo_formatado } = req.body;
    const file = req.file;

    const mensagem = await prisma.mensagem.update({
      where: { id },
      data: {
        titulo,
        conteudo: (file && file.mimetype.startsWith('audio/')) ? '' : (conteudo || ''),
        conteudo_formatado,
        tem_midia: !!file || undefined, // Mantém se já tinha ou atualiza se veio novo
        midias: file ? {
          deleteMany: {}, // Remove mídias antigas (simplificação: 1 mídia por msg)
          create: {
            tipo: file.mimetype.split('/')[0],
            nome_arquivo: file.originalname,
            url: `/uploads/${file.filename}`,
            mime_type: file.mimetype,
            tamanho_bytes: BigInt(file.size)
          }
        } : undefined
      },
      include: { midias: true }
    });

    return res.json({
      success: true,
      data: mensagem,
      message: 'Mensagem atualizada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar mensagem:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao atualizar mensagem'
    });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.mensagem.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Mensagem excluída com sucesso'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir mensagem'
    });
  }
};
