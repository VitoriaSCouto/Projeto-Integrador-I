// solicitacao-flow.js
import { userState } from "../state/state.js";
import fetch from "node-fetch";
import crypto from "crypto";

// ── Busca as cidades únicas da API de regiões ──────────────────
const buscarCidades = async () => {
  try {
    const resposta = await fetch('http://localhost:3000/api/regioes/listar');
    const dados = await resposta.json();
    const cidades = [...new Set(dados.regioes.map(r => r.cidade))];
    return cidades;
  } catch (erro) {
    console.error('[SOL] Erro ao buscar cidades:', erro);
    return [];
  }
};

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

  console.log('[SOL] IV length:', iv.length);   // deve ser 16
  console.log('[SOL] Key length:', key.length); // deve ser 32

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  decipher.setAutoPadding(true);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer.slice(0, -10)),
    decipher.final()
  ]);

  return decrypted;
};

// ── Baixa e descriptografa a mídia ────────────────────────────
const baixarMidia = async (msg) => {
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

  console.log('[SOL] Primeiros bytes:', decrypted.slice(0, 4).toString('hex'));
  console.log('[SOL] Tamanho descriptografado:', decrypted.length);

  return decrypted.toString('base64');
};

const TIPOS_ABRIGO = [
  'Escola',
  'Ginásio',
  'Igreja',
  'Hotel',
  'Pousada',
  'CentroCultural',
  'CentroComunitário',
  'Campo',
];

