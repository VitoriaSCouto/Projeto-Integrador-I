// alerta-flow.js
//
// Sistema de alertas pelo WhatsApp:
//   • inscrição (nome, e-mail e bairro onde mora — se o bairro não estiver
//     na lista, a pessoa informa o CEP e o sistema cadastra o bairro);
//   • gerenciar os bairros acompanhados;
//   • relatar uma ocorrência com perguntas fechadas + foto (opcional);
//   • entrar no grupo de alertas da cidade (link de convite);
//   • ver os alertas ativos (opção 5 do menu principal).
//
// Todas as etapas começam com "alerta_" no state.step.
import { userState } from "../state/state.js";
import { api } from "../services/api.js";
import { baixarFoto } from "../services/midia.js";
import { enviarMenuPrincipal } from "./menu.js";
import { numeroReal } from "../services/telefone.js";
import {
  titulo, listaNumerada, opcao, SEPARADOR, RODAPE_OPCAO, RODAPE_MENU, RODAPE_CANCELAR, erro
} from "../utils/formato.js";

// Mesmas opções do backend (Backend/src/lib/alertas.js) — o valor precisa bater
const TIPOS = [
  { valor: 'alagamento',      label: '🌊 Alagamento' },
  { valor: 'deslizamento',    label: '⛰️ Deslizamento de terra' },
  { valor: 'arvore_caida',    label: '🌳 Árvore caída' },
  { valor: 'falta_energia',   label: '⚡ Falta de energia / fios caídos' },
  { valor: 'incendio',        label: '🔥 Incêndio' },
  { valor: 'via_interditada', label: '🚧 Via interditada' },
  { valor: 'vendaval',        label: '🌪️ Vendaval / chuva forte' },
];

const GRAVIDADES = [
  { valor: 'grave', label: '🔴 *Grave*', descricao: 'risco à vida, pessoas feridas ou ilhadas' },
  { valor: 'medio', label: '🟠 *Médio*', descricao: 'danos ou risco, sem pessoas em perigo imediato' },
  { valor: 'leve',  label: '🟡 *Leve*',  descricao: 'transtorno, sem risco imediato' },
];

const RODAPE_EMERGENCIA = '🚨 Em emergência ligue *193* (Bombeiros) ou *199* (Defesa Civil).';

const ERRO_CONEXAO = `❌ Não consegui falar com o sistema agora.\nTente novamente em alguns minutos. 🙏\n\n${RODAPE_MENU}`;

// ── Auxiliares ─────────────────────────────────────────────────

// Minúsculo e sem acento, para comparar o que a pessoa digitou
const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s+/g, ' ').trim();

// Converte a resposta "3" no item da lista (ou null)
const escolherPorNumero = (text, itens) => {
  const indice = parseInt(text) - 1;
  return /^\d+$/.test(text) && itens[indice] ? itens[indice] : null;
};

const descreverBairro = (b) => `${b.nome} (${b.cidade}/${b.estado})`;

// Busca o inscrito pelo número. Retorna null se não estiver inscrito.
const buscarInscrito = async (from) => {
  const { ok, status, dados } = await api('GET', `/bot/inscritos/${encodeURIComponent(from)}`);
  if (status === 404) return null;
  if (!ok) throw new Error(dados.mensagem ?? `HTTP ${status}`);
  return dados.inscrito;
};

// Número de telefone de quem está conversando (para exibir no painel).
// Para contatos "@lid" o getContact() devolve o código interno, não o número,
// então pedimos o número real ao WhatsApp.
const obterTelefone = async (msg) => numeroReal(msg.client, msg.from);


// ── Menus ──────────────────────────────────────────────────────

const mostrarConvite = async (msg, from, inscritoInativo = false) => {
  userState.set(from, { step: 'alerta_convite', tempData: {} });

  await msg.reply(
`${titulo('🔔', 'ALERTAS DO MEU BAIRRO')}

${inscritoInativo
  ? '⚠️ Sua inscrição no sistema de alertas está *cancelada*.'
  : '📢 Receba avisos de *alagamentos*, *deslizamentos* e outras ocorrências no seu bairro — e ajude a avisar a sua vizinhança.'}

✅ Os alertas só são enviados depois que *vários moradores* relatam a mesma ocorrência, para evitar alarmes falsos.

📝 Para se inscrever precisamos do seu *nome*, *e-mail* e do *bairro onde você mora*.

${opcao(1, '✍️ Quero me inscrever')}
${opcao(2, '👥 Entrar no grupo de alertas da cidade')}
${opcao(0, '↩️ Voltar ao menu')}

${RODAPE_OPCAO}`
  );
};

