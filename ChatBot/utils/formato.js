// formato.js
//
// Padrão visual das mensagens do bot: título com emoji, linha separadora,
// opções numeradas com emoji (1️⃣ 2️⃣ ...) e rodapé com a navegação.
// Use estes helpers em todos os fluxos para as mensagens ficarem iguais.

export const SEPARADOR = '━━━━━━━━━━━━━━━━';

const EMOJIS_NUMERO = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// 3 → "3️⃣" (acima de 10 fica "*11.*")
export const numero = (n) => EMOJIS_NUMERO[n] ?? `*${n}.*`;

// Título da mensagem: "🔔 *ALERTAS*" + separador
export const titulo = (emoji, texto) => `${emoji} *${texto}*\n${SEPARADOR}`;

// Lista numerada a partir de 1: ["Sim", "Não"] → "1️⃣ Sim\n2️⃣ Não"
export const listaNumerada = (itens, formatar = (item) => item) =>
    itens.map((item, i) => `${numero(i + 1)} ${formatar(item)}`).join('\n');

// Uma opção com número escolhido: opcao(0, '↩️ Voltar') → "0️⃣ ↩️ Voltar"
export const opcao = (n, texto) => `${numero(n)} ${texto}`;

// Rodapés
export const RODAPE_OPCAO = `${SEPARADOR}\n💬 Digite o *número* da opção.`;
export const RODAPE_MENU = '↩️ Digite *menu* para voltar ao início.';
export const RODAPE_CANCELAR = '✋ Digite *cancelar* a qualquer momento para desistir.';

// Mensagem de erro padrão: "❌ texto" + dica
export const erro = (texto, dica) => `❌ ${texto}${dica ? `\n\n💡 ${dica}` : ''}`;


// ─── Saudações ─────────────────────────────────────────────────
// Qualquer uma delas abre o menu principal, em qualquer etapa.
// Só vale a mensagem INTEIRA (ex: "oi", "Oiii!", "Olá!!", "OI", "boa tarde"),
// para não atrapalhar quem está escrevendo um texto livre que começa com "oi".
const SAUDACOES = /^(o+i+e*|o+l+a+|oie+|menu|inicio|comecar|bom dia|boa tarde|boa noite|e ?a+i+|opa+)$/;

// Recebe o texto já em minúsculas e sem acento
export const ehSaudacao = (texto) => SAUDACOES.test(
    String(texto ?? '')
        .replace(/[^a-z0-9 ]/g, '')  // tira pontuação e emojis ("oi!!" → "oi")
        .replace(/\s+/g, ' ')
        .trim()
);
