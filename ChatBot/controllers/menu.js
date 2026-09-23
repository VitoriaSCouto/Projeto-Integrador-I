// Menu principal do bot — usado pelo message-controller e pelos fluxos
// que precisam "voltar ao menu"

export const MENSAGEM_MENU = `SISTEMA DE APOIO EM DESASTRES NATURAIS

Ola! Sou o assistente da S.O.S Vale!.

Escolha uma opcao digitando o numero:

1 - Alertas do meu bairro
2 - Solicitar apoio
3 - Abrigos disponiveis
4 - Apoio psicologico
5 - Relatar ocorrencia (alagamento, deslizamento...)
6 - Telefones de emergencia
7 - Solicitar cadastro de abrigo
8 - Encerrar atendimento`;

export const enviarMenuPrincipal = async (msg) => {
    await msg.reply(MENSAGEM_MENU);
};
