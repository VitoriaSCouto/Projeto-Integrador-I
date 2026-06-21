/*
  Warnings:

  - Added the required column `cep` to the `abrigo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "abrigo" ADD COLUMN     "cep" INTEGER NOT NULL;
