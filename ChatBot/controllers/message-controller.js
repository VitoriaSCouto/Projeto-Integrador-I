import { PrismaClient } from "@prisma/client";
import { userState } from "../state/state.js";

import { apoioFlow } from "./apoio-flow.js";
import { problemaFlow } from "./problema-flow.js";
import { psicologicoFlow } from "./psicologico-flow.js";
import { solicitacaoFlow } from "./solicitacao-flow.js";

const prisma = new PrismaClient();

export const handleMessage = async (msg, client) => {

    const from = msg.from;

    // minusculo + sem acento (resolve "olá", "OLA", "ólá" etc)
    const text = msg.body
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    let state = userState.get(from);

    // ============================================
    // FLUXOS EXTERNOS
    // ============================================

    if (state) {
        if (await apoioFlow(msg, from, text, state)) return;
        if (await psicologicoFlow(msg, from, text, state)) return;
        if (await problemaFlow(msg, from, text, state)) return;
        if (await solicitacaoFlow(msg, from, text, state)) return;
    }

    // ============================================
    // FLUXO ALERTAS
    // ============================================

    if (state?.step === 'alert_subscribe') {

        if (['sim', 'quero', 'confirmo'].includes(text)) {

            userState.set(from, { step: 'alert_city' });

            await msg.reply(
`Escolha sua cidade para receber alertas:

1 - Pindamonhangaba
2 - Cacapava
3 - Taubate`
            );

        } else {

            userState.delete(from);

            await msg.reply(
`Cadastro cancelado.

Voce nao recebera alertas automaticos.

Digite *oi* para voltar ao menu.`
            );
        }

        return;
    }

    if (state?.step === 'alert_city') {

        const cidades = {
            '1': { nome: 'Pindamonhangaba', link: 'https://seu-link-pinda-aqui' },
            '2': { nome: 'Cacapava',         link: 'https://seu-link-cacapava-aqui' },
            '3': { nome: 'Taubate',          link: 'https://seu-link-taubate-aqui' },
        };

        let escolha = cidades[text];

        if (!escolha) {
            if (text.includes('pinda'))    escolha = cidades['1'];
            if (text.includes('cacapava')) escolha = cidades['2'];
            if (text.includes('taubate'))  escolha = cidades['3'];
        }

        if (!escolha) {
            await msg.reply(
`Opcao invalida. Digite 1, 2 ou 3 para escolher a cidade.

1 - Pindamonhangaba
2 - Cacapava
3 - Taubate`
            );
            return;
        }

        userState.delete(from);

        await msg.reply(
`Entre no link abaixo para receber alertas de ${escolha.nome}:

${escolha.link}

Voce recebera notificacoes de risco pelo canal.`
        );

        return;
    }

    // ============================================
    // MENU PRINCIPAL
    // ============================================

    if (['oi', 'menu', 'ola', 'inicio'].includes(text)) {

        if (state) userState.delete(from);

        await msg.reply(
`SISTEMA DE APOIO EM DESASTRES NATURAIS

Ola! Sou o assistente da S.O.S Vale!.

Escolha uma opcao digitando o numero:

1 - Receber alertas de desastres
2 - Solicitar apoio
3 - Abrigos disponiveis
4 - Apoio psicologico
5 - Relatar problema
6 - Telefones de emergencia
7 - Solicitar cadastro de abrigo
8 - Encerrar atendimento`
        );

        return;
    }

    // ============================================
    // OPCOES DO MENU
    // ============================================

    switch (text) {

        case "1":
            await msg.reply(
`ALERTAS DE DESASTRES

Deseja receber notificacoes de risco na sua regiao?

Digite SIM para continuar ou NAO para cancelar.`
            );
            userState.set(from, { step: 'alert_subscribe' });
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
                const abrigos = await prisma.abrigo.findMany({
                    where: { status: "ativo" },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                });

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
                    return `*${a.nome}*\n${a.endereco}, ${a.cidade}\n${vagasTexto}${a.telefone ? `\nTel: ${a.telefone}` : ""}`;
                }).join("\n\n");

                await msg.reply(
`ABRIGOS DISPONIVEIS

${lista}

Digite *oi* para voltar ao menu.`
                );

            } catch (err) {
                console.error("[DB] Erro ao buscar abrigos:", err);
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
            await msg.reply(
`RELATAR PROBLEMA

1 - Arvore caida
2 - Alagamento
3 - Falta de energia
4 - Deslizamento
5 - Bueiro entupido
6 - Via interditada`
            );
            userState.set(from, { step: 'problem_type', tempData: {} });
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