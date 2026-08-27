/*
  Warnings:

  - You are about to drop the `doacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusSolicitacaoAjuda" AS ENUM ('aberto', 'em_andamento', 'concluido', 'cancelado');

-- CreateEnum
CREATE TYPE "CategoriaAjuda" AS ENUM ('doacao', 'medicamento', 'voluntariado', 'infraestrutura', 'outro');

-- CreateEnum
CREATE TYPE "UrgenciaAjuda" AS ENUM ('baixa', 'media', 'alta', 'critica');

-- DropForeignKey
ALTER TABLE "doacao" DROP CONSTRAINT "doacao_abrigoId_fkey";

-- DropForeignKey
ALTER TABLE "doacao" DROP CONSTRAINT "doacao_voluntarioId_fkey";

-- DropTable
DROP TABLE "doacao";

-- CreateTable
CREATE TABLE "solicitacao_ajuda" (
    "id_solicitacao" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaAjuda" NOT NULL,
    "urgencia" "UrgenciaAjuda" NOT NULL DEFAULT 'media',
    "status" "StatusSolicitacaoAjuda" NOT NULL DEFAULT 'aberto',
    "observacaoFechamento" TEXT,
    "criadoPorId" INTEGER NOT NULL,
    "abrigoId" INTEGER NOT NULL,
    "voluntarioId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_ajuda_pkey" PRIMARY KEY ("id_solicitacao")
);

-- CreateTable
CREATE TABLE "solicitacao_ajuda_interesse" (
    "id" SERIAL NOT NULL,
    "solicitacaoId" INTEGER NOT NULL,
    "voluntarioId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_ajuda_interesse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacao_ajuda_status_idx" ON "solicitacao_ajuda"("status");

-- CreateIndex
CREATE INDEX "solicitacao_ajuda_abrigoId_idx" ON "solicitacao_ajuda"("abrigoId");

-- CreateIndex
CREATE INDEX "solicitacao_ajuda_categoria_idx" ON "solicitacao_ajuda"("categoria");

-- CreateIndex
CREATE INDEX "solicitacao_ajuda_created_at_idx" ON "solicitacao_ajuda"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacao_ajuda_interesse_solicitacaoId_voluntarioId_key" ON "solicitacao_ajuda_interesse"("solicitacaoId", "voluntarioId");

-- AddForeignKey
ALTER TABLE "solicitacao_ajuda" ADD CONSTRAINT "solicitacao_ajuda_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_ajuda" ADD CONSTRAINT "solicitacao_ajuda_abrigoId_fkey" FOREIGN KEY ("abrigoId") REFERENCES "abrigo"("id_abrigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_ajuda" ADD CONSTRAINT "solicitacao_ajuda_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "voluntario"("id_voluntario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_ajuda_interesse" ADD CONSTRAINT "solicitacao_ajuda_interesse_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacao_ajuda"("id_solicitacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_ajuda_interesse" ADD CONSTRAINT "solicitacao_ajuda_interesse_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "voluntario"("id_voluntario") ON DELETE RESTRICT ON UPDATE CASCADE;
