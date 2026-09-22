import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import alertasRoutes from './alertas.js'
import {
  ErroAlerta, validarId, validarCriacao, validarEdicao, validarTransicao,
  conferirTransicao, conferirVersao, calcularSituacaoEfetiva,
} from './alertas.regras.js'

// Depois de integrar, não precisa de variável alguma. Para testar a entrega
// separada, pode apontar somente para o package.json do Backend já instalado.
const require = createRequire(process.env.ALERTAS_TEST_PACKAGE_JSON || import.meta.url)
const Fastify = require('fastify')
const fastifyJwt = require('@fastify/jwt')
const AGORA = new Date('2030-01-01T12:00:00.000Z')
const CONTEUDO = {
  titulo: 'Alerta de inundação de teste',
  descricao: 'Descrição suficientemente detalhada para validar o formulário.',
  orientacoes: 'Orientações revisadas para o exercício de desenvolvimento.',
  tipo: 'inundacao', severidade: 'alta', regiaoId: 1,
  inicioEm: '2099-01-01T12:00:00.000Z', expiraEm: '2099-01-02T12:00:00.000Z',
  fonteNome: 'Fonte de teste', fonteUrl: 'https://example.com/boletim',
}

function rejeita(acao, status = 400) {
  assert.throws(acao, (erro) => erro instanceof ErroAlerta && erro.statusCode === status)
}

test('normaliza textos/ID, preserva fuso em UTC e aceita referência opcional', () => {
  const resultado = validarCriacao({
    ...CONTEUDO, titulo: `  ${CONTEUDO.titulo}  `, regiaoId: '1', fonteUrl: '',
    inicioEm: '2099-01-01T09:00:00-03:00',
  }, AGORA)
  assert.equal(resultado.titulo, CONTEUDO.titulo)
  assert.equal(resultado.regiaoId, 1)
  assert.equal(resultado.inicioEm.toISOString(), '2099-01-01T12:00:00.000Z')
  assert.equal(resultado.fonteUrl, null)
})

test('rejeita conteúdo curto/longo, enum inválido, ID inadequado e autoria do browser', () => {
  for (const alteracao of [
    { titulo: 'oi' }, { titulo: 'a'.repeat(141) }, { descricao: 'curta' },
    { orientacoes: 'a'.repeat(3001) }, { fonteNome: 'a' }, { fonteNome: 'a'.repeat(161) },
    { tipo: 'desastre_inventado' }, { severidade: 'urgente' }, { regiaoId: 0 },
    { regiaoId: '1e2' }, { regiaoId: 1.5 }, { criadoPorId: 99 }, { status: 'publicado' },
  ]) rejeita(() => validarCriacao({ ...CONTEUDO, ...alteracao }, AGORA))
  for (const valor of [undefined, null, [], 'texto']) rejeita(() => validarCriacao(valor, AGORA))
  for (const valor of ['01', '1.0', '1e2', -1, 0, Infinity, 2147483648]) rejeita(() => validarId(valor))
})

test('rejeita datas inexistentes, sem fuso, invertidas ou vencidas', () => {
  for (const alteracao of [
    { inicioEm: '2099-02-30T10:00:00Z' }, { inicioEm: '2099-01-01T25:00:00Z' },
    { inicioEm: '2099-01-01T12:00' }, { expiraEm: CONTEUDO.inicioEm },
    { expiraEm: '2098-12-30T12:00:00Z' },
    { inicioEm: '2029-12-31T12:00:00Z', expiraEm: AGORA.toISOString() },
  ]) rejeita(() => validarCriacao({ ...CONTEUDO, ...alteracao }, AGORA))
  assert.doesNotThrow(() => validarCriacao({
    ...CONTEUDO, inicioEm: '2029-12-31T12:00:00Z', expiraEm: '2030-01-02T12:00:00Z',
  }, AGORA))
})

test('aceita apenas URL http(s) sem credenciais', () => {
  for (const fonteUrl of ['javascript:alert(1)', 'file:///tmp/arquivo', 'sem-endereco', 'https://usuario:senha@example.com']) {
    rejeita(() => validarCriacao({ ...CONTEUDO, fonteUrl }, AGORA))
  }
  assert.equal(validarCriacao({ ...CONTEUDO, fonteUrl: 'http://example.com' }, AGORA).fonteUrl, 'http://example.com/')
})

