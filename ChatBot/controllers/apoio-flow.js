import { userState } from "../state/state.js";
import { salvarRegistro } from "../services/registroService.js";
import { titulo, listaNumerada, SEPARADOR, RODAPE_MENU, RODAPE_CANCELAR } from "../utils/formato.js";

const TIPOS_APOIO = [
    { valor: 'abrigo',       label: '🏠 Abrigo' },
    { valor: 'alimentacao',  label: '🍲 Alimentação' },
    { valor: 'agua_potavel', label: '💧 Água potável' },
    { valor: 'roupas',       label: '👕 Roupas' },
    { valor: 'kit_higiene',  label: '🧼 Kit de higiene' },
    { valor: 'outro',        label: '📝 Outro' },
];

export async function apoioFlow(msg, from, text, state) {

    if (state.step === "help_address") {
        state.tempData.endereco = msg.body;

        state.step = "help_people";

        await msg.reply(
`👥 *Passo 2 de 4* — Quantas pessoas precisam desse apoio?

_Digite apenas o número. Ex: 4_

${RODAPE_CANCELAR}`
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
`📦 *Passo 3 de 4* — Qual apoio você precisa?

${listaNumerada(TIPOS_APOIO, t => t.label)}

${RODAPE_CANCELAR}`
        );

        return true;
    }

    if (state.step === "help_type") {

        const tipo = TIPOS_APOIO[parseInt(text) - 1];
        state.tempData.tipo_apoio = tipo ? tipo.valor : msg.body;
        state.tempData._tipo_label = tipo ? tipo.label : msg.body;

        state.step = "help_contact";

        await msg.reply(
`📞 *Passo 4 de 4* — Informe um telefone para contato (com DDD).

_Ex: 12999999999_

Não quer informar? Digite *não*.

${RODAPE_CANCELAR}`
        );

        return true;
    }

    if (state.step === "help_contact") {

        state.tempData.telefone_contato =
            text === "nao"
                ? "não informado"
                : msg.body;

        const { _tipo_label, ...dados } = state.tempData;

        const registro = salvarRegistro(
            "solicitacao_apoio",
            {
                numero_usuario: from,
                ...dados
            }
        );

        await msg.reply(
`${titulo('✅', 'SOLICITAÇÃO DE APOIO REGISTRADA')}

🔖 Protocolo: *${registro.id}*

📍 Endereço: ${dados.endereco}
👥 Pessoas: ${dados.pessoas}
📦 Apoio: ${_tipo_label}
📞 Contato: ${dados.telefone_contato}

Sua solicitação foi encaminhada à equipe. 🙏

${SEPARADOR}
🚨 Em emergência ligue *193* (Bombeiros) ou *199* (Defesa Civil).
${RODAPE_MENU}`
        );

        userState.delete(from);

        return true;
    }

    return false;
}
