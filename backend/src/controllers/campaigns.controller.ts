import { Request, Response } from 'express';
import { prisma } from '../server';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { nome, mensagem_id, grupos_ids, intervalo_segundos, agendada_para, tipo_disparo } = req.body;

    if (!nome || !mensagem_id || !grupos_ids || grupos_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome, mensagem e pelo menos um grupo são obrigatórios.'
      });
    }

    // Criar a campanha e as relações com os grupos em uma transação
    const campanha = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.campanha.create({
        data: {
          nome,
          mensagem_id,
          intervalo_segundos: Number(intervalo_segundos) || 0,
          agendada_para: agendada_para ? new Date(agendada_para) : null,
          tipo_disparo: tipo_disparo || 'imediato',
          status: 'rascunho',
          total_grupos: grupos_ids.length,
        }
      });

      const campanhaGruposData = grupos_ids.map((grupoId: string) => ({
        campanha_id: newCampaign.id,
        grupo_id: grupoId,
        status: 'pendente'
      }));

      await tx.campanhaGrupo.createMany({
        data: campanhaGruposData
      });

      return newCampaign;
    });

    return res.status(201).json({
      success: true,
      data: campanha
    });
  } catch (error: any) {
    console.error('Erro ao criar campanha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar campanha'
    });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campanhas = await prisma.campanha.findMany({
      include: {
        mensagem: {
          select: { titulo: true }
        },
        _count: {
          select: { campanhas_grupos: true }
        }
      },
      orderBy: { criado_em: 'desc' }
    });

    return res.json({
      success: true,
      data: campanhas
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar campanhas'
    });
  }
};

export const getCampaignDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campanha = await prisma.campanha.findUnique({
      where: { id },
      include: {
        mensagem: true,
        campanhas_grupos: {
          include: {
            grupo: true
          }
        }
      }
    });

    if (!campanha) {
      return res.status(404).json({
        success: false,
        message: 'Campanha não encontrada'
      });
    }

    return res.json({
      success: true,
      data: campanha
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes da campanha'
    });
  }
};

export const updateCampaignStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const campanha = await prisma.campanha.update({
      where: { id },
      data: { 
        status,
        iniciada_em: status === 'em_andamento' ? new Date() : undefined,
        concluida_em: status === 'concluida' ? new Date() : undefined
      }
    });

    return res.json({
      success: true,
      data: campanha
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da campanha'
    });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, mensagem_id, grupos_ids, intervalo_segundos, agendada_para, tipo_disparo } = req.body;

    const campanha = await prisma.$transaction(async (tx) => {
      // Atualiza dados básicos
      const updated = await tx.campanha.update({
        where: { id },
        data: {
          nome,
          mensagem_id,
          intervalo_segundos: Number(intervalo_segundos),
          agendada_para: agendada_para ? new Date(agendada_para) : null,
          tipo_disparo,
          total_grupos: grupos_ids.length
        }
      });

      // Remove relações antigas e cria novas
      await tx.campanhaGrupo.deleteMany({
        where: { campanha_id: id }
      });

      const campanhaGruposData = grupos_ids.map((grupoId: string) => ({
        campanha_id: id,
        grupo_id: grupoId,
        status: 'pendente'
      }));

      await tx.campanhaGrupo.createMany({
        data: campanhaGruposData
      });

      return updated;
    });

    return res.json({
      success: true,
      data: campanha
    });
  } catch (error) {
    console.error('Erro ao editar campanha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao editar campanha'
    });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.campanha.delete({ where: { id } });
    return res.json({ success: true, message: 'Campanha excluída' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao excluir campanha' });
  }
};
