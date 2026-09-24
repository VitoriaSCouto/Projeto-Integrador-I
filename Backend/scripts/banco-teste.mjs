// Banco de TESTE: um Postgres em memória (PGlite) com todas as migrações
// aplicadas, na porta 5433. Nada é gravado no Supabase.
//
// Uso (na pasta Backend):
//   npm run banco:teste         → já vem com dados de exemplo (para testar à mão)
//   npm run banco:teste:vazio   → começa vazio (exigido pelo npm run teste:api)
//
// Deixe este terminal aberto. Ao fechar (Ctrl+C), os dados somem — cada vez
// que você abre, o banco começa do zero.
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import bcrypt from 'bcrypt'
import fs from 'node:fs'
import path from 'node:path'

// Porta do banco de teste (mude com BANCO_TESTE_PORTA se a 5433 estiver ocupada)
const PORTA = Number(process.env.BANCO_TESTE_PORTA) || 5433
const VAZIO = process.argv.includes('--vazio')
const pastaMigracoes = path.join('prisma', 'migrations')

const db = new PGlite()
for (const migracao of fs.readdirSync(pastaMigracoes).filter(p => /^\d/.test(p)).sort()) {
  await db.exec(fs.readFileSync(path.join(pastaMigracoes, migracao, 'migration.sql'), 'utf8'))
}

// ─── Dados de exemplo ────────────────────────────────────────────────────────
async function criarDadosDeExemplo() {
  const um = async (sql, params) => (await db.query(sql, params)).rows[0]

  // Admin para entrar no painel
  await db.query(
    `INSERT INTO admin (nome, email, senha, cargo) VALUES ($1, $2, $3, 'Administrador')`,
    ['Admin Teste', 'adm@teste.com', await bcrypt.hash('123456', 10)]
  )

  const sp = await um(`SELECT id_estado FROM estado WHERE sigla = 'SP'`)

  const cidade = (nome) => um(
    `INSERT INTO cidade (nome, "estadoId") VALUES ($1, $2) RETURNING id_cidade`, [nome, sp.id_estado]
  ).then(c => c.id_cidade)

  const bairro = (nome, cidadeId, risco = 'baixo') => um(
    `INSERT INTO bairro (nome, "cidadeId", "nivelRisco") VALUES ($1, $2, $3) RETURNING id_bairro`, [nome, cidadeId, risco]
  ).then(b => b.id_bairro)

  const taubate = await cidade('Taubaté')
  const cacapava = await cidade('Caçapava')
  const pinda = await cidade('Pindamonhangaba')

  const centroTaubate = await bairro('Centro', taubate, 'alto')
  await bairro('Independência', taubate, 'medio')
  await bairro('Vila São José', taubate)
  await bairro('Centro', cacapava)
  await bairro('Centro', pinda)
  await bairro('Moreira César', pinda, 'alto')

  const abrigo = (nome, cep, endereco, tipo, total, ocupada, lat, lng, cidadeId) => um(
    `INSERT INTO abrigo (nome, cep, endereco, "tipoAbrigo", "capacidadeTotal", "capacidadeOcupada",
                         telefone, responsavel, latitude, longitude, "cidadeId")
     VALUES ($1, $2, $3, $4, $5, $6, '(12) 3600-0000', 'Maria Souza', $7, $8, $9) RETURNING id_abrigo`,
    [nome, cep, endereco, tipo, total, ocupada, lat, lng, cidadeId]
  ).then(a => a.id_abrigo)

  const escola = await abrigo('Escola Municipal Centro', '12010-000', 'Rua Quatro de Março, 100', 'Escola', 80, 12, -23.0262, -45.5553, taubate)
  await db.query(`UPDATE abrigo SET "bairroId" = $1 WHERE id_abrigo = $2`, [centroTaubate, escola])
  // Quase lotado (90%) → aparece em "Abrigos que precisam de ajuda" no painel do voluntário
  const ginasio = await abrigo('Ginásio Poliesportivo', '12281-000', 'Av. Brasil, 500', 'Ginásio', 80, 72, -23.1008, -45.7069, cacapava)

  // Voluntário para entrar no módulo do voluntário
  const voluntario = await um(
    `INSERT INTO voluntario (nome, email, senha, telefone, "dataNascimento", genero)
     VALUES ('Vitor Voluntário', 'voluntario@teste.com', $1, '(12) 99999-0000', '1995-05-20', 'masculino')
     RETURNING id_voluntario`,
    [await bcrypt.hash('123456', 10)]
  ).then(v => v.id_voluntario)

  // Solicitações de ajuda dos abrigos (criadas pelo admin id 1)
  const ajuda = (titulo, descricao, categoria, urgencia, status, abrigoId, voluntarioId = null) => um(
    `INSERT INTO solicitacao_ajuda (titulo, descricao, categoria, urgencia, status, "criadoPorId", "abrigoId", "voluntarioId", updated_at)
     VALUES ($1, $2, $3, $4, $5, 1, $6, $7, now()) RETURNING id_solicitacao`,
    [titulo, descricao, categoria, urgencia, status, abrigoId, voluntarioId]
  ).then(s => s.id_solicitacao)

  const cobertores = await ajuda('Cobertores e colchões', 'Precisamos de 40 cobertores e 20 colchonetes.', 'doacao', 'alta', 'aberto', ginasio)
  await ajuda('Insulina e medicamentos de pressão', 'Três acolhidos com diabetes e hipertensão.', 'medicamento', 'critica', 'aberto', ginasio)
  await ajuda('Voluntários para a cozinha', 'Turno da noite, preparo do jantar.', 'voluntariado', 'media', 'em_andamento', escola, voluntario)
  await ajuda('Kits de higiene', 'Sabonete, escova e pasta de dente.', 'doacao', 'baixa', 'aberto', escola)
  await ajuda('Conserto do chuveiro', 'Vestiário masculino sem água quente.', 'infraestrutura', 'media', 'concluido', escola, voluntario)

  await db.query(
    `INSERT INTO solicitacao_ajuda_interesse ("solicitacaoId", "voluntarioId") VALUES ($1, $2)`,
    [cobertores, voluntario]
  )

  // Dois moradores do Centro de Taubaté já inscritos...
  const morador = (nome, numero) => um(
    `INSERT INTO inscrito_alerta (nome, email, "whatsappId", telefone, "bairroId", updated_at)
     VALUES ($1, $2, $3, $4, $5, now()) RETURNING id_inscrito`,
    [nome, `${nome.toLowerCase()}@teste.com`, `${numero}@c.us`, numero, centroTaubate]
  ).then(m => m.id_inscrito)

  const ana = await morador('Ana', '5512900000001')
  const bruno = await morador('Bruno', '5512900000002')

  // ...que já relataram um alagamento: falta 1 relato para o alerta disparar
  const alerta = await um(
    `INSERT INTO alerta (tipo, gravidade, "bairroId", updated_at)
     VALUES ('alagamento', 'grave', $1, now()) RETURNING id_alerta`, [centroTaubate]
  )
  for (const inscrito of [ana, bruno]) {
    await db.query(
      `INSERT INTO relato_alerta ("alertaId", "inscritoId", gravidade) VALUES ($1, $2, 'grave')`,
      [alerta.id_alerta, inscrito]
    )
  }
}

