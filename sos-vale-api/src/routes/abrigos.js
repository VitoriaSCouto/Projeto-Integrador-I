import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function abrigoRoutes(app) {

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
}