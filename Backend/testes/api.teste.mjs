// Teste de ponta a ponta da API (58 verificações)
//
// Pré-requisitos, cada um num terminal, na pasta Backend:
//   1. npm run banco:teste   → banco em memória (comece SEMPRE com ele recém-aberto)
//   2. npm run back:teste    → API em modo teste
// Depois:
//   3. npm run teste:api
//
// Cada linha mostra OK ou FALHOU. Nada é gravado no Supabase.
// Precisa de internet só para consultar o CEP no ViaCEP.
const API = (process.env.API_URL || 'http://127.0.0.1:3000') + '/api'
const BOT = { 'x-bot-key': 'chave-de-teste' }
let token = ''
let falhas = 0

async function req(metodo, caminho, corpo, headers = {}) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { ...(corpo ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const texto = await r.text()
  let dados; try { dados = JSON.parse(texto) } catch { dados = texto }
  return { status: r.status, dados }
}
function checar(nome, condicao, extra) {
  console.log(`${condicao ? 'OK  ' : 'FALHOU'} ${nome}${condicao ? '' : ' → ' + JSON.stringify(extra)}`)
  if (!condicao) falhas++
}
const FOTO = Buffer.from('fake-jpeg').toString('base64')

// ── Trava de segurança: só roda contra a API em MODO TESTE ──
// A API de teste aceita a chave "chave-de-teste"; a API real responde 401.
// Sem isso, se a API real estiver aberta na porta 3000, o teste gravaria no Supabase.
{
  const r = await req('GET', '/bot/inscritos/verificacao-modo-teste', null, BOT)
  if (r.status !== 404) {
    console.error(`\n✗ A API em ${API} NÃO está em modo teste (resposta ${r.status}).`)
    console.error('  Feche a API normal (npm run back / npm run dev) e rode: npm run banco:teste  e  npm run back:teste')
    process.exit(1)
  }

  // Este teste cria as próprias cidades — precisa do banco vazio
  const cidades = await req('GET', '/cidades/listar')
  if (cidades.dados.cidades?.length > 0) {
    console.error('\n✗ O banco de teste já tem dados. Este teste precisa do banco VAZIO.')
    console.error('  Feche o banco (Ctrl + C) e abra com: npm run banco:teste:vazio')
    process.exit(1)
  }
}

// ── Regiões
let r = await req('GET', '/estados/listar')
checar('27 estados', r.dados.estados?.length === 27, r)
const sp = r.dados.estados.find(e => e.sigla === 'SP')

r = await req('POST', '/auth/cadastrar', { nome: 'Admin', email: 'adm@teste.com', senha: '123456' })
r = await req('POST', '/auth/login', { email: 'adm@teste.com', senha: '123456' })
checar('login admin', r.status === 200 && r.dados.token, r)
const tokenAdmin = r.dados.token

r = await req('POST', '/cidades/cadastrar', { nome: 'Taubaté', estadoId: sp.id_estado })
checar('cadastrar cidade sem token → 401', r.status === 401, r)

token = tokenAdmin
r = await req('POST', '/cidades/cadastrar', { nome: 'Taubaté', estadoId: sp.id_estado })
checar('cadastrar cidade', r.status === 201, r)
const taubate = r.dados.cidade
r = await req('POST', '/cidades/cadastrar', { nome: 'taubate', estadoId: sp.id_estado })
checar('cidade duplicada (sem acento) → 400', r.status === 400, r)
r = await req('PUT', `/cidades/atualizar/${taubate.id_cidade}`, { grupoWhatsappId: 'grupo-invalido' })
checar('grupo inválido → 400', r.status === 400, r)

r = await req('POST', '/bairros/cadastrar', { nome: 'Centro', cidadeId: taubate.id_cidade, nivelRisco: 'alto', populacaoEstimada: '5000' })
checar('cadastrar bairro', r.status === 201 && r.dados.bairro.nivelRisco === 'alto', r)
const centro = r.dados.bairro
r = await req('POST', '/bairros/cadastrar', { nome: 'Independência', cidadeId: taubate.id_cidade })
const independencia = r.dados.bairro
r = await req('POST', '/bairros/cadastrar', { nome: 'X', cidadeId: taubate.id_cidade, nivelRisco: 'extremo' })
checar('nível de risco inválido → 400', r.status === 400, r)
r = await req('GET', `/bairros/listar?cidadeId=${taubate.id_cidade}`)
checar('listar bairros da cidade', r.dados.bairros?.length === 2 && r.dados.bairros[0].cidade === 'Taubaté', r)

r = await req('GET', '/bairros/cep/12070610')
checar('consultar CEP (ViaCEP)', r.status === 200 && r.dados.cidadeId === taubate.id_cidade, r)
console.log('     ViaCEP →', r.dados.bairro, '/', r.dados.cidade, '/', r.dados.uf)
r = await req('GET', '/bairros/cep/99999999')
checar('CEP inexistente → 404', r.status === 404, r)

// ── Abrigo com a nova localização
r = await req('POST', '/abrigos/cadastrar', { nome: 'Escola A', cep: '12000-000', cidadeId: taubate.id_cidade, bairroId: independencia.id_bairro, endereco: 'Rua 1', tipoAbrigo: 'Escola', capacidadeTotal: 10, capacidadeOcupada: 0 })
checar('cadastrar abrigo', r.status === 201 && r.dados.cidade === 'Taubaté' && r.dados.bairro === 'Independência', r)
const abrigoId = r.dados.id
r = await req('POST', '/abrigos/cadastrar', { nome: 'Escola B', cep: '12000-000', cidadeId: 999, endereco: 'Rua 2', tipoAbrigo: 'Escola', capacidadeTotal: 10 })
checar('abrigo com cidade inexistente → 400', r.status === 400, r)
r = await req('GET', '/abrigos/listar')
checar('listar abrigos (achatado)', r.dados.abrigos?.[0]?.cidade === 'Taubaté' && r.dados.abrigos[0].estado === 'SP', r)
r = await req('GET', `/abrigos/listar/${abrigoId}`)
checar('detalhe abrigo (achatado)', r.dados.cidade === 'Taubaté' && r.dados.bairroId === independencia.id_bairro, r)
r = await req('PUT', `/abrigos/atualizar/${abrigoId}`, { nome: 'Escola A', bairroId: centro.id_bairro })
checar('atualizar bairro do abrigo', r.status === 200 && r.dados.bairro === 'Centro', r)

// ── Solicitação de abrigo
r = await req('POST', '/solicitacoes/criar', { nome: 'Igreja', cep: '1', endereco: 'Rua', cidadeId: taubate.id_cidade, responsavel: 'F', tipoAbrigo: 'Igreja', capacidadeTotal: 5, solicitanteNome: 'F', solicitanteEmail: 'f@f.com' })
checar('criar solicitação de abrigo', r.status === 201, r)
r = await req('GET', '/solicitacoes/listar')
checar('listar solicitações (achatado)', r.dados.solicitacoes?.[0]?.cidade === 'Taubaté', r)

// ── Bot
token = ''
r = await req('POST', '/bot/inscritos', { whatsappId: 'a@c.us', nome: 'Ana', email: 'ana@x.com', bairroId: centro.id_bairro })
checar('bot sem chave → 401', r.status === 401, r)
const inscrever = (w, n, b) => req('POST', '/bot/inscritos', { whatsappId: w, telefone: w.split('@')[0], nome: n, email: `${n}@x.com`, bairroId: b }, BOT)
r = await inscrever('551100000001@c.us', 'Ana', centro.id_bairro)
checar('inscrever', r.status === 201 && r.dados.inscrito.bairro === 'Centro', r)
await inscrever('551100000002@c.us', 'Bia', centro.id_bairro)
await inscrever('551100000003@c.us', 'Caio', centro.id_bairro)
await inscrever('551100000004@c.us', 'Duda', independencia.id_bairro)
await inscrever('551100000005@c.us', 'Edu', independencia.id_bairro)
r = await req('POST', '/bot/inscritos', { whatsappId: 'x@c.us', nome: 'Z', email: 'invalido', bairroId: centro.id_bairro }, BOT)
checar('e-mail inválido → 400', r.status === 400, r)

r = await req('POST', '/bot/inscritos/551100000004@c.us/bairros', { bairroId: centro.id_bairro }, BOT)
checar('Duda acompanha Centro', r.status === 201 && r.dados.inscrito.bairrosInteresse.length === 1, r)
r = await req('POST', '/bot/inscritos/551100000004@c.us/bairros', { bairroId: independencia.id_bairro }, BOT)
checar('acompanhar o próprio bairro → 400', r.status === 400, r)
r = await req('GET', '/bot/inscritos/551100000004@c.us', null, BOT)
checar('buscar inscrito', r.dados.inscrito?.nome === 'Duda', r)

r = await req('POST', '/bot/bairros/cep', { cep: '12070610' }, BOT)
checar('criar bairro pelo CEP', [200, 201].includes(r.status) && r.dados.bairro.cidadeId === taubate.id_cidade, r)
console.log('     bairro via CEP →', r.dados.bairro?.nome, '| criou:', r.dados.criouBairro)

r = await req('PUT', `/bot/cidades/${taubate.id_cidade}/grupo`, { grupoWhatsappId: '120363000000@g.us' }, BOT)
checar('vincular grupo', r.status === 200, r)

// ── Relatos
const relatar = (w, extra = {}) => req('POST', '/bot/alertas/relatar', { whatsappId: w, tipo: 'alagamento', gravidade: 'grave', bairroId: centro.id_bairro, foto: FOTO, ...extra }, BOT)
r = await relatar('naoinscrito@c.us')
checar('não inscrito não relata → 403', r.status === 403, r)
r = await relatar('551100000001@c.us', { foto: null })
checar('relato sem foto → 400', r.status === 400, r)
r = await relatar('551100000001@c.us')
checar('1º relato: aguardando 1/3', r.dados.situacao === 'aguardando_confirmacao' && r.dados.totalRelatos === 1, r)
const alertaId = r.dados.alerta.id_alerta
r = await relatar('551100000001@c.us')
checar('mesma pessoa de novo → 409', r.status === 409, r)
r = await relatar('551100000002@c.us', { gravidade: 'medio' })
checar('2º relato: aguardando 2/3', r.dados.situacao === 'aguardando_confirmacao' && r.dados.totalRelatos === 2, r)
r = await relatar('551100000003@c.us', { gravidade: 'medio' })
checar('3º relato: disparado', r.dados.situacao === 'disparado' && r.dados.alerta.status === 'ativo', r)
checar('gravidade = mais relatada (médio)', r.dados.alerta.gravidade === 'medio', r.dados.alerta)
r = await relatar('551100000004@c.us')
checar('4º relato: já ativo', r.dados.situacao === 'ja_ativo', r)
r = await relatar('551100000005@c.us', { tipo: 'incendio' })
checar('tipo diferente abre outro alerta', r.dados.alerta.id_alerta !== alertaId, r)

// ── Fila
r = await req('POST', '/bot/notificacoes/reservar', { limite: 50 }, BOT)
const fila = r.dados.notificacoes
const inscritosNaFila = fila.filter(n => n.tipoDestino === 'inscrito').map(n => n.destino).sort()
checar('fila: 4 inscritos (Ana, Bia, Caio + Duda que acompanha) + 1 grupo', inscritosNaFila.length === 4 && fila.filter(n => n.tipoDestino === 'grupo').length === 1 && !inscritosNaFila.includes('551100000005@c.us'), fila.map(n => n.destino))
console.log('\n----- mensagem enviada ao inscrito -----\n' + fila.find(n => n.tipoDestino === 'inscrito').mensagem + '\n-----------------------------------------\n')
r = await req('POST', '/bot/notificacoes/reservar', {}, BOT)
checar('fila não repete o que está enviando', r.dados.notificacoes.length === 0, r)
for (const n of fila.slice(0, 3)) await req('PATCH', `/bot/notificacoes/${n.id_notificacao}`, { sucesso: true }, BOT)
await req('PATCH', `/bot/notificacoes/${fila[3].id_notificacao}`, { sucesso: false, erro: 'número inválido' }, BOT)
r = await req('POST', '/bot/notificacoes/reservar', {}, BOT)
checar('falha volta para a fila (tentativa 2)', r.dados.notificacoes.length === 1 && r.dados.notificacoes[0].tentativas === 2, r)

// ── Painel admin
token = tokenAdmin
r = await req('GET', '/alertas/listar')
checar('listar alertas', r.dados.total === 2 && r.dados.alertas.some(a => a.cidade === 'Taubaté'), r)
r = await req('GET', `/alertas/listar/${alertaId}`)
checar('detalhe alerta com relatos', r.dados.relatos?.length === 4 && r.dados.notificacoes.resumo.length > 0, r)
r = await req('GET', '/abrigos/listar')
checar('abrigo no bairro com alerta ativo → statusAlerta', r.dados.abrigos[0].statusAlerta === true, r.dados.abrigos[0])

r = await req('PATCH', `/alertas/cancelar/${alertaId}`, {})
checar('cancelar sem motivo → 400', r.status === 400, r)
r = await req('PATCH', `/alertas/cancelar/${alertaId}`, { motivo: 'Relato falso' })
checar('cancelar alerta disparado gera correções', r.status === 200 && r.dados.correcoes >= 3, r)
r = await req('PATCH', `/alertas/encerrar/${alertaId}`)
checar('encerrar alerta cancelado → 400', r.status === 400, r)

// Confirmar manualmente o alerta de incêndio (1 relato)
const incendio = (await req('GET', '/alertas/listar?tipo=incendio')).dados.alertas[0]
r = await req('PATCH', `/alertas/confirmar/${incendio.id_alerta}`)
// 4 moradores do Centro (Ana, Bia, Caio + Duda que acompanha) + o grupo da cidade
checar('admin confirma e dispara', r.status === 200 && r.dados.totalNotificacoes === 5, r)
r = await req('PATCH', `/alertas/confirmar/${incendio.id_alerta}`)
checar('confirmar de novo → 400', r.status === 400, r)
r = await req('PATCH', `/alertas/encerrar/${incendio.id_alerta}`)
checar('encerrar', r.status === 200, r)

// ── Concorrência: 3 relatos ao mesmo tempo → 1 alerta, 1 disparo
token = ''
const simultaneos = await Promise.all(['551100000001@c.us', '551100000002@c.us', '551100000003@c.us']
  .map(w => relatar(w, { tipo: 'deslizamento' })))
const ids = new Set(simultaneos.map(s => s.dados.alerta?.id_alerta))
checar('relatos simultâneos → mesmo alerta', ids.size === 1, simultaneos.map(s => s.dados))
checar('relatos simultâneos → disparado uma vez', simultaneos.filter(s => s.dados.situacao === 'disparado').length === 1, simultaneos.map(s => s.dados.situacao))

// ── Inscritos (admin)
token = tokenAdmin
r = await req('GET', `/inscritos/listar?bairroId=${centro.id_bairro}`)
checar('inscritos do Centro (moram + acompanham)', r.dados.total === 4, r.dados.inscritos?.map(i => i.nome))
const duda = r.dados.inscritos.find(i => i.nome === 'Duda')
r = await req('PUT', `/inscritos/atualizar/${duda.id_inscrito}`, { bairrosInteresse: [], ativo: false })
checar('atualizar inscrito', r.status === 200 && r.dados.inscrito.bairrosInteresse.length === 0 && r.dados.inscrito.ativo === false, r)
r = await req('GET', `/inscritos/listar/${duda.id_inscrito}`)
checar('detalhe inscrito com relatos', r.dados.relatos?.length === 1, r)
r = await req('GET', '/inscritos/listar?busca=bia')
checar('busca por nome', r.dados.total === 1, r)

// ── Exclusões bloqueadas / permitidas
r = await req('DELETE', `/bairros/excluir/${centro.id_bairro}`)
checar('excluir bairro em uso → 400', r.status === 400, r)
r = await req('DELETE', `/cidades/excluir/${taubate.id_cidade}`)
checar('excluir cidade em uso → 400', r.status === 400, r)
r = await req('DELETE', `/alertas/excluir/${alertaId}`)
checar('excluir alerta', r.status === 200, r)
r = await req('DELETE', `/inscritos/excluir/${duda.id_inscrito}`)
checar('excluir inscrito', r.status === 200, r)

// ── Token de voluntário não acessa rotas de admin
await req('POST', '/voluntarios/cadastrar', { nome: 'Vol', email: 'vol@x.com', senha: '123456', dataNascimento: '2000-01-01', genero: 'outro' })
r = await req('POST', '/voluntarios/login', { email: 'vol@x.com', senha: '123456' })
token = r.dados.token
r = await req('GET', '/alertas/listar')
checar('token de voluntário em rota admin → 403', r.status === 403, r)

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} TESTE(S) FALHARAM`)
process.exit(falhas ? 1 : 0)
