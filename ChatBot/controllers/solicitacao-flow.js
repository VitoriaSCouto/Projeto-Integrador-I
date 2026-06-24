// solicitacao-flow.js
import { userState } from "../state/state.js";
import fetch from "node-fetch";

// ── Busca as cidades únicas da API de regiões ──────────────────
// Roda uma vez quando o usuário chega na etapa de cidade
// Retorna um array simples: ['Taubaté', 'Caçapava', 'Pindamonhangaba']
const buscarCidades = async () => {
  try {
    const resposta = await fetch('http://localhost:3000/api/regioes/listar');
    const dados = await resposta.json();

    // dados.regioes é um array de { estado, cidade, bairro }
    // Set remove duplicatas, depois converte de volta pra array
    const cidades = [...new Set(dados.regioes.map(r => r.cidade))];
    return cidades;

  } catch (erro) {
    console.error('[SOL] Erro ao buscar cidades:', erro);
    return []; // se falhar, retorna vazio — tratamos na etapa
  }
};

// Tipos fixos — espelham o enum do Prisma
// Se adicionar um tipo novo no schema, atualiza aqui também
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

// Função principal — é chamada no message-controller antes dos outros fluxos
export const solicitacaoFlow = async (msg, from, text, state) => {

  // Esse flow só age quando o step começa com 'sol_'
  if (!state?.step?.startsWith('sol_')) return false;

  // ── ETAPA 1: Nome do abrigo ──────────────────────────────────
  if (state.step === 'sol_nome') {
    state.tempData.nome = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_cep' });

    await msg.reply(
`📮 Qual o CEP do abrigo?

Ex: 12030-000`
    );
    return true;
  }

  // ── ETAPA 2: CEP ────────────────────────────────────────────
  if (state.step === 'sol_cep') {
    state.tempData.cep = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_endereco' });

    await msg.reply(
`🏠 Qual o endereço completo?

Ex: Rua das Flores, 123`
    );
    return true;
  }

// ── ETAPA 3: Endereço ────────────────────────────────────────
  if (state.step === 'sol_endereco') {
    state.tempData.endereco = msg.body.trim();

    // Busca as cidades do banco AGORA, antes de perguntar
    const cidades = await buscarCidades();

    if (cidades.length === 0) {
      await msg.reply('⚠️ Não consegui carregar as cidades. Tente novamente mais tarde.\n\nDigite *oi* para voltar ao menu.');
      userState.delete(from);
      return true;
    }

    // Salva as cidades no tempData para usar na próxima etapa
    // Assim não precisa buscar de novo
    state.tempData._cidades = cidades;
    userState.set(from, { ...state, step: 'sol_cidade' });

    // Monta a lista numerada dinamicamente
    const lista = cidades.map((c, i) => `${i + 1} - ${c}`).join('\n');
    await msg.reply(`🌆 Qual a cidade?\n\n${lista}`);
    return true;
  }

  // ── ETAPA 4: Cidade ──────────────────────────────────────────
  if (state.step === 'sol_cidade') {
    const cidades = state.tempData._cidades; // recupera do estado
    const indice = parseInt(text) - 1;       // converte "1" → índice 0

    if (isNaN(indice) || !cidades[indice]) {
      await msg.reply(`❌ Digite um número de 1 a ${cidades.length}.`);
      return true;
    }

    state.tempData.cidade = cidades[indice];
    state.tempData.estado = 'SP';
    state.tempData.bairro = '';
    delete state.tempData._cidades; // limpa, não precisa mais
    userState.set(from, { ...state, step: 'sol_tipo' });

    // Monta a lista de tipos dinamicamente
    const lista = TIPOS_ABRIGO.map((t, i) => `${i + 1} - ${t}`).join('\n');
    await msg.reply(`🏗️ Qual o tipo do abrigo?\n\n${lista}`);
    return true;
  }

  // ── ETAPA 5: Tipo ────────────────────────────────────────────
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

  // ── ETAPA 6: Capacidade ──────────────────────────────────────
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

  // ── ETAPA 7: Responsável ─────────────────────────────────────
  if (state.step === 'sol_responsavel') {
    state.tempData.responsavel = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_telefone' });

    await msg.reply('📞 Qual o telefone do abrigo? (ou digite - para pular)');
    return true;
  }

  // ── ETAPA 8: Telefone ────────────────────────────────────────
  if (state.step === 'sol_telefone') {
    const tel = msg.body.trim();
    state.tempData.telefone = tel === '-' ? null : tel;
    userState.set(from, { ...state, step: 'sol_sol_nome' });

    await msg.reply('📋 Agora seus dados como *solicitante*.\n\nQual seu nome completo?');
    return true;
  }

  // ── ETAPA 9: Nome do solicitante ─────────────────────────────
  if (state.step === 'sol_sol_nome') {
    state.tempData.solicitanteNome = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_sol_email' });

    await msg.reply('📧 Qual seu e-mail?');
    return true;
  }

  // ── ETAPA 10: Email do solicitante ───────────────────────────
  if (state.step === 'sol_sol_email') {
    state.tempData.solicitanteEmail = msg.body.trim();
    userState.set(from, { ...state, step: 'sol_sol_telefone' });

    await msg.reply('📱 Qual seu telefone? (ou - para pular)');
    return true;
  }

  // ── ETAPA 11: Telefone do solicitante ────────────────────────
  if (state.step === 'sol_sol_telefone') {
    const tel = msg.body.trim();
    state.tempData.solicitanteTelefone = tel === '-' ? null : tel;
    userState.set(from, { ...state, step: 'sol_foto' });

    await msg.reply(
`📸 Deseja enviar uma foto do abrigo?

Envie a imagem agora, ou digite *pular* para continuar sem foto.`
    );
    return true;
  }

  // ── ETAPA 12: Foto (opcional) ────────────────────────────────
  if (state.step === 'sol_foto') {

    let fotoBase64 = null;

    // Verifica se a mensagem tem uma imagem anexada
    if (msg.hasMedia) {
      const media = await msg.downloadMedia(); // baixa a imagem
      fotoBase64 = media.data; // já vem em base64!
    }

    state.tempData.fotoAbrigo = fotoBase64;
    userState.set(from, { ...state, step: 'sol_confirmar' });

    // Monta um resumo para o usuário confirmar
    const d = state.tempData;
    await msg.reply(
`✅ *Resumo da solicitação:*

🏠 Nome: ${d.nome}
📍 Cidade: ${d.cidade} - ${d.estado}
🏗️ Tipo: ${d.tipoAbrigo}
👥 Capacidade: ${d.capacidadeTotal}
👤 Responsável: ${d.responsavel}
👤 Solicitante: ${d.solicitanteNome}
📸 Foto: ${fotoBase64 ? 'Sim' : 'Não'}

Digite *confirmar* para enviar ou *cancelar* para desistir.`
    );
    return true;
  }

  // ── ETAPA 13: Confirmar e enviar para a API ──────────────────
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

    // Envia para a API
    try {
      const resposta = await fetch('http://localhost:3000/api/solicitacoes/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.tempData)
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        await msg.reply(
`🎉 Solicitação enviada com sucesso!

Seu pedido foi registrado e será analisado pela equipe. Aguarde o contato.

Digite *oi* para voltar ao menu.`
        );
      } else {
        await msg.reply(`⚠️ Erro ao enviar: ${resultado.mensagem}\n\nDigite *oi* para recomeçar.`);
      }

    } catch (erro) {
      console.error('[SOL] Erro ao enviar solicitação:', erro);
      await msg.reply('❌ Falha na conexão com o servidor. Tente novamente mais tarde.\n\nDigite *oi* para voltar ao menu.');
    }

    userState.delete(from);
    return true;
  }

  return false; // nenhum step bateu
};