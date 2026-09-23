// Exporta todas as tabelas do banco para arquivos JSON (um por tabela)
//
// Uso (na pasta Backend):  node scripts/backup-banco.mjs
// Saída: Backend/backups/<data-hora>/<tabela>.json
//
// A pasta backups/ está no .gitignore — ela tem dados pessoais
// (CPF, telefones, hashes de senha). Não envie para o GitHub.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

const pasta = path.join('backups', new Date().toISOString().replace(/[:.]/g, '-'))
fs.mkdirSync(pasta, { recursive: true })

const tabelas = await prisma.$queryRaw`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name`

let total = 0
for (const { table_name: tabela } of tabelas) {
  // json_agg converte cada linha em JSON no próprio Postgres (datas, enums etc.)
  const [{ linhas }] = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(json_agg(t), '[]'::json) AS linhas FROM "${tabela}" t`
  )
  fs.writeFileSync(path.join(pasta, `${tabela}.json`), JSON.stringify(linhas, null, 2))
  console.log(`${tabela.padEnd(30)} ${linhas.length} linha(s)`)
  total += linhas.length
}

console.log(`\nBackup salvo em ${pasta} (${tabelas.length} tabelas, ${total} linhas)`)
await prisma.$disconnect()
