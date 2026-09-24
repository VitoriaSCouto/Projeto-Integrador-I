// Ensaia as migrações numa CÓPIA do banco, sem tocar no Supabase
//
// Uso (na pasta Backend):
//   node scripts/backup-banco.mjs                          ← gera o backup
//   node scripts/ensaiar-migracao.mjs backups/<pasta>      ← ensaia com ele
//
// Como funciona:
//   1. Cria um Postgres em memória (PGlite)
//   2. Aplica as migrações que o banco real JÁ tem (lidas de _prisma_migrations.json)
//   3. Carrega os dados do backup
//   4. Aplica as migrações pendentes e mostra o resultado
// Se algo der errado aqui, daria errado no banco real também — e nada foi alterado.
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'

const pastaBackup = process.argv[2]
if (!pastaBackup) {
  console.error('Informe a pasta do backup. Ex: node scripts/ensaiar-migracao.mjs backups/2026-09-23T13-24-45-361Z')
  process.exit(1)
}

const pastaMigracoes = path.join('prisma', 'migrations')
const lerBackup = (tabela) => JSON.parse(fs.readFileSync(path.join(pastaBackup, `${tabela}.json`), 'utf8'))

const aplicadas = new Set(lerBackup('_prisma_migrations').filter(m => m.finished_at).map(m => m.migration_name))
const todas = fs.readdirSync(pastaMigracoes).filter(p => /^\d/.test(p)).sort()
const pendentes = todas.filter(m => !aplicadas.has(m))

const db = new PGlite()

// 1-2. Estrutura igual à do banco real
for (const migracao of todas.filter(m => aplicadas.has(m))) {
  await db.exec(fs.readFileSync(path.join(pastaMigracoes, migracao, 'migration.sql'), 'utf8'))
}
console.log(`Migrações já aplicadas no banco real: ${aplicadas.size}`)

// 3. Dados do backup (FKs desligadas durante a carga para não depender da ordem)
await db.exec(`SET session_replication_role = replica`)
const contagemAntes = {}
for (const arquivo of fs.readdirSync(pastaBackup)) {
  const tabela = path.basename(arquivo, '.json')
  if (tabela === '_prisma_migrations') continue
  const linhas = lerBackup(tabela)
  contagemAntes[tabela] = linhas.length
  // Algumas migrações já inserem dados (ex: os 27 estados): limpa a tabela
  // para ficar exatamente igual ao backup
  await db.exec(`DELETE FROM "${tabela}"`)
  if (linhas.length === 0) continue
  await db.query(
    `INSERT INTO "${tabela}" SELECT * FROM json_populate_recordset(null::"${tabela}", $1::json)`,
    [JSON.stringify(linhas)]
  )
}
await db.exec(`SET session_replication_role = DEFAULT`)
console.log('Dados carregados:', contagemAntes)

// 4. Migrações pendentes
if (pendentes.length === 0) {
  console.log('\nNenhuma migração pendente.')
  process.exit(0)
}

for (const migracao of pendentes) {
  await db.exec(fs.readFileSync(path.join(pastaMigracoes, migracao, 'migration.sql'), 'utf8'))
  console.log(`✓ aplicada no ensaio: ${migracao}`)
}

// Resultado — confira se cidades, bairros e vínculos fazem sentido
const mostrar = async (titulo, sql) => {
  console.log(`\n${titulo}`)
  console.table((await db.query(sql)).rows)
}

const existe = async (tabela) => (await db.query(`SELECT to_regclass('public."${tabela}"') AS t`)).rows[0].t !== null

if (await existe('cidade')) {
  await mostrar('Cidades', `SELECT c.id_cidade, c.nome, e.sigla FROM cidade c JOIN estado e ON e.id_estado = c."estadoId" ORDER BY 1`)
  await mostrar('Bairros', `SELECT b.id_bairro, b.nome, c.nome AS cidade, b."nivelRisco" FROM bairro b JOIN cidade c ON c.id_cidade = b."cidadeId" ORDER BY 1`)
  await mostrar('Abrigos', `SELECT a.id_abrigo, a.nome, c.nome AS cidade, b.nome AS bairro FROM abrigo a JOIN cidade c ON c.id_cidade = a."cidadeId" LEFT JOIN bairro b ON b.id_bairro = a."bairroId" ORDER BY 1`)
  await mostrar('Solicitações de abrigo', `SELECT s.id_solicitacao, s.nome, c.nome AS cidade, b.nome AS bairro FROM solicitacao_abrigo s JOIN cidade c ON c.id_cidade = s."cidadeId" LEFT JOIN bairro b ON b.id_bairro = s."bairroId" ORDER BY 1`)
}

// Nenhuma linha das tabelas que continuam existindo pode ter sumido
let perdeu = false
for (const [tabela, antes] of Object.entries(contagemAntes)) {
  if (!(await existe(tabela))) continue
  const depois = Number((await db.query(`SELECT count(*) AS n FROM "${tabela}"`)).rows[0].n)
  if (depois !== antes) {
    console.error(`✗ ${tabela}: ${antes} linha(s) antes, ${depois} depois`)
    perdeu = true
  }
}

console.log(perdeu ? '\n✗ ENSAIO COM PERDA DE DADOS — não aplique no banco real.' : '\n✓ Ensaio OK: nenhuma linha perdida.')
process.exit(perdeu ? 1 : 0)
