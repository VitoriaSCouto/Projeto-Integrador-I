-- CreateTable
CREATE TABLE "Vitima" (
    "id_vitima" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT DEFAULT 'Ainda não informado',
    "telefone" TEXT DEFAULT 'Ainda não informado',
    "dataNascimento" DATE NOT NULL,
    "genero" TEXT NOT NULL,
    "fotoPerfil" BYTEA NOT NULL,

    CONSTRAINT "Vitima_pkey" PRIMARY KEY ("id_vitima")
);

-- CreateTable
CREATE TABLE "Deficiencia" (
    "id_deficiencia" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "Fisica" INTEGER NOT NULL,
    "Visual" INTEGER NOT NULL,
    "Auditiva" INTEGER NOT NULL,
    "Intelectual" INTEGER NOT NULL,
    "TEA" INTEGER NOT NULL,
    "Multipla" INTEGER NOT NULL,
    "Psicossocial" INTEGER NOT NULL,
    "Surdocegueira" INTEGER NOT NULL,
    "Nanismo" INTEGER NOT NULL,
    "ParalisiaCerebral" INTEGER NOT NULL,
    "MobilidadeReduzida" INTEGER NOT NULL,
    "DeficienciaDeFala" INTEGER NOT NULL,
    "TranstornoDeAprendizagem" INTEGER NOT NULL,
    "SindromeDeDown" INTEGER NOT NULL,
    "Epilepsia" INTEGER NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "Deficiencia_pkey" PRIMARY KEY ("id_deficiencia")
);

-- CreateTable
CREATE TABLE "VitimaDeficiencia" (
    "id_vitima" INTEGER NOT NULL,
    "id_deficiencia" INTEGER NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "VitimaDeficiencia_pkey" PRIMARY KEY ("id_vitima","id_deficiencia")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vitima_telefone_key" ON "Vitima"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Deficiencia_nome_key" ON "Deficiencia"("nome");

-- AddForeignKey
ALTER TABLE "VitimaDeficiencia" ADD CONSTRAINT "VitimaDeficiencia_id_vitima_fkey" FOREIGN KEY ("id_vitima") REFERENCES "Vitima"("id_vitima") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitimaDeficiencia" ADD CONSTRAINT "VitimaDeficiencia_id_deficiencia_fkey" FOREIGN KEY ("id_deficiencia") REFERENCES "Deficiencia"("id_deficiencia") ON DELETE RESTRICT ON UPDATE CASCADE;
