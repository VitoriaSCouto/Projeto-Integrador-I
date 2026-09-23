// solicitacao-flow.js
import { userState } from "../state/state.js";
import { api } from "../services/api.js";
import { baixarFoto } from "../services/midia.js";

// ── Busca as cidades cadastradas na API ────────────────────────
const buscarCidades = async () => {
  try {
    const { ok, dados } = await api('GET', '/cidades/listar');
    if (!ok) throw new Error(dados.mensagem);
    return dados.cidades.map(c => ({ id_cidade: c.id_cidade, nome: c.nome, estado: c.estado }));
  } catch (erro) {
    console.error('[SOL] Erro ao buscar cidades:', erro);
    return [];
  }
};

// ── Busca os bairros de uma cidade ─────────────────────────────
const buscarBairros = async (cidadeId) => {
  try {
    const { ok, dados } = await api('GET', `/bairros/listar?cidadeId=${cidadeId}`);
    if (!ok) throw new Error(dados.mensagem);
    return dados.bairros.map(b => ({ id_bairro: b.id_bairro, nome: b.nome }));
  } catch (erro) {
    console.error('[SOL] Erro ao buscar bairros:', erro);
    return [];
  }
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

// ── Pergunta o tipo do abrigo (depois da cidade/bairro) ────────
const perguntarTipo = async (msg, from, state) => {
  userState.set(from, { ...state, step: 'sol_tipo' });

  const lista = TIPOS_ABRIGO.map((t, i) => `${i + 1} - ${t}`).join('\n');
  await msg.reply(`🏷️ Qual o tipo do abrigo?\n\n${lista}`);
  return true;
};

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

    const lista = cidades.map((c, i) => `${i + 1} - ${c.nome}/${c.estado}`).join('\n');
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

    const cidade = cidades[indice];
    state.tempData.cidadeId = cidade.id_cidade;
    state.tempData.cidade = cidade.nome;
    state.tempData.estado = cidade.estado;
    state.tempData.bairroId = null;
    state.tempData.bairro = null;
    delete state.tempData._cidades;

    const bairros = await buscarBairros(cidade.id_cidade);

    // Sem bairros cadastrados na cidade: segue sem bairro
    if (bairros.length === 0) {
      return perguntarTipo(msg, from, state);
    }

    state.tempData._bairros = bairros;
    userState.set(from, { ...state, step: 'sol_bairro' });

    const lista = bairros.map((b, i) => `${i + 1} - ${b.nome}`).join('\n');
    await msg.reply(`🏘️ Qual o bairro?\n\n${lista}\n\n0 - Não sei / não está na lista`);
    return true;
  }

  // ── ETAPA 4b: Bairro (opcional) ───────────────────────────────
  if (state.step === 'sol_bairro') {
    const bairros = state.tempData._bairros;
    const indice = parseInt(text) - 1;

    if (text !== '0' && (isNaN(indice) || !bairros[indice])) {
      await msg.reply(`❌ Digite um número de 1 a ${bairros.length}, ou 0 para pular.`);
      return true;
    }

    if (text !== '0') {
      state.tempData.bairroId = bairros[indice].id_bairro;
      state.tempData.bairro = bairros[indice].nome;
    }
    delete state.tempData._bairros;

    return perguntarTipo(msg, from, state);
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

      // Tenta via downloadMedia e, se falhar, baixa e descriptografa manualmente
      try {
        fotoBase64 = (await baixarFoto(msg, '[SOL]')).data;
      } catch (erroFetch) {
        console.error('[SOL] Não foi possível baixar a foto:', erroFetch.message);
        await msg.reply(
`⚠️ Não consegui baixar a imagem.

Tente enviar como *documento*:
Clipe 📎 → Documento → selecione a foto

Ou digite *pular* para continuar sem foto.`
        );
        return true;
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
🏘️ Bairro: ${d.bairro ?? '-'}
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
      const { ok, dados: resultado } = await api('POST', '/solicitacoes/criar', state.tempData);

      if (ok) {
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