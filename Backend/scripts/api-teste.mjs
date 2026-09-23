// Sobe a API apontando para o banco de TESTE (npm run banco:teste),
// com chaves falsas — nunca usa o Supabase real.
//
// Uso (na pasta Backend):  npm run back:teste
//
// As variáveis são definidas ANTES de carregar o servidor; o dotenv e o
// Prisma não sobrescrevem variáveis que já existem, então o .env real é ignorado.
const PORTA_BANCO = Number(process.env.BANCO_TESTE_PORTA) || 5433
const URL_TESTE = `postgresql://postgres:postgres@127.0.0.1:${PORTA_BANCO}/postgres?sslmode=disable&connection_limit=1`

Object.assign(process.env, {
  DATABASE_URL: URL_TESTE,
  DIRECT_URL: URL_TESTE,
  JWT_SECRET: 'segredo-de-teste',
  BOT_API_KEY: 'chave-de-teste',
  // Supabase falso: uploads de foto falham e o sistema segue sem a foto
  SUPABASE_URL: 'http://127.0.0.1:9',
  SUPABASE_KEY: 'chave-falsa',
  PORT: process.env.PORT || '3000',
})

// Se a API normal já estiver aberta na mesma porta, avisa em vez de falhar calado
const porta = Number(process.env.PORT)
const emUso = await fetch(`http://127.0.0.1:${porta}/api/estados/listar`).then(() => true).catch(() => false)
if (emUso) {
  console.error(`✗ Já existe uma API rodando na porta ${porta} (provavelmente a normal, ligada ao Supabase).`)
  console.error('  Feche-a antes de rodar o modo teste.')
  process.exit(1)
}

console.log('⚠️  API em MODO TESTE (banco em memória na porta 5433, chave do bot: chave-de-teste)')
await import('../src/server.js')