const mostrarMenuInscrito = async (msg, from, inscrito) => {
  userState.set(from, { step: 'alerta_menu', tempData: { inscrito } });

  const acompanhados = inscrito.bairrosInteresse.length > 0
    ? inscrito.bairrosInteresse.map(b => `   • ${descreverBairro(b)}`).join('\n')
    : '   _nenhum outro bairro_';

  await msg.reply(
`${titulo('🔔', 'ALERTAS DO MEU BAIRRO')}

Olá, *${inscrito.nome}*! 👋

🏠 Você mora em: *${inscrito.bairro}* (${inscrito.cidade}/${inscrito.estado})
👀 Também acompanha:
${acompanhados}

${opcao(1, '📢 Relatar uma ocorrência')}
${opcao(2, '👥 Entrar no grupo de alertas da cidade')}
${opcao(3, '➕ Acompanhar outro bairro')}
${opcao(4, '➖ Parar de acompanhar um bairro')}
${opcao(5, '🚫 Cancelar minha inscrição')}
${opcao(0, '↩️ Voltar ao menu')}

${RODAPE_OPCAO}`
  );
};

// Opção 1 do menu principal
export const abrirMenuAlertas = async (msg, from) => {
  try {
    const inscrito = await buscarInscrito(from);
    if (inscrito?.ativo) {
      await mostrarMenuInscrito(msg, from, inscrito);
    } else {
      await mostrarConvite(msg, from, Boolean(inscrito));
    }
  } catch (erroApi) {
    console.error('[ALERTA] Erro ao abrir menu:', erroApi.message);
    userState.delete(from);
    await msg.reply(ERRO_CONEXAO);
  }
};

// Volta para o menu de alertas (do inscrito ou o convite)
const voltarAoMenuAlertas = async (msg, from, inscrito) => {
  if (inscrito?.ativo) return mostrarMenuInscrito(msg, from, inscrito);
  return mostrarConvite(msg, from, Boolean(inscrito));
};


// ── Grupo de alertas da cidade (link de convite) ───────────────
// O link é cadastrado pelo admin no painel (Regiões → cidade).

const enviarLinkGrupo = async (msg, from, cidade) => {
  userState.delete(from);
  await msg.reply(
`${titulo('👥', `GRUPO DE ALERTAS — ${cidade.nome.toUpperCase()}/${cidade.estado}`)}

Toque no link para entrar no grupo: 👇
${cidade.link}

📌 No grupo são publicados apenas os alertas *confirmados* por moradores ou pela equipe do S.O.S Vale.

${SEPARADOR}
🔔 Digite *1* para voltar aos alertas.
${RODAPE_MENU}`
  );
};

const mostrarGrupos = async (msg, from, inscrito) => {
  const { ok, dados } = await api('GET', '/bot/cidades/grupos');
  if (!ok) throw new Error(dados.mensagem);

  // Cidades do inscrito (onde mora e bairros que acompanha) aparecem primeiro
  const minhas = new Set(inscrito
    ? [inscrito.cidade, ...inscrito.bairrosInteresse.map(b => b.cidade)].map(normalizar)
    : []);
  const cidades = [...dados.cidades]
    .map(c => ({ ...c, minha: minhas.has(normalizar(c.nome)) }))
    .sort((a, b) => Number(b.minha) - Number(a.minha) || a.nome.localeCompare(b.nome));

  if (cidades.length === 0) {
    await msg.reply('😕 Ainda não há grupos de alertas cadastrados.\nEm breve eles estarão disponíveis por aqui!');
    return voltarAoMenuAlertas(msg, from, inscrito);
  }

  // Só um grupo: envia direto
  if (cidades.length === 1) return enviarLinkGrupo(msg, from, cidades[0]);

  userState.set(from, { step: 'alerta_grupo_escolha', tempData: { inscrito, cidades } });

  await msg.reply(
`${titulo('👥', 'GRUPOS DE ALERTAS')}

De qual cidade você quer entrar no grupo?

${listaNumerada(cidades, c => `${c.nome}/${c.estado}${c.minha ? ' 🏠' : ''}`)}
${opcao(0, '↩️ Voltar')}

${RODAPE_OPCAO}`
  );
};


