// Dados de DEMONSTRAÇÃO no banco NORMAL (Supabase) — para apresentar o sistema
// sem precisar do modo teste.
//
// Uso (na pasta Backend):
//   npm run backup                 → antes de tudo, guarda uma cópia do banco
//   npm run demo:dados             → cria os dados (pode rodar de novo sem duplicar)
//   npm run demo:remover           → apaga só o que este script criou
//
// Rode o "demo:dados" de novo pouco antes da apresentação: o alerta de
// alagamento em verificação só aceita novos relatos por ALERTA_JANELA_HORAS
// (6 h) depois de criado, então o script "renova" esse alerta.
//
// Os moradores de exemplo usam números com DDD 00 (não existem), para o bot
// nunca mandar alerta para um estranho. Quando um alerta disparar, o envio para
// eles falha e aparece no log do bot — isso é esperado.
import bcrypt from 'bcrypt'
import prisma from '../src/lib/prisma.js'

const REMOVER = process.argv.includes('--remover')

// Tudo o que o script cria é reconhecido por estas marcas
const PREFIXO_WHATSAPP = '5500'                  // moradores de exemplo
const EMAIL_VOLUNTARIO = 'voluntario@teste.com'
const ABRIGOS = ['Escola Municipal Centro', 'Ginásio Poliesportivo', 'Centro Comunitário Moreira César']
// Vítimas de exemplo: telefone "(00) 9xxxx-0000" (DDD 00 não existe)
const PREFIXO_TELEFONE_VITIMA = '(00) 9'

// Nomes para montar as vítimas de exemplo (combinação nome + sobrenome)
const NOMES = [
  ['Maria', 'Feminino'], ['José', 'Masculino'], ['Ana', 'Feminino'], ['João', 'Masculino'],
  ['Francisca', 'Feminino'], ['Antônio', 'Masculino'], ['Juliana', 'Feminino'], ['Carlos', 'Masculino'],
  ['Luzia', 'Feminino'], ['Pedro', 'Masculino'], ['Beatriz', 'Feminino'], ['Lucas', 'Masculino'],
  ['Helena', 'Feminino'], ['Rafael', 'Masculino'], ['Sebastiana', 'Feminino'], ['Gabriel', 'Masculino'],
  ['Alice', 'Feminino'], ['Miguel', 'Masculino'], ['Rosa', 'Feminino'], ['Benedito', 'Masculino'],
  ['Sam', 'Outro'],
]
const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Lima', 'Carvalho', 'Ferreira',
  'Rodrigues', 'Almeida', 'Costa', 'Gomes', 'Ribeiro', 'Martins', 'Rocha', 'Barbosa',
]
const DEFICIENCIAS = [
  'Física', 'Visual', 'Auditiva', 'Intelectual', 'TEA', 'Múltipla', 'Psicossocial', 'Surdocegueira',
  'Nanismo', 'Paralisia Cerebral', 'Mobilidade Reduzida', 'Deficiência de Fala',
  'Transtorno de Aprendizagem', 'Síndrome de Down', 'Epilepsia',
]
const BAIRROS = [
  // [nome, cidade, risco]
  ['Centro', 'Taubaté', 'alto'],
  ['Independência', 'Taubaté', 'medio'],
  ['Centro', 'Caçapava', 'baixo'],
  ['Centro', 'Pindamonhangaba', 'baixo'],
  ['Moreira César', 'Pindamonhangaba', 'alto'],
]
const MORADORES = [
  // [nome, número, bairro, cidade]
  ['Ana', '5500900000001', 'Centro', 'Taubaté'],
  ['Bruno', '5500900000002', 'Centro', 'Taubaté'],
  ['Carla', '5500900000003', 'Independência', 'Taubaté'],
  ['Daniel', '5500900000004', 'Moreira César', 'Pindamonhangaba'],
  ['Eduarda', '5500900000005', 'Centro', 'Caçapava'],
]

// ─── Auxiliares ──────────────────────────────────────────────────────────────
async function cidadeSP(nome) {
  const cidade = await prisma.cidade.findFirst({ where: { nome, estado: { sigla: 'SP' } } })
  if (cidade) return cidade
  const sp = await prisma.estado.findFirstOrThrow({ where: { sigla: 'SP' } })
  console.log(`  + cidade ${nome}`)
  return prisma.cidade.create({ data: { nome, estadoId: sp.id_estado } })
}

