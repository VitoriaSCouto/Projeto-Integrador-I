import { userState } from "../state/state.js";
import { salvarRegistro } from "../services/registroService.js";

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
`Se quiser, descreva como está se sentindo ou o que está passando.

Isso ajuda o psicólogo voluntário a te entender melhor antes do contato.

Exemplo: "Perdi minha casa na enchente e estou me sentindo perdido"
ou "Não consigo dormir desde que aconteceu"

Você pode digitar apenas "NAO" se não quiser descrever agora.`
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
`Como você prefere ser contatado?

1 - Telefone (ligação)
2 - WhatsApp (mensagem)
3 - Não quero contato agora, só registrar meu relato

Digite o número da opção.`
        );

        return true;
    }

    if (state.step === 'psycho_contact') {

        if (text === '1') {

            state.tempData.contato_preferencia = 'telefone';
            state.step = 'psycho_phone';

            await msg.reply(
`Informe seu telefone com DDD para contato:

Exemplo: 11999999999`
            );

            return true;
        }

        if (text === '2') {

            state.tempData.contato_preferencia = 'whatsapp';
            state.step = 'psycho_phone';

            await msg.reply(
`Informe seu telefone com DDD (o mesmo do WhatsApp):

Exemplo: 11999999999`
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
` RELATO REGISTRADO COM SUCESSO

Protocolo: ${registro.id}

Seu relato foi salvo e será encaminhado para a equipe de apoio psicológico.

 Lembre-se: Você não está sozinho.

Digite *oi* para voltar ao menu principal.`
            );

            userState.delete(from);

            return true;
        }

        await msg.reply(
`Opção inválida. Digite 1, 2 ou 3.`
        );

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
` PEDIDO DE APOIO PSICOLÓGICO REGISTRADO

 Protocolo: ${registro.id}
 Preferência: ${state.tempData.contato_preferencia}
 Telefone: ${state.tempData.telefone}

 Em breve um psicólogo voluntário entrará em contato com você.

 CVV - 188 (24h, gratuito)

Digite *oi* para voltar ao menu principal.`
        );

        userState.delete(from);

        return true;
    }

    return false;
}