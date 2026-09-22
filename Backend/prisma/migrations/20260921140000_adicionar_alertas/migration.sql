-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('inundacao', 'deslizamento', 'tempestade', 'vento_forte', 'outro');

-- CreateEnum
CREATE TYPE "SeveridadeAlerta" AS ENUM ('baixa', 'moderada', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('rascunho', 'em_revisao', 'publicado', 'encerrado', 'cancelado');

-- CreateEnum
CREATE TYPE "AcaoHistoricoAlerta" AS ENUM ('criar', 'editar', 'enviar_revisao', 'devolver_rascunho', 'publicar', 'encerrar', 'cancelar');

-- CreateEnum
CREATE TYPE "CanalEntregaAlerta" AS ENUM ('email', 'sms', 'whatsapp');

-- CreateEnum
CREATE TYPE "StatusEntregaAlerta" AS ENUM ('pendente', 'enviada', 'falha', 'cancelada');

-- CreateTable
CREATE TABLE "alerta" (
    "id_alerta" SERIAL NOT NULL,
    "titulo" VARCHAR(140) NOT NULL,
    "descricao" TEXT NOT NULL,
    "orientacoes" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "severidade" "SeveridadeAlerta" NOT NULL,
    "status" "StatusAlerta" NOT NULL DEFAULT 'rascunho',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "inicioEm" TIMESTAMPTZ(3) NOT NULL,
    "expiraEm" TIMESTAMPTZ(3) NOT NULL,
    "publicadoEm" TIMESTAMPTZ(3),
    "fonteNome" VARCHAR(160) NOT NULL,
    "fonteUrl" VARCHAR(2048),
    "regiaoId" INTEGER NOT NULL,
    "criadoPorId" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateTable
CREATE TABLE "historico_alerta" (
    "id" SERIAL NOT NULL,
    "alertaId" INTEGER NOT NULL,
    "atorId" INTEGER NOT NULL,
    "acao" "AcaoHistoricoAlerta" NOT NULL,
    "observacao" TEXT,
    "versao" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricao_alerta" (
    "id" SERIAL NOT NULL,
    "regiaoId" INTEGER NOT NULL,
    "canal" "CanalEntregaAlerta" NOT NULL,
    "destino" VARCHAR(320) NOT NULL,
    "severidadeMinima" "SeveridadeAlerta" NOT NULL DEFAULT 'baixa',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "consentidoEm" TIMESTAMPTZ(3) NOT NULL,
    "canceladaEm" TIMESTAMPTZ(3),
    "cancelamentoTokenHash" VARCHAR(128),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inscricao_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrega_alerta" (
    "id" SERIAL NOT NULL,
    "alertaId" INTEGER NOT NULL,
    "inscricaoId" INTEGER NOT NULL,
    "versaoAlerta" INTEGER NOT NULL,
    "status" "StatusEntregaAlerta" NOT NULL DEFAULT 'pendente',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "proximaTentativaEm" TIMESTAMPTZ(3),
    "ultimaTentativaEm" TIMESTAMPTZ(3),
    "enviadaEm" TIMESTAMPTZ(3),
    "provedorReferencia" VARCHAR(255),
    "ultimoErro" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "entrega_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerta_status_inicioEm_expiraEm_idx" ON "alerta"("status", "inicioEm", "expiraEm");

-- CreateIndex
CREATE INDEX "alerta_regiaoId_status_idx" ON "alerta"("regiaoId", "status");

-- CreateIndex
CREATE INDEX "alerta_severidade_idx" ON "alerta"("severidade");

-- CreateIndex
CREATE INDEX "alerta_criadoPorId_idx" ON "alerta"("criadoPorId");

-- CreateIndex
CREATE INDEX "alerta_updated_at_idx" ON "alerta"("updated_at");

-- CreateIndex
CREATE INDEX "historico_alerta_alertaId_created_at_idx" ON "historico_alerta"("alertaId", "created_at");

-- CreateIndex
CREATE INDEX "historico_alerta_atorId_idx" ON "historico_alerta"("atorId");

-- CreateIndex
CREATE UNIQUE INDEX "historico_alerta_alertaId_versao_key" ON "historico_alerta"("alertaId", "versao");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_alerta_cancelamentoTokenHash_key" ON "inscricao_alerta"("cancelamentoTokenHash");

-- CreateIndex
CREATE INDEX "inscricao_alerta_regiaoId_ativa_severidadeMinima_idx" ON "inscricao_alerta"("regiaoId", "ativa", "severidadeMinima");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_alerta_regiaoId_canal_destino_key" ON "inscricao_alerta"("regiaoId", "canal", "destino");

-- CreateIndex
CREATE INDEX "entrega_alerta_status_proximaTentativaEm_idx" ON "entrega_alerta"("status", "proximaTentativaEm");

-- CreateIndex
CREATE INDEX "entrega_alerta_inscricaoId_idx" ON "entrega_alerta"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_alerta_alertaId_inscricaoId_versaoAlerta_key" ON "entrega_alerta"("alertaId", "inscricaoId", "versaoAlerta");

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_regiaoId_fkey" FOREIGN KEY ("regiaoId") REFERENCES "regiao"("id_regiao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_alerta" ADD CONSTRAINT "historico_alerta_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alerta"("id_alerta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_alerta" ADD CONSTRAINT "historico_alerta_atorId_fkey" FOREIGN KEY ("atorId") REFERENCES "admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricao_alerta" ADD CONSTRAINT "inscricao_alerta_regiaoId_fkey" FOREIGN KEY ("regiaoId") REFERENCES "regiao"("id_regiao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega_alerta" ADD CONSTRAINT "entrega_alerta_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alerta"("id_alerta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega_alerta" ADD CONSTRAINT "entrega_alerta_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricao_alerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

