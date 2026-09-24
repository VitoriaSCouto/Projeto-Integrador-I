// Dados extras para a tela de Mapa (admin e voluntário)
// Exige login, mas de qualquer tipo: o voluntário também vê os alertas no mapa.

import prisma from '../lib/prisma.js'
import { formatarAlerta, includeListagemAlerta, TIPOS_ALERTA, GRAVIDADES } from '../lib/alertas.js'

export default async function mapaRoutes(app) {

  app.addHook('onRequest', app.authenticate)


  //----- Alertas ativos -----
  // Só os alertas já confirmados (status "ativo"), com o bairro e a cidade
  // para o front posicionar o círculo no mapa.
  // URL: GET http://localhost:3000/api/mapa/alertas
  app.get('/alertas', async (request, reply) => {
    const alertas = await prisma.alerta.findMany({
      where: { status: 'ativo' },
      orderBy: { disparadoEm: 'desc' },
      include: includeListagemAlerta
    })

    return reply.status(200).send({
      mensagem: 'Alertas ativos:',
      total: alertas.length,
      alertas: alertas.map(alerta => ({
        ...formatarAlerta(alerta),
        emoji:          TIPOS_ALERTA[alerta.tipo]?.emoji ?? '⚠️',
        orientacao:     TIPOS_ALERTA[alerta.tipo]?.orientacao ?? null,
        pesoGravidade:  GRAVIDADES[alerta.gravidade]?.peso ?? 1,
      }))
    })
  })
}