async function bairro(nome, nomeCidade, nivelRisco) {
  const cidade = await cidadeSP(nomeCidade)
  const existente = await prisma.bairro.findUnique({ where: { nome_cidadeId: { nome, cidadeId: cidade.id_cidade } } })
  if (existente) return existente
  console.log(`  + bairro ${nome} (${nomeCidade})`)
  return prisma.bairro.create({ data: { nome, cidadeId: cidade.id_cidade, nivelRisco } })
}

// Coordenadas pelo Nominatim (OpenStreetMap); null se não achar ou sem internet
async function coordenadas(texto) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(texto)}`
    const resposta = await fetch(url, { headers: { 'User-Agent': 'SOS-Vale-demonstracao (projeto academico)' } })
    const [achado] = await resposta.json()
    return achado ? [parseFloat(achado.lat), parseFloat(achado.lon)] : null
  } catch {
    return null
  }
}

// Compara, em TODOS os abrigos, a ocupação registrada com as vítimas vinculadas.
// Não altera nada — só informa.
async function conferirOcupacao() {
  const abrigos = await prisma.abrigo.findMany({
    orderBy: { id_abrigo: 'asc' },
    select: { id_abrigo: true, nome: true, capacidadeTotal: true, capacidadeOcupada: true, _count: { select: { vitimas: true } } }
  })
  console.log('\nConferência da ocupação (pessoas no abrigo × vítimas cadastradas)')
  let problemas = 0
  for (const a of abrigos) {
    const cadastradas = a._count.vitimas
    const diferenca = a.capacidadeOcupada - cadastradas
    let situacao = 'ok'
    if (diferenca > 0) situacao = `⚠ ${diferenca} pessoa(s) no abrigo SEM cadastro de vítima`
    if (diferenca < 0) situacao = `⚠ ${-diferenca} vítima(s) cadastrada(s) a mais do que a ocupação registrada`
    if (diferenca !== 0) problemas++
    console.log(`  #${a.id_abrigo} ${a.nome}: ocupação ${a.capacidadeOcupada}/${a.capacidadeTotal}, ${cadastradas} vítima(s) cadastrada(s) — ${situacao}`)
  }
  console.log(problemas === 0
    ? '  Todos os abrigos batem: não há ninguém no abrigo sem cadastro.'
    : `  ${problemas} abrigo(s) com diferença.`)
}

async function acharBairro(nome, nomeCidade) {
  return prisma.bairro.findFirst({ where: { nome, cidade: { nome: nomeCidade, estado: { sigla: 'SP' } } } })
}

