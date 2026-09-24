import prisma from '../lib/prisma.js'


// Os 27 estados são cadastrados pela migração — aqui só existe a listagem
export default async function estadoRoutes(app) {

  //----- Listar -----
  // URL: GET http://localhost:3000/api/estados/listar
  // URL: GET http://localhost:3000/api/estados/listar?comCidades=true  → só estados que já têm cidades
  app.get('/listar', async (request, reply) => {
    const { comCidades } = request.query

    const estados = await prisma.estado.findMany({
      where: comCidades === 'true' ? { cidades: { some: {} } } : undefined,
      orderBy: { nome: 'asc' },
      include: { _count: { select: { cidades: true } } }
    })

    return reply.status(200).send({
      mensagem: 'Lista:',
      estados: estados.map(({ _count, ...estado }) => ({ ...estado, totalCidades: _count.cidades }))
    })
  })
}
