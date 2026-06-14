// Importa o Prisma Client
import { PrismaClient } from '@prisma/client'

// Importa o cliente do Supabase para upload de imagens
import supabase from '../supabase.js'

// Cria a instância do Prisma — conexão com o banco
const prisma = new PrismaClient()

// Exporta a função que define as rotas de vítima
export default async function vitimaRoutes(app) {

  // Rota POST para cadastrar uma nova vítima
  // URL http://localhost:3000/api/vitimas/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    // Extrai os dados do corpo da requisição
    const { nome, cpf, telefone, dataNascimento, genero, fotoPerfil } = request.body

    // Verifica se já existe uma vítima com o mesmo CPF
    const vitimaExistente = await prisma.vitima.findFirst({
      where: { cpf }
    })

    // Se já existir, retorna erro 400
    if (vitimaExistente) {
      return reply.status(400).send({ mensagem: 'CPF já cadastrado.' })
    }

    // Se tiver foto, faz upload no Supabase Storage
    let fotoUrl = null
    if (fotoPerfil) {

      // Converte Base64 para buffer binário — B maiúsculo!
      const buffer = Buffer.from(fotoPerfil, 'base64')

      // Faz upload da imagem no bucket 'fotos-perfil'
      // Date.now() garante nome único para cada imagem
      const { data, error } = await supabase.storage
        .from('fotos-perfil')
        .upload(`vitima-${Date.now()}.jpg`, buffer, {
          contentType: 'image/jpeg'
        })

        

      // Pega a URL pública da imagem salva
      const { data: urlData } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(data.path)

      fotoUrl = urlData.publicUrl
    }

    // Cria a vítima no banco com a URL da foto
    const vitima = await prisma.vitima.create({
      data: {
        nome,
        cpf: cpf || 'Ainda não informado',
        telefone: telefone || 'Ainda não informado',
        dataNascimento: new Date(dataNascimento),
        genero,
        fotoPerfil: fotoUrl
      }
    })

    // Retorna sucesso com os dados da vítima
    return reply.status(201).send({
      mensagem: 'Vítima cadastrada com sucesso!',
      id: vitima.id_vitima,
      nome: vitima.nome,
      cpf: vitima.cpf
    })
  })

  // Rota GET para listar todas as vítimas
  // URL http://localhost:3000/api/vitimas/listar
  // URL http://localhost:3000/api/vitimas/listar?nome=João
  app.get('/listar', async (request, reply) => {

    // Filtro opcional por nome
    const { nome } = request.query

    // Busca as vítimas com filtro se fornecido
    const vitimas = await prisma.vitima.findMany({
      where: {
        nome: nome ? { contains: nome, mode: 'insensitive' } : undefined
      }
    })

    // Retorna apenas os campos necessários
    const vitimasListadas = vitimas.map((vitima) => ({
      id: vitima.id_vitima,
      nome: vitima.nome,
      cpf: vitima.cpf,
      telefone: vitima.telefone,
      genero: vitima.genero,
      fotoPerfil: vitima.fotoPerfil
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      vitimas: vitimasListadas
    })
  })

  // Rota PUT para atualizar os dados de uma vítima
  // URL http://localhost:3000/api/vitimas/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {

    // Extrai o ID da URL e os dados do corpo
    const { id } = request.params
    const { nome, cpf, telefone, dataNascimento, genero, fotoPerfil } = request.body

    // Verifica se a vítima existe
    const vitimaExistente = await prisma.vitima.findUnique({
      where: { id_vitima: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!vitimaExistente) {
      return reply.status(404).send({ mensagem: 'Vítima não encontrada.' })
    }

    // Se tiver nova foto, faz upload no Supabase Storage
    let fotoUrl = vitimaExistente.fotoPerfil
    if (fotoPerfil) {
      const buffer = Buffer.from(fotoPerfil, 'base64')
      const { data, error } = await supabase.storage
        .from('fotos-perfil')
        .upload(`vitima-${vitimaExistente.id_vitima}.jpg`, buffer, {
          contentType: 'image/jpeg'
        })

      console.log('erro upload:', error)
      console.log('data upload:', data)

      const { data: urlData } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(data.path)
      fotoUrl = urlData.publicUrl
    }

    // Atualiza a vítima no banco
    const vitimaAtualizada = await prisma.vitima.update({
      where: { id_vitima: Number(id) },
      data: {
        nome,
        cpf,
        telefone,
        dataNascimento: new Date(dataNascimento),
        genero,
        fotoPerfil: fotoUrl
      }
    })

    return reply.status(200).send({
      mensagem: 'Vítima atualizada com sucesso!',
      id: vitimaAtualizada.id_vitima,
      nome: vitimaAtualizada.nome
    })
  })

  // Rota DELETE para excluir uma vítima
  // URL http://localhost:3000/api/vitimas/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    // Extrai o ID da URL
    const { id } = request.params

    // Verifica se a vítima existe
    const vitimaExistente = await prisma.vitima.findUnique({
      where: { id_vitima: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!vitimaExistente) {
      return reply.status(404).send({ mensagem: 'Vítima não encontrada.' })
    }

    // Exclui a vítima do banco
    await prisma.vitima.delete({
      where: { id_vitima: Number(id) }
    })


 // Só tenta remover a foto se ela existir
  if (vitimaExistente.fotoPerfil) {
    // Extrai o caminho relativo a partir do nome do bucket
    const url = vitimaExistente.fotoPerfil
    const bucketName = 'fotos-perfil'
    const filePath = url.split(`/${bucketName}/`)[1]

    if (filePath) {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(filePath)
        return reply.status(200).send({
          mensagem: 'Vítima excluída com sucesso, mas houve um erro ao deletar a foto do storage.',
          erro: error ? error.message : null
        })
      if (error) {
        return reply.status(404).send({'Erro ao deletar foto do storage': error.message})
        console.error('Erro ao deletar foto do storage:', error)
      }
    }
  }

  return reply.status(200).send({
    mensagem: 'Vítima excluída com sucesso!'
  })
})
}