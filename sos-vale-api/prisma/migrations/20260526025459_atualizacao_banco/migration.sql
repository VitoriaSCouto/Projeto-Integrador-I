/*
  Warnings:

  - You are about to drop the column `Auditiva` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `DeficienciaDeFala` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Epilepsia` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Fisica` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Intelectual` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `MobilidadeReduzida` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Multipla` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Nanismo` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `ParalisiaCerebral` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Psicossocial` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `SindromeDeDown` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Surdocegueira` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `TEA` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `TranstornoDeAprendizagem` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `Visual` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Deficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `observacao` on the `VitimaDeficiencia` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `regiao` table. All the data in the column will be lost.
  - Added the required column `bairro` to the `regiao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deficiencia" DROP COLUMN "Auditiva",
DROP COLUMN "DeficienciaDeFala",
DROP COLUMN "Epilepsia",
DROP COLUMN "Fisica",
DROP COLUMN "Intelectual",
DROP COLUMN "MobilidadeReduzida",
DROP COLUMN "Multipla",
DROP COLUMN "Nanismo",
DROP COLUMN "ParalisiaCerebral",
DROP COLUMN "Psicossocial",
DROP COLUMN "SindromeDeDown",
DROP COLUMN "Surdocegueira",
DROP COLUMN "TEA",
DROP COLUMN "TranstornoDeAprendizagem",
DROP COLUMN "Visual",
DROP COLUMN "descricao";

-- AlterTable
ALTER TABLE "Vitima" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "fotoPerfil" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VitimaDeficiencia" DROP COLUMN "observacao";

-- AlterTable
ALTER TABLE "regiao" DROP COLUMN "nome",
ADD COLUMN     "bairro" TEXT NOT NULL;
