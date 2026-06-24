import { PrismaClient } from "@prisma/client";
import { userState } from "../state/state.js";

import { apoioFlow } from "./apoio-flow.js";
import { problemaFlow } from "./problema-flow.js";
import { psicologicoFlow } from "./psicologico-flow.js";

const prisma = new PrismaClient();

export const handleMessage = async (msg, client) => {

    const from = msg.from;
    const text = msg.body.toLowerCase().trim();

    let state = userState.get(from);

    // ============================================
    // FLUXOS EXTERNOS
    // ============================================

    if (state) {

        if (await apoioFlow(msg, from, text, state)) return;
        if (await psicologicoFlow(msg, from, text, state)) return;
        if (await problemaFlow(msg, from, text, state)) return;
    }

    // ============================================
    // FLUXO ALERTAS (NOVO)
    // ============================================

    if (state?.step === 'alert_subscribe') {

        if (['sim', 'quero', 'confirmo'].includes(text)) {

            userState.set(from, {
                step: 'alert_city'
            });

            await msg.reply(
`📍 Escolha sua cidade para receber alertas:

1 - Pindamonhangaba
2 - Caçapava
3 - Taubaté`
            );

        } else {

            await msg.reply(
`❌ Cadastro cancelado.

Você não receberá alertas automáticos.

Digite *oi* para voltar ao menu.`
            );

            userState.delete(from);
        }

        return;
    }

    // escolha de cidade
    if (state?.step === 'alert_city') {

        let city = '';
        let link = '';

        if (text === '1' || text.includes('pinda')) {
            city = 'Pindamonhangaba';
            link = 'https://seu-link-pinda-aqui';
        }

        if (text === '2' || text.includes('caçapava')) {
            city = 'Caçapava';
            link = 'https://seu-link-cacapava-aqui';
        }

        if (text === '3' || text.includes('taubaté')) {
            city = 'Taubaté';
            link = 'https://seu-link-taubate-aqui';
        }

        if (city) {

            await msg.reply(
`✅ Entre no link abaixo para receber alertas da cidade de ${city}!

🔗 Grupo/Canal:
${link}

⚠️ Você receberá notificações de risco através do Canal.`
            );

            userState.delete(from);
        }

        return;
    }

    // ============================================
    // MENU PRINCIPAL
    // ============================================

    if (
        text === "oi" ||
        text === "menu" ||
        text === "olá" ||
        text === "ola"
    ) {

        if (state) userState.delete(from);

        await msg.reply(
`🌧️ SISTEMA DE APOIO EM DESASTRES NATURAIS

Olá! Sou o assistente da Defesa Civil.

Escolha uma opção digitando o número:

1️⃣ Receber alertas de desastres
2️⃣ Solicitar apoio
3️⃣ Abrigos disponíveis
4️⃣ Apoio psicológico
5️⃣ Relatar problema
6️⃣ Telefones de emergência
7️⃣ Encerrar atendimento`
        );

        return;
    }

    // ============================================
    // OPÇÕES DO MENU
    // ============================================

    switch (text) {

        case "1":

            await msg.reply(
`⚠️ ALERTAS DE DESASTRES

Deseja receber notificações de risco na sua região?

Digite SIM para continuar ou NÃO para cancelar.`
            );

            userState.set(from, {
                step: 'alert_subscribe'
            });

            break;

        case "2":

            await msg.reply(
`🤝 SOLICITAR APOIO

Informe seu ENDEREÇO completo:

Ex: Rua das Flores, 123 - Centro`
            );

            userState.set(from, {
                step: 'help_address',
                tempData: {}
            });

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
`😔 Nenhum abrigo disponível no momento.

Entre em contato com a Defesa Civil: 199

Digite *oi* para voltar ao menu.`
                    );
                    break;
                }

                const lista = abrigos.map(a => {
                    const vagas = a.capacidadeTotal - a.capacidadeOcupada;
                    const vagasTexto = vagas > 0 ? `✅ ${vagas} vagas` : `❌ Sem vagas`;
                    return `📍 *${a.nome}*\n📌 ${a.endereco}, ${a.cidade}\n🛏 ${vagasTexto}${a.telefone ? `\n📞 ${a.telefone}` : ""}`;
                }).join("\n\n");

                await msg.reply(
`🏠 *ABRIGOS DISPONÍVEIS*

${lista}

Digite *oi* para voltar ao menu.`
                );

            } catch (err) {
                console.error("[DB] Erro ao buscar abrigos:", err);
                await msg.reply(
`⚠️ Não foi possível carregar os abrigos agora.

Ligue para a Defesa Civil: 199

Digite *oi* para voltar ao menu.`
                );
            }

            break;
        }

        case "4":

            await msg.reply(
`💙 APOIO PSICOLÓGICO

1 - Quero conversar com alguém
2 - Ansiedade
3 - Apoio familiar
4 - Crise emocional
5 - Desabafar
6 - Outro motivo`
            );

            userState.set(from, {
                step: 'psycho_need',
                tempData: {}
            });

            break;

        case "5":

            await msg.reply(
`📢 RELATAR PROBLEMA

1 - Árvore caída
2 - Alagamento
3 - Falta de energia
4 - Deslizamento
5 - Bueiro entupido
6 - Via interditada`
            );

            userState.set(from, {
                step: 'problem_type',
                tempData: {}
            });

            break;

        case "6":

            await msg.reply(
`📞 EMERGÊNCIA

🚒 193 Bombeiros
🚑 192 SAMU
👮 190 Polícia
🛟 199 Defesa Civil`
            );

            break;

        case "7":

            await msg.reply(
`👋 Atendimento encerrado.

Digite *oi* para reabrir o menu.`
            );

            userState.delete(from);

            break;

        default:

            await msg.reply(
`❌ Não entendi.

Digite *oi* para ver o menu ou escolha uma opção válida.`
            );
    }
};