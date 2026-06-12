import { PrismaClient } from '@prisma/client'

// Cria uma instância do Prisma Client
// Instancia é a conexão com o banco de dados, e é através dela que vamos fazer as consultas
const prisma = new PrismaClient()

// Exporta a função que define as rotas de abrigo
export default async function abrigoRoutes(app) {

  // Rota utilizando o método POST para cadastrar um novo abrigo
  // URL http://localhost:3000/api/abrigos/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    // Extrai os dados do body da requisição
    // Os campos booleanos já vêm com default false do banco, mas são extraídos aqui
    // para quando a tela de cadastro tiver os checkboxes, já funcionar automaticamente
    const { nome, endereco, telefone, responsavel, tipoAbrigo, capacidadeTotal,
      capacidadeOcupada, possuiAtendimentoMedico, possuiPets,
      possuiAcessibilidade, possuiCozinha, status } = request.body

    // Verifica se já existe um abrigo com o mesmo nome e endereço no banco de dados
    // O findFirst retorna o primeiro registro que corresponder aos filtros
    const abrigoExistente = await prisma.abrigo.findFirst({
      where: { nome, endereco }
    })

    // Se já existir um abrigo com o mesmo nome e endereço, retorna erro 400
    if (abrigoExistente) {
      return reply.status(400).send({ mensagem: 'Abrigo já cadastrado.' })
    }

    // Cria o novo abrigo no banco de dados com os dados recebidos no body
    // Os campos booleanos usam ?? para garantir o valor padrão caso não sejam enviados
    const abrigo = await prisma.abrigo.create({
      data: {
        nome,
        endereco,
        telefone,
        responsavel,
        tipoAbrigo,
        capacidadeTotal,
        capacidadeOcupada,
        possuiAtendimentoMedico: possuiAtendimentoMedico ?? false,
        possuiPets: possuiPets ?? false,
        possuiAcessibilidade: possuiAcessibilidade ?? false,
        possuiCozinha: possuiCozinha ?? false,
        status: status ?? 'ativo'
      }
    })

    // Retorna o status 201 (Created) com os dados do abrigo criado
    // Retorna também os campos booleanos para confirmar o que foi salvo
    return reply.status(201).send({
      mensagem: 'Abrigo cadastrado com sucesso!',
      id: abrigo.id,
      nome: abrigo.nome,
      endereco: abrigo.endereco,
      telefone: abrigo.telefone,
      responsavel: abrigo.responsavel,
      tipoAbrigo: abrigo.tipoAbrigo,
      capacidadeTotal: abrigo.capacidadeTotal,
      capacidadeOcupada: abrigo.capacidadeOcupada,
      possuiAtendimentoMedico: abrigo.possuiAtendimentoMedico,
      possuiPets: abrigo.possuiPets,
      possuiAcessibilidade: abrigo.possuiAcessibilidade,
      possuiCozinha: abrigo.possuiCozinha,
      status: abrigo.status
    })
  })

  // Rota utilizando o método GET para listar todos os abrigos
  // Rota também com a possibilidade de filtrar por nome, endereço ou id, usando query params
  // URL http://localhost:3000/api/abrigos/listar
  // URL http://localhost:3000/api/abrigos/listar?nome=
  // URL http://localhost:3000/api/abrigos/listar?endereco=
  app.get('/listar', async (request, reply) => {

    // Extrai os filtros opcionais da query string da URL
    const { id, nome, endereco } = request.query

    // Busca todos os abrigos no banco de dados com base nos filtros, se fornecidos
    // O findMany retorna um array com todos os registros que corresponderem aos filtros
    const abrigo = await prisma.abrigo.findMany({
      where: {

        // O contains é para buscar por partes do nome ou endereço
        // O mode: 'insensitive' é para não diferenciar maiúsculas de minúsculas
        // undefined é para não aplicar o filtro se o query param não for informado
        nome: nome ? { contains: nome, mode: 'insensitive' } : undefined,
        endereco: endereco ? { contains: endereco, mode: 'insensitive' } : undefined,
        id: id ? { equals: Number(id) } : undefined
      }
    })

    // Aqui o Array é ITERADO
    // Iterar => percorrer cada item do array e retornar apenas os campos necessários para a listagem
    // capacidadeTotal e capacidadeOcupada são necessários para calcular a barra de progresso na tela
    const abrigosListados = abrigo.map((abrigo) => ({
      id: abrigo.id,
      nome: abrigo.nome,
      endereco: abrigo.endereco,
      status: abrigo.status,
      capacidadeTotal: abrigo.capacidadeTotal,
      capacidadeOcupada: abrigo.capacidadeOcupada
    }))

    // Retorna o status 200 (OK) com a lista de abrigos
    return reply.status(200).send({
      mensagem: 'Lista:',
      abrigos: abrigosListados
    })
  })

  // Rota utilizando o método GET para buscar um abrigo específico pelo ID
  // Diferente do /listar, essa rota retorna TODOS os campos do abrigo
  // É utilizada pela tela de Detalhes para preencher o formulário com os dados do abrigo
  // URL http://localhost:3000/api/abrigos/listar/:id
  app.get('/listar/:id', async (request, reply) => {

    // Extrai o ID do abrigo dos parâmetros da URL
    // Diferente do /listar que usa query params (?id=), aqui o id vem direto na URL (/listar/1)
    const { id } = request.params

    // Busca um único abrigo pelo ID no banco de dados
    // O findUnique retorna apenas um registro, ou null se não encontrar
    const abrigo = await prisma.abrigo.findUnique({
      where: { id: Number(id) }
    })

    // Se não encontrar nenhum abrigo com esse ID, retorna erro 404
    if (!abrigo) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Retorna o status 200 (OK) com todos os dados do abrigo encontrado
    // O Prisma já retorna todos os campos automaticamente com o findUnique
    return reply.status(200).send(abrigo)
  })

  // Rota utilizando o método PUT para atualizar as informações de um abrigo
  // URL http://localhost:3000/api/abrigos/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {

    // Extrai o ID do abrigo dos parâmetros da URL
    const { id } = request.params

    // Extrai os novos dados do body da requisição
    // Inclui todos os campos booleanos de infraestrutura e o status
    const { nome, endereco, telefone, responsavel, tipoAbrigo,
      capacidadeTotal, capacidadeOcupada, possuiAtendimentoMedico,
      possuiPets, possuiAcessibilidade, possuiCozinha, status } = request.body

    // Verifica se o abrigo existe antes de tentar atualizar
    // O findUnique retorna o abrigo se encontrar, ou null se não encontrar
    const abrigoExistente = await prisma.abrigo.findUnique({
      where: { id: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!abrigoExistente) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Atualiza o abrigo no banco de dados com os novos dados recebidos no body
    // O update localiza o registro pelo ID e substitui os campos informados
    // Os campos booleanos usam ?? para garantir o valor padrão caso não sejam enviados
    const abrigoAtualizado = await prisma.abrigo.update({
      where: { id: Number(id) },
      data: {
        nome,
        endereco,
        telefone,
        responsavel,
        tipoAbrigo,
        capacidadeTotal,
        capacidadeOcupada,
        possuiAtendimentoMedico: possuiAtendimentoMedico ?? false,
        possuiPets: possuiPets ?? false,
        possuiAcessibilidade: possuiAcessibilidade ?? false,
        possuiCozinha: possuiCozinha ?? false,
        status: status ?? 'ativo'
      }
    })

    // Retorna o status 200 (OK) com todos os dados atualizados do abrigo
    return reply.status(200).send({
      mensagem: 'Informações do abrigo atualizadas com sucesso!',
      id: abrigoAtualizado.id,
      nome: abrigoAtualizado.nome,
      endereco: abrigoAtualizado.endereco,
      telefone: abrigoAtualizado.telefone,
      responsavel: abrigoAtualizado.responsavel,
      tipoAbrigo: abrigoAtualizado.tipoAbrigo,
      capacidadeTotal: abrigoAtualizado.capacidadeTotal,
      capacidadeOcupada: abrigoAtualizado.capacidadeOcupada,
      possuiAtendimentoMedico: abrigoAtualizado.possuiAtendimentoMedico,
      possuiPets: abrigoAtualizado.possuiPets,
      possuiAcessibilidade: abrigoAtualizado.possuiAcessibilidade,
      possuiCozinha: abrigoAtualizado.possuiCozinha,
      status: abrigoAtualizado.status
    })
  })

  // Rota utilizando o método DELETE para excluir um abrigo
  // URL http://localhost:3000/api/abrigos/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    // Extrai o ID do abrigo dos parâmetros da URL
    const { id } = request.params

    // Verifica se o abrigo existe antes de tentar excluir
    const abrigoExistente = await prisma.abrigo.findUnique({
      where: { id: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!abrigoExistente) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Exclui o abrigo do banco de dados pelo ID
    // O delete localiza o registro pelo ID e o remove permanentemente
    await prisma.abrigo.delete({
      where: { id: Number(id) }
    })

    // Retorna o status 200 (OK) confirmando a exclusão
    return reply.status(200).send({
      mensagem: 'Abrigo excluído com sucesso!'
    })
  })
}