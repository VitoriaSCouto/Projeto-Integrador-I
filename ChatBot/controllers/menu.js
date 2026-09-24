// Menu principal do bot — usado pelo message-controller e pelos fluxos
// que precisam "voltar ao menu"
import { SEPARADOR, opcao, RODAPE_OPCAO } from "../utils/formato.js";

export const MENSAGEM_MENU = `🌧️ *S.O.S VALE*
_Apoio em desastres naturais no Vale do Paraíba_
${SEPARADOR}

Olá! 👋 Sou o assistente virtual do *S.O.S Vale*.
Como posso te ajudar?

${opcao(1, '🔔 Alertas do meu bairro')}
${opcao(2, '🆘 Solicitar apoio')}
${opcao(3, '🏠 Abrigos disponíveis')}
${opcao(4, '💙 Apoio psicológico')}
${opcao(5, '🚨 Alertas ativos agora')}
${opcao(6, '☎️ Telefones de emergência')}
${opcao(7, '🏫 Indicar um local para abrigo')}
${opcao(8, '👋 Encerrar atendimento')}

${RODAPE_OPCAO}`;

export const enviarMenuPrincipal = async (msg) => {
    await msg.reply(MENSAGEM_MENU);
};
