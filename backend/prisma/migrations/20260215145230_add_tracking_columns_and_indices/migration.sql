-- AlterTable
ALTER TABLE "campanhas_grupos" ADD COLUMN     "erro_em" TIMESTAMP(3),
ADD COLUMN     "processado_em" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "campanhas_grupos_status_idx" ON "campanhas_grupos"("status");

-- CreateIndex
CREATE INDEX "campanhas_mensagens_campanha_id_idx" ON "campanhas_mensagens"("campanha_id");
