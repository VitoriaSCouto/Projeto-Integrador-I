import { userState } from "../state/state.js";
import { salvarRegistro } from "../services/registroService.js";

export async function problemaFlow(msg, from, text, state) {

    if (state.step === 'problem_type') {

        const tipos = {
            '1': 'arvore_caida',
            '2': 'alagamento_enchente',
            '3': 'falta_energia',
            '4': 'risco_deslizamento',
            '5': 'bueiro_entupido',
            '6': 'via_interditada',
            '7': 'outro'
        };

        state.tempData.tipo_problema = tipos[text] || text;

        state.step = 'problem_address';

        await msg.reply(
`Informe o endereço completo:

Ex: Rua das Flores, 123 - Bairro Centro`
        );

        return true;
    }

    if (state.step === 'problem_address') {

        state.tempData.endereco = msg.body;

        state.step = 'problem_description';

        await msg.reply(
`Descreva o problema com detalhes:

Ex: "Árvore bloqueando toda a via"`
        );

        return true;
    }

    if (state.step === 'problem_description') {

        state.tempData.descricao = msg.body;

        const registro = salvarRegistro('relato_problema', {
            numero_usuario: from,
            ...state.tempData
        });

        await msg.reply(
`✅ PROBLEMA REGISTRADO

Protocolo: ${registro.id}
Tipo: ${state.tempData.tipo_problema}
Endereço: ${state.tempData.endereco}

Sua notificação foi enviada à Defesa Civil.

Digite *oi* para voltar ao menu.`
        );

        userState.delete(from);

        return true;
    }

    return false;
}