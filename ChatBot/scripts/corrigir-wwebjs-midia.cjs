// Correção para o envio de mídia do whatsapp-web.js 1.34.7
//
// Desde a atualização do WhatsApp Web de 17/09/2026, TODO envio de imagem,
// vídeo, áudio ou documento falha com:
//   "Data passed to getter must include an id property (it's how we memoize)"
// (texto continua funcionando).
//
// Causa: ao montar a mensagem, o whatsapp-web.js espalha o modelo de mídia
// (...mediaOptions), que carrega o campo privado "__x_id: undefined". O WhatsApp
// Web novo passou a usar esse campo como id da mensagem. A correção é apagá-lo.
// Issue: https://github.com/wwebjs/whatsapp-web.js/issues/201922
//
// Este script roda sozinho depois de "npm install" (postinstall no package.json).
// Só altera o arquivo se a correção ainda não estiver lá. Quando o
// whatsapp-web.js lançar a correção oficial, ele simplesmente não encontra o
// trecho e não faz nada.
const fs = require('fs')
const path = require('path')

const arquivo = path.join(__dirname, '..', 'node_modules', 'whatsapp-web.js', 'src', 'util', 'Injected', 'Utils.js')
const ancora = "// Bot's won't reply if canonicalUrl is set (linking)"
const correcao = 'delete message.__x_id; // [SOS Vale] correção do envio de mídia (ver ChatBot/scripts/corrigir-wwebjs-midia.cjs)'

if (!fs.existsSync(arquivo)) {
  console.log('[correção wwebjs] whatsapp-web.js não instalado — nada a fazer.')
  process.exit(0)
}

let codigo = fs.readFileSync(arquivo, 'utf8')

if (codigo.includes('delete message.__x_id')) {
  console.log('[correção wwebjs] correção do envio de mídia já aplicada.')
  process.exit(0)
}

const posicao = codigo.indexOf(ancora)
if (posicao === -1) {
  console.warn('[correção wwebjs] trecho esperado não encontrado — a versão do whatsapp-web.js mudou; correção não aplicada.')
  process.exit(0)
}

// Mantém a mesma indentação da linha âncora
const inicioLinha = codigo.lastIndexOf('\n', posicao) + 1
const indentacao = codigo.slice(inicioLinha, posicao)

codigo = codigo.slice(0, inicioLinha) + indentacao + correcao + '\n' + codigo.slice(inicioLinha)
fs.writeFileSync(arquivo, codigo)
console.log('[correção wwebjs] correção do envio de mídia aplicada.')
