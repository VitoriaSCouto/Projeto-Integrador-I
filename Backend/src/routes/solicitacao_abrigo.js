import { PrismaClient } from '@prisma/client'
import supabase from '../supabase.js'

const prisma = new PrismaClient()

export default async function solicitacaoAbrigoRoutes(app) {

  // ----- Criar Solicitação -----
  // URL: POST http://localhost:3000/api/solicitacoes/criar
  app.post('/criar', async (request, reply) => {
    const {
      nome, cep, endereco, cidade, estado, bairro, telefone, responsavel,
      tipoAbrigo, capacidadeTotal, possuiAtendimentoMedico, possuiEnfermagem,
      possuiPets, possuiAcessibilidade, possuiCozinha, fotoAbrigo,
      solicitanteNome, solicitanteEmail, solicitanteTelefone
    } = request.body

    // Cria a solicitação primeiro sem foto para obter o ID
    const solicitacao = await prisma.solicitacaoAbrigo.create({
      data: {
        nome, cep, endereco, cidade, estado, bairro,
        telefone: telefone ?? null,
        responsavel, tipoAbrigo, capacidadeTotal,
        possuiAtendimentoMedico: possuiAtendimentoMedico ?? false,
        possuiEnfermagem:        possuiEnfermagem        ?? false,
        possuiPets:              possuiPets              ?? false,
        possuiAcessibilidade:    possuiAcessibilidade    ?? false,
        possuiCozinha:           possuiCozinha           ?? false,
        fotoAbrigo: null,
        solicitanteNome, solicitanteEmail,
        solicitanteTelefone: solicitanteTelefone ?? null,
        status: 'pendente',
      }
    })

    // Upload da foto se vier em base64
    if (fotoAbrigo) {
      const buffer = Buffer.from(fotoAbrigo, 'base64')
      const nomeArquivo = `solicitacao-${solicitacao.id_solicitacao}-${Date.now()}.jpg`

      const { data, error } = await supabase.storage
        .from('fotos-abrigo')
        .upload(nomeArquivo, buffer, { contentType: 'image/jpeg', upsert: false })

      if (error) {
        return reply.status(500).send({ mensagem: 'Solicitação criada, mas erro ao salvar a foto.' })
      }

      const { data: urlData } = supabase.storage
        .from('fotos-abrigo')
        .getPublicUrl(data.path)

      await prisma.solicitacaoAbrigo.update({
        where: { id_solicitacao: solicitacao.id_solicitacao },
        data: { fotoAbrigo: urlData.publicUrl }
      })

      solicitacao.fotoAbrigo = urlData.publicUrl
    }

    return reply.status(201).send({
      mensagem: 'Solicitação enviada com sucesso! Aguarde a análise.',
      solicitacao
    })
  })


  // ----- Listar todas -----
  // URL: GET http://localhost:3000/api/solicitacoes/listar
  // Filtros: ?status=pendente | ?status=aprovado | ?status=recusado | ?solicitanteEmail=
  app.get('/listar', async (request, reply) => {
    const { status, solicitanteEmail, cidade, estado } = request.query

    const solicitacoes = await prisma.solicitacaoAbrigo.findMany({
      where: {
        status:          status          ? { equals: status }                               : undefined,
        solicitanteEmail: solicitanteEmail ? { contains: solicitanteEmail, mode: 'insensitive' } : undefined,
        cidade:          cidade          ? { contains: cidade,  mode: 'insensitive' }       : undefined,
        estado:          estado          ? { contains: estado,  mode: 'insensitive' }       : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        analisadoPor: {
          select: { id: true, nome: true, email: true }
        }
      }
    })

    return reply.status(200).send({
      mensagem: 'Lista de solicitações:',
      total: solicitacoes.length,
      solicitacoes
    })
  })


  // ----- Listar uma só -----
  // URL: GET http://localhost:3000/api/solicitacoes/listar/:id
  app.get('/listar/:id', async (request, reply) => {
    const { id } = request.params

    const solicitacao = await prisma.solicitacaoAbrigo.findUnique({
      where: { id_solicitacao: Number(id) },
      include: {
        analisadoPor: {
          select: { id: true, nome: true, email: true }
        },
        abrigo: true // retorna o abrigo criado, se já foi aprovado
      }
    })

    if (!solicitacao) {
      return reply.status(404).send({ mensagem: 'Solicitação não encontrada.' })
    }

    return reply.status(200).send(solicitacao)
  })


  // ----- Analisar (aprovar ou recusar) -----
  // Essa é a rota mais importante — é onde o Admin toma a decisão
  // URL: PATCH http://localhost:3000/api/solicitacoes/analisar/:id
  // Body: { status: "aprovado" | "recusado", motivoRecusa?: string, adminId: number }
  app.patch('/analisar/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const { status, motivoRecusa, adminId } = request.body

      if (!['aprovado', 'recusado'].includes(status)) {
        return reply.status(400).send({ mensagem: 'Status inválido. Use "aprovado" ou "recusado".' })
      }

      if (status === 'recusado' && !motivoRecusa) {
        return reply.status(400).send({ mensagem: 'Informe o motivo da recusa.' })
      }

      const solicitacao = await prisma.solicitacaoAbrigo.findUnique({
        where: { id_solicitacao: Number(id) }
      })

      if (!solicitacao) {
        return reply.status(404).send({ mensagem: 'Solicitação não encontrada.' })
      }

      if (solicitacao.status !== 'pendente') {
        return reply.status(400).send({ mensagem: 'Essa solicitação já foi analisada.' })
      }

      // Se aprovado: cria o Abrigo real com os dados da solicitação
      let abrigoCriado = null

      if (status === 'aprovado') {
        abrigoCriado = await prisma.abrigo.create({
          data: {
            nome:                    solicitacao.nome,
            cep:                     solicitacao.cep,
            endereco:                solicitacao.endereco,
            cidade:                  solicitacao.cidade,
            estado:                  solicitacao.estado,
            bairro:                  solicitacao.bairro,
            telefone:                solicitacao.telefone,
            responsavel:             solicitacao.responsavel,
            tipoAbrigo:              solicitacao.tipoAbrigo,
            capacidadeTotal:         solicitacao.capacidadeTotal,
            capacidadeOcupada:       0,
            possuiAtendimentoMedico: solicitacao.possuiAtendimentoMedico,
            possuiEnfermagem:        solicitacao.possuiEnfermagem,
            possuiPets:              solicitacao.possuiPets,
            possuiAcessibilidade:    solicitacao.possuiAcessibilidade,
            possuiCozinha:           solicitacao.possuiCozinha,
            fotoAbrigo:              solicitacao.fotoAbrigo,
            status:                  'ativo',
          }
        })
      }

      // Atualiza a solicitação com o resultado da análise
      const solicitacaoAtualizada = await prisma.solicitacaoAbrigo.update({
        where: { id_solicitacao: Number(id) },
        data: {
          status,
          motivoRecusa:  motivoRecusa ?? null,
          analisadoPorId: adminId,
          dataAnalise:   new Date(),
          abrigo_id:     abrigoCriado?.id_abrigo ?? null,
        }
      })

      return reply.status(200).send({
        mensagem: status === 'aprovado'
          ? 'Solicitação aprovada e abrigo criado com sucesso!'
          : 'Solicitação recusada.',
        solicitacao: solicitacaoAtualizada,
        abrigoCriado // null se recusado
      })

    } catch (erro) {
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })


  // ----- Excluir -----
  // URL: DELETE http://localhost:3000/api/solicitacoes/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {
    const { id } = request.params

    const solicitacao = await prisma.solicitacaoAbrigo.findUnique({
      where: { id_solicitacao: Number(id) }
    })

    if (!solicitacao) {
      return reply.status(404).send({ mensagem: 'Solicitação não encontrada.' })
    }

    // Remove a foto do Storage se existir
    if (solicitacao.fotoAbrigo) {
      const nomeArquivo = solicitacao.fotoAbrigo.split('/').pop().split('?')[0]
      await supabase.storage.from('fotos-abrigo').remove([nomeArquivo])
    }

    await prisma.solicitacaoAbrigo.delete({
      where: { id_solicitacao: Number(id) }
    })

    return reply.status(200).send({ mensagem: 'Solicitação excluída com sucesso!' })
  })
}