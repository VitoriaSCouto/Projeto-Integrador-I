/*
  Warnings:

  - You are about to drop the `Deficiencia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VitimaDeficiencia" DROP CONSTRAINT "VitimaDeficiencia_id_deficiencia_fkey";

-- AlterTable
ALTER TABLE "Vitima" ADD COLUMN     "abrigoId" INTEGER;

-- AlterTable
ALTER TABLE "abrigo" ADD COLUMN     "regiaoId" INTEGER;

-- DropTable
DROP TABLE "Deficiencia";

-- CreateTable
CREATE TABLE "deficiencia" (
    "id_deficiencia" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "deficiencia_pkey" PRIMARY KEY ("id_deficiencia")
);

-- CreateTable
CREATE TABLE "voluntario" (
    "id_voluntario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" VARCHAR(14),
    "telefone" VARCHAR(15),
    "email" TEXT,
    "dataNascimento" DATE NOT NULL,
    "genero" TEXT NOT NULL,
    "habilidades" TEXT,
    "disponibilidade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abrigoId" INTEGER,

    CONSTRAINT "voluntario_pkey" PRIMARY KEY ("id_voluntario")
);

-- CreateTable
CREATE TABLE "doacao" (
    "id_doacao" SERIAL NOT NULL,
    "doadorNome" TEXT NOT NULL,
    "doadorTelefone" VARCHAR(15),
    "tipo" TEXT NOT NULL,
    "quantidade" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abrigoId" INTEGER,

    CONSTRAINT "doacao_pkey" PRIMARY KEY ("id_doacao")
);

-- CreateIndex
CREATE UNIQUE INDEX "deficiencia_nome_key" ON "deficiencia"("nome");

-- AddForeignKey
ALTER TABLE "abrigo" ADD CONSTRAINT "abrigo_regiaoId_fkey" FOREIGN KEY ("regiaoId") REFERENCES "regiao"("id_regiao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vitima" ADD CONSTRAINT "Vitima_abrigoId_fkey" FOREIGN KEY ("abrigoId") REFERENCES "abrigo"("id_abrigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitimaDeficiencia" ADD CONSTRAINT "VitimaDeficiencia_id_deficiencia_fkey" FOREIGN KEY ("id_deficiencia") REFERENCES "deficiencia"("id_deficiencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voluntario" ADD CONSTRAINT "voluntario_abrigoId_fkey" FOREIGN KEY ("abrigoId") REFERENCES "abrigo"("id_abrigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_abrigoId_fkey" FOREIGN KEY ("abrigoId") REFERENCES "abrigo"("id_abrigo") ON DELETE SET NULL ON UPDATE CASCADE;
