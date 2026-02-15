import { Request, Response } from 'express';
import { prisma } from '../server';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { 
      nome, 
      mensagem_id, 
      mensagens_ids, 
      grupos_ids, 
      intervalo_segundos, 
      agendada_para, 
      tipo_disparo,
      criar_nova_mensagem,
      novas_mensagens, // Novo campo: array de objetos {titulo, conteudo}
      msg_titulo, // Legado
      msg_conteudo // Legado
    } = req.body;
    
    const files = req.files as Express.Multer.File[];

    // Converte mensagens_ids para array se vier como string JSON
    let finalMensagensIds: string[] = [];
    if (mensagens_ids) {
      finalMensagensIds = typeof mensagens_ids === 'string' ? JSON.parse(mensagens_ids) : mensagens_ids;
    } else if (mensagem_id) {
      finalMensagensIds = [mensagem_id];
    }

    if (!nome || (finalMensagensIds.length === 0 && !criar_nova_mensagem) || !grupos_ids || grupos_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nome, pelo menos uma mensagem e pelo menos um grupo são obrigatórios.'
      });
    }

    // Criar a campanha e as relações com os grupos em uma transação
    const campanha = await prisma.$transaction(async (tx) => {
      // Se for para criar novas mensagens
      if (criar_nova_mensagem === 'true' || criar_nova_mensagem === true) {
        let items: any[] = [];
        
        if (novas_mensagens) {
          items = typeof novas_mensagens === 'string' ? JSON.parse(novas_mensagens) : novas_mensagens;
        } else if (msg_titulo) {
          items = [{ titulo: msg_titulo, conteudo: msg_conteudo }];
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          // Procura arquivo correspondente à posição (file_0, file_1...) ou campo genérico 'file'
          const file = files?.find(f => f.fieldname === `file_${i}` || (i === 0 && f.fieldname === 'file'));

          const novaMensagem = await tx.mensagem.create({
            data: {
              titulo: item.titulo || `Mensagem ${i+1} - ${nome}`,
              conteudo: item.conteudo || '',
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
            }
          });
          finalMensagensIds.push(novaMensagem.id);
        }
      }

      // Limitar a 3 mensagens
      finalMensagensIds = finalMensagensIds.slice(0, 3);

      const newCampaign = await tx.campanha.create({
        data: {
          nome,
          intervalo_segundos: Number(intervalo_segundos) || 0,
          agendada_para: agendada_para ? new Date(agendada_para) : null,
          tipo_disparo: tipo_disparo || 'imediato',
          status: 'rascunho',
          total_grupos: (typeof grupos_ids === 'string' ? JSON.parse(grupos_ids) : grupos_ids).length,
          campanhas_mensagens: {
            create: finalMensagensIds.map((msgId, index) => ({
              mensagem_id: msgId,
              ordem: index
            }))
          }
        }
      });

      const parsedGruposIds = typeof grupos_ids === 'string' ? JSON.parse(grupos_ids) : grupos_ids;
      const campanhaGruposData = parsedGruposIds.map((grupoId: string) => ({
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
        campanhas_mensagens: {
          include: {
            mensagem: {
              select: { titulo: true }
            }
          }
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
        campanhas_mensagens: {
          include: {
            mensagem: {
              include: {
                midias: true
              }
            }
          }
        },
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
    const { 
      nome, 
      mensagem_id, 
      mensagens_ids, 
      grupos_ids, 
      intervalo_segundos, 
      agendada_para, 
      tipo_disparo,
      criar_nova_mensagem,
      novas_mensagens
    } = req.body;
    
    const files = req.files as Express.Multer.File[];

    let parsedMensagensIds: string[] = [];
    if (mensagens_ids) {
      parsedMensagensIds = typeof mensagens_ids === 'string' ? JSON.parse(mensagens_ids) : mensagens_ids;
    } else if (mensagem_id) {
      parsedMensagensIds = [mensagem_id];
    }

    const parsedGruposIds = typeof grupos_ids === 'string' ? JSON.parse(grupos_ids) : grupos_ids;

    const campanha = await prisma.$transaction(async (tx) => {
      // Se for para criar novas mensagens durante o update
      if (criar_nova_mensagem === 'true' || criar_nova_mensagem === true) {
        let items: any[] = [];
        if (novas_mensagens) {
          items = typeof novas_mensagens === 'string' ? JSON.parse(novas_mensagens) : novas_mensagens;
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const file = files?.find(f => f.fieldname === `file_${i}`);

          const novaMensagem = await tx.mensagem.create({
            data: {
              titulo: item.titulo || `Mensagem ${i+1} - ${nome}`,
              conteudo: item.conteudo || '',
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
            }
          });
          parsedMensagensIds.push(novaMensagem.id);
        }
      }

      // Atualiza dados básicos
      const updated = await tx.campanha.update({
        where: { id },
        data: {
          nome,
          intervalo_segundos: Number(intervalo_segundos),
          agendada_para: agendada_para ? new Date(agendada_para) : null,
          tipo_disparo,
          total_grupos: parsedGruposIds.length
        }
      });

      // Atualiza Mensagens
      await tx.campanhaMensagem.deleteMany({ where: { campanha_id: id } });
      const finalMensagensIds = parsedMensagensIds.slice(0, 3);
      if (finalMensagensIds.length > 0) {
        await tx.campanhaMensagem.createMany({
          data: finalMensagensIds.map((msgId: string, index: number) => ({
            campanha_id: id,
            mensagem_id: msgId,
            ordem: index
          }))
        });
      }

      // Remove relações antigas e cria novas de grupos
      await tx.campanhaGrupo.deleteMany({
        where: { campanha_id: id }
      });

      const campanhaGruposData = parsedGruposIds.map((grupoId: string) => ({
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