test('edição exige versão numérica e transição sensível exige justificativa', () => {
  rejeita(() => validarEdicao(CONTEUDO, AGORA))
  rejeita(() => validarEdicao({ ...CONTEUDO, versao: '1' }, AGORA))
  assert.equal(validarEdicao({ ...CONTEUDO, versao: 1 }, AGORA).versao, 1)
  for (const acao of ['cancelar', 'encerrar', 'devolver_rascunho']) {
    rejeita(() => validarTransicao({ acao, versao: 1 }))
    rejeita(() => validarTransicao({ acao, versao: 1, observacao: 'curta' }))
    assert.equal(validarTransicao({ acao, versao: 1, observacao: 'Motivo registrado.' }).acao, acao)
  }
  rejeita(() => validarTransicao({ acao: 'publicar', versao: 1, observacao: 'a'.repeat(2001) }))
  rejeita(() => validarTransicao({ acao: 'apagar', versao: 1 }))
})

test('fluxo impede publicação direta, alteração de encerrados e publicação vencida', () => {
  const alerta = { ...CONTEUDO, status: 'rascunho', versao: 1 }
  assert.equal(conferirTransicao(alerta, 'enviar_revisao', AGORA), 'em_revisao')
  rejeita(() => conferirTransicao(alerta, 'publicar', AGORA), 409)
  assert.equal(conferirTransicao({ ...alerta, status: 'em_revisao' }, 'publicar', AGORA), 'publicado')
  rejeita(() => conferirTransicao({ ...alerta, status: 'encerrado' }, 'cancelar', AGORA), 409)
  rejeita(() => conferirTransicao({ ...alerta, status: 'em_revisao', expiraEm: AGORA }, 'publicar', AGORA), 409)
  rejeita(() => conferirVersao(alerta, 2), 409)
})

test('situação efetiva respeita início inclusivo e término exclusivo', () => {
  const alerta = { status: 'publicado', inicioEm: '2030-01-01T12:00:00Z', expiraEm: '2030-01-01T13:00:00Z' }
  assert.equal(calcularSituacaoEfetiva(alerta, new Date('2030-01-01T11:59:59Z')), 'agendado')
  assert.equal(calcularSituacaoEfetiva(alerta, AGORA), 'ativo')
  assert.equal(calcularSituacaoEfetiva(alerta, new Date('2030-01-01T13:00:00Z')), 'expirado')
  assert.equal(calcularSituacaoEfetiva({ ...alerta, status: 'cancelado' }, AGORA), 'cancelado')
})

function prismaEmMemoria() {
  let estado = { alertas: [], historico: [] }
  const admin = { id: 1, nome: 'Admin de teste', email: 'admin@example.com', cargo: 'operador' }
  const regiao = { id_regiao: 1, bairro: 'Bairro de teste', cidade: 'Taubaté', estado: 'SP', populacaoEstimada: 100 }
  const controle = { falharHistorico: false, perderAtualizacao: false, desconexoes: 0, condicoes: [] }
  let fila = Promise.resolve()
  function apresentar(item) {
    if (!item) return null
    return {
      ...structuredClone(item), regiao: { ...regiao }, criadoPor: { id: admin.id, nome: admin.nome },
      historico: estado.historico.filter((h) => h.alertaId === item.id_alerta).toReversed().map((h) => ({
        id: h.id, acao: h.acao, observacao: h.observacao, createdAt: h.createdAt,
        ator: { id: admin.id, nome: admin.nome },
      })),
    }
  }
  const prisma = {
    admin: { findFirst: async ({ where }) => where.id === admin.id && where.email === admin.email && where.cargo === admin.cargo ? admin : null },
    regiao: {
      findMany: async () => [regiao],
      findUnique: async ({ where }) => where.id_regiao === regiao.id_regiao ? regiao : null,
    },
    alerta: {
      findMany: async () => estado.alertas.map(apresentar),
      findUnique: async ({ where }) => apresentar(estado.alertas.find((a) => a.id_alerta === where.id_alerta)),
      create: async ({ data }) => {
        const criado = { ...data, id_alerta: estado.alertas.length + 1, status: 'rascunho', versao: 1,
          createdAt: new Date(), updatedAt: new Date(), publicadoEm: null }
        estado.alertas.push(criado)
        return apresentar(criado)
      },
      updateMany: async ({ where, data }) => {
        controle.condicoes.push(where)
        if (controle.perderAtualizacao) return { count: 0 }
        const item = estado.alertas.find((a) => a.id_alerta === where.id_alerta && a.versao === where.versao && a.status === where.status)
        if (!item) return { count: 0 }
        const { versao, ...campos } = data
        Object.assign(item, campos, { versao: item.versao + versao.increment, updatedAt: new Date() })
        return { count: 1 }
      },
    },
    historicoAlerta: { create: async ({ data }) => {
      if (controle.falharHistorico) throw new Error('Falha simulada na gravação do histórico')
      const evento = { ...structuredClone(data), id: estado.historico.length + 1, createdAt: new Date() }
      estado.historico.push(evento)
      return evento
    } },
    $transaction: (callback) => {
      const tarefa = fila.then(async () => {
        const antes = structuredClone(estado)
        try { return await callback(prisma) } catch (erro) { estado = antes; throw erro }
      })
      fila = tarefa.catch(() => {})
      return tarefa
    },
    $disconnect: async () => { controle.desconexoes++ },
  }
  return { prisma, controle, admin, lerEstado: () => structuredClone(estado) }
}

