//Importa o Prisma Client
import { PrismaClient } from '@prisma/client'

//Cria uma instância do Prisma Client
//Instancia é a conexão com o banco de dados, e é através dela que vamos fazer as consultas
const prisma = new PrismaClient()


//Exporta a função que define as rotas de abrigo
export default async function abrigoRoutes(app) {

  //Rota utilizando o método POST para cadastrar um novo abrigo
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
  app.get('/listar', async (request, reply) => {

    //Busca todos os abrigos no banco de dados
    //e armazena na variavel abrigo como array
    const abrigo = await prisma.abrigo.findMany()

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


}