// ─── Criar ───────────────────────────────────────────────────────────────────
async function criar() {
  const admin = await prisma.admin.findFirst({ orderBy: { id: 'asc' } })
  if (!admin) throw new Error('Nenhum admin cadastrado — crie um pelo painel antes.')

  console.log('Regiões')
  const b = {}
  for (const [nome, cidade, risco] of BAIRROS) b[`${nome}/${cidade}`] = await bairro(nome, cidade, risco)
  const taubate = await cidadeSP('Taubaté')
  const cacapava = await cidadeSP('Caçapava')

  console.log('Abrigos')
  // A ocupação NÃO é definida aqui: ela é sempre igual ao número de vítimas
  // vinculadas (acertada mais abaixo, depois de cadastrar as vítimas)
  const abrigo = async (dados) => {
    const existente = await prisma.abrigo.findFirst({ where: { nome: dados.nome } })
    if (existente) {
      // Garante a capacidade da demonstração (versões antigas do script usavam outra)
      return prisma.abrigo.update({ where: { id_abrigo: existente.id_abrigo }, data: { capacidadeTotal: dados.capacidadeTotal } })
    }
    console.log(`  + ${dados.nome}`)
    return prisma.abrigo.create({
      data: { telefone: '(12) 3600-0000', responsavel: 'Maria Souza', ...dados }
    })
  }
  const escola = await abrigo({
    nome: ABRIGOS[0], cep: '12010-000', endereco: 'Rua Quatro de Março, 100', tipoAbrigo: 'Escola',
    capacidadeTotal: 40, latitude: -23.0262, longitude: -45.5553,
    possuiCozinha: true, possuiAcessibilidade: true,
    cidadeId: taubate.id_cidade, bairroId: b['Centro/Taubaté'].id_bairro,
  })
  // Quase lotado (90%) → aparece em "Abrigos que precisam de ajuda" no painel do voluntário
  const ginasio = await abrigo({
    nome: ABRIGOS[1], cep: '12281-000', endereco: 'Av. Brasil, 500', tipoAbrigo: 'Ginásio',
    capacidadeTotal: 20, latitude: -23.1008, longitude: -45.7069,
    possuiEnfermagem: true, possuiPets: true,
    cidadeId: cacapava.id_cidade, bairroId: b['Centro/Caçapava'].id_bairro,
  })
  const pinda = await cidadeSP('Pindamonhangaba')
  const pontoMoreira = await coordenadas('Moreira César, Pindamonhangaba, SP, Brasil') ?? [-22.9238, -45.4603]
  const comunitario = await abrigo({
    nome: ABRIGOS[2], cep: '12440-000', endereco: 'Moreira César', tipoAbrigo: 'Centro comunitário',
    capacidadeTotal: 30, latitude: pontoMoreira[0], longitude: pontoMoreira[1],
    possuiAtendimentoMedico: true, possuiCozinha: true, possuiAcessibilidade: true,
    cidadeId: pinda.id_cidade, bairroId: b['Moreira César/Pindamonhangaba'].id_bairro,
  })

  console.log('Vítimas acolhidas')
  // Tipos de deficiência (os mesmos do "npm run seed"; não duplica)
  await prisma.deficiencia.createMany({ data: DEFICIENCIAS.map(nome => ({ nome })), skipDuplicates: true })
  const deficiencias = await prisma.deficiencia.findMany({ where: { nome: { in: ['Física', 'Visual', 'Auditiva', 'Mobilidade Reduzida', 'TEA'] } } })

  // [abrigo, quantas vítimas, número inicial]: os números iniciais separam as
  // vítimas de cada abrigo e formam o telefone fictício de cada uma
  const lotes = [[escola, 12, 1], [ginasio, 18, 101], [comunitario, 9, 201]]
  for (const [abrigoDoLote, quantidade, inicio] of lotes) {
    let criadas = 0
    for (let n = inicio; n < inicio + quantidade; n++) {
      const telefone = `${PREFIXO_TELEFONE_VITIMA}${String(n).padStart(4, '0')}-0000`
      const existente = await prisma.vitima.findUnique({ where: { telefone } })
      if (existente) {
        // Garante que continua no abrigo certo
        if (existente.abrigoId !== abrigoDoLote.id_abrigo) {
          await prisma.vitima.update({ where: { id_vitima: existente.id_vitima }, data: { abrigoId: abrigoDoLote.id_abrigo } })
        }
        continue
      }
      const [primeiroNome, genero] = NOMES[n % NOMES.length]
      const sobrenome = `${SOBRENOMES[n % SOBRENOMES.length]} ${SOBRENOMES[(n * 7 + 3) % SOBRENOMES.length]}`
      // Idades variadas (de 2 a 88 anos) e entrada nos últimos 10 dias
      const idade = 2 + ((n * 37) % 87)
      const nascimento = new Date(Date.UTC(new Date().getFullYear() - idade, (n * 5) % 12, 1 + (n * 11) % 28))
      const entrada = new Date(Date.now() - ((n * 13) % 10) * 24 * 60 * 60 * 1000)
      // 1 em cada 5 tem alguma deficiência
      const deficiencia = n % 5 === 0 && deficiencias.length ? deficiencias[n % deficiencias.length] : null

      await prisma.vitima.create({
        data: {
          nome: `${primeiroNome} ${sobrenome}`, telefone, genero,
          dataNascimento: nascimento, dataEntrada: entrada, abrigoId: abrigoDoLote.id_abrigo,
          deficiencias: deficiencia ? { create: [{ id_deficiencia: deficiencia.id_deficiencia }] } : undefined,
        }
      })
      criadas++
    }
    if (criadas) console.log(`  + ${criadas} vítima(s) em ${abrigoDoLote.nome}`)
  }

  // Ocupação = vítimas vinculadas (só nos abrigos da demonstração)
  for (const nome of ABRIGOS) {
    const a = await prisma.abrigo.findFirst({ where: { nome } })
    const vinculadas = await prisma.vitima.count({ where: { abrigoId: a.id_abrigo } })
    await prisma.abrigo.update({ where: { id_abrigo: a.id_abrigo }, data: { capacidadeOcupada: vinculadas } })
    console.log(`  = ${nome}: ${vinculadas}/${a.capacidadeTotal} pessoas`)
  }

  console.log('Voluntário')
  let voluntario = await prisma.voluntario.findUnique({ where: { email: EMAIL_VOLUNTARIO } })
  if (!voluntario) {
    console.log(`  + ${EMAIL_VOLUNTARIO}`)
    voluntario = await prisma.voluntario.create({
      data: {
        nome: 'Vitor Voluntário', email: EMAIL_VOLUNTARIO, senha: await bcrypt.hash('123456', 10),
        telefone: '(12) 99999-0000', dataNascimento: new Date('1995-05-20'), genero: 'masculino',
      }
    })
  }

  console.log('Solicitações de ajuda')
  const ajuda = async (titulo, descricao, categoria, urgencia, status, abrigoId, voluntarioId = null) => {
    const existente = await prisma.solicitacaoAjuda.findFirst({ where: { titulo, abrigoId } })
    if (existente) return existente
    console.log(`  + ${titulo}`)
    return prisma.solicitacaoAjuda.create({
      data: { titulo, descricao, categoria, urgencia, status, abrigoId, voluntarioId, criadoPorId: admin.id }
    })
  }
  const cobertores = await ajuda('Cobertores e colchões', 'Precisamos de 40 cobertores e 20 colchonetes.', 'doacao', 'alta', 'aberto', ginasio.id_abrigo)
  await ajuda('Insulina e medicamentos de pressão', 'Três acolhidos com diabetes e hipertensão.', 'medicamento', 'critica', 'aberto', ginasio.id_abrigo)
  await ajuda('Voluntários para a cozinha', 'Turno da noite, preparo do jantar.', 'voluntariado', 'media', 'em_andamento', escola.id_abrigo, voluntario.id_voluntario)
  await ajuda('Kits de higiene', 'Sabonete, escova e pasta de dente.', 'doacao', 'baixa', 'aberto', escola.id_abrigo)
  await ajuda('Conserto do chuveiro', 'Vestiário masculino sem água quente.', 'infraestrutura', 'media', 'concluido', escola.id_abrigo, voluntario.id_voluntario)
  await prisma.solicitacaoAjudaInteresse.upsert({
    where: { solicitacaoId_voluntarioId: { solicitacaoId: cobertores.id_solicitacao, voluntarioId: voluntario.id_voluntario } },
    create: { solicitacaoId: cobertores.id_solicitacao, voluntarioId: voluntario.id_voluntario },
    update: {},
  })

  console.log('Moradores inscritos (números fictícios, DDD 00)')
  const morador = {}
  for (const [nome, numero, nomeBairro, cidade] of MORADORES) {
    const whatsappId = `${numero}@c.us`
    morador[nome] = await prisma.inscritoAlerta.findUnique({ where: { whatsappId } })
    if (!morador[nome]) {
      console.log(`  + ${nome}`)
      morador[nome] = await prisma.inscritoAlerta.create({
        data: {
          nome, whatsappId, telefone: numero, email: `${nome.toLowerCase()}@teste.com`,
          bairroId: b[`${nomeBairro}/${cidade}`].id_bairro,
        }
      })
    }
  }
  // Carla mora na Independência e acompanha o Centro
  await prisma.inscritoBairro.upsert({
    where: { inscritoId_bairroId: { inscritoId: morador.Carla.id_inscrito, bairroId: b['Centro/Taubaté'].id_bairro } },
    create: { inscritoId: morador.Carla.id_inscrito, bairroId: b['Centro/Taubaté'].id_bairro },
    update: {},
  })

  console.log('Alertas')
  const centro = b['Centro/Taubaté']
  const idsDemo = [morador.Ana.id_inscrito, morador.Bruno.id_inscrito]

  // Alerta de alagamento no Centro de Taubaté com 2 de 3 relatos:
  // na apresentação, o 3º relato (pelo bot) dispara o alerta
  const alertaAberto = await prisma.alerta.findFirst({
    where: {
      bairroId: centro.id_bairro, tipo: 'alagamento', status: { in: ['em_verificacao', 'ativo'] },
      // Só mexe no alerta criado por este script (com relatos da Ana/Bruno)
      relatos: { some: { inscritoId: { in: idsDemo } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (alertaAberto?.status === 'ativo') {
    console.log(`  ! já existe um alerta de alagamento ATIVO no Centro de Taubaté (#${alertaAberto.id_alerta}).`)
    console.log('    Encerre-o no painel (Alertas) e rode este script de novo para recriar o de 2/3.')
  } else if (alertaAberto) {
    await prisma.alerta.update({ where: { id_alerta: alertaAberto.id_alerta }, data: { createdAt: new Date() } })
    console.log(`  ~ alagamento no Centro (#${alertaAberto.id_alerta}) renovado — aceita relatos pelas próximas horas`)
  } else {
    const alerta = await prisma.alerta.create({
      data: {
        tipo: 'alagamento', gravidade: 'grave', bairroId: centro.id_bairro,
        relatos: { create: idsDemo.map(inscritoId => ({ inscritoId, gravidade: 'grave' })) },
      }
    })
    console.log(`  + alagamento no Centro de Taubaté com 2/3 relatos (#${alerta.id_alerta})`)
  }

  // Um alerta antigo já encerrado, para o histórico não ficar vazio
  const moreira = b['Moreira César/Pindamonhangaba']
  const antigo = await prisma.alerta.findFirst({
    where: { bairroId: moreira.id_bairro, tipo: 'deslizamento', relatos: { some: { inscritoId: morador.Daniel.id_inscrito } } }
  })
  if (!antigo) {
    const ontem = new Date(Date.now() - 26 * 60 * 60 * 1000)
    await prisma.alerta.create({
      data: {
        tipo: 'deslizamento', gravidade: 'medio', status: 'encerrado', bairroId: moreira.id_bairro,
        disparadoPorAdmin: true, disparadoEm: ontem, analisadoPorId: admin.id,
        finalizadoEm: new Date(ontem.getTime() + 5 * 60 * 60 * 1000), createdAt: ontem,
        relatos: { create: [{ inscritoId: morador.Daniel.id_inscrito, gravidade: 'medio', createdAt: ontem }] },
      }
    })
    console.log('  + deslizamento encerrado em Moreira César (histórico)')
  }

  // Alertas ATIVOS de gravidades diferentes, para o mapa mostrar as cores.
  // Criados já ativos e sem notificações: não mandam nada pelo WhatsApp.
  const ativos = [
    // [tipo, gravidade, bairro, morador que relatou]
    ['via_interditada', 'leve', b['Independência/Taubaté'], morador.Carla],
    ['vendaval', 'medio', b['Centro/Caçapava'], morador.Eduarda],
  ]
  for (const [tipo, gravidade, bairroDoAlerta, quemRelatou] of ativos) {
    const existe = await prisma.alerta.findFirst({
      where: { tipo, bairroId: bairroDoAlerta.id_bairro, status: 'ativo', relatos: { some: { inscritoId: quemRelatou.id_inscrito } } }
    })
    if (existe) continue
    const disparadoEm = new Date(Date.now() - 40 * 60 * 1000)
    await prisma.alerta.create({
      data: {
        tipo, gravidade, status: 'ativo', bairroId: bairroDoAlerta.id_bairro,
        disparadoPorAdmin: true, disparadoEm, analisadoPorId: admin.id, createdAt: disparadoEm,
        relatos: { create: [{ inscritoId: quemRelatou.id_inscrito, gravidade, createdAt: disparadoEm }] },
      }
    })
    console.log(`  + ${tipo} (${gravidade}) ativo em ${bairroDoAlerta.nome}`)
  }

  console.log(`
Pronto! Para a apresentação:
  • Painel voluntário: ${EMAIL_VOLUNTARIO} / 123456
  • Abrigos: Escola Municipal Centro (Taubaté), Ginásio Poliesportivo (Caçapava, 90% ocupado)
    e Centro Comunitário Moreira César (Pindamonhangaba), com 39 vítimas cadastradas no total
  • Alerta de alagamento no Centro de Taubaté com 2 de 3 relatos (Ana e Bruno, sem foto)
    → pelo bot, quem mora ou acompanha o Centro de Taubaté relata um alagamento
      (com foto): o 3º relato dispara o alerta, com a sua foto, e ele vai para o grupo de Taubaté.`)
}

// ─── Remover ─────────────────────────────────────────────────────────────────
async function remover() {
  const moradores = await prisma.inscritoAlerta.findMany({
    where: { whatsappId: { startsWith: PREFIXO_WHATSAPP } }, select: { id_inscrito: true }
  })
  const idsMoradores = moradores.map(m => m.id_inscrito)

  // Alertas que têm relato de morador de exemplo (os relatos e notificações vão junto)
  const alertas = await prisma.alerta.deleteMany({ where: { relatos: { some: { inscritoId: { in: idsMoradores } } } } })
  const inscritos = await prisma.inscritoAlerta.deleteMany({ where: { id_inscrito: { in: idsMoradores } } })
  console.log(`- ${alertas.count} alerta(s) e ${inscritos.count} morador(es) de exemplo`)

  // Vítimas de exemplo (telefone com DDD 00) e as deficiências vinculadas a elas
  const vitimas = await prisma.vitima.findMany({
    where: { telefone: { startsWith: PREFIXO_TELEFONE_VITIMA } }, select: { id_vitima: true }
  })
  const idsVitimas = vitimas.map(v => v.id_vitima)
  await prisma.$transaction([
    prisma.vitimaDeficiencia.deleteMany({ where: { id_vitima: { in: idsVitimas } } }),
    prisma.vitima.deleteMany({ where: { id_vitima: { in: idsVitimas } } }),
  ])
  console.log(`- ${idsVitimas.length} vítima(s) de exemplo`)

  for (const nome of ABRIGOS) {
    const abrigo = await prisma.abrigo.findFirst({ where: { nome }, include: { _count: { select: { vitimas: true, voluntarios: true } } } })
    if (!abrigo) continue
    if (abrigo._count.vitimas || abrigo._count.voluntarios) {
      console.log(`! ${nome} tem vítimas ou voluntários vinculados — não removido`)
      continue
    }
    const solicitacoes = await prisma.solicitacaoAjuda.findMany({ where: { abrigoId: abrigo.id_abrigo }, select: { id_solicitacao: true } })
    const ids = solicitacoes.map(s => s.id_solicitacao)
    await prisma.$transaction([
      prisma.solicitacaoAjudaInteresse.deleteMany({ where: { solicitacaoId: { in: ids } } }),
      prisma.solicitacaoAjuda.deleteMany({ where: { id_solicitacao: { in: ids } } }),
      prisma.abrigo.delete({ where: { id_abrigo: abrigo.id_abrigo } }),
    ])
    console.log(`- ${nome} e ${ids.length} solicitação(ões) de ajuda`)
  }

  const voluntario = await prisma.voluntario.findUnique({ where: { email: EMAIL_VOLUNTARIO } })
  if (voluntario) {
    try {
      await prisma.$transaction([
        prisma.solicitacaoAjudaInteresse.deleteMany({ where: { voluntarioId: voluntario.id_voluntario } }),
        prisma.voluntario.delete({ where: { id_voluntario: voluntario.id_voluntario } }),
      ])
      console.log(`- voluntário ${EMAIL_VOLUNTARIO}`)
    } catch {
      console.log(`! voluntário ${EMAIL_VOLUNTARIO} ainda está vinculado a solicitações — não removido`)
    }
  }

  // Bairros só saem se ninguém mais usa (cidades nunca são removidas).
  // Confere tudo antes: excluir um bairro apagaria em cascata quem o acompanha
  // e deixaria abrigos reais sem bairro.
  for (const [nome, cidade] of BAIRROS) {
    const b = await acharBairro(nome, cidade)
    if (!b) continue
    const uso = await prisma.bairro.findUnique({
      where: { id_bairro: b.id_bairro },
      select: { _count: { select: { abrigos: true, solicitacoesAbrigo: true, moradores: true, inscritosInteressados: true, alertas: true } } }
    })
    if (Object.values(uso._count).some(n => n > 0)) {
      console.log(`! bairro ${nome} (${cidade}) está em uso — mantido`)
      continue
    }
    await prisma.bairro.delete({ where: { id_bairro: b.id_bairro } })
    console.log(`- bairro ${nome} (${cidade})`)
  }
}

try {
  if (REMOVER) await remover()
  else if (!process.argv.includes('--conferir')) await criar()
  await conferirOcupacao()
} finally {
  await prisma.$disconnect()
}