if (!VAZIO) await criarDadosDeExemplo()

// maxConnections: cada arquivo de rota abre a própria conexão (um PrismaClient por arquivo)
const servidor = new PGLiteSocketServer({ db, port: PORTA, host: '127.0.0.1', maxConnections: 50 })
try {
  await servidor.start()
} catch (erro) {
  if (erro.code === 'EADDRINUSE') {
    console.error(`✗ A porta ${PORTA} já está em uso — provavelmente já existe um banco de teste aberto em outro terminal.`)
    console.error('  Feche-o (Ctrl + C no terminal dele) ou use outra porta:')
    console.error('  $env:BANCO_TESTE_PORTA=5434; npm run banco:teste')
    process.exit(1)
  }
  throw erro
}

console.log(`Banco de teste pronto em postgresql://127.0.0.1:${PORTA} (em memória)`)

if (VAZIO) {
  console.log('Banco VAZIO (para o npm run teste:api).')
} else {
  console.log(`
Dados de exemplo criados:
  • Painel admin:      adm@teste.com / senha 123456   (http://localhost:5173/login-adm)
  • Painel voluntário: voluntario@teste.com / 123456  (http://localhost:5173/login-voluntario)
  • Cidades: Taubaté, Caçapava e Pindamonhangaba (SP), com bairros
  • Abrigos: Escola Municipal Centro (Taubaté) e Ginásio Poliesportivo (Caçapava, 90% ocupado)
  • 5 solicitações de ajuda (doação, medicamento, voluntariado, infraestrutura)
  • Moradores inscritos no Centro de Taubaté: Ana (5512900000001) e Bruno (5512900000002)
  • Alerta de alagamento no Centro de Taubaté com 2 de 3 relatos
    → inscreva-se no Centro de Taubaté pelo bot e relate um alagamento: o seu relato dispara o alerta`)
}
console.log('\nAgora, em outro terminal: npm run back:teste')
