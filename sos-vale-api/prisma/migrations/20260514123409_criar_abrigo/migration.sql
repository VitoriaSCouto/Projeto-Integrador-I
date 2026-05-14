/*
  Warnings:

  - You are about to drop the column `possuiAgua` on the `abrigo` table. All the data in the column will be lost.
  - You are about to drop the column `possuiEnergia` on the `abrigo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "abrigo" DROP COLUMN "possuiAgua",
DROP COLUMN "possuiEnergia";