// ── Alertas ativos (opção 5 do menu principal) ─────────────────

const MAXIMO_ALERTAS_LISTADOS = 10;

export const mostrarAlertasAtivos = async (msg, from) => {
  userState.delete(from);

  try {
    const { ok, dados } = await api('GET', '/bot/alertas/ativos');
    if (!ok) throw new Error(dados.mensagem);

    if (dados.alertas.length === 0) {
      await msg.reply(
`${titulo('🚨', 'ALERTAS ATIVOS')}

✅ Nenhum alerta ativo no momento.

🔔 Quer ser avisado quando houver? Digite *1* e inscreva-se nos alertas do seu bairro.
${RODAPE_MENU}`
      );
      return;
    }

    // Mais graves primeiro, agrupados por cidade
    const alertas = [...dados.alertas]
      .sort((a, b) => b.pesoGravidade - a.pesoGravidade)
      .slice(0, MAXIMO_ALERTAS_LISTADOS);

    const porCidade = {};
    for (const a of alertas) (porCidade[`${a.cidade}/${a.estado}`] ??= []).push(a);

    const blocos = Object.entries(porCidade).map(([cidade, lista]) =>
      `🌆 *${cidade}*\n` + lista.map(a =>
        `${a.gravidadeEmoji} ${a.emoji} *${a.tipoLabel}* — ${a.bairro}\n` +
        `      ${a.gravidadeLabel} · confirmado por ${a.totalRelatos} morador(es)`
      ).join('\n')
    ).join('\n\n');

    const restantes = dados.alertas.length - alertas.length;

    await msg.reply(
`${titulo('🚨', 'ALERTAS ATIVOS')}

${blocos}
${restantes > 0 ? `\n➕ e mais ${restantes} alerta(s).\n` : ''}
${SEPARADOR}
${RODAPE_EMERGENCIA}
🔔 Digite *1* para receber os alertas do seu bairro ou entrar no grupo da cidade.
${RODAPE_MENU}`
    );
  } catch (erroApi) {
    console.error('[ALERTA] Erro ao listar alertas ativos:', erroApi.message);
    await msg.reply(ERRO_CONEXAO);
  }
};


// ── Seleção de bairro (CEP ou nome do bairro) ──────────────────
// Reaproveitada na inscrição, em "acompanhar outro bairro" e no relato.
// "proposito" diz o que fazer quando o bairro for escolhido.
// A pessoa digita o CEP ou o nome do bairro — sem listas enormes.

const PERGUNTA_BAIRRO =
`📮 Digite o *CEP* do endereço _(ex: 12070-610)_
ou o *nome do bairro* _(ex: Centro)_.

${RODAPE_CANCELAR}`;

const iniciarSelecaoBairro = async (msg, from, tempData, proposito, cabecalho) => {
  userState.set(from, { step: 'alerta_sel_busca', tempData, selecao: { proposito } });
  await msg.reply(`${cabecalho}\n\n${PERGUNTA_BAIRRO}`);
};

const voltarParaBusca = async (msg, from, state, aviso) => {
  userState.set(from, { step: 'alerta_sel_busca', tempData: state.tempData, selecao: { proposito: state.selecao.proposito } });
  await msg.reply(aviso ? `${aviso}\n\n${PERGUNTA_BAIRRO}` : PERGUNTA_BAIRRO);
};

// Mostra uma lista curta de bairros encontrados para a pessoa escolher
const mostrarOpcoes = async (msg, from, state, opcoes, cabecalho) => {
  userState.set(from, { ...state, step: 'alerta_sel_escolha', selecao: { ...state.selecao, opcoes } });

  await msg.reply(
`${cabecalho}

${listaNumerada(opcoes, b => `🏘️ ${descreverBairro(b)}`)}
${opcao(0, '📮 Nenhum desses (digitar o CEP)')}

${RODAPE_OPCAO}`
  );
};

