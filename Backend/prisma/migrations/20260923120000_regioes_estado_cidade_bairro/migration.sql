-- ════════════════════════════════════════════════════════════════════
-- Reformulação das regiões: ESTADO → CIDADE → BAIRRO
--
-- Antes: tabela "regiao" (bairro + cidade + estado em texto) e abrigos /
-- solicitações de abrigo guardando cidade, estado e bairro em texto.
-- Agora: tabelas estado, cidade e bairro, e abrigo / solicitacao_abrigo
-- apontam para elas por chave estrangeira.
--
-- Os dados existentes são convertidos (nada é descartado):
--   • estados: os 27 estados brasileiros são cadastrados;
--   • cidades: criadas a partir das cidades usadas em regiao, abrigo e
--     solicitacao_abrigo (sem diferenciar maiúsculas/minúsculas);
--   • bairros: criados a partir de regiao (mantendo população, área e
--     risco) e dos bairros digitados em abrigo / solicitacao_abrigo;
--   • estado em texto que não bater com sigla ou nome → SP;
--   • cidade vazia → cidade "Não informada" (SP), para revisão manual.
-- ════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "NivelRisco" AS ENUM ('baixo', 'medio', 'alto', 'critico');

-- CreateTable
CREATE TABLE "estado" (
    "id_estado" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" VARCHAR(2) NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "cidade" (
    "id_cidade" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "estadoId" INTEGER NOT NULL,
    "grupoWhatsappId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cidade_pkey" PRIMARY KEY ("id_cidade")
);

-- CreateTable
CREATE TABLE "bairro" (
    "id_bairro" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cidadeId" INTEGER NOT NULL,
    "populacaoEstimada" INTEGER,
    "areaKm2" DOUBLE PRECISION,
    "nivelRisco" "NivelRisco" NOT NULL DEFAULT 'baixo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bairro_pkey" PRIMARY KEY ("id_bairro")
);

-- CreateIndex
CREATE UNIQUE INDEX "estado_sigla_key" ON "estado"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "cidade_nome_estadoId_key" ON "cidade"("nome", "estadoId");

-- CreateIndex
CREATE UNIQUE INDEX "bairro_nome_cidadeId_key" ON "bairro"("nome", "cidadeId");

-- AddForeignKey
ALTER TABLE "cidade" ADD CONSTRAINT "cidade_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "estado"("id_estado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bairro" ADD CONSTRAINT "bairro_cidadeId_fkey" FOREIGN KEY ("cidadeId") REFERENCES "cidade"("id_cidade") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─── Dados: estados ─────────────────────────────────────────────────
INSERT INTO "estado" ("sigla", "nome") VALUES
  ('AC', 'Acre'), ('AL', 'Alagoas'), ('AP', 'Amapá'), ('AM', 'Amazonas'),
  ('BA', 'Bahia'), ('CE', 'Ceará'), ('DF', 'Distrito Federal'),
  ('ES', 'Espírito Santo'), ('GO', 'Goiás'), ('MA', 'Maranhão'),
  ('MT', 'Mato Grosso'), ('MS', 'Mato Grosso do Sul'), ('MG', 'Minas Gerais'),
  ('PA', 'Pará'), ('PB', 'Paraíba'), ('PR', 'Paraná'), ('PE', 'Pernambuco'),
  ('PI', 'Piauí'), ('RJ', 'Rio de Janeiro'), ('RN', 'Rio Grande do Norte'),
  ('RS', 'Rio Grande do Sul'), ('RO', 'Rondônia'), ('RR', 'Roraima'),
  ('SC', 'Santa Catarina'), ('SP', 'São Paulo'), ('SE', 'Sergipe'),
  ('TO', 'Tocantins');


-- ─── Funções temporárias (existem só durante esta migração) ─────────

-- Estado em texto ("SP" ou "São Paulo") → id_estado. Sem correspondência → SP.
CREATE FUNCTION pg_temp.sos_estado_id(p_estado TEXT) RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT e."id_estado" FROM "estado" e
      WHERE e."sigla" = upper(trim(p_estado))
         OR lower(e."nome") = lower(trim(p_estado))
      LIMIT 1),
    (SELECT e."id_estado" FROM "estado" e WHERE e."sigla" = 'SP')
  )
$$ LANGUAGE sql STABLE;

-- Cidade vazia vira "Não informada"
CREATE FUNCTION pg_temp.sos_nome_cidade(p_cidade TEXT) RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(trim(p_cidade), ''), 'Não informada')
$$ LANGUAGE sql IMMUTABLE;

-- (cidade, estado) em texto → id_cidade
CREATE FUNCTION pg_temp.sos_cidade_id(p_cidade TEXT, p_estado TEXT) RETURNS INTEGER AS $$
  SELECT c."id_cidade" FROM "cidade" c
  WHERE lower(c."nome") = lower(pg_temp.sos_nome_cidade(p_cidade))
    AND c."estadoId" = pg_temp.sos_estado_id(p_estado)
  LIMIT 1
$$ LANGUAGE sql STABLE;

-- (bairro em texto, id_cidade) → id_bairro
CREATE FUNCTION pg_temp.sos_bairro_id(p_bairro TEXT, p_cidade_id INTEGER) RETURNS INTEGER AS $$
  SELECT b."id_bairro" FROM "bairro" b
  WHERE lower(b."nome") = lower(trim(p_bairro))
    AND b."cidadeId" = p_cidade_id
  LIMIT 1
$$ LANGUAGE sql STABLE;


