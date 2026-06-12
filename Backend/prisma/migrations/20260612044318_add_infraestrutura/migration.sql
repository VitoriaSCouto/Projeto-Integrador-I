-- AlterTable
ALTER TABLE "abrigo" ADD COLUMN     "acessibilidade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cozinha" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pets" BOOLEAN NOT NULL DEFAULT false;
