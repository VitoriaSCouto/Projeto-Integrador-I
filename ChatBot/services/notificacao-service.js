// notificacao-service.js
//
// Envia os alertas pelo WhatsApp. A API guarda as notificações numa fila;
// de tempos em tempos o bot reserva algumas, envia uma por uma e informa
// o resultado (enviada ou falha — a API tenta de novo até 3 vezes).
import pkg from "whatsapp-web.js";
import { api } from "./api.js";

const { MessageMedia } = pkg;

// Intervalo entre as buscas na fila
const INTERVALO_MS = Number(process.env.NOTIFICACOES_INTERVALO_MS) || 15000;

// Pausa entre uma mensagem e outra — enviar muitas mensagens seguidas pode
// fazer o WhatsApp bloquear o número do bot
const PAUSA_ENTRE_MENSAGENS_MS = Number(process.env.NOTIFICACOES_PAUSA_MS) || 2000;

const LOTE = 20;

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Envia a mensagem com a foto do relato (se houver). Se a foto não puder ser
// baixada, envia só o texto.
const enviar = async (client, notificacao) => {
  if (notificacao.fotoUrl) {
    let media = null;
    try {
      media = await MessageMedia.fromUrl(notificacao.fotoUrl, { unsafeMime: true });
    } catch (erro) {
      console.warn('[NOTIF] Não foi possível baixar a foto, enviando só o texto:', erro.message);
    }

    if (media) {
      await client.sendMessage(notificacao.destino, media, { caption: notificacao.mensagem });
      return;
    }
  }

  await client.sendMessage(notificacao.destino, notificacao.mensagem);
};

let iniciado = false;

export const iniciarEnvioDeNotificacoes = (client) => {
  // O evento "ready" pode disparar de novo após reconexão
  if (iniciado) return;
  iniciado = true;

  let processando = false;

  const ciclo = async () => {
    if (processando) return;
    processando = true;

    try {
      const { ok, status, dados } = await api('POST', '/bot/notificacoes/reservar', { limite: LOTE });

      if (!ok) {
        console.error(`[NOTIF] API recusou a reserva (HTTP ${status}):`, dados.mensagem);
        return;
      }

      for (const notificacao of dados.notificacoes) {
        try {
          await enviar(client, notificacao);
          await api('PATCH', `/bot/notificacoes/${notificacao.id_notificacao}`, { sucesso: true });
          console.log(`[NOTIF] ✓ ${notificacao.evento} → ${notificacao.destino}`);
        } catch (erro) {
          console.error(`[NOTIF] ✗ ${notificacao.destino}:`, erro.message);
          await api('PATCH', `/bot/notificacoes/${notificacao.id_notificacao}`, { sucesso: false, erro: erro.message });
        }

        await esperar(PAUSA_ENTRE_MENSAGENS_MS);
      }
    } catch (erro) {
      // API fora do ar: tenta de novo no próximo ciclo
      console.error('[NOTIF] Erro ao processar a fila:', erro.message);
    } finally {
      processando = false;
    }
  };

  setInterval(ciclo, INTERVALO_MS);
  ciclo();
  console.log(`[NOTIF] Envio de alertas ativo (verificando a fila a cada ${INTERVALO_MS / 1000}s)`);
};
