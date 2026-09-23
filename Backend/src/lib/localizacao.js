// Funções compartilhadas de localização (Estado → Cidade → Bairro)

// Select padrão para trazer cidade, estado e bairro junto com um abrigo
// ou uma solicitação de abrigo
export const selectLocalizacao = {
  cidade: {
    select: {
      id_cidade: true,
      nome: true,
      estado: { select: { id_estado: true, sigla: true, nome: true } }
    }
  },
  bairro: { select: { id_bairro: true, nome: true, nivelRisco: true } }
}

// Transforma { cidade: { nome, estado: { sigla } }, bairro: { nome } }
// em { cidade: 'Taubaté', estado: 'SP', bairro: 'Centro', cidadeId, estadoId, bairroId }
//
// Assim as telas que já usavam abrigo.cidade / abrigo.estado / abrigo.bairro
// como texto continuam funcionando depois da reformulação das regiões.
export function achatarLocalizacao(registro) {
  if (!registro) return registro

  const { cidade, bairro, ...resto } = registro

  // Se a cidade/bairro não foram incluídos na consulta, não mexe no registro
  if (cidade === undefined && bairro === undefined) return registro

  return {
    ...resto,
    cidadeId: resto.cidadeId ?? cidade?.id_cidade ?? null,
    estadoId: cidade?.estado?.id_estado ?? null,
    bairroId: resto.bairroId ?? bairro?.id_bairro ?? null,
    cidade:   cidade?.nome ?? null,
    estado:   cidade?.estado?.sigla ?? null,
    bairro:   bairro?.nome ?? null,
    nivelRisco: bairro?.nivelRisco ?? null,
  }
}

// Minúsculo, sem acento e sem espaços extras — usado para comparar nomes
// digitados no bot ("sao jose" = "São José")
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Mantém só os dígitos do CEP. Retorna null se não tiver 8 dígitos.
export function limparCep(cep) {
  const digitos = String(cep ?? '').replace(/\D/g, '')
  return digitos.length === 8 ? digitos : null
}

// Consulta o CEP no ViaCEP (https://viacep.com.br)
// Retorna { cep, logradouro, bairro, cidade, uf } ou null se o CEP não existir
export async function consultarCep(cep) {
  const cepLimpo = limparCep(cep)
  if (!cepLimpo) return null

  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
    signal: AbortSignal.timeout(8000)
  })

  if (!resposta.ok) {
    throw new Error(`ViaCEP respondeu ${resposta.status}`)
  }

  const dados = await resposta.json()

  // O ViaCEP responde { erro: true } quando o CEP tem formato válido mas não existe
  if (dados.erro) return null

  return {
    cep:        dados.cep,
    logradouro: dados.logradouro || null,
    bairro:     dados.bairro || null,
    cidade:     dados.localidade,
    uf:         dados.uf,
  }
}

// Procura (sem diferenciar acento/maiúscula) ou cria a cidade e o bairro
// informados pelo ViaCEP. Usado quando o morador não encontra o bairro dele
// na lista do bot.
//
// Retorna { bairro, cidade, criouCidade, criouBairro }
export async function obterOuCriarBairroPorCep(prisma, dadosCep) {
  const estado = await prisma.estado.findUnique({ where: { sigla: dadosCep.uf } })
  if (!estado) {
    throw new Error(`Estado ${dadosCep.uf} não cadastrado.`)
  }

  if (!dadosCep.bairro) {
    // Alguns CEPs (cidades pequenas) não têm bairro
    const erro = new Error('Este CEP não informa o bairro. Tente o CEP de uma rua próxima.')
    erro.statusCode = 422
    throw erro
  }

  return prisma.$transaction(async (tx) => {
    const cidades = await tx.cidade.findMany({ where: { estadoId: estado.id_estado } })
    let cidade = cidades.find(c => normalizarTexto(c.nome) === normalizarTexto(dadosCep.cidade))
    let criouCidade = false

    if (!cidade) {
      cidade = await tx.cidade.create({
        data: { nome: dadosCep.cidade, estadoId: estado.id_estado }
      })
      criouCidade = true
    }

    const bairros = await tx.bairro.findMany({ where: { cidadeId: cidade.id_cidade } })
    let bairro = bairros.find(b => normalizarTexto(b.nome) === normalizarTexto(dadosCep.bairro))
    let criouBairro = false

    if (!bairro) {
      bairro = await tx.bairro.create({
        data: { nome: dadosCep.bairro, cidadeId: cidade.id_cidade }
      })
      criouBairro = true
    }

    return { bairro, cidade: { ...cidade, estado }, criouCidade, criouBairro }
  })
}

// Confere se o bairro (opcional) pertence à cidade informada
// Retorna uma mensagem de erro ou null se estiver tudo certo
export async function validarCidadeBairro(prisma, cidadeId, bairroId) {
  if (!cidadeId) return 'Selecione a cidade.'

  const cidade = await prisma.cidade.findUnique({ where: { id_cidade: Number(cidadeId) } })
  if (!cidade) return 'Cidade não encontrada.'

  if (bairroId) {
    const bairro = await prisma.bairro.findUnique({ where: { id_bairro: Number(bairroId) } })
    if (!bairro) return 'Bairro não encontrado.'
    if (bairro.cidadeId !== cidade.id_cidade) return 'O bairro não pertence à cidade selecionada.'
  }

  return null
}