// Chamado quando o bairro foi definido — segue conforme o propósito
const concluirSelecao = async (msg, from, state, bairro) => {
  const { proposito } = state.selecao;
  const tempData = state.tempData;

  if (proposito === 'inscricao') {
    const { ok, dados } = await api('POST', '/bot/inscritos', {
      whatsappId: from,
      telefone: await obterTelefone(msg),
      nome: tempData.nome,
      email: tempData.email,
      bairroId: bairro.id_bairro,
    });

    if (!ok) {
      userState.delete(from);
      await msg.reply(erro(`Não foi possível concluir a inscrição: ${dados.mensagem}`, 'Digite *oi* para recomeçar.'));
      return;
    }

    await msg.reply(`🎉 *Inscrição realizada!*\n\nVocê vai receber os alertas confirmados do bairro *${descreverBairro(bairro)}*. 🔔`);
    await mostrarMenuInscrito(msg, from, dados.inscrito);
    return;
  }

  if (proposito === 'acompanhar') {
    const { ok, dados } = await api('POST', `/bot/inscritos/${encodeURIComponent(from)}/bairros`, {
      bairroId: bairro.id_bairro
    });

    await msg.reply(ok ? `✅ ${dados.mensagem}` : `⚠️ ${dados.mensagem}`);

    const inscrito = ok ? dados.inscrito : await buscarInscrito(from);
    if (inscrito?.ativo) await mostrarMenuInscrito(msg, from, inscrito);
    else userState.delete(from);
    return;
  }

  if (proposito === 'relato') {
    tempData.bairro = bairro;
    await perguntarTipo(msg, from, tempData);
  }
};

// Parece um CEP? (8 números, com ou sem traço/ponto/espaço)
const pareceCep = (texto) => /^[\d\s.-]+$/.test(texto.trim()) && texto.replace(/\D/g, '').length === 8;

const buscarPorCep = async (msg, from, state, cepDigitado) => {
  const cep = cepDigitado.replace(/\D/g, '');
  const { ok, status, dados } = await api('GET', `/bairros/cep/${cep}`);

  if (status === 404) return voltarParaBusca(msg, from, state, '❌ CEP não encontrado. Confira os números.');
  if (!ok) throw new Error(dados.mensagem);

  if (!dados.bairro) {
    return voltarParaBusca(msg, from, state, '⚠️ Este CEP não informa o bairro (comum em cidades pequenas).\n💡 Digite o CEP de uma rua próxima ou o nome do bairro.');
  }

  userState.set(from, { ...state, step: 'alerta_sel_cep_confirmar', selecao: { ...state.selecao, cep } });

  await msg.reply(
`📍 *Encontrei este endereço:*

🏘️ Bairro: *${dados.bairro}*
🌆 Cidade: *${dados.cidade}/${dados.uf}*

${opcao(1, '✅ Sim, é esse')}
${opcao(2, '✏️ Não, digitar de novo')}`
  );
};

const buscarPorNome = async (msg, from, state, nomeDigitado) => {
  const termo = normalizar(nomeDigitado);

  if (termo.length < 2) {
    return voltarParaBusca(msg, from, state, '❌ Digite pelo menos 2 letras do nome do bairro.');
  }

  const { ok, dados } = await api('GET', '/bairros/listar');
  if (!ok) throw new Error(dados.mensagem);

  const bairros = dados.bairros.map(b => ({
    id_bairro: b.id_bairro, nome: b.nome, cidadeId: b.cidadeId, cidade: b.cidade, estado: b.estado
  }));

  // 1º nome exato (sem acento/maiúscula); se não houver, nomes que contêm o termo
  const exatos = bairros.filter(b => normalizar(b.nome) === termo);
  const parecidos = exatos.length > 0 ? exatos : bairros.filter(b => normalizar(b.nome).includes(termo));

  if (parecidos.length === 1) return concluirSelecao(msg, from, state, parecidos[0]);

  if (parecidos.length > 1 && parecidos.length <= 10) {
    const cabecalho = exatos.length > 1
      ? `🔎 Existe *${nomeDigitado.trim()}* em mais de uma cidade. Qual é o seu?`
      : `🔎 Encontrei estes bairros com "*${nomeDigitado.trim()}*":`;
    return mostrarOpcoes(msg, from, state, parecidos, cabecalho);
  }

  if (parecidos.length > 10) {
    return voltarParaBusca(msg, from, state, `🔎 Muitos bairros com "${nomeDigitado.trim()}".\n💡 Digite o nome mais completo ou o CEP.`);
  }

  return voltarParaBusca(msg, from, state, `❌ Não encontrei o bairro "${nomeDigitado.trim()}".\n💡 Confira o nome ou digite o *CEP* — se o bairro ainda não estiver cadastrado, cadastramos pelo CEP.`);
};

