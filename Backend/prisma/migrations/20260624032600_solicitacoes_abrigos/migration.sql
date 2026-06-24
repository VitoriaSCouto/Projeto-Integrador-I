/*
  Warnings:

  - You are about to alter the column `cpf` on the `Vitima` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(14)`.
  - You are about to alter the column `telefone` on the `Vitima` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `cep` on the `abrigo` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(9)`.

*/
-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('pendente', 'aprovado', 'recusado');

-- AlterTable
ALTER TABLE "Vitima" ALTER COLUMN "cpf" DROP DEFAULT,
ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(14),
ALTER COLUMN "telefone" DROP DEFAULT,
ALTER COLUMN "telefone" SET DATA TYPE VARCHAR(15);

-- AlterTable
ALTER TABLE "abrigo" ALTER COLUMN "cep" SET DATA TYPE VARCHAR(9);

-- CreateTable
CREATE TABLE "solicitacao_abrigo" (
    "id_solicitacao" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "telefone" VARCHAR(15),
    "responsavel" TEXT NOT NULL,
    "tipoAbrigo" TEXT NOT NULL,
    "capacidadeTotal" INTEGER NOT NULL,
    "possuiAtendimentoMedico" BOOLEAN NOT NULL DEFAULT false,
    "possuiEnfermagem" BOOLEAN NOT NULL DEFAULT false,
    "possuiPets" BOOLEAN NOT NULL DEFAULT false,
    "possuiAcessibilidade" BOOLEAN NOT NULL DEFAULT false,
    "possuiCozinha" BOOLEAN NOT NULL DEFAULT false,
    "fotoAbrigo" TEXT,
    "solicitanteNome" TEXT NOT NULL,
    "solicitanteEmail" TEXT NOT NULL,
    "solicitanteTelefone" VARCHAR(15),
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'pendente',
    "motivoRecusa" TEXT,
    "analisadoPorId" INTEGER,
    "dataAnalise" TIMESTAMP(3),
    "abrigo_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_abrigo_pkey" PRIMARY KEY ("id_solicitacao")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitacao_abrigo_abrigo_id_key" ON "solicitacao_abrigo"("abrigo_id");

-- CreateIndex
CREATE INDEX "solicitacao_abrigo_status_idx" ON "solicitacao_abrigo"("status");

-- CreateIndex
CREATE INDEX "solicitacao_abrigo_created_at_idx" ON "solicitacao_abrigo"("created_at");

-- AddForeignKey
ALTER TABLE "solicitacao_abrigo" ADD CONSTRAINT "solicitacao_abrigo_analisadoPorId_fkey" FOREIGN KEY ("analisadoPorId") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_abrigo" ADD CONSTRAINT "solicitacao_abrigo_abrigo_id_fkey" FOREIGN KEY ("abrigo_id") REFERENCES "abrigo"("id_abrigo") ON DELETE SET NULL ON UPDATE CASCADE;
