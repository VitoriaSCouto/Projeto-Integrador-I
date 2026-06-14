/*
  Warnings:

  - Added the required column `cidade` to the `abrigo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "abrigo" ADD COLUMN     "cidade" TEXT NOT NULL,
ADD COLUMN     "possuiEnfermagem" BOOLEAN NOT NULL DEFAULT false;