const processarSelecao = async (msg, from, text, state) => {
  const { selecao } = state;
  const digitado = (msg.body ?? '').trim();

  // ── CEP ou nome do bairro ──
  if (state.step === 'alerta_sel_busca') {
    if (!digitado || msg.hasMedia) return voltarParaBusca(msg, from, state);
    return pareceCep(digitado) ? buscarPorCep(msg, from, state, digitado) : buscarPorNome(msg, from, state, digitado);
  }

  // ── Escolha entre os bairros encontrados ──
  if (state.step === 'alerta_sel_escolha') {
    if (text === '0') return voltarParaBusca(msg, from, state, '📮 Tudo bem, vamos pelo CEP.');

    const escolhido = escolherPorNumero(text, selecao.opcoes);
    if (escolhido) return concluirSelecao(msg, from, state, escolhido);

    // Digitou outro nome ou um CEP em vez do número: busca de novo
    if (digitado && !/^\d{1,2}$/.test(digitado)) {
      return pareceCep(digitado) ? buscarPorCep(msg, from, state, digitado) : buscarPorNome(msg, from, state, digitado);
    }

    await msg.reply(`❌ Digite um número de *1 a ${selecao.opcoes.length}*, ou *0* para digitar o CEP.`);
    return;
  }

  // ── Confirmar o bairro do CEP ──
  if (state.step === 'alerta_sel_cep_confirmar') {
    if (text === '2') return voltarParaBusca(msg, from, state);

    if (text !== '1') {
      await msg.reply('💬 Digite *1* para confirmar ou *2* para digitar de novo.');
      return;
    }

    // Encontra ou cadastra o bairro (e a cidade, se for nova)
    const { ok, dados } = await api('POST', '/bot/bairros/cep', { cep: selecao.cep });

    if (!ok) return voltarParaBusca(msg, from, state, `❌ ${dados.mensagem}`);

    return concluirSelecao(msg, from, state, dados.bairro);
  }
};

// ── Relato de ocorrência ───────────────────────────────────────

// Opção 1 do menu de alertas
export const iniciarRelato = async (msg, from) => {
  try {
    const inscrito = await buscarInscrito(from);

    if (!inscrito?.ativo) {
      await msg.reply('📍 Para relatar ocorrências você precisa estar *inscrito* no sistema de alertas — assim conseguimos confirmar os relatos e avisar a vizinhança.');
      await mostrarConvite(msg, from, Boolean(inscrito));
      return;
    }

    const locais = [
      { id_bairro: inscrito.bairroId, nome: inscrito.bairro, cidade: inscrito.cidade, estado: inscrito.estado, residencia: true },
      ...inscrito.bairrosInteresse,
    ];

    userState.set(from, { step: 'alerta_rel_local', tempData: { inscrito, locais } });

    await msg.reply(
`${titulo('📢', 'RELATAR OCORRÊNCIA')}

📍 *Passo 1 de 4* — Onde está acontecendo?

${listaNumerada(locais, b => `${b.residencia ? '🏠' : '👀'} ${descreverBairro(b)}${b.residencia ? ' — _onde você mora_' : ''}`)}
${opcao(locais.length + 1, '🔎 Outro bairro')}

${RODAPE_CANCELAR}`
    );
  } catch (erroApi) {
    console.error('[ALERTA] Erro ao iniciar relato:', erroApi.message);
    userState.delete(from);
    await msg.reply(ERRO_CONEXAO);
  }
};

const perguntarTipo = async (msg, from, tempData) => {
  userState.set(from, { step: 'alerta_rel_tipo', tempData });

  await msg.reply(
`⚠️ *Passo 2 de 4* — O que está acontecendo em *${tempData.bairro.nome}*?

${listaNumerada(TIPOS, t => t.label)}

${RODAPE_OPCAO}`
  );
};

