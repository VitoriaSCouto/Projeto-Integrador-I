import { userState } from "../state/state.js";
import { salvarRegistro } from "../services/registroService.js";

export async function apoioFlow(msg, from, text, state) {

    if (state.step === "help_address") {
        state.tempData.endereco = msg.body;

        state.step = "help_people";

        await msg.reply(
`Quantas pessoas precisam desse apoio?

Digite apenas o número.`
        );

        return true;
    }

    if (state.step === "help_people") {

        const pessoas = parseInt(msg.body);

        state.tempData.pessoas = isNaN(pessoas)
            ? 1
            : pessoas;

        state.step = "help_type";

        await msg.reply(
`Qual apoio você precisa?

1 - Abrigo
2 - Alimentação
3 - Água potável
4 - Roupas
5 - Kit de higiene
6 - Outro`
        );

        return true;
    }

    if (state.step === "help_type") {

        const tipos = {
            "1": "abrigo",
            "2": "alimentacao",
            "3": "agua_potavel",
            "4": "roupas",
            "5": "kit_higiene",
            "6": "outro"
        };

        state.tempData.tipo_apoio =
            tipos[text] || msg.body;

        state.step = "help_contact";

        await msg.reply(
`Informe um telefone para contato (com DDD).

Exemplo: 11999999999

Digite NAO se não quiser informar.`
        );

        return true;
    }

    if (state.step === "help_contact") {

        state.tempData.telefone_contato =
            text === "nao"
                ? "não informado"
                : msg.body;

        const registro = salvarRegistro(
            "solicitacao_apoio",
            {
                numero_usuario: from,
                ...state.tempData
            }
        );

        await msg.reply(
`✅ SOLICITAÇÃO DE APOIO REGISTRADA

Protocolo: ${registro.id}

Endereço: ${state.tempData.endereco}
Pessoas: ${state.tempData.pessoas}
Tipo de apoio: ${state.tempData.tipo_apoio}

Sua solicitação foi encaminhada.

Digite *oi* para voltar ao menu.`
        );

        userState.delete(from);

        return true;
    }

    return false;
}