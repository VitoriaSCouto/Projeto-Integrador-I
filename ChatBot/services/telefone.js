// Descobre o número de telefone real de um contato do WhatsApp
//
// Muitos contatos chegam com um ID interno ("239161143513120@lid") em vez do
// número ("5512982487132@c.us"). Para mostrar o telefone no painel, pedimos ao
// WhatsApp o número correspondente.
import { api } from "./api.js";

// Retorna só os dígitos do telefone (ex: "5512982487132") ou null
export const numeroReal = async (client, whatsappId) => {
    if (!whatsappId) return null;

    // Formato antigo: o próprio ID já é o número
    if (whatsappId.endsWith('@c.us')) return whatsappId.split('@')[0];

    try {
        const [{ pn } = {}] = await client.getContactLidAndPhone([whatsappId]);
        return pn ? pn.split('@')[0] : null;
    } catch (erro) {
        console.warn(`[TELEFONE] Não foi possível descobrir o número de ${whatsappId}:`, erro.message);
        return null;
    }
};

// Corrige os inscritos que ficaram com o código interno no lugar do telefone.
// Roda quando o bot conecta.
export const corrigirTelefonesDosInscritos = async (client) => {
    try {
        const { ok, dados } = await api('GET', '/bot/inscritos/sem-telefone');
        if (!ok || dados.whatsappIds.length === 0) return;

        let corrigidos = 0;
        for (const whatsappId of dados.whatsappIds) {
            const telefone = await numeroReal(client, whatsappId);
            if (!telefone) continue;

            const resposta = await api('PATCH', `/bot/inscritos/${encodeURIComponent(whatsappId)}/telefone`, { telefone });
            if (resposta.ok) corrigidos++;
        }

        console.log(`[TELEFONE] ${corrigidos} de ${dados.whatsappIds.length} inscrito(s) com o telefone corrigido.`);
    } catch (erro) {
        console.error('[TELEFONE] Erro ao corrigir telefones:', erro.message);
    }
};
