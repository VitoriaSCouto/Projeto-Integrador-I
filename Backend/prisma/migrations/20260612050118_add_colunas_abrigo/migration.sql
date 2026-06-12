/*
  Warnings:

  - You are about to drop the column `acessibilidade` on the `abrigo` table. All the data in the column will be lost.
  - You are about to drop the column `cozinha` on the `abrigo` table. All the data in the column will be lost.
  - You are about to drop the column `pets` on the `abrigo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "abrigo" DROP COLUMN "acessibilidade",
DROP COLUMN "cozinha",
DROP COLUMN "pets",
ADD COLUMN     "possuiAcessibilidade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiCozinha" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possuiPets" BOOLEAN NOT NULL DEFAULT false;
