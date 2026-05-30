-- CreateTable
CREATE TABLE "regiao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "populacaoEstimada" INTEGER,
    "areaKm2" DOUBLE PRECISION,
    "nivelRisco" TEXT NOT NULL DEFAULT 'baixo',
    "statusAlerta" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regiao_pkey" PRIMARY KEY ("id")
);
