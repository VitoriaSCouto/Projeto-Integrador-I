-- CreateTable
CREATE TABLE "abrigo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT,
    "responsavel" TEXT NOT NULL,
    "tipoAbrigo" TEXT NOT NULL,
    "capacidadeTotal" INTEGER NOT NULL,
    "capacidadeOcupada" INTEGER NOT NULL DEFAULT 0,
    "possuiEnergia" BOOLEAN NOT NULL DEFAULT false,
    "possuiAgua" BOOLEAN NOT NULL DEFAULT false,
    "possuiAtendimentoMedico" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abrigo_pkey" PRIMARY KEY ("id")
);
