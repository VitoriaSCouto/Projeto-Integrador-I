//Importa o Prisma Client
import { PrismaClient } from '@prisma/client'

//Cria uma instância do Prisma Client
//Instancia é a conexão com o banco de dados, e é através dela que vamos fazer as consultas
const prisma = new PrismaClient()


//Exporta a função que define as rotas de abrigo
export default async function abrigoRoutes(app) {

  //Rota utilizando o método POST para cadastrar um novo abrigo
  //URL http://localhost:3000/api/abrigos/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    const { nome, endereco, telefone, responsavel, tipoAbrigo, capacidadeTotal } = request.body

    const abrigoExistente = await prisma.abrigo.findFirst({
      where: { nome, endereco }
    })

    if (abrigoExistente) {
      return reply.status(400).send({ mensagem: 'Abrigo já cadastrado.' })
    }

    const abrigo = await prisma.abrigo.create({
      data: {
        nome,
        endereco,
        telefone,
        responsavel,
        tipoAbrigo,
        capacidadeTotal
      }
    })

    return reply.status(201).send({
      mensagem: 'Abrigo cadastrado com sucesso!',
      id: abrigo.id,
      nome: abrigo.nome,
      endereco: abrigo.endereco
    })
  })

  //Rota utilizando o método GET para listar todos os abrigos
  //Rota também com a possibilidade de filtrar por nome ou cidade, usando query params
  //URL http://localhost:3000/api/abrigos/listar?nome=
  //URL http://localhost:3000/api/abrigos/listar?endereco=
  app.get('/listar', async (request, reply) => {

    //Busca todos os abrigos no banco de dados
    //e armazena na variavel abrigo como array

    //Se quiser filtrar por nome ou cidade, pode usar query params
    const { nome, endereco } = request.query

    
    //Busca todos os abrigos no banco de dados com base nos filtros de nome e cidade, se fornecidos
    //e armazena na variavel abrigo como array
    const abrigo = await prisma.abrigo.findMany({
      where: {

        //O contains é para buscar por partes do nome ou cidade,
        //e o mode: 'insensitive' é para não diferenciar maiúsculas de minúsculas
        //undefined é para não aplicar o filtro se o query param não for informado

        nome: nome ? { contains: nome, mode: 'insensitive' } : undefined,
        endereco: endereco ? { contains: endereco, mode: 'insensitive' } : undefined
      }
    })

    //Aqui o Array é ITERADO
    //Iterar =>
    const abrigosListados = abrigo.map((abrigo) => ({
      nome: abrigo.nome,
      endereco: abrigo.endereco,
      id: abrigo.id
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      abrigos: abrigosListados
    })
  })

  //Rota utilizando o método PUT para atualizar as informações de um abrigo
  //URL http://localhost:3000/api/abrigos/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {

    // Extrai o ID do abrigo dos parâmetros da URL

    const {id} = request.params
    const { nome, endereco, telefone, responsavel, tipoAbrigo,
     capacidadeTotal, capacidadeOcupada, possuiAtendimentoMedico, status } = request.body

    // Verifica se o abrigo existe
    const abrigoExistente = await prisma.abrigo.findUnique({
      where: { id: Number(id) }
    })

    // Senão existir, retorna erro 404
    if (!abrigoExistente) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Atualiza o abrigo no banco de dados
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
        possuiAtendimentoMedico,
        status
      }
    })

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
      status: abrigoAtualizado.status
    })
  })

//Rota utilizando o método DELETE para excluir um abrigo
//URL http://localhost:3000/api/abrigos/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {
    // Extrai o ID do abrigo dos parâmetros da URL
     const {id} = request.params
     
    // Verifica se o abrigo existe
    const abrigoExistente = await prisma.abrigo.findUnique({
      where: { id: Number(id) }
    })

    // Senão existir, retorna erro 404
    if (!abrigoExistente) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Exclui o abrigo do banco de dados
    await prisma.abrigo.delete({
      where: { id: Number(id) }
    })  

    return reply.status(200).send({
      mensagem: 'Abrigo excluído com sucesso!'
    })
  })


}