-- ─── Dados: cidades ─────────────────────────────────────────────────
INSERT INTO "cidade" ("nome", "estadoId")
SELECT DISTINCT ON (lower(o.nome), o.estado_id) o.nome, o.estado_id
FROM (
  SELECT pg_temp.sos_nome_cidade(r."cidade") AS nome, pg_temp.sos_estado_id(r."estado") AS estado_id FROM "regiao" r
  UNION ALL
  SELECT pg_temp.sos_nome_cidade(a."cidade"), pg_temp.sos_estado_id(a."estado") FROM "abrigo" a
  UNION ALL
  SELECT pg_temp.sos_nome_cidade(s."cidade"), pg_temp.sos_estado_id(s."estado") FROM "solicitacao_abrigo" s
) o
ORDER BY lower(o.nome), o.estado_id, o.nome;


-- ─── Dados: bairros vindos da antiga tabela regiao ──────────────────
INSERT INTO "bairro" ("nome", "cidadeId", "populacaoEstimada", "areaKm2", "nivelRisco", "created_at")
SELECT DISTINCT ON (lower(trim(r."bairro")), pg_temp.sos_cidade_id(r."cidade", r."estado"))
  trim(r."bairro"),
  pg_temp.sos_cidade_id(r."cidade", r."estado"),
  r."populacaoEstimada",
  r."areaKm2",
  (CASE lower(trim(r."nivelRisco"))
     WHEN 'medio'   THEN 'medio'
     WHEN 'médio'   THEN 'medio'
     WHEN 'alto'    THEN 'alto'
     WHEN 'critico' THEN 'critico'
     WHEN 'crítico' THEN 'critico'
     ELSE 'baixo'
   END)::"NivelRisco",
  r."created_at"
FROM "regiao" r
WHERE trim(r."bairro") <> ''
ORDER BY lower(trim(r."bairro")), pg_temp.sos_cidade_id(r."cidade", r."estado"), r."id_regiao";


-- ─── Dados: bairros digitados em abrigos / solicitações ─────────────
INSERT INTO "bairro" ("nome", "cidadeId")
SELECT DISTINCT ON (lower(o.nome), o.cidade_id) o.nome, o.cidade_id
FROM (
  SELECT trim(a."bairro") AS nome, pg_temp.sos_cidade_id(a."cidade", a."estado") AS cidade_id FROM "abrigo" a
  UNION ALL
  SELECT trim(s."bairro"), pg_temp.sos_cidade_id(s."cidade", s."estado") FROM "solicitacao_abrigo" s
) o
WHERE o.nome IS NOT NULL
  AND o.nome <> ''
  AND pg_temp.sos_bairro_id(o.nome, o.cidade_id) IS NULL
ORDER BY lower(o.nome), o.cidade_id, o.nome;


-- ─── Abrigo: texto → chaves estrangeiras ────────────────────────────
ALTER TABLE "abrigo" ADD COLUMN "cidadeId" INTEGER,
ADD COLUMN "bairroId" INTEGER;

UPDATE "abrigo" a SET "cidadeId" = pg_temp.sos_cidade_id(a."cidade", a."estado");

-- O bairro vem da região vinculada (se houver) ou do bairro digitado
UPDATE "abrigo" a SET "bairroId" = COALESCE(
  (SELECT pg_temp.sos_bairro_id(r."bairro", pg_temp.sos_cidade_id(r."cidade", r."estado"))
     FROM "regiao" r WHERE r."id_regiao" = a."regiaoId"),
  pg_temp.sos_bairro_id(a."bairro", a."cidadeId")
);

ALTER TABLE "abrigo" ALTER COLUMN "cidadeId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "abrigo" DROP CONSTRAINT "abrigo_regiaoId_fkey";

-- AlterTable
ALTER TABLE "abrigo" DROP COLUMN "bairro",
DROP COLUMN "cidade",
DROP COLUMN "estado",
DROP COLUMN "regiaoId";


-- ─── Solicitação de abrigo: texto → chaves estrangeiras ─────────────
ALTER TABLE "solicitacao_abrigo" ADD COLUMN "cidadeId" INTEGER,
ADD COLUMN "bairroId" INTEGER;

UPDATE "solicitacao_abrigo" s SET "cidadeId" = pg_temp.sos_cidade_id(s."cidade", s."estado");
UPDATE "solicitacao_abrigo" s SET "bairroId" = pg_temp.sos_bairro_id(s."bairro", s."cidadeId");

ALTER TABLE "solicitacao_abrigo" ALTER COLUMN "cidadeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "solicitacao_abrigo" DROP COLUMN "bairro",
DROP COLUMN "cidade",
DROP COLUMN "estado";


-- ─── Remove a tabela antiga ─────────────────────────────────────────
-- DropTable
DROP TABLE "regiao";

DROP FUNCTION pg_temp.sos_bairro_id(TEXT, INTEGER);
DROP FUNCTION pg_temp.sos_cidade_id(TEXT, TEXT);
DROP FUNCTION pg_temp.sos_nome_cidade(TEXT);
DROP FUNCTION pg_temp.sos_estado_id(TEXT);


-- AddForeignKey
ALTER TABLE "abrigo" ADD CONSTRAINT "abrigo_cidadeId_fkey" FOREIGN KEY ("cidadeId") REFERENCES "cidade"("id_cidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abrigo" ADD CONSTRAINT "abrigo_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "bairro"("id_bairro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_abrigo" ADD CONSTRAINT "solicitacao_abrigo_cidadeId_fkey" FOREIGN KEY ("cidadeId") REFERENCES "cidade"("id_cidade") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_abrigo" ADD CONSTRAINT "solicitacao_abrigo_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "bairro"("id_bairro") ON DELETE SET NULL ON UPDATE CASCADE;
