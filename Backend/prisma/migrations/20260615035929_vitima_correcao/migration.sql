/*
  Warnings:

  - The primary key for the `Vitima` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Vitima` table. All the data in the column will be lost.
  - The primary key for the `VitimaDeficiencia` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `VitimaDeficiencia` table. All the data in the column will be lost.
  - Added the required column `id_vitima` to the `VitimaDeficiencia` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VitimaDeficiencia" DROP CONSTRAINT "VitimaDeficiencia_id_fkey";

-- AlterTable
ALTER TABLE "Vitima" DROP CONSTRAINT "Vitima_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_vitima" SERIAL NOT NULL,
ADD CONSTRAINT "Vitima_pkey" PRIMARY KEY ("id_vitima");

-- AlterTable
ALTER TABLE "VitimaDeficiencia" DROP CONSTRAINT "VitimaDeficiencia_pkey",
DROP COLUMN "id",
ADD COLUMN     "id_vitima" INTEGER NOT NULL,
ADD CONSTRAINT "VitimaDeficiencia_pkey" PRIMARY KEY ("id_vitima", "id_deficiencia");

-- AddForeignKey
ALTER TABLE "VitimaDeficiencia" ADD CONSTRAINT "VitimaDeficiencia_id_vitima_fkey" FOREIGN KEY ("id_vitima") REFERENCES "Vitima"("id_vitima") ON DELETE RESTRICT ON UPDATE CASCADE;
