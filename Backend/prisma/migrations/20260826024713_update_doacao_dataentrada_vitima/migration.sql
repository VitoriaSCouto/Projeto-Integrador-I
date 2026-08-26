/*
  Warnings:

  - You are about to drop the column `doadorNome` on the `doacao` table. All the data in the column will be lost.
  - You are about to drop the column `doadorTelefone` on the `doacao` table. All the data in the column will be lost.
  - Changed the type of `quantidade` on the `doacao` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `abrigoId` on table `doacao` required. This step will fail if there are existing NULL values in that column.
  - Made the column `voluntarioId` on table `doacao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "doacao" DROP CONSTRAINT "doacao_abrigoId_fkey";

-- DropForeignKey
ALTER TABLE "doacao" DROP CONSTRAINT "doacao_voluntarioId_fkey";

-- AlterTable
ALTER TABLE "Vitima" ADD COLUMN     "dataEntrada" DATE;

-- AlterTable
ALTER TABLE "doacao" DROP COLUMN "doadorNome",
DROP COLUMN "doadorTelefone",
DROP COLUMN "quantidade",
ADD COLUMN     "quantidade" INTEGER NOT NULL,
ALTER COLUMN "abrigoId" SET NOT NULL,
ALTER COLUMN "voluntarioId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_abrigoId_fkey" FOREIGN KEY ("abrigoId") REFERENCES "abrigo"("id_abrigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "voluntario"("id_voluntario") ON DELETE RESTRICT ON UPDATE CASCADE;
