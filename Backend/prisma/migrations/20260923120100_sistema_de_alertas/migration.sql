-- ════════════════════════════════════════════════════════════════════
-- Sistema de alertas: inscritos, bairros acompanhados, alertas,
-- relatos dos moradores e fila de notificações do WhatsApp.
-- ════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('alagamento', 'deslizamento', 'arvore_caida', 'falta_energia', 'incendio', 'via_interditada', 'vendaval');

-- CreateEnum
CREATE TYPE "GravidadeAlerta" AS ENUM ('leve', 'medio', 'grave');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('em_verificacao', 'ativo', 'encerrado', 'cancelado');

-- CreateEnum
CREATE TYPE "EventoNotificacao" AS ENUM ('disparo', 'cancelamento');

-- CreateEnum
CREATE TYPE "DestinoNotificacao" AS ENUM ('inscrito', 'grupo');

-- CreateEnum
CREATE TYPE "StatusNotificacao" AS ENUM ('pendente', 'enviando', 'enviada', 'falha', 'cancelada');

-- CreateTable
CREATE TABLE "inscrito_alerta" (
    "id_inscrito" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "telefone" VARCHAR(20),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "bairroId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscrito_alerta_pkey" PRIMARY KEY ("id_inscrito")
);

-- CreateTable
CREATE TABLE "inscrito_bairro" (
    "inscritoId" INTEGER NOT NULL,
    "bairroId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscrito_bairro_pkey" PRIMARY KEY ("inscritoId","bairroId")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id_alerta" SERIAL NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "gravidade" "GravidadeAlerta" NOT NULL,
    "status" "StatusAlerta" NOT NULL DEFAULT 'em_verificacao',
    "bairroId" INTEGER NOT NULL,
    "disparadoEm" TIMESTAMP(3),
    "disparadoPorAdmin" BOOLEAN NOT NULL DEFAULT false,
    "analisadoPorId" INTEGER,
    "motivoCancelamento" TEXT,
    "finalizadoEm" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateTable
CREATE TABLE "relato_alerta" (
    "id_relato" SERIAL NOT NULL,
    "alertaId" INTEGER NOT NULL,
    "inscritoId" INTEGER,
    "gravidade" "GravidadeAlerta" NOT NULL,
    "fotoRelato" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relato_alerta_pkey" PRIMARY KEY ("id_relato")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id_notificacao" SERIAL NOT NULL,
    "alertaId" INTEGER NOT NULL,
    "evento" "EventoNotificacao" NOT NULL DEFAULT 'disparo',
    "tipoDestino" "DestinoNotificacao" NOT NULL,
    "destino" TEXT NOT NULL,
    "inscritoId" INTEGER,
    "cidadeId" INTEGER,
    "mensagem" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "status" "StatusNotificacao" NOT NULL DEFAULT 'pendente',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "enviadaEm" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id_notificacao")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscrito_alerta_whatsappId_key" ON "inscrito_alerta"("whatsappId");

-- CreateIndex
CREATE INDEX "inscrito_alerta_bairroId_idx" ON "inscrito_alerta"("bairroId");

-- CreateIndex
CREATE INDEX "alerta_bairroId_tipo_status_idx" ON "alerta"("bairroId", "tipo", "status");

-- CreateIndex
CREATE INDEX "alerta_status_idx" ON "alerta"("status");

-- CreateIndex
CREATE INDEX "alerta_created_at_idx" ON "alerta"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "relato_alerta_alertaId_inscritoId_key" ON "relato_alerta"("alertaId", "inscritoId");

-- CreateIndex
CREATE INDEX "notificacao_status_idx" ON "notificacao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_alertaId_evento_destino_key" ON "notificacao"("alertaId", "evento", "destino");

-- AddForeignKey
ALTER TABLE "inscrito_alerta" ADD CONSTRAINT "inscrito_alerta_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "bairro"("id_bairro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscrito_bairro" ADD CONSTRAINT "inscrito_bairro_inscritoId_fkey" FOREIGN KEY ("inscritoId") REFERENCES "inscrito_alerta"("id_inscrito") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscrito_bairro" ADD CONSTRAINT "inscrito_bairro_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "bairro"("id_bairro") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "bairro"("id_bairro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_analisadoPorId_fkey" FOREIGN KEY ("analisadoPorId") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relato_alerta" ADD CONSTRAINT "relato_alerta_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alerta"("id_alerta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relato_alerta" ADD CONSTRAINT "relato_alerta_inscritoId_fkey" FOREIGN KEY ("inscritoId") REFERENCES "inscrito_alerta"("id_inscrito") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alerta"("id_alerta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_inscritoId_fkey" FOREIGN KEY ("inscritoId") REFERENCES "inscrito_alerta"("id_inscrito") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_cidadeId_fkey" FOREIGN KEY ("cidadeId") REFERENCES "cidade"("id_cidade") ON DELETE SET NULL ON UPDATE CASCADE;
