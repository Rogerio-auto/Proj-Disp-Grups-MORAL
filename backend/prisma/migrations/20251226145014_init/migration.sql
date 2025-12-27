-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'user',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_ativas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_ativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "grupo_id_zapi" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "foto_url" TEXT,
    "descricao" TEXT,
    "total_participantes" INTEGER NOT NULL DEFAULT 0,
    "sincronizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "conteudo_formatado" TEXT,
    "tem_midia" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midias" (
    "id" TEXT NOT NULL,
    "mensagem_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanho_bytes" BIGINT,
    "mime_type" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "midias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mensagem_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "total_grupos" INTEGER NOT NULL DEFAULT 0,
    "grupos_processados" INTEGER NOT NULL DEFAULT 0,
    "agendada_para" TIMESTAMP(3),
    "iniciada_em" TIMESTAMP(3),
    "concluida_em" TIMESTAMP(3),
    "tipo_disparo" TEXT NOT NULL DEFAULT 'imediato',
    "intervalo_segundos" INTEGER NOT NULL DEFAULT 0,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campanhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas_grupos" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "erro_mensagem" TEXT,
    "enviado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campanhas_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_de_erros" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "stack_trace" TEXT,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_de_erros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamanho_kb" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_gerais" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "configuracoes_gerais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estatisticas_campanhas" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT,
    "total_grupos" INTEGER NOT NULL,
    "total_sucessos" INTEGER NOT NULL,
    "total_erros" INTEGER NOT NULL,
    "total_pendentes" INTEGER NOT NULL,
    "taxa_sucesso" DECIMAL(5,2) NOT NULL,
    "tempo_medio_envio" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),

    CONSTRAINT "estatisticas_campanhas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_ativas_token_key" ON "sessoes_ativas"("token");

-- CreateIndex
CREATE INDEX "sessoes_ativas_usuario_id_idx" ON "sessoes_ativas"("usuario_id");

-- CreateIndex
CREATE INDEX "sessoes_ativas_token_idx" ON "sessoes_ativas"("token");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_grupo_id_zapi_key" ON "grupos"("grupo_id_zapi");

-- CreateIndex
CREATE INDEX "grupos_ativo_idx" ON "grupos"("ativo");

-- CreateIndex
CREATE INDEX "midias_mensagem_id_idx" ON "midias"("mensagem_id");

-- CreateIndex
CREATE INDEX "campanhas_status_idx" ON "campanhas"("status");

-- CreateIndex
CREATE INDEX "campanhas_grupos_campanha_id_idx" ON "campanhas_grupos"("campanha_id");

-- CreateIndex
CREATE UNIQUE INDEX "campanhas_grupos_campanha_id_grupo_id_key" ON "campanhas_grupos"("campanha_id", "grupo_id");

-- CreateIndex
CREATE INDEX "log_de_erros_campanha_id_idx" ON "log_de_erros"("campanha_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquivos_nome_arquivo_key" ON "arquivos"("nome_arquivo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_gerais_chave_key" ON "configuracoes_gerais"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "estatisticas_campanhas_campanha_id_key" ON "estatisticas_campanhas"("campanha_id");

-- AddForeignKey
ALTER TABLE "sessoes_ativas" ADD CONSTRAINT "sessoes_ativas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "midias" ADD CONSTRAINT "midias_mensagem_id_fkey" FOREIGN KEY ("mensagem_id") REFERENCES "mensagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_mensagem_id_fkey" FOREIGN KEY ("mensagem_id") REFERENCES "mensagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_grupos" ADD CONSTRAINT "campanhas_grupos_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_grupos" ADD CONSTRAINT "campanhas_grupos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_de_erros" ADD CONSTRAINT "log_de_erros_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
