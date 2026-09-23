// grupo-controller.js
//
// Mensagens recebidas em GRUPOS do WhatsApp. O bot ignora tudo, exceto os
// comandos abaixo, usados para configurar o grupo de alertas de uma cidade:
//
//   !alertas id                   → mostra o ID do grupo (para colar no painel)
//   !alertas vincular Taubaté     → este grupo passa a receber os alertas da cidade
//   !alertas vincular Taubaté/SP  → idem, informando o estado
//   !alertas desvincular          → o grupo deixa de receber alertas
//
// Vincular e desvincular só funcionam para administradores do grupo.
import { api } from "../services/api.js";

const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();

const AJUDA =
`🔔 *Comandos de alertas do S.O.S Vale*

!alertas id — mostra o ID deste grupo
!alertas vincular <cidade> — este grupo passa a receber os alertas da cidade
!alertas desvincular — este grupo deixa de receber alertas`;

// Confere se quem enviou a mensagem é administrador do grupo
const remetenteEhAdmin = async (msg) => {
  const chat = await msg.getChat();
  if (!chat.isGroup) return false;

  const autor = msg.author ?? '';
  const participante = chat.participants.find(p =>
    p.id._serialized === autor || p.id.user === autor.split('@')[0]
  );

  return Boolean(participante?.isAdmin || participante?.isSuperAdmin);
};

export const handleGrupo = async (msg) => {
  const texto = (msg.body ?? '').trim();
  if (!normalizar(texto).startsWith('!alertas')) return;

  const [, comando = '', ...resto] = texto.split(/\s+/);
  const acao = normalizar(comando);
  const grupoId = msg.from;

  try {
    if (acao === 'id') {
      await msg.reply(`🆔 ID deste grupo:\n\n${grupoId}\n\nCole este ID no campo "Grupo de alertas" da cidade, no painel S.O.S Vale.`);
      return;
    }

    if (acao === 'vincular' || acao === 'desvincular') {
      if (!(await remetenteEhAdmin(msg))) {
        await msg.reply('⚠️ Apenas administradores do grupo podem usar este comando.');
        return;
      }
    }

    if (acao === 'desvincular') {
      const { ok, dados } = await api('DELETE', `/bot/grupos/${encodeURIComponent(grupoId)}`);
      await msg.reply(ok ? `✅ ${dados.mensagem}` : `❌ ${dados.mensagem}`);
      return;
    }

    if (acao === 'vincular') {
      // Aceita "Taubaté" ou "Taubaté/SP"
      const [nomeCidade, uf] = resto.join(' ').split('/').map(s => s?.trim());

      if (!nomeCidade) {
        await msg.reply('Informe a cidade. Ex: !alertas vincular Taubaté');
        return;
      }

      const { ok, dados } = await api('GET', '/cidades/listar');
      if (!ok) throw new Error(dados.mensagem);

      const encontradas = dados.cidades.filter(c =>
        normalizar(c.nome) === normalizar(nomeCidade) &&
        (!uf || normalizar(c.estado) === normalizar(uf))
      );

      if (encontradas.length === 0) {
        await msg.reply(`❌ A cidade "${nomeCidade}" não está cadastrada no S.O.S Vale. Cadastre-a no painel (Regiões) e tente de novo.`);
        return;
      }

      if (encontradas.length > 1) {
        await msg.reply(`Existe mais de uma cidade com esse nome. Informe o estado, ex: !alertas vincular ${encontradas[0].nome}/${encontradas[0].estado}`);
        return;
      }

      const cidade = encontradas[0];
      const resposta = await api('PUT', `/bot/cidades/${cidade.id_cidade}/grupo`, { grupoWhatsappId: grupoId });

      await msg.reply(resposta.ok
        ? `✅ Pronto! Este grupo vai receber os alertas confirmados de *${cidade.nome}/${cidade.estado}*.`
        : `❌ ${resposta.dados.mensagem}`);
      return;
    }

    await msg.reply(AJUDA);

  } catch (erro) {
    console.error('[GRUPO] Erro ao processar comando:', erro.message);
    await msg.reply('❌ Não consegui falar com o sistema agora. Tente novamente em alguns minutos.');
  }
};
