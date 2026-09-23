// Conversa interativa com o bot SEM abrir o WhatsApp
//
// Você digita as mensagens no terminal como se fosse um morador, e as
// respostas do bot aparecem logo abaixo. Usa o bot de verdade (mesmos
// fluxos), falando com a API em MODO TESTE.
//
// Pré-requisitos (pasta Backend, terminais separados):
//   npm run banco:teste   e   npm run back:teste
// Depois, na pasta ChatBot:
//   npm run teste:interativo
//
// Comandos especiais (começam com /):
//   /foto              envia uma foto falsa (para o relato de ocorrência)
//   /numero 5512...    troca de morador (cada número é uma pessoa diferente)
//   /grupo <texto>     envia <texto> num grupo, como admin do grupo (ex: /grupo !alertas vincular Taubaté)
//   /fila              "envia" os alertas que estão na fila e mostra para quem iriam
//   /sair              encerra
import readline from 'node:readline/promises'

process.env.API_URL = process.env.API_URL || 'http://127.0.0.1:3000'
process.env.BOT_API_KEY = 'chave-de-teste'

// Trava de segurança: só roda contra a API em MODO TESTE (a API real recusa a chave de teste)
{
  const r = await fetch(`${process.env.API_URL}/api/bot/inscritos/verificacao-modo-teste`, { headers: { 'x-bot-key': 'chave-de-teste' } })
    .catch(() => null)
  if (r?.status !== 404) {
    console.error(`✗ A API em ${process.env.API_URL} não está em modo teste (ou não está aberta). Use npm run back:teste no Backend.`)
    process.exit(1)
  }
}

const { handleMessage } = await import('../controllers/message-controller.js')
const { api } = await import('../services/api.js')

// PNG de 1x1 pixel — basta para o bot aceitar como foto
const FOTO_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const GRUPO = '120363000000000001@g.us'

let numero = '5512999990001'

// Mensagem falsa com o mesmo formato que o whatsapp-web.js entrega ao bot
function mensagem(from, body, { foto = false, author } = {}) {
  return {
    from, body, author, hasMedia: foto,
    reply: async (texto) => console.log('\n🤖 ' + texto.replace(/\n/g, '\n   ') + '\n'),
    getContact: async () => ({ number: from.split('@')[0] }),
    downloadMedia: async () => ({ data: FOTO_PNG, mimetype: 'image/png' }),
    // No grupo simulado, o morador atual é administrador
    getChat: async () => ({ isGroup: true, participants: [{ id: { _serialized: author, user: author?.split('@')[0] }, isAdmin: true }] }),
  }
}

// Mostra e marca como enviadas as notificações da fila (sem WhatsApp de verdade)
async function processarFila() {
  const { ok, dados } = await api('POST', '/bot/notificacoes/reservar', { limite: 50 })
  if (!ok) return console.log('✗ Erro ao ler a fila:', dados.mensagem)
  if (dados.notificacoes.length === 0) return console.log('\n📭 Fila vazia — nenhum alerta para enviar.\n')

  for (const n of dados.notificacoes) {
    console.log(`\n📤 Para ${n.tipoDestino === 'grupo' ? 'o GRUPO' : 'o morador'} ${n.destino.split('@')[0]} (${n.evento}):`)
    console.log('   ' + n.mensagem.replace(/\n/g, '\n   '))
    await api('PATCH', `/bot/notificacoes/${n.id_notificacao}`, { sucesso: true })
  }
  console.log(`\n✓ ${dados.notificacoes.length} mensagem(ns) "enviada(s)".\n`)
}

console.log(`Conversa de teste com o bot. Você é o número ${numero}.`)
console.log('Digite "oi" para começar. Comandos: /foto  /numero <n>  /grupo <texto>  /fila  /sair\n')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

while (true) {
  const linha = (await rl.question(`👤 [${numero}] `).catch(() => '/sair')).trim()
  if (!linha) continue

  try {
    if (linha === '/sair') break
    else if (linha === '/foto') await handleMessage(mensagem(`${numero}@c.us`, '', { foto: true }))
    else if (linha === '/fila') await processarFila()
    else if (linha.startsWith('/numero')) {
      const novo = linha.split(/\s+/)[1]?.replace(/\D/g, '')
      if (novo) { numero = novo; console.log(`\nAgora você é o morador ${numero}.\n`) }
      else console.log('\nUse: /numero 5512999990002\n')
    }
    else if (linha.startsWith('/grupo ')) await handleMessage(mensagem(GRUPO, linha.slice(7), { author: `${numero}@c.us` }))
    else await handleMessage(mensagem(`${numero}@c.us`, linha))
  } catch (erro) {
    console.error('✗ Erro:', erro.message)
  }
}

rl.close()
process.exit(0)
