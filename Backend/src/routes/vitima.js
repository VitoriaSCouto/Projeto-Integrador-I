// Importa o Prisma Client
import { PrismaClient } from '@prisma/client'
import supabase from '../supabase.js'

// Cria a instância do Prisma — conexão com o banco
const prisma = new PrismaClient()

// Exporta a função que define as rotas de vítima
export default async function vitimaRoutes(app) {

  //----- Cadastrar -----
  //Rota POST para cadastrar uma nova vítima
  //URL http://localhost:3000/api/vitimas/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    // Extrai os dados do corpo da requisição
    const { nome, cpf, telefone, dataNascimento, genero, fotoVitima } = request.body
    const dataFormatada = new Date(dataNascimento)

    // Verifica se já existe uma vítima com o mesmo CPF
    const vitimaExistente = await prisma.vitima.findFirst({
      where: { cpf }
    })

    // Se já existir, retorna erro 400
    if (vitimaExistente) {
      return reply.status(400).send({ mensagem: 'CPF já cadastrado.' })
    }

    // Cria o vitima primeiro sem foto para gerar o ID
    // O ID é necessário para nomear o arquivo no Storage
    const vitima = await prisma.vitima.create({
      data: {
        nome,
        cpf,
        telefone,
        dataNascimento: dataFormatada,
        genero,
        fotoVitima: null
      }
    })

    // Se veio uma foto em base64, faz o upload usando o ID do vitima + timestamp como nome do arquivo
    // O timestamp é necessário para quebrar o cache do CDN do Supabase:
    // Como a URL pública não muda quando o arquivo é sobrescrito, o navegador servia a foto antiga.
    // Agora cada upload gera um nome único (vitima-{id}-{timestamp}.jpg), forçando uma URL nova.
    if (fotoVitima) {
      const buffer = Buffer.from(fotoVitima, 'base64')
      const nomeArquivo = `vitima-${vitima.id_vitima}-${Date.now()}.jpg`

      const { data, error } = await supabase.storage
        .from('fotos-vitima')
        .upload(nomeArquivo, buffer, {
          contentType: 'image/jpeg',
          upsert: false // cada upload tem nome único, não precisa sobrescrever
        })

      if (error) {
        return reply.status(500).send({ mensagem: 'Vitima criado, mas erro ao salvar a foto.' })
      }

      const { data: urlData } = supabase.storage
        .from('fotos-vitima')
        .getPublicUrl(data.path)

      // Atualiza o vitima com a URL pública da foto
      await prisma.vitima.update({
        where: { id_vitima: vitima.id_vitima },
        data: { fotoVitima: urlData.publicUrl }
      })

      vitima.fotoVitima = urlData.publicUrl
    }

    return reply.status(201).send({
      mensagem: 'vitima cadastrado com sucesso!',
      id: vitima.id_vitima,
      nome: vitima.nome,
      cpf: vitima.cpf,
      telefone: vitima.telefone,
      // Formata a data para exibição no padrão brasileiro
      dataNascimento: vitima.dataNascimento?.toLocaleDateString('pt-BR'),
      genero: vitima.genero,
      fotoVitima: vitima.fotoVitima
    })
  })

  //----- Listar -----
  //Rota GET para listar todas as vítimas
  //URL http://localhost:3000/api/vitimas/listar
  //URL http://localhost:3000/api/vitimas/listar?nome=João
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
      fotoVitima: vitima.fotoVitima
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      vitimas: vitimasListadas
    })
  })
  
  //----- Listar um só ----- (Importante para o Detalhes-vitima)
  //Método GET para buscar uma vitima específico pelo ID
  //Retorna TODOS os campos — usado pela tela de Detalhes
  //URL: http://localhost:3000/api/vitimas/listar/:id
  app.get('/listar/:id', async (request, reply) => {

    const { id } = request.params

    const vitima = await prisma.vitima.findUnique({
      where: { id_vitima: Number(id) }
    })

    if (!vitima) {
      return reply.status(404).send({ mensagem: 'Vítima não encontrado.' })
    }

    // O Prisma já retorna todos os campos automaticamente com o findUnique
    // Formata a data para exibição no padrão brasileiro antes de retornar
    return reply.status(200).send({
      ...vitima,
      dataNascimento: vitima.dataNascimento?.toLocaleDateString('pt-BR')
    })
  })


  //----- Atualizar -----
  //Rota PUT para atualizar os dados de uma vítima
  //URL http://localhost:3000/api/vitimas/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {
    try{

    // Extrai o ID da URL e os dados do corpo
    const { id } = request.params
    const { nome, cpf, telefone, dataNascimento, genero, fotoVitima } = request.body

    // Verifica se a vítima existe
    const vitimaExistente = await prisma.vitima.findUnique({
      where: { id_vitima: Number(id) }
    })

    // Se não existir, retorna erro 404
    if (!vitimaExistente) {
      return reply.status(404).send({ mensagem: 'Vítima não encontrada.' })
    }

    // Define a URL da foto que vai ser salva no banco
    // Por padrão mantém a foto atual, mas pode mudar dependendo do que veio no body
    let fotoUrl = vitimaExistente.fotoVitima

    if (fotoVitima === null) {
      // Usuário clicou em "Remover Foto" — apaga do Storage e do banco
      // O nome do arquivo é extraído da URL salva no banco, já que agora o nome tem timestamp
      // Exemplo: "https://...supabase.co/.../vitima-24-1718323200000.jpg" → "vitima-24-1718323200000.jpg"
      if (vitimaExistente.fotoVitima) {
        const nomeArquivo = vitimaExistente.fotoVitima.split('/').pop().split('?')[0]
        await supabase.storage
          .from('fotos-vitima')
          .remove([nomeArquivo])
      }
      fotoUrl = null

    } else if (fotoVitima && !fotoVitima.startsWith('http')) {
      // Veio um novo base64 — apaga a foto anterior e sobe a nova com nome único
      //
      // Antes usávamos upsert com nome fixo (vitima-{id_vitima}.jpg), mas o CDN do Supabase
      // fazia cache da URL e continuava servindo a foto antiga mesmo após o upload.
      // A solução foi:
      //   1. Apagar o arquivo anterior pelo nome extraído da URL do banco
      //   2. Subir o novo com timestamp no nome → URL nova → cache quebrado
      if (vitimaExistente.fotoVitima) {
        const nomeAntigo = vitimaExistente.fotoVitima.split('/').pop().split('?')[0]
        await supabase.storage
          .from('fotos-vitima')
          .remove([nomeAntigo])
      }

      const buffer = Buffer.from(fotoVitima, 'base64')
      const nomeArquivo = `vitima-${id}-${Date.now()}.jpg`

      const { data, error } = await supabase.storage
        .from('fotos-vitima')
        .upload(nomeArquivo, buffer, {
          contentType: 'image/jpeg',
          upsert: false // nome único por timestamp, não precisa sobrescrever
        })

      if (error) {
        return reply.status(500).send({ mensagem: 'Erro ao fazer upload da foto.' })
      }

      const { data: urlData } = supabase.storage
        .from('fotos-vitima')
        .getPublicUrl(data.path)

      fotoUrl = urlData.publicUrl

    }
    // Se fotoVitima vier como uma URL http, não faz nada — mantém a foto atual

    // Converte a string de data para objeto Date antes de salvar no banco
    // O backend retorna a data formatada como DD/MM/YYYY para o frontend
    // mas o new Date() não entende esse formato — por isso converte manualmente:
    // "01/02/2000" → split('/') → ['01','02','2000'] → reverse → ['2000','02','01'] → join('-') → "2000-02-01"
    // Se a data já vier no formato ISO (YYYY-MM-DD), o new Date() funciona normalmente
    const dataConvertida = dataNascimento.includes('/')
      ? new Date(dataNascimento.split('/').reverse().join('-'))
      : new Date(dataNascimento)

    const vitimaAtualizado = await prisma.vitima.update({
      where: { id_vitima: Number(id) },
      data: {
        nome,
        cpf,
        telefone,
        dataNascimento: dataConvertida,
        genero,
        fotoVitima: fotoUrl
      }
    })

    return reply.status(200).send({

      mensagem: 'Informações do vitima atualizadas com sucesso!',
      id:                      vitimaAtualizado.id_vitima,
      nome:                    vitimaAtualizado.nome,
      cpf:                     vitimaAtualizado.cpf,
      telefone:                vitimaAtualizado.telefone,
      // Corrigido: era "vitima" (variável inexistente nesse escopo), deve ser "vitimaAtualizado"
      dataNascimento:          vitimaAtualizado.dataNascimento?.toLocaleDateString('pt-BR'),
      genero:                  vitimaAtualizado.genero,
      fotoVitima:              vitimaAtualizado.fotoVitima
    })

    } catch (erro) {
      // Vai mostrar o erro real no terminal
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })


  //----- Deletar -----
  //Rota DELETE para excluir uma vítima
  //URL http://localhost:3000/api/vitimas/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    const { id } = request.params

    const vitimaExistente = await prisma.vitima.findUnique({
      where: { id_vitima: Number(id) }
    })

    if (!vitimaExistente) {
      return reply.status(404).send({ mensagem: 'Vitima não encontrado.' })
    }

    // Se o vitima tiver foto, remove do Storage antes de deletar o registro
    // O nome do arquivo é extraído da URL salva no banco, já que agora o nome tem timestamp
    // Exemplo: "https://...supabase.co/.../vitima-24-1718323200000.jpg" → "vitima-24-1718323200000.jpg"
    if (vitimaExistente.fotoVitima) {
      const nomeArquivo = vitimaExistente.fotoVitima.split('/').pop().split('?')[0]
      await supabase.storage
        .from('fotos-vitima')
        .remove([nomeArquivo])
    }

    await prisma.vitima.delete({
      where: { id_vitima: Number(id) }
    })

    return reply.status(200).send({ mensagem: 'vitima excluído com sucesso!' })
  })
}