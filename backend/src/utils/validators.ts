import { z } from 'zod';

// Autenticação
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  papel: z.enum(['user', 'admin']).default('user')
});

// Mensagens
export const createMessageSchema = z.object({
  titulo: z.string().min(1).max(255),
  conteudo: z.string().min(1).max(4096),
  conteudo_formatado: z.string().optional(),
  tem_midia: z.boolean().default(false)
});

// Campanhas
export const createCampaignSchema = z.object({
  nome: z.string().min(1).max(255),
  mensagem_id: z.string().uuid(),
  grupos_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um grupo"),
  tipo_disparo: z.enum(['imediato', 'agendado']).default('imediato'),
  agendada_para: z.string().datetime().optional(),
  intervalo_segundos: z.number().min(0).default(0)
});

// Grupos
export const updateGroupSchema = z.object({
  ativo: z.boolean()
});