async function fixture(t) {
  const banco = prismaEmMemoria()
  const app = Fastify({ logger: false })
  await app.register(fastifyJwt, { secret: 'chave-exclusiva-do-teste-local-sem-banco' })
  await app.register(alertasRoutes, { prefix: '/api/alertas', prisma: banco.prisma })
  await app.ready()
  t.after(() => app.close())
  const token = app.jwt.sign({ id: banco.admin.id, email: banco.admin.email, cargo: banco.admin.cargo })
  const headers = { authorization: `Bearer ${token}` }
  const req = (method, url, payload) => app.inject({ method, url, headers, ...(payload === undefined ? {} : { payload }) })
  return { ...banco, app, req }
}

test('API autentica admin; bloqueia visitante, voluntário e identidade divergente', async (t) => {
  const { app, req } = await fixture(t)
  assert.equal((await app.inject('/api/alertas')).statusCode, 401)
  for (const claims of [
    { id: 1, email: 'admin@example.com' },
    { id: 1, email: 'outro@example.com', cargo: 'operador' },
    { id: 1, email: 'admin@example.com', cargo: 'admin_inventado' },
  ]) {
    const resposta = await app.inject({ url: '/api/alertas', headers: { authorization: `Bearer ${app.jwt.sign(claims)}` } })
    assert.equal(resposta.statusCode, 403)
  }
  assert.equal((await req('GET', '/api/alertas')).statusCode, 200)
})

test('API responde sem/com barra final e lista a chave correta das regiões', async (t) => {
  const { req } = await fixture(t)
  for (const url of ['/api/alertas', '/api/alertas/']) {
    const resposta = await req('GET', url)
    assert.equal(resposta.statusCode, 200)
    assert.deepEqual(resposta.json(), { alertas: [] })
  }
  const regioes = (await req('GET', '/api/alertas/regioes')).json().regioes
  assert.equal(regioes[0].id_regiao, 1)
  assert.equal(regioes[0].populacaoEstimada, 100)
})

test('API mantém o contrato de erro também para JSON malformado', async (t) => {
  const { app, admin } = await fixture(t)
  const token = app.jwt.sign({ id: admin.id, email: admin.email, cargo: admin.cargo })
  const resposta = await app.inject({
    method: 'POST', url: '/api/alertas', payload: '{"titulo":',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  })
  assert.equal(resposta.statusCode, 400)
  assert.equal(typeof resposta.json().mensagem, 'string')
})

