import { Request, Response } from 'express';
import { prisma } from '../server';
import { zapiService } from '../services/zapi.service';

export const syncGroups = async (req: Request, res: Response) => {
  try {
    const groups = await zapiService.getGroups();

    if (!Array.isArray(groups)) {
      return res.status(400).json({
        success: false,
        message: 'Resposta inválida da Z-API'
      });
    }

    // Sincronizar cada grupo no banco de dados
    const syncPromises = groups
      .filter(group => group.phone || group.id) // Garante que o grupo tem um ID
      .map(group => {
        const groupId = group.phone || group.id;
        
        return prisma.grupo.upsert({
        where: { grupo_id_zapi: groupId },
        update: {
          nome: group.name || 'Grupo sem nome',
          foto_url: group.image || group.thumbnail || null,
          total_participantes: group.participantsCount || 0,
          sincronizado_em: new Date(),
        },
        create: {
          grupo_id_zapi: groupId,
          nome: group.name || 'Grupo sem nome',
          foto_url: group.image || group.thumbnail || null,
          total_participantes: group.participantsCount || 0,
        }
      });
    });

    await Promise.all(syncPromises);

    return res.json({
      success: true,
      message: `${groups.length} grupos sincronizados com sucesso`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao sincronizar grupos'
    });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const { search, ativo } = req.query;

    const where: any = {};
    
    if (search) {
      where.nome = { contains: String(search), mode: 'insensitive' };
    }

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    const grupos = await prisma.grupo.findMany({
      where,
      orderBy: { nome: 'asc' }
    });

    return res.json({
      success: true,
      data: grupos
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar grupos'
    });
  }
};

export const toggleGroupStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    const grupo = await prisma.grupo.update({
      where: { id },
      data: { ativo }
    });

    return res.json({
      success: true,
      data: grupo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do grupo'
    });
  }
};
