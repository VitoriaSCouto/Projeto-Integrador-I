// Download de fotos enviadas pelo WhatsApp
// (usado na solicitação de abrigo e no relato de ocorrências)
import crypto from "crypto";

// ── Descriptografa mídia do WhatsApp usando crypto nativo ──────
const descriptografarMidia = async (encryptedBuffer, mediaKeyBase64) => {
  const mediaKey = Buffer.from(mediaKeyBase64, 'base64');
  const info = Buffer.from('WhatsApp Image Keys');
  const salt = Buffer.alloc(32, 0);

  // HKDF extract
  const prk = crypto.createHmac('sha256', salt).update(mediaKey).digest();

  // HKDF expand — precisa de 2 blocos para gerar 48 bytes
  const block1 = crypto.createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([0x01])]))
    .digest();

  const block2 = crypto.createHmac('sha256', prk)
    .update(Buffer.concat([block1, info, Buffer.from([0x02])]))
    .digest();

  const derived = Buffer.concat([block1, block2]); // 64 bytes

  const iv  = derived.slice(0, 16);
  const key = derived.slice(16, 48);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  decipher.setAutoPadding(true);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer.slice(0, -10)),
    decipher.final()
  ]);

  return decrypted;
};

// ── Baixa e descriptografa a mídia direto do servidor do WhatsApp ──
const baixarMidiaDireto = async (msg) => {
  const mediaData = msg._data?.mediaData ?? msg._data;

  if (!mediaData?.directPath || !mediaData?.mediaKey) {
    throw new Error('Dados de mídia insuficientes');
  }

  const mediaUrl = `https://mmg.whatsapp.net${mediaData.directPath}`;
  const response = await fetch(mediaUrl, {
    headers: {
      'Origin': 'https://web.whatsapp.com',
      'Referer': 'https://web.whatsapp.com/',
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const encryptedBuffer = Buffer.from(await response.arrayBuffer());
  const decrypted = await descriptografarMidia(encryptedBuffer, mediaData.mediaKey);

  return decrypted.toString('base64');
};

// Baixa a foto da mensagem. Retorna { data (base64), mimetype }.
// Tenta primeiro pelo whatsapp-web.js e, se falhar, baixa e descriptografa
// manualmente. Lança erro se as duas formas falharem.
export const baixarFoto = async (msg, prefixoLog = '[MIDIA]') => {
  try {
    const media = await msg.downloadMedia();
    if (media?.data) {
      console.log(`${prefixoLog} Foto baixada via downloadMedia ✓`);
      return { data: media.data, mimetype: media.mimetype || 'image/jpeg' };
    }
    throw new Error('Media vazia');
  } catch (erroPuppeteer) {
    console.warn(`${prefixoLog} downloadMedia falhou, tentando fetch direto:`, erroPuppeteer.message);

    const data = await baixarMidiaDireto(msg);
    console.log(`${prefixoLog} Foto baixada via fetch direto ✓`);
    return { data, mimetype: msg._data?.mimetype || 'image/jpeg' };
  }
};