test('API cria com autor da sessão e registra snapshot, região e histórico', async (t) => {
  const { req, lerEstado } = await fixture(t)
  assert.equal((await req('POST', '/api/alertas', { ...CONTEUDO, criadoPorId: 99 })).statusCode, 400)
  assert.equal((await req('POST', '/api/alertas', { ...CONTEUDO, regiaoId: 99 })).statusCode, 400)
  const resposta = await req('POST', '/api/alertas', CONTEUDO)
  assert.equal(resposta.statusCode, 201)
  const { alerta } = resposta.json()
  assert.equal(alerta.criadoPor.id, 1)
  assert.equal(alerta.status, 'rascunho')
  assert.equal(alerta.versao, 1)
  assert.equal(alerta.historico[0].acao, 'criar')
  assert.equal(alerta.historico[0].ator.id, 1)
  assert.equal(alerta.regiao.id_regiao, 1)
  assert.equal(lerEstado().historico[0].snapshot.titulo, CONTEUDO.titulo)
  assert.equal('snapshot' in alerta.historico[0], false)
})

test('API obriga revisão, protege publicação e exige motivo ao encerrar', async (t) => {
  const { req, lerEstado } = await fixture(t)
  await req('POST', '/api/alertas', CONTEUDO)
  const transicao = (acao, versao, observacao) => req('POST', '/api/alertas/1/transicoes', { acao, versao, observacao })
  assert.equal((await transicao('publicar', 1)).statusCode, 409)
  assert.equal((await transicao('enviar_revisao', 1)).json().alerta.status, 'em_revisao')
  assert.equal((await req('PUT', '/api/alertas/1', { ...CONTEUDO, versao: 2 })).statusCode, 409)
  const publicado = (await transicao('publicar', 2)).json().alerta
  assert.equal(publicado.status, 'publicado')
  assert.ok(publicado.publicadoEm)
  assert.equal(publicado.versao, 3)
  assert.equal((await transicao('encerrar', 3)).statusCode, 400)
  assert.equal((await transicao('encerrar', 3, 'Situação acompanhada e encerrada.')).json().alerta.status, 'encerrado')
  assert.equal((await transicao('cancelar', 4, 'Motivo detalhado para cancelamento.')).statusCode, 409)
  assert.equal(lerEstado().historico.length, 4)
})

test('API rejeita versões antigas e guarda uma condição atômica de versão/status', async (t) => {
  const { req, controle, lerEstado } = await fixture(t)
  await req('POST', '/api/alertas', CONTEUDO)
  const respostas = await Promise.all([
    req('PUT', '/api/alertas/1', { ...CONTEUDO, titulo: 'Primeira atualização', versao: 1 }),
    req('PUT', '/api/alertas/1', { ...CONTEUDO, titulo: 'Segunda atualização', versao: 1 }),
  ])
  assert.deepEqual(respostas.map((r) => r.statusCode).sort(), [200, 409])
  assert.deepEqual(controle.condicoes[0], { id_alerta: 1, versao: 1, status: 'rascunho' })
  assert.equal(lerEstado().alertas[0].versao, 2)
  assert.equal(lerEstado().historico.length, 2)
  assert.equal(lerEstado().historico[1].acao, 'editar')
  controle.perderAtualizacao = true
  assert.equal((await req('POST', '/api/alertas/1/transicoes', { acao: 'enviar_revisao', versao: 2 })).statusCode, 409)
  assert.equal(lerEstado().historico.length, 2)
})

test('falha de auditoria desfaz criação/edição e não devolve detalhe interno', async (t) => {
  const { req, controle, lerEstado } = await fixture(t)
  controle.falharHistorico = true
  const falhaCriacao = await req('POST', '/api/alertas', CONTEUDO)
  assert.equal(falhaCriacao.statusCode, 500)
  assert.equal(lerEstado().alertas.length, 0)
  assert.equal(falhaCriacao.body.includes('Falha simulada'), false)
  controle.falharHistorico = false
  await req('POST', '/api/alertas', CONTEUDO)
  controle.falharHistorico = true
  assert.equal((await req('PUT', '/api/alertas/1', { ...CONTEUDO, titulo: 'Mudança não confirmada', versao: 1 })).statusCode, 500)
  assert.equal(lerEstado().alertas[0].titulo, CONTEUDO.titulo)
  assert.equal(lerEstado().alertas[0].versao, 1)
  assert.equal(lerEstado().historico.length, 1)
})

test('fechamento do plugin não desconecta o cliente fornecido pelos testes', async (t) => {
  const { app, controle } = await fixture(t)
  await app.close()
  assert.equal(controle.desconexoes, 0)
})
