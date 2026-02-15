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

    // 1. Identificar IDs que vieram da API e filtrar apenas os que terminam com -group ou @g.us
    // Usamos um Map para garantir unicidade pelo ID antes de processar
    const uniqueGroupsMap = new Map();

    groups.forEach(group => {
      const id = group.id || group.phone;
      if (id && (id.endsWith('-group') || id.endsWith('@g.us'))) {
        uniqueGroupsMap.set(id, group);
      }
    });

    const filteredGroups = Array.from(uniqueGroupsMap.values());
    const zapiGroupIds = Array.from(uniqueGroupsMap.keys());

    // 2. Marcar como "ativos" apenas os grupos filtrados e atualizar dados
    // Usamos Promise.all com a lista deduplicada para performance
    console.log(`Iniciando sincronização de ${filteredGroups.length} grupos únicos...`);
    
    const syncPromises = filteredGroups.map(group => {
      const groupId = group.id || group.phone;
      const participantsCount = parseInt(String(group.participantsCount)) || 0;
      
      return prisma.grupo.upsert({
        where: { grupo_id_zapi: groupId },
        update: {
          nome: group.name || 'Grupo sem nome',
          foto_url: group.image || group.thumbnail || null,
          total_participantes: participantsCount,
          sincronizado_em: new Date(),
          ativo: true 
        },
        create: {
          grupo_id_zapi: groupId,
          nome: group.name || 'Grupo sem nome',
          foto_url: group.image || group.thumbnail || null,
          total_participantes: participantsCount,
          ativo: true
        }
      });
    });

    await Promise.all(syncPromises);

    // 3. Remover ou desativar o que não é mais um grupo válido
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    // Se temos grupos retornados, desativamos os que não estão na lista
    if (zapiGroupIds.length > 0) {
      await prisma.grupo.updateMany({
        where: {
          grupo_id_zapi: { notIn: zapiGroupIds as string[] }
        },
        data: { ativo: false }
      });
    }

    // Limpeza: Deletar definitivamente grupos que não são sincronizados há mais de 7 dias
    const deleted = await prisma.grupo.deleteMany({
      where: {
        sincronizado_em: { lt: seteDiasAtras }
      }
    });

    return res.json({
      success: true,
      message: `${groups.length} grupos sincronizados. ${deleted.count} grupos antigos removidos por expiração (7 dias).`
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
