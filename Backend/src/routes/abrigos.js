import { PrismaClient } from '@prisma/client'
import supabase from '../supabase.js'

const prisma = new PrismaClient()

export default async function abrigoRoutes(app) {

  //----- Cadastrar ----- 
  //Método POST para cadastrar um novo abrigo
  //URL: http://localhost:3000/api/abrigos/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    const { nome, cep, estado, cidade, bairro, endereco, telefone, responsavel, tipoAbrigo,
      capacidadeTotal, capacidadeOcupada, possuiAtendimentoMedico,
      possuiEnfermagem, possuiPets, possuiAcessibilidade, possuiCozinha,
      status, fotoAbrigo, latitude, longitude, regiaoId } = request.body

    // Verifica se já existe um abrigo com o mesmo nome e endereço
    const abrigoExistente = await prisma.abrigo.findFirst({
      where: { nome, endereco }
    })

    if (abrigoExistente) {
      return reply.status(400).send({ mensagem: 'Abrigo já cadastrado.' })
    }

    // Cria o abrigo primeiro sem foto para gerar o ID
    // O ID é necessário para nomear o arquivo no Storage
    const abrigo = await prisma.abrigo.create({
      data: {
        nome,
        cep,
        estado,
        cidade,
        bairro,
        endereco,
        telefone,
        responsavel,
        tipoAbrigo,
        capacidadeTotal,
        capacidadeOcupada,
        possuiAtendimentoMedico: possuiAtendimentoMedico ?? false,
        possuiEnfermagem: possuiEnfermagem ?? false,
        possuiPets: possuiPets ?? false,
        possuiAcessibilidade: possuiAcessibilidade ?? false,
        possuiCozinha: possuiCozinha ?? false,
        status: status ?? 'ativo',
        fotoAbrigo: null,
        // Coordenadas vindas do geocoding feito na página de cadastro
        // Podem ser null se o geocoding falhou ou o usuário não preencheu o endereço
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        // Região vinculada ao abrigo — opcional, usado para exibir nivelRisco no mapa
        regiaoId: regiaoId ?? null,
      }
    })

    // Se veio uma foto em base64, faz o upload usando o ID do abrigo + timestamp como nome do arquivo
    // O timestamp é necessário para quebrar o cache do CDN do Supabase:
    // Como a URL pública não muda quando o arquivo é sobrescrito, o navegador servia a foto antiga.
    // Agora cada upload gera um nome único (abrigo-{id}-{timestamp}.jpg), forçando uma URL nova.
    if (fotoAbrigo) {
      const buffer = Buffer.from(fotoAbrigo, 'base64')
      const nomeArquivo = `abrigo-${abrigo.id_abrigo}-${Date.now()}.jpg`

      const { data, error } = await supabase.storage
        .from('fotos-abrigo')
        .upload(nomeArquivo, buffer, {
          contentType: 'image/jpeg',
          upsert: false // cada upload tem nome único, não precisa sobrescrever
        })

      if (error) {
        return reply.status(500).send({ mensagem: 'Abrigo criado, mas erro ao salvar a foto.' })
      }

      const { data: urlData } = supabase.storage
        .from('fotos-abrigo')
        .getPublicUrl(data.path)

      // Atualiza o abrigo com a URL pública da foto
      await prisma.abrigo.update({
        where: { id_abrigo: abrigo.id_abrigo },
        data: { fotoAbrigo: urlData.publicUrl }
      })

      abrigo.fotoAbrigo = urlData.publicUrl
    }

    return reply.status(201).send({
      mensagem: 'Abrigo cadastrado com sucesso!',
      id: abrigo.id_abrigo,
      nome: abrigo.nome,
      cep: abrigo.cep,
      estado: abrigo.estado,
      cidade: abrigo.cidade,
      bairro: abrigo.bairro,
      endereco: abrigo.endereco,
      telefone: abrigo.telefone,
      responsavel: abrigo.responsavel,
      tipoAbrigo: abrigo.tipoAbrigo,
      capacidadeTotal: abrigo.capacidadeTotal,
      capacidadeOcupada: abrigo.capacidadeOcupada,
      possuiAtendimentoMedico: abrigo.possuiAtendimentoMedico,
      possuiEnfermagem: abrigo.possuiEnfermagem,
      possuiPets: abrigo.possuiPets,
      possuiAcessibilidade: abrigo.possuiAcessibilidade,
      possuiCozinha: abrigo.possuiCozinha,
      status: abrigo.status,
      fotoAbrigo: abrigo.fotoAbrigo,
      latitude: abrigo.latitude,
      longitude: abrigo.longitude,
      regiaoId: abrigo.regiaoId,
    })
  })


  //----- Listar -----
  //Método GET para listar todos os abrigos, com filtros opcionais via query params
  //URL: http://localhost:3000/api/abrigos/listar
  //URL: http://localhost:3000/api/abrigos/listar?nome=
  //URL: http://localhost:3000/api/abrigos/listar?cidade=
  //URL: http://localhost:3000/api/abrigos/listar?endereco=
  app.get('/listar', async (request, reply) => {

    const { id, nome, cep, endereco, cidade, estado, bairro } = request.query

    const abrigos = await prisma.abrigo.findMany({
      where: {
        // O contains busca por partes do texto (ex: "escola" acha "Escola Municipal")
        // O mode: 'insensitive' ignora maiúsculas e minúsculas
        // undefined remove o filtro se o query param não for informado
        nome:     nome     ? { contains: nome,     mode: 'insensitive' } : undefined,
        endereco: endereco ? { contains: endereco, mode: 'insensitive' } : undefined,
        cidade:   cidade   ? { contains: cidade,   mode: 'insensitive' } : undefined,
        estado:   estado   ? { contains: estado,   mode: 'insensitive' } : undefined,
        bairro:   bairro   ? { contains: bairro,   mode: 'insensitive' } : undefined,
        cep:      cep      ? { equals: Number(cep) }                     : undefined,
        id_abrigo: id      ? { equals: Number(id) }                      : undefined,
      },
      // Inclui os dados da região vinculada para exibir nivelRisco e statusAlerta no mapa
      include: {
        regiao: {
          select: { nivelRisco: true, statusAlerta: true }
        }
      }
    })

    // Retorna apenas os campos necessários para a listagem
    // capacidadeTotal e capacidadeOcupada são usados para a barra de progresso na tela
    // latitude e longitude são usados pelo Mapa para plotar os marcadores
    const abrigosListados = abrigos.map((abrigo) => ({
      id:                abrigo.id_abrigo,
      nome:              abrigo.nome,
      cep:               abrigo.cep,
      estado:            abrigo.estado,
      cidade:            abrigo.cidade,
      bairro:            abrigo.bairro,
      endereco:          abrigo.endereco,
      status:            abrigo.status,
      tipoAbrigo:        abrigo.tipoAbrigo,
      capacidadeTotal:   abrigo.capacidadeTotal,
      capacidadeOcupada: abrigo.capacidadeOcupada,
      fotoAbrigo:        abrigo.fotoAbrigo,
      // Incluídos agora para o Mapa plotar os marcadores sem precisar de geocoding
      latitude:          abrigo.latitude,
      longitude:         abrigo.longitude,
      // Dados da região para exibir nível de risco no mapa e nas listagens
      regiaoId:          abrigo.regiaoId,
      nivelRisco:        abrigo.regiao?.nivelRisco   ?? null,
      statusAlerta:      abrigo.regiao?.statusAlerta ?? null,
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      abrigos: abrigosListados
    })
  })


  //----- Listar um só ----- (Importante para o Detalhes-abrigo)
  //Método GET para buscar um abrigo específico pelo ID
  //Retorna TODOS os campos — usado pela tela de Detalhes
  //URL: http://localhost:3000/api/abrigos/listar/:id
  app.get('/listar/:id', async (request, reply) => {

    const { id } = request.params

    const abrigo = await prisma.abrigo.findUnique({
      where: { id_abrigo: Number(id) },
      // Inclui os dados completos da região e a contagem de vítimas e voluntários vinculados
      include: {
        regiao: {
          select: { bairro: true, cidade: true, estado: true, nivelRisco: true, statusAlerta: true }
        },
        vitimas: {
          select: {
            id_vitima:      true,
            nome:           true,
            dataNascimento: true, // ← necessário para calcular idade no frontend
            dataEntrada:    true, // ← necessário para exibir horário de entrada
            genero:         true, // ← necessário para exibir gênero no frontend
          }
        },
        voluntarios: { select: { id_voluntario: true, nome: true } },
        // Antes era "doacoes" (model removido do schema). Agora é "solicitacoesAjuda",
        // que substitui o antigo model de doações.
        solicitacoesAjuda: {
          select: { id_solicitacao: true, titulo: true, categoria: true, urgencia: true, status: true }
        },
      }
    })

    if (!abrigo) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // O Prisma já retorna todos os campos automaticamente com o findUnique
    return reply.status(200).send(abrigo)
  })


  //----- Atualizar -----
  //Método PUT para atualizar as informações de um abrigo
  //URL: http://localhost:3000/api/abrigos/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {
    try {

    const { id } = request.params
    const { nome, cep, estado, cidade, bairro, endereco, telefone, responsavel, tipoAbrigo,
      capacidadeTotal, capacidadeOcupada, possuiAtendimentoMedico,
      possuiEnfermagem, possuiPets, possuiAcessibilidade, possuiCozinha,
      status, fotoAbrigo, latitude, longitude, regiaoId } = request.body

    const abrigoExistente = await prisma.abrigo.findUnique({
      where: { id_abrigo: Number(id) }
    })

    if (!abrigoExistente) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Define a URL da foto que vai ser salva no banco
    // Por padrão mantém a foto atual, mas pode mudar dependendo do que veio no body
    let fotoUrl = abrigoExistente.fotoAbrigo

    if (fotoAbrigo === null) {
      // Usuário clicou em "Remover Foto" — apaga do Storage e do banco
      // O nome do arquivo é extraído da URL salva no banco, já que agora o nome tem timestamp
      // Exemplo: "https://...supabase.co/.../abrigo-24-1718323200000.jpg" → "abrigo-24-1718323200000.jpg"
      if (abrigoExistente.fotoAbrigo) {
        const nomeArquivo = abrigoExistente.fotoAbrigo.split('/').pop().split('?')[0]
        await supabase.storage
          .from('fotos-abrigo')
          .remove([nomeArquivo])
      }
      fotoUrl = null

    } else if (fotoAbrigo && !fotoAbrigo.startsWith('http')) {
      // Veio um novo base64 — apaga a foto anterior e sobe a nova com nome único
      //
      // Antes usávamos upsert com nome fixo (abrigo-{id}.jpg), mas o CDN do Supabase
      // fazia cache da URL e continuava servindo a foto antiga mesmo após o upload.
      // A solução foi:
      //   1. Apagar o arquivo anterior pelo nome extraído da URL do banco
      //   2. Subir o novo com timestamp no nome → URL nova → cache quebrado
      if (abrigoExistente.fotoAbrigo) {
        const nomeAntigo = abrigoExistente.fotoAbrigo.split('/').pop().split('?')[0]
        await supabase.storage
          .from('fotos-abrigo')
          .remove([nomeAntigo])
      }

      const buffer = Buffer.from(fotoAbrigo, 'base64')
      const nomeArquivo = `abrigo-${id}-${Date.now()}.jpg`

      const { data, error } = await supabase.storage
        .from('fotos-abrigo')
        .upload(nomeArquivo, buffer, {
          contentType: 'image/jpeg',
          upsert: false // nome único por timestamp, não precisa sobrescrever
        })

      if (error) {
        return reply.status(500).send({ mensagem: 'Erro ao fazer upload da foto.' })
      }

      const { data: urlData } = supabase.storage
        .from('fotos-abrigo')
        .getPublicUrl(data.path)

      fotoUrl = urlData.publicUrl

    }
    // Se fotoAbrigo vier como uma URL http, não faz nada — mantém a foto atual

    const abrigoAtualizado = await prisma.abrigo.update({
      where: { id_abrigo: Number(id) },
      data: {
        nome,
        cep,
        estado,
        cidade,
        bairro,
        endereco,
        telefone,
        responsavel,
        tipoAbrigo,
        capacidadeTotal,
        capacidadeOcupada,
        possuiAtendimentoMedico: possuiAtendimentoMedico ?? false,
        possuiEnfermagem:        possuiEnfermagem        ?? false,
        possuiPets:              possuiPets              ?? false,
        possuiAcessibilidade:    possuiAcessibilidade    ?? false,
        possuiCozinha:           possuiCozinha           ?? false,
        status:                  status                  ?? 'ativo',
        fotoAbrigo:              fotoUrl,
        // Atualiza as coordenadas se vieram no body
        // Se não vieram (undefined), mantém os valores anteriores do banco
        latitude:  latitude  ?? abrigoExistente.latitude,
        longitude: longitude ?? abrigoExistente.longitude,
        // Atualiza a região vinculada — se não vier, mantém a anterior
        regiaoId:  regiaoId  ?? abrigoExistente.regiaoId,
      }
    })

    return reply.status(200).send({
      mensagem: 'Informações do abrigo atualizadas com sucesso!',
      id_abrigo:               abrigoAtualizado.id_abrigo,
      nome:                    abrigoAtualizado.nome,
      cep:                     abrigoAtualizado.cep,
      estado:                  abrigoAtualizado.estado,
      cidade:                  abrigoAtualizado.cidade,
      bairro:                  abrigoAtualizado.bairro,
      endereco:                abrigoAtualizado.endereco,
      telefone:                abrigoAtualizado.telefone,
      responsavel:             abrigoAtualizado.responsavel,
      tipoAbrigo:              abrigoAtualizado.tipoAbrigo,
      capacidadeTotal:         abrigoAtualizado.capacidadeTotal,
      capacidadeOcupada:       abrigoAtualizado.capacidadeOcupada,
      possuiAtendimentoMedico: abrigoAtualizado.possuiAtendimentoMedico,
      possuiEnfermagem:        abrigoAtualizado.possuiEnfermagem,
      possuiPets:              abrigoAtualizado.possuiPets,
      possuiAcessibilidade:    abrigoAtualizado.possuiAcessibilidade,
      possuiCozinha:           abrigoAtualizado.possuiCozinha,
      status:                  abrigoAtualizado.status,
      fotoAbrigo:              abrigoAtualizado.fotoAbrigo,
      latitude:                abrigoAtualizado.latitude,
      longitude:               abrigoAtualizado.longitude,
      regiaoId:                abrigoAtualizado.regiaoId,
    })

    } catch (erro) {
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })


  // ─── EXCLUIR ─────────────────────────────────────────────────
  // Método DELETE para excluir um abrigo
  // URL: http://localhost:3000/api/abrigos/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    const { id } = request.params

    const abrigoExistente = await prisma.abrigo.findUnique({
      where: { id_abrigo: Number(id) }
    })

    if (!abrigoExistente) {
      return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
    }

    // Se o abrigo tiver foto, remove do Storage antes de deletar o registro
    // O nome do arquivo é extraído da URL salva no banco, já que agora o nome tem timestamp
    // Exemplo: "https://...supabase.co/.../abrigo-24-1718323200000.jpg" → "abrigo-24-1718323200000.jpg"
    if (abrigoExistente.fotoAbrigo) {
      const nomeArquivo = abrigoExistente.fotoAbrigo.split('/').pop().split('?')[0]
      await supabase.storage
        .from('fotos-abrigo')
        .remove([nomeArquivo])
    }

    await prisma.abrigo.delete({
      where: { id_abrigo: Number(id) }
    })

    return reply.status(200).send({ mensagem: 'Abrigo excluído com sucesso!' })
  })
}