const mostrarResumoRelato = async (msg, from, tempData) => {
  userState.set(from, { step: 'alerta_rel_confirmar', tempData });

  await msg.reply(
`${titulo('📋', 'CONFIRA SEU RELATO')}

📍 Local: ${descreverBairro(tempData.bairro)}
⚠️ Ocorrência: ${tempData.tipo.label}
🎚️ Gravidade: ${tempData.gravidade.label}
📷 Foto: ${tempData.foto ? '✅ enviada' : '➖ sem foto'}

${opcao(1, '📤 Enviar relato')}
${opcao(2, '❌ Cancelar')}`
  );
};

const enviarRelato = async (msg, from, tempData) => {
  const { ok, status, dados } = await api('POST', '/bot/alertas/relatar', {
    whatsappId: from,
    tipo: tempData.tipo.valor,
    gravidade: tempData.gravidade.valor,
    bairroId: tempData.bairro.id_bairro,
    // Foto opcional: sem foto, vai null
    foto: tempData.foto?.data ?? null,
    fotoMimetype: tempData.foto?.mimetype ?? null,
  });

  userState.delete(from);

  if (!ok) {
    await msg.reply(`${status === 409 ? 'ℹ️' : '❌'} ${dados.mensagem}\n\n${RODAPE_MENU}`);
    return;
  }

  const protocolo = `#A${dados.alerta.id_alerta}`;
  const rodape = `\n\n${SEPARADOR}\n${RODAPE_EMERGENCIA}\n${RODAPE_MENU}`;

  if (dados.situacao === 'disparado') {
    await msg.reply(
`${titulo('🚨', 'OCORRÊNCIA CONFIRMADA')}

✅ Relato recebido e confirmado por *${dados.totalRelatos} moradores*!

📣 O alerta *${protocolo}* está sendo enviado para quem mora ou acompanha o bairro *${tempData.bairro.nome}*.

🙏 Obrigado por ajudar a sua vizinhança!${rodape}`);
  } else if (dados.situacao === 'ja_ativo') {
    await msg.reply(
`${titulo('✅', 'RELATO RECEBIDO')}

ℹ️ Esta ocorrência (*${protocolo}*) já estava confirmada e os moradores já foram avisados.

🙏 Obrigado por reforçar!${rodape}`);
  } else {
    await msg.reply(
`${titulo('✅', 'RELATO RECEBIDO')}

🔖 Protocolo: *${protocolo}*

🛡️ Para evitar alarmes falsos, o alerta só é enviado quando *${dados.confirmacoesNecessarias} pessoas diferentes* relatam a mesma ocorrência.

📊 Relatos até agora: *${dados.totalRelatos}/${dados.confirmacoesNecessarias}*${rodape}`);
  }
};

const processarRelato = async (msg, from, text, state) => {
  const { tempData } = state;

  // ── Local ──
  if (state.step === 'alerta_rel_local') {
    const outro = String(tempData.locais.length + 1);

    if (text === outro) {
      return iniciarSelecaoBairro(msg, from, tempData, 'relato', '🔎 *OUTRO BAIRRO*');
    }

    const local = escolherPorNumero(text, tempData.locais);
    if (!local) {
      await msg.reply(`❌ Digite um número de *1 a ${outro}*.`);
      return;
    }

    tempData.bairro = local;
    return perguntarTipo(msg, from, tempData);
  }

  // ── Tipo ──
  if (state.step === 'alerta_rel_tipo') {
    const tipo = escolherPorNumero(text, TIPOS);
    if (!tipo) {
      await msg.reply(`❌ Digite um número de *1 a ${TIPOS.length}*.`);
      return;
    }

    tempData.tipo = tipo;
    userState.set(from, { step: 'alerta_rel_gravidade', tempData });

    await msg.reply(
`🎚️ *Passo 3 de 4* — Qual a gravidade?

${listaNumerada(GRAVIDADES, g => `${g.label}\n      _${g.descricao}_`)}

${RODAPE_OPCAO}`
    );
    return;
  }

  // ── Gravidade ──
  if (state.step === 'alerta_rel_gravidade') {
    const gravidade = escolherPorNumero(text, GRAVIDADES);
    if (!gravidade) {
      await msg.reply(`❌ Digite um número de *1 a ${GRAVIDADES.length}*.`);
      return;
    }

    tempData.gravidade = gravidade;
    userState.set(from, { step: 'alerta_rel_foto', tempData });

    await msg.reply(
`📷 *Passo 4 de 4* — Se puder, envie uma *foto* da ocorrência.
Ela ajuda os vizinhos a entenderem a situação.

➡️ Sem foto? Digite *pular*.

⚠️ _Só tire a foto se estiver em local seguro._`
    );
    return;
  }

  // ── Foto (opcional) ──
  if (state.step === 'alerta_rel_foto') {
    if (text === 'pular') {
      tempData.foto = null;
      return mostrarResumoRelato(msg, from, tempData);
    }

    if (!msg.hasMedia) {
      await msg.reply('📷 Envie uma *foto* da ocorrência ou digite *pular* para continuar sem foto.');
      return;
    }

    let foto;
    try {
      foto = await baixarFoto(msg, '[ALERTA]');
    } catch (erroFoto) {
      console.error('[ALERTA] Não foi possível baixar a foto:', erroFoto.message);
      await msg.reply('⚠️ Não consegui baixar a imagem.\n\n💡 Tente enviar de novo, envie como *documento* (Clipe 📎 → Documento) ou digite *pular* para continuar sem foto.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.mimetype)) {
      await msg.reply('⚠️ O arquivo precisa ser uma *foto* (JPG ou PNG).\n\n💡 Envie de novo ou digite *pular*.');
      return;
    }

    tempData.foto = foto;
    return mostrarResumoRelato(msg, from, tempData);
  }

  // ── Confirmar ──
  if (state.step === 'alerta_rel_confirmar') {
    if (text === '2') {
      userState.delete(from);
      await msg.reply(`❌ *Relato cancelado.*\n\n${RODAPE_MENU}`);
      return;
    }

    if (text !== '1') {
      await msg.reply('💬 Digite *1* para enviar ou *2* para cancelar.');
      return;
    }

    return enviarRelato(msg, from, tempData);
  }
};


// ── Fluxo principal ────────────────────────────────────────────

export const alertaFlow = async (msg, from, text, state) => {

  if (!state?.step?.startsWith('alerta_')) return false;

  try {
    // "cancelar" funciona em qualquer etapa
    if (text === 'cancelar') {
      userState.delete(from);
      await msg.reply(`✋ *Operação cancelada.*\n\n${RODAPE_MENU}`);
      return true;
    }

    // ── Convite para quem não é inscrito ──
    if (state.step === 'alerta_convite') {
      if (text === '1') {
        userState.set(from, { step: 'alerta_insc_nome', tempData: {} });
        await msg.reply(`${titulo('✍️', 'INSCRIÇÃO NOS ALERTAS')}\n\n👤 *Passo 1 de 3* — Qual o seu *nome*?\n\n${RODAPE_CANCELAR}`);
      } else if (text === '2') {
        await mostrarGrupos(msg, from, await buscarInscrito(from));
      } else if (text === '0') {
        userState.delete(from);
        await enviarMenuPrincipal(msg);
      } else {
        await msg.reply('💬 Digite *1* para se inscrever, *2* para entrar no grupo da cidade ou *0* para voltar.');
      }
      return true;
    }

    // ── Escolha do grupo da cidade ──
    if (state.step === 'alerta_grupo_escolha') {
      const { inscrito, cidades } = state.tempData;

      if (text === '0') {
        await voltarAoMenuAlertas(msg, from, inscrito);
        return true;
      }

      const cidade = escolherPorNumero(text, cidades);
      if (!cidade) {
        await msg.reply(`❌ Digite um número de *1 a ${cidades.length}*, ou *0* para voltar.`);
        return true;
      }

      await enviarLinkGrupo(msg, from, cidade);
      return true;
    }

    // ── Inscrição ──
    if (state.step === 'alerta_insc_nome') {
      const nome = msg.body.trim();
      if (nome.length < 2 || msg.hasMedia) {
        await msg.reply('❌ Digite o seu *nome*.');
        return true;
      }
      state.tempData.nome = nome;
      userState.set(from, { ...state, step: 'alerta_insc_email' });
      await msg.reply(`📧 *Passo 2 de 3* — Prazer, ${nome.split(' ')[0]}! 😊\nQual o seu *e-mail*?`);
      return true;
    }

    if (state.step === 'alerta_insc_email') {
      const email = msg.body.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await msg.reply(erro('E-mail inválido.', 'Exemplo: maria@email.com'));
        return true;
      }
      state.tempData.email = email;
      await iniciarSelecaoBairro(msg, from, state.tempData, 'inscricao', '🏠 *Passo 3 de 3* — Onde você *mora*?');
      return true;
    }

    // ── Menu do inscrito ──
    if (state.step === 'alerta_menu') {
      const { inscrito } = state.tempData;

      if (text === '0') {
        userState.delete(from);
        await enviarMenuPrincipal(msg);
      } else if (text === '1') {
        await iniciarRelato(msg, from);
      } else if (text === '2') {
        await mostrarGrupos(msg, from, inscrito);
      } else if (text === '3') {
        await iniciarSelecaoBairro(msg, from, {}, 'acompanhar', `${titulo('➕', 'ACOMPANHAR OUTRO BAIRRO')}\n\nVocê vai receber também os alertas desse bairro. 👀`);
      } else if (text === '4') {
        if (inscrito.bairrosInteresse.length === 0) {
          await msg.reply('ℹ️ Você não acompanha outros bairros além do bairro onde mora.');
          await mostrarMenuInscrito(msg, from, inscrito);
        } else {
          userState.set(from, { step: 'alerta_remover', tempData: { inscrito } });
          await msg.reply(
`${titulo('➖', 'PARAR DE ACOMPANHAR')}

Qual bairro você quer deixar de acompanhar?

${listaNumerada(inscrito.bairrosInteresse, b => `🏘️ ${descreverBairro(b)}`)}
${opcao(0, '↩️ Voltar')}

${RODAPE_OPCAO}`
          );
        }
      } else if (text === '5') {
        userState.set(from, { step: 'alerta_cancelar_inscricao', tempData: { inscrito } });
        await msg.reply(
`⚠️ *Tem certeza que quer cancelar a inscrição?*
Você deixará de receber os alertas. 🔕

${opcao(1, '🚫 Sim, cancelar')}
${opcao(2, '↩️ Não, voltar')}`
        );
      } else {
        await msg.reply('❌ Digite um número de *0 a 5*.');
      }
      return true;
    }

    // ── Parar de acompanhar ──
    if (state.step === 'alerta_remover') {
      const { inscrito } = state.tempData;

      if (text === '0') {
        await mostrarMenuInscrito(msg, from, inscrito);
        return true;
      }

      const bairro = escolherPorNumero(text, inscrito.bairrosInteresse);
      if (!bairro) {
        await msg.reply(`❌ Digite um número de *1 a ${inscrito.bairrosInteresse.length}*, ou *0* para voltar.`);
        return true;
      }

      const { ok, dados } = await api('DELETE', `/bot/inscritos/${encodeURIComponent(from)}/bairros/${bairro.id_bairro}`);
      await msg.reply(ok ? `✅ Você não receberá mais os alertas de *${bairro.nome}*.` : `❌ ${dados.mensagem}`);
      await mostrarMenuInscrito(msg, from, ok ? dados.inscrito : inscrito);
      return true;
    }

    // ── Cancelar inscrição ──
    if (state.step === 'alerta_cancelar_inscricao') {
      if (text === '1') {
        const { ok, dados } = await api('PATCH', `/bot/inscritos/${encodeURIComponent(from)}/cancelar`);
        userState.delete(from);
        await msg.reply(ok
          ? `✅ *Inscrição cancelada.* Você não receberá mais alertas. 🔕\n\n🔔 Para voltar, digite *oi* e escolha a opção *1*.`
          : `❌ ${dados.mensagem}\n\n${RODAPE_MENU}`);
      } else {
        await mostrarMenuInscrito(msg, from, state.tempData.inscrito);
      }
      return true;
    }

    // ── Seleção de bairro e relato ──
    if (state.step.startsWith('alerta_sel_')) {
      await processarSelecao(msg, from, text, state);
      return true;
    }

    if (state.step.startsWith('alerta_rel_')) {
      await processarRelato(msg, from, text, state);
      return true;
    }

  } catch (erroFluxo) {
    console.error('[ALERTA] Erro no fluxo:', erroFluxo);
    userState.delete(from);
    await msg.reply(ERRO_CONEXAO);
    return true;
  }

  return false;
};
