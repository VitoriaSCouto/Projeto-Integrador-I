// Simula conversas do WhatsApp chamando o handleMessage do bot de verdade,
// sem abrir o WhatsApp: as mensagens são objetos falsos e as respostas do
// bot aparecem no terminal (🤖). No fim, envia a fila de alertas para um
// "cliente WhatsApp" falso.
//
// Pré-requisitos (na pasta Backend, em terminais separados):
//   npm run banco:teste   e   npm run back:teste
//   e rode ANTES o  npm run teste:api  (ele cadastra cidade, bairros e inscritos)
// Depois, na pasta ChatBot:
//   npm run teste:conversa
process.env.API_URL = process.env.API_URL || 'http://127.0.0.1:3000'
process.env.BOT_API_KEY = 'chave-de-teste'
process.env.NOTIFICACOES_PAUSA_MS = '10'

// Trava de segurança: só roda contra a API em MODO TESTE (a API real recusa a chave de teste)
{
  const r = await fetch(`${process.env.API_URL}/api/bot/inscritos/verificacao-modo-teste`, { headers: { 'x-bot-key': 'chave-de-teste' } })
  if (r.status !== 404) {
    console.error(`✗ A API em ${process.env.API_URL} NÃO está em modo teste (resposta ${r.status}). Use npm run back:teste no Backend.`)
    process.exit(1)
  }
}

// import dinâmico: as variáveis acima precisam existir antes de carregar o bot
const { handleMessage } = await import('../controllers/message-controller.js')
const { iniciarEnvioDeNotificacoes } = await import('../services/notificacao-service.js')

const FOTO_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function mensagem(from, body, extra = {}) {
  return {
    from, body, hasMedia: false, author: extra.author,
    reply: async (t) => console.log(`   🤖 ${t.replace(/\n/g, '\n      ')}`),
    getContact: async () => ({ number: from.split('@')[0] }),
    downloadMedia: async () => ({ data: FOTO_PNG, mimetype: 'image/png' }),
    getChat: async () => ({ isGroup: true, participants: [{ id: { _serialized: 'adm@c.us', user: 'adm' }, isAdmin: true }] }),
    ...extra,
  }
}

async function diz(from, body, extra) {
  console.log(`\n👤 [${from.split('@')[0]}] ${extra?.hasMedia ? '<FOTO>' : body}`)
  await handleMessage(mensagem(from, body, extra), null)
}

const eu = '5512988887777@c.us'
await diz(eu, 'Oi')
await diz(eu, '5')            // relatar sem inscrição → convite
await diz(eu, '1')            // quero me inscrever
await diz(eu, 'Maria Teste')
await diz(eu, 'email-errado')
await diz(eu, 'maria@teste.com')
await diz(eu, '1')            // cidade
await diz(eu, 'indep')        // bairro por parte do nome
await diz(eu, '2')            // acompanhar outro bairro
await diz(eu, '1')            // cidade
await diz(eu, '0')            // não achei → CEP
await diz(eu, '12070-610')
await diz(eu, '1')            // confirma bairro do CEP
await diz(eu, '1')            // relatar
await diz(eu, '2')            // local: bairro acompanhado
await diz(eu, '1')            // alagamento
await diz(eu, '1')            // grave
await diz(eu, 'olha lá')      // texto em vez de foto
await diz(eu, '', { hasMedia: true })
await diz(eu, '1')            // enviar
await diz(eu, 'menu')         // comando global
await diz(eu, '3')            // abrigos via API

// Grupo
await diz('120363999@g.us', 'bom dia pessoal')   // ignorado
await diz('120363999@g.us', '!alertas id')
await diz('120363999@g.us', '!alertas vincular Taubate', { author: 'comum@c.us' })
await diz('120363999@g.us', '!alertas vincular Taubate', { author: 'adm@c.us' })

// Envio da fila com um cliente falso
console.log('\n===== ENVIO DA FILA =====')
const enviados = []
const clienteFalso = {
  sendMessage: async (destino, conteudo, opcoes) => {
    if (destino.startsWith('551100000002')) throw new Error('número inválido (simulado)')
    enviados.push(destino)
    console.log(`   📤 ${destino} ${typeof conteudo === 'string' ? '(texto)' : '(foto + legenda)'} ${opcoes?.caption ? '' : ''}`)
  }
}
iniciarEnvioDeNotificacoes(clienteFalso)
await new Promise(r => setTimeout(r, 4000))
console.log(`\nEnviadas: ${enviados.length}`)
process.exit(0)
