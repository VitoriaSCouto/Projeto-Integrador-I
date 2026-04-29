/*
  Warnings:

  - You are about to drop the column `criadoEm` on the `admin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admin" DROP COLUMN "criadoEm",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
