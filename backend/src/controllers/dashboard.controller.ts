import { Request, Response } from 'express';
import { prisma } from '../server';
import { zapiService } from '../services/zapi.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalMensagens, totalGrupos, campanhasAtivas, campanhasConcluidas] = await Promise.all([
      prisma.mensagem.count(),
      prisma.grupo.count(),
      prisma.campanha.count({ where: { status: 'em_andamento' } }),
      prisma.campanha.count({ where: { status: 'concluida' } })
    ]);

    const atividadesRecentes = await prisma.campanha.findMany({
      take: 5,
      orderBy: { atualizado_em: 'desc' },
      include: {
        mensagem: { select: { titulo: true } }
      }
    });

    return res.json({
      success: true,
      data: {
        stats: {
          totalMensagens,
          totalGrupos,
          campanhasAtivas,
          campanhasConcluidas
        },
        atividadesRecentes
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
};
export const getZapiStatus = async (req: Request, res: Response) => {
  try {
    const status = await zapiService.getInstanceStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    return res.json({
      success: true,
      data: { connected: false }
    });
  }
};