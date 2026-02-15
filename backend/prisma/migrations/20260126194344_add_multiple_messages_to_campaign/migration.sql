/*
  Warnings:

  - You are about to drop the column `mensagem_id` on the `campanhas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "campanhas" DROP CONSTRAINT "campanhas_mensagem_id_fkey";

-- AlterTable
ALTER TABLE "campanhas" DROP COLUMN "mensagem_id";

-- CreateTable
CREATE TABLE "campanhas_mensagens" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "mensagem_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "campanhas_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campanhas_mensagens_campanha_id_mensagem_id_key" ON "campanhas_mensagens"("campanha_id", "mensagem_id");

-- AddForeignKey
ALTER TABLE "campanhas_mensagens" ADD CONSTRAINT "campanhas_mensagens_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanhas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas_mensagens" ADD CONSTRAINT "campanhas_mensagens_mensagem_id_fkey" FOREIGN KEY ("mensagem_id") REFERENCES "mensagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
