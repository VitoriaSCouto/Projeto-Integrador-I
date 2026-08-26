/*
  Warnings:

  - You are about to drop the column `disponibilidade` on the `voluntario` table. All the data in the column will be lost.
  - You are about to drop the column `habilidades` on the `voluntario` table. All the data in the column will be lost.
  - You are about to drop the `deficiencia` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `voluntario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `senha` to the `voluntario` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `voluntario` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "VitimaDeficiencia" DROP CONSTRAINT "VitimaDeficiencia_id_deficiencia_fkey";

-- AlterTable
ALTER TABLE "doacao" ADD COLUMN     "voluntarioId" INTEGER;

-- AlterTable
ALTER TABLE "voluntario" DROP COLUMN "disponibilidade",
DROP COLUMN "habilidades",
ADD COLUMN     "senha" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "deficiencia";

-- CreateTable
CREATE TABLE "Deficiencia" (
    "id_deficiencia" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Deficiencia_pkey" PRIMARY KEY ("id_deficiencia")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deficiencia_nome_key" ON "Deficiencia"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "voluntario_email_key" ON "voluntario"("email");

-- AddForeignKey
ALTER TABLE "VitimaDeficiencia" ADD CONSTRAINT "VitimaDeficiencia_id_deficiencia_fkey" FOREIGN KEY ("id_deficiencia") REFERENCES "Deficiencia"("id_deficiencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "voluntario"("id_voluntario") ON DELETE SET NULL ON UPDATE CASCADE;
