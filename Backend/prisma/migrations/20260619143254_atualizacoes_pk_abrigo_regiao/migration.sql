/*
  Warnings:

  - The primary key for the `abrigo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `abrigo` table. All the data in the column will be lost.
  - The primary key for the `regiao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `regiao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "abrigo" DROP CONSTRAINT "abrigo_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_abrigo" SERIAL NOT NULL,
ADD CONSTRAINT "abrigo_pkey" PRIMARY KEY ("id_abrigo");

-- AlterTable
ALTER TABLE "regiao" DROP CONSTRAINT "regiao_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_regiao" SERIAL NOT NULL,
ADD CONSTRAINT "regiao_pkey" PRIMARY KEY ("id_regiao");