// ── Função principal ───────────────────────────────────────────
export const solicitacaoFlow = async (msg, from, text, state) => {

  if (!state?.step?.startsWith('sol_')) return false;

  // ── ETAPA 1: Nome do abrigo ──────────────────────────────────
  if (state.step === 'sol_nome') {
    state.tempData.nome = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_cep' });
    await msg.reply('📍 Qual o CEP do abrigo?\n\nEx: 12030-000');
    return true;
  }

  // ── ETAPA 2: CEP ─────────────────────────────────────────────
  if (state.step === 'sol_cep') {
    state.tempData.cep = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_endereco' });
    await msg.reply('🏠 Qual o endereço completo?\n\nEx: Rua das Flores, 123');
    return true;
  }

  // ── ETAPA 3: Endereço ─────────────────────────────────────────
  if (state.step === 'sol_endereco') {
    state.tempData.endereco = msg.body.trim();

    const cidades = await buscarCidades();
    if (cidades.length === 0) {
      await msg.reply('❌ Não consegui carregar as cidades. Tente novamente mais tarde.\n\nDigite *oi* para voltar ao menu.');
      userState.delete(from);
      return true;
    }

    state.tempData._cidades = cidades;
    userState.set(from, { ...state, step: 'sol_cidade' });

    const lista = cidades.map((c, i) => `${i + 1} - ${c}`).join('\n');
    await msg.reply(`🌆 Qual a cidade?\n\n${lista}`);
    return true;
  }

  // ── ETAPA 4: Cidade ───────────────────────────────────────────
  if (state.step === 'sol_cidade') {
    const cidades = state.tempData._cidades;
    const indice = parseInt(text) - 1;

    if (isNaN(indice) || !cidades[indice]) {
      await msg.reply(`❌ Digite um número de 1 a ${cidades.length}.`);
      return true;
    }

    state.tempData.cidade = cidades[indice];
    state.tempData.estado = 'SP';
    state.tempData.bairro = '';
    delete state.tempData._cidades;
    userState.set(from, { ...state, step: 'sol_tipo' });

    const lista = TIPOS_ABRIGO.map((t, i) => `${i + 1} - ${t}`).join('\n');
    await msg.reply(`🏷️ Qual o tipo do abrigo?\n\n${lista}`);
    return true;
  }

  // ── ETAPA 5: Tipo ─────────────────────────────────────────────
  if (state.step === 'sol_tipo') {
    const indice = parseInt(text) - 1;

    if (isNaN(indice) || !TIPOS_ABRIGO[indice]) {
      await msg.reply(`❌ Digite um número de 1 a ${TIPOS_ABRIGO.length}.`);
      return true;
    }

    state.tempData.tipoAbrigo = TIPOS_ABRIGO[indice];
    userState.set(from, { ...state, step: 'sol_capacidade' });
    await msg.reply('👥 Qual a capacidade total de pessoas?');
    return true;
  }

  // ── ETAPA 6: Capacidade ───────────────────────────────────────
  if (state.step === 'sol_capacidade') {
    const capacidade = parseInt(msg.body.trim());

    if (isNaN(capacidade) || capacidade <= 0) {
      await msg.reply('❌ Digite um número válido. Ex: 100');
      return true;
    }

    state.tempData.capacidadeTotal = capacidade;
    userState.set(from, { ...state, step: 'sol_responsavel' });
    await msg.reply('👤 Qual o nome do responsável pelo abrigo?');
    return true;
  }

  // ── ETAPA 7: Responsável ──────────────────────────────────────
  if (state.step === 'sol_responsavel') {
    state.tempData.responsavel = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_telefone' });
    await msg.reply('📞 Qual o telefone do abrigo? (ou digite - para pular)');
    return true;
  }

  // ── ETAPA 8: Telefone ─────────────────────────────────────────
  if (state.step === 'sol_telefone') {
    const tel = msg.body.trim();
    state.tempData.telefone = tel === '-' ? null : tel;
    userState.set(from, { ...state, step: 'sol_sol_nome' });
    await msg.reply('🙋 Agora seus dados como *solicitante*.\n\nQual seu nome completo?');
    return true;
  }

  // ── ETAPA 9: Nome do solicitante ──────────────────────────────
  if (state.step === 'sol_sol_nome') {
    state.tempData.solicitanteNome = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_sol_email' });
    await msg.reply('📧 Qual seu e-mail?');
    return true;
  }

  // ── ETAPA 10: Email do solicitante ────────────────────────────
  if (state.step === 'sol_sol_email') {
    state.tempData.solicitanteEmail = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_sol_telefone' });
    await msg.reply('📱 Qual seu telefone? (ou - para pular)');
    return true;
  }

  // ── ETAPA 11: Telefone do solicitante ─────────────────────────
  if (state.step === 'sol_sol_telefone') {
    const tel = msg.body.trim();
    state.tempData.solicitanteTelefone = tel === '-' ? null : tel;
    userState.set(from, { ...state, step: 'sol_foto' });

    await msg.reply(
`📷 Deseja enviar uma foto do abrigo?

Envie a imagem normalmente pelo WhatsApp, ou:
• Como *documento* (mais confiável)
• Digite *pular* para continuar sem foto`
    );
    return true;
  }

  // ── ETAPA 12: Foto (opcional) ─────────────────────────────────
  if (state.step === 'sol_foto') {

    let fotoBase64 = null;

    if (text === 'pular') {
      // segue sem foto

    } else if (msg.hasMedia) {

      // Tenta via downloadMedia (foto normal)
      try {
        const media = await msg.downloadMedia();
        if (media?.data) {
          fotoBase64 = media.data;
          console.log('[SOL] Foto baixada via downloadMedia ✓');
        } else {
          throw new Error('Media vazia');
        }
      } catch (erroPuppeteer) {
        console.warn('[SOL] downloadMedia falhou, tentando fetch direto:', erroPuppeteer.message);

        // Fallback: fetch + descriptografia manual
        try {
          fotoBase64 = await baixarMidia(msg);
          console.log('[SOL] Foto baixada via fetch direto ✓');
        } catch (erroFetch) {
          console.error('[SOL] Fetch direto também falhou:', erroFetch.message);
          await msg.reply(
`⚠️ Não consegui baixar a imagem.

Tente enviar como *documento*:
Clipe 📎 → Documento → selecione a foto

Ou digite *pular* para continuar sem foto.`
          );
          return true;
        }
      }

    } else {
      await msg.reply('Envie uma imagem, um documento ou digite *pular* para continuar sem foto.');
      return true;
    }

    state.tempData.fotoAbrigo = fotoBase64;
    userState.set(from, { ...state, step: 'sol_confirmar' });

    const d = state.tempData;
    await msg.reply(
`📋 *Resumo da solicitação:*

🏠 Nome: ${d.nome}
📍 CEP: ${d.cep}
🏘️ Endereço: ${d.endereco}
🌆 Cidade: ${d.cidade} - ${d.estado}
🏷️ Tipo: ${d.tipoAbrigo}
👥 Capacidade: ${d.capacidadeTotal}
👤 Responsável: ${d.responsavel}
📞 Telefone: ${d.telefone ?? '-'}
🙋 Solicitante: ${d.solicitanteNome}
📧 Email: ${d.solicitanteEmail}
📱 Tel. Solicitante: ${d.solicitanteTelefone ?? '-'}
📷 Foto: ${fotoBase64 ? 'Sim ✅' : 'Não'}

Digite *confirmar* para enviar ou *cancelar* para desistir.`
    );
    return true;
  }

  // ── ETAPA 13: Confirmar ───────────────────────────────────────
  if (state.step === 'sol_confirmar') {

    if (text === 'cancelar') {
      userState.delete(from);
      await msg.reply('❌ Solicitação cancelada.\n\nDigite *oi* para voltar ao menu.');
      return true;
    }

    if (text !== 'confirmar') {
      await msg.reply('Digite *confirmar* para enviar ou *cancelar* para desistir.');
      return true;
    }

    try {
      const resposta = await fetch('http://localhost:3000/api/solicitacoes/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.tempData)
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        await msg.reply(
`✅ Solicitação enviada com sucesso!

Seu pedido foi registrado e será analisado pela equipe. Aguarde o contato.

Digite *oi* para voltar ao menu.`
        );
      } else {
        await msg.reply(`❌ Erro ao enviar: ${resultado.mensagem}\n\nDigite *oi* para recomeçar.`);
      }

    } catch (erro) {
      console.error('[SOL] Erro ao enviar solicitação:', erro);
      await msg.reply('❌ Falha na conexão com o servidor. Tente novamente mais tarde.\n\nDigite *oi* para voltar ao menu.');
    }

    userState.delete(from);
    return true;
  }

  return false;
};