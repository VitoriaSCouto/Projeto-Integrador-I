import { userState } from "../state/state.js";
import { salvarRegistro } from "../services/registroService.js";
import { titulo, listaNumerada, SEPARADOR, RODAPE_MENU, RODAPE_CANCELAR } from "../utils/formato.js";

const PREFERENCIAS = {
    telefone: '📞 Ligação',
    whatsapp: '💬 WhatsApp',
};

export async function psicologicoFlow(msg, from, text, state) {

    if (state.step === 'psycho_need') {

        const opcoes = {
            '1': 'conversar',
            '2': 'ansiedade',
            '3': 'familia',
            '4': 'crise',
            '5': 'desabafar',
            '6': 'outro'
        };

        state.tempData.motivo = opcoes[text] || text;

        state.step = 'psycho_description';

        await msg.reply(
`💭 Se quiser, conte como você está se sentindo ou o que está passando.

Isso ajuda o psicólogo voluntário a te entender melhor antes do contato. 🤝

_Ex: "Perdi minha casa na enchente e estou me sentindo perdido"_
_ou "Não consigo dormir desde que aconteceu"_

Prefere não descrever agora? Digite *não*.

${RODAPE_CANCELAR}`
        );

        return true;
    }

    if (state.step === 'psycho_description') {

        state.tempData.descricao =
            text === 'nao'
                ? 'não informado'
                : msg.body;

        state.step = 'psycho_contact';

        await msg.reply(
`📲 Como você prefere ser contatado?

${listaNumerada([
    '📞 Telefone (ligação)',
    '💬 WhatsApp (mensagem)',
    '📝 Não quero contato agora, só registrar meu relato',
])}

${SEPARADOR}
💬 Digite o *número* da opção.`
        );

        return true;
    }

    if (state.step === 'psycho_contact') {

        if (text === '1' || text === '2') {

            state.tempData.contato_preferencia = text === '1' ? 'telefone' : 'whatsapp';
            state.step = 'psycho_phone';

            await msg.reply(
`📞 Informe seu telefone com DDD${text === '2' ? ' (o mesmo do WhatsApp)' : ''}:

_Ex: 12999999999_`
            );

            return true;
        }

        if (text === '3') {

            state.tempData.contato_preferencia = 'nenhum';
            state.tempData.telefone = 'não informado';

            const registro = salvarRegistro(
                'apoio_psicologico',
                {
                    numero_usuario: from,
                    ...state.tempData
                }
            );

            await msg.reply(
`${titulo('✅', 'RELATO REGISTRADO')}

🔖 Protocolo: *${registro.id}*

Seu relato foi salvo e será encaminhado à equipe de apoio psicológico.

💙 Lembre-se: você não está sozinho(a).
📞 *CVV — 188* (24h, gratuito)

${RODAPE_MENU}`
            );

            userState.delete(from);

            return true;
        }

        await msg.reply('❌ Opção inválida. Digite *1*, *2* ou *3*.');

        return true;
    }

    if (state.step === 'psycho_phone') {

        state.tempData.telefone = msg.body;

        const registro = salvarRegistro(
            'apoio_psicologico',
            {
                numero_usuario: from,
                ...state.tempData,
                status_contato: 'aguardando_contato'
            }
        );

        await msg.reply(
`${titulo('✅', 'PEDIDO DE APOIO PSICOLÓGICO REGISTRADO')}

🔖 Protocolo: *${registro.id}*
📲 Preferência: ${PREFERENCIAS[state.tempData.contato_preferencia] ?? state.tempData.contato_preferencia}
📞 Telefone: ${state.tempData.telefone}

🤝 Em breve um psicólogo voluntário entrará em contato com você.

💙 Enquanto isso: *CVV — 188* (24h, gratuito)

${RODAPE_MENU}`
        );

        userState.delete(from);

        return true;
    }

    return false;
}
