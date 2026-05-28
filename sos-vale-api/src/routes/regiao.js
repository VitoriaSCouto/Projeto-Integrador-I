// Importa o Prisma Client
import { PrismaClient } from '@prisma/client'

// Cria uma instância do Prisma Client
// Instância é a conexão com o banco de dados, e é através dela que vamos fazer as consultas
const prisma = new PrismaClient()

// Exporta a função que define as rotas de regiao
export default async function regiaoRoutes(app) {

  // Rota utilizando o método POST para cadastrar uma nova região
  // URL http://localhost:3000/api/regioes/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    const { bairro, cidade, estado, populacaoEstimada, areaKm2, nivelRisco, statusAlerta } = request.body

    // Verifica se já existe uma região com o mesmo bairro e cidade
    const regiaoExistente = await prisma.regiao.findFirst({
      where: { bairro, cidade }
    })

    if (regiaoExistente) {
      return reply.status(400).send({ mensagem: 'Região já cadastrada.' })
    }

    // Cria a região no banco de dados
    const regiao = await prisma.regiao.create({
      data: {
        bairro,
        cidade,
        estado,
        populacaoEstimada,
        areaKm2,
        nivelRisco: nivelRisco || 'baixo', // se não informar, usa baixo como padrão
        statusAlerta: statusAlerta || false  // se não informar, usa false como padrão
      }
    })

    return reply.status(201).send({
      mensagem: 'Região cadastrada com sucesso!',
      id: regiao.id,
      bairro: regiao.bairro,
      cidade: regiao.cidade
    })
  })

  // Rota utilizando o método GET para listar todas as regiões
  // Rota também com a possibilidade de filtrar por bairro ou cidade usando query params
  // URL http://localhost:3000/api/regioes/listar
  // URL http://localhost:3000/api/regioes/listar?cidade=Taubaté
  // URL http://localhost:3000/api/regioes/listar?bairro=Centro
  app.get('/listar', async (request, reply) => {

    // Se quiser filtrar por bairro ou cidade, pode usar query params
    const { bairro, cidade } = request.query

    // Busca todas as regiões no banco de dados com base nos filtros, se fornecidos
    const regiao = await prisma.regiao.findMany({
      where: {
        // O contains é para buscar por partes do bairro ou cidade
        // e o mode: 'insensitive' é para não diferenciar maiúsculas de minúsculas
        // undefined é para não aplicar o filtro se o query param não for informado
        bairro: bairro ? { contains: bairro, mode: 'insensitive' } : undefined,
        cidade: cidade ? { contains: cidade, mode: 'insensitive' } : undefined
      }
    })

    // Itera o array de regiões e retorna apenas os campos necessários
    const regioesListadas = regiao.map((regiao) => ({
      id: regiao.id,
      bairro: regiao.bairro,
      cidade: regiao.cidade,
      estado: regiao.estado,
      nivelRisco: regiao.nivelRisco,
      statusAlerta: regiao.statusAlerta
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      regioes: regioesListadas
    })
  })

  // Rota utilizando o método PUT para atualizar as informações de uma região
  // URL http://localhost:3000/api/regioes/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {

    // Extrai o ID da região dos parâmetros da URL
    const { id } = request.params
    const { bairro, cidade, estado, populacaoEstimada, areaKm2, nivelRisco, statusAlerta } = request.body

    // Verifica se a região existe
    const regiaoExistente = await prisma.regiao.findUnique({
      where: { id: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!regiaoExistente) {
      return reply.status(404).send({ mensagem: 'Região não encontrada.' })
    }

    // Atualiza a região no banco de dados
    const regiaoAtualizada = await prisma.regiao.update({
      where: { id: Number(id) },
      data: {
        bairro,
        cidade,
        estado,
        populacaoEstimada,
        areaKm2,
        nivelRisco,
        statusAlerta
      }
    })

    return reply.status(200).send({
      mensagem: 'Informações da região atualizadas com sucesso!',
      id: regiaoAtualizada.id,
      bairro: regiaoAtualizada.bairro,
      cidade: regiaoAtualizada.cidade,
      estado: regiaoAtualizada.estado,
      nivelRisco: regiaoAtualizada.nivelRisco,
      statusAlerta: regiaoAtualizada.statusAlerta
    })
  })

  // Rota utilizando o método DELETE para excluir uma região
  // URL http://localhost:3000/api/regioes/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    // Extrai o ID da região dos parâmetros da URL
    const { id } = request.params

    // Verifica se a região existe
    const regiaoExistente = await prisma.regiao.findUnique({
      where: { id: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!regiaoExistente) {
      return reply.status(404).send({ mensagem: 'Região não encontrada.' })
    }

    // Exclui a região do banco de dados
    await prisma.regiao.delete({
      where: { id: Number(id) }
    })

    return reply.status(200).send({
      mensagem: 'Região excluída com sucesso!'
    })
  })
}