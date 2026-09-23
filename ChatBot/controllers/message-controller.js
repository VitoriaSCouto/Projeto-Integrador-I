import { userState } from "../state/state.js";
import { api } from "../services/api.js";

import { apoioFlow } from "./apoio-flow.js";
import { psicologicoFlow } from "./psicologico-flow.js";
import { solicitacaoFlow } from "./solicitacao-flow.js";
import { alertaFlow, abrirMenuAlertas, iniciarRelato } from "./alerta-flow.js";
import { handleGrupo } from "./grupo-controller.js";
import { enviarMenuPrincipal } from "./menu.js";

// Palavras que sempre voltam ao menu, em qualquer etapa de qualquer fluxo
const COMANDOS_MENU = ['oi', 'menu', 'ola', 'inicio'];

export const handleMessage = async (msg, client) => {

    const from = msg.from;

    // Ignora os "status" do WhatsApp
    if (from === 'status@broadcast') return;

    // Em grupos, o bot só responde aos comandos "!alertas"
    if (from.endsWith('@g.us')) {
        await handleGrupo(msg);
        return;
    }

    // minusculo + sem acento (resolve "olá", "OLA", "ólá" etc)
    const text = (msg.body ?? '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

    // ============================================
    // MENU PRINCIPAL
    // Vem antes dos fluxos para que "menu" nunca seja
    // interpretado como resposta de uma pergunta
    // ============================================

    if (COMANDOS_MENU.includes(text)) {
        userState.delete(from);
        await enviarMenuPrincipal(msg);
        return;
    }

    let state = userState.get(from);

    // ============================================
    // FLUXOS EXTERNOS
    // ============================================

    if (state) {
        if (await alertaFlow(msg, from, text, state)) return;
        if (await apoioFlow(msg, from, text, state)) return;
        if (await psicologicoFlow(msg, from, text, state)) return;
        if (await solicitacaoFlow(msg, from, text, state)) return;
    }

    // ============================================
    // OPCOES DO MENU
    // ============================================

    switch (text) {

        case "1":
            await abrirMenuAlertas(msg, from);
            break;

        case "2":
            await msg.reply(
`SOLICITAR APOIO

Informe seu endereco completo:

Ex: Rua das Flores, 123 - Centro`
            );
            userState.set(from, { step: 'help_address', tempData: {} });
            break;

        case "3": {
            try {
                const { ok, dados } = await api('GET', '/abrigos/listar?status=ativo');
                if (!ok) throw new Error(dados.mensagem);

                // Os 5 abrigos ativos cadastrados mais recentemente
                const abrigos = [...dados.abrigos]
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 5);

                if (abrigos.length === 0) {
                    await msg.reply(
`Nenhum abrigo disponivel no momento.

Entre em contato com a Defesa Civil: 199

Digite *oi* para voltar ao menu.`
                    );
                    break;
                }

                const lista = abrigos.map(a => {
                    const vagas = a.capacidadeTotal - a.capacidadeOcupada;
                    const vagasTexto = vagas > 0 ? `${vagas} vagas disponiveis` : `Sem vagas`;
                    const local = a.bairro ? `${a.bairro}, ${a.cidade}` : a.cidade;
                    return `*${a.nome}*\n${a.endereco}, ${local}\n${vagasTexto}${a.telefone ? `\nTel: ${a.telefone}` : ""}`;
                }).join("\n\n");

                await msg.reply(
`ABRIGOS DISPONIVEIS

${lista}

Digite *oi* para voltar ao menu.`
                );

            } catch (err) {
                console.error("[API] Erro ao buscar abrigos:", err);
                await msg.reply(
`Nao foi possivel carregar os abrigos agora.

Ligue para a Defesa Civil: 199

Digite *oi* para voltar ao menu.`
                );
            }
            break;
        }

        case "4":
            await msg.reply(
`APOIO PSICOLOGICO

1 - Quero conversar com alguem
2 - Ansiedade
3 - Apoio familiar
4 - Crise emocional
5 - Desabafar
6 - Outro motivo`
            );
            userState.set(from, { step: 'psycho_need', tempData: {} });
            break;

        case "5":
            await iniciarRelato(msg, from);
            break;

        case "6":
            await msg.reply(
`EMERGENCIA

193 - Bombeiros
192 - SAMU
190 - Policia
199 - Defesa Civil`
            );
            break;

        case "7":
            await msg.reply(
`SOLICITAR CADASTRO DE ABRIGO

Vou coletar os dados de um local que pode servir como abrigo em emergencias.

Qual o nome do abrigo?`
            );
            userState.set(from, { step: 'sol_nome', tempData: {} });
            break;

        case "8":
            await msg.reply(
`Atendimento encerrado.

Digite *oi* para reabrir o menu.`
            );
            userState.delete(from);
            break;

        default:
            await msg.reply(
`Nao entendi.

Digite *oi* para ver o menu ou escolha uma opcao valida.`
            );
    }
};
