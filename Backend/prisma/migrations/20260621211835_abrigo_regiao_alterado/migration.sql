/*
  Warnings:

  - Added the required column `bairro` to the `abrigo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `abrigo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "abrigo" ADD COLUMN     "bairro" TEXT NOT NULL,
ADD COLUMN     "estado" TEXT NOT NULL,
ALTER COLUMN "responsavel" DROP NOT NULL,
ALTER COLUMN "cep" SET DATA TYPE TEXT;
