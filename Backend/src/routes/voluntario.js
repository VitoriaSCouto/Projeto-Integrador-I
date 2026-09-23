// Importa o Prisma Client
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { selectLocalizacao, achatarLocalizacao } from '../lib/localizacao.js'

// Cria a instância do Prisma — conexão com o banco
const prisma = new PrismaClient()

// Exporta a função que define as rotas de voluntário
export default async function voluntarioRoutes(app) {

  //----- Cadastrar -----
  // Rota POST para cadastrar um novo voluntário
  // URL http://localhost:3000/api/voluntarios/cadastrar
  app.post('/cadastrar', async (request, reply) => {

    // Extrai os dados do corpo da requisição
    const { nome, cpf, telefone, email, senha, dataNascimento, genero } = request.body
    const dataFormatada = new Date(dataNascimento)

    // Verifica se já existe um voluntário com o mesmo email
    const voluntarioExistente = await prisma.voluntario.findUnique({
      where: { email }
    })

    // Se já existir, retorna erro 400
    if (voluntarioExistente) {
      return reply.status(400).send({ mensagem: 'Email já cadastrado.' })
    }

    // Criptografa a senha antes de salvar no banco
    // Nunca salvar a senha pura
    const senhaCriptografada = await bcrypt.hash(senha, 10)

    // Cria o voluntário no banco
    const voluntario = await prisma.voluntario.create({
      data: {
        nome,
        cpf:            cpf      ?? null,
        telefone:       telefone ?? null,
        email,
        senha:          senhaCriptografada,
        dataNascimento: dataFormatada,
        genero,
        status:         'ativo',
        abrigoId:       null
      }
    })

    // Retorna sucesso — nunca retornando a senha
    return reply.status(201).send({
      mensagem: 'Voluntário cadastrado com sucesso!',
      id:       voluntario.id_voluntario,
      nome:     voluntario.nome,
      email:    voluntario.email
    })
  })


  //----- Login -----
  // Rota POST para autenticar um voluntário
  // URL http://localhost:3000/api/voluntarios/login
  app.post('/login', async (request, reply) => {

    // Extrai email e senha do corpo da requisição
    const { email, senha } = request.body

    // Busca o voluntário no banco pelo email
    const voluntario = await prisma.voluntario.findUnique({
      where: { email }
    })

    // Se não encontrar, retorna erro
    if (!voluntario) {
      return reply.status(401).send({ mensagem: 'Email ou senha incorretos.' })
    }

    // Compara a senha digitada com a criptografada no banco
    const senhaCorreta = await bcrypt.compare(senha, voluntario.senha)

    // Se a senha não bater, retorna erro
    if (!senhaCorreta) {
      return reply.status(401).send({ mensagem: 'Email ou senha incorretos.' })
    }

    // Gera o token JWT com os dados do voluntário
    // O token expira em 8 horas
    const token = app.jwt.sign(
      { id: voluntario.id_voluntario, email: voluntario.email, tipo: 'voluntario' },
      { expiresIn: '8h' }
    )

    // Retorna o token e os dados do voluntário
    // O frontend salva esse token e usa nas próximas requisições
    return reply.send({
      mensagem: 'Login realizado com sucesso!',
      token,
      voluntario: {
        id:    voluntario.id_voluntario,
        nome:  voluntario.nome,
        email: voluntario.email
      }
    })
  })


  //----- Meus dados -----
  // Rota GET protegida — retorna os dados do voluntário logado
  // URL http://localhost:3000/api/voluntarios/me
  app.get('/me', { onRequest: [app.authenticate] }, async (request, reply) => {

    // Extrai o ID do token JWT decodificado
    const { id } = request.user

    // Busca o voluntário no banco pelo ID
    const voluntario = await prisma.voluntario.findUnique({
      where: { id_voluntario: id },
      select: {
        id_voluntario:  true,
        nome:           true,
        email:          true,
        telefone:       true,
        cpf:            true,
        genero:         true,
        dataNascimento: true,
        status:         true,
        abrigo: {
          select: { nome: true, ...selectLocalizacao }
        },
        // Antes era "doacoes" (model removido do schema).
        // Agora é "solicitacoesAjudaAtendidas" — solicitações de ajuda que este
        // voluntário atendeu (campo voluntarioId em SolicitacaoAjuda).
        solicitacoesAjudaAtendidas: {
          select: { titulo: true, categoria: true, status: true, createdAt: true }
        }
      }
    })

    if (!voluntario) {
      return reply.status(404).send({ mensagem: 'Voluntário não encontrado.' })
    }

    return reply.status(200).send({
      voluntario: { ...voluntario, abrigo: achatarLocalizacao(voluntario.abrigo) }
    })
  })


  //----- Listar -----
  // Rota GET para listar todos os voluntários
  // URL http://localhost:3000/api/voluntarios/listar
  // URL http://localhost:3000/api/voluntarios/listar?nome=João
  // URL http://localhost:3000/api/voluntarios/listar?status=ativo
  app.get('/listar', async (request, reply) => {

    // Filtros opcionais por nome, status e abrigo
    const { nome, status, abrigoId } = request.query

    // Busca os voluntários com filtros se fornecidos
    const voluntarios = await prisma.voluntario.findMany({
      where: {
        nome:     nome     ? { contains: nome, mode: 'insensitive' } : undefined,
        status:   status   ?? undefined,
        abrigoId: abrigoId ? Number(abrigoId)                       : undefined,
      },
      include: {
        abrigo: { select: { nome: true, ...selectLocalizacao } }
      }
    })

    // Retorna apenas os campos necessários para a listagem
    // Mantém "id_voluntario" (em vez de renomear para "id") para bater com o
    // padrão usado no resto do projeto (id_abrigo, id_solicitacao, id_vitima...)
    const voluntariosListados = voluntarios.map((voluntario) => ({
      id_voluntario: voluntario.id_voluntario,
      nome:          voluntario.nome,
      email:         voluntario.email,
      telefone:      voluntario.telefone,
      genero:        voluntario.genero,
      status:        voluntario.status,
      abrigo:        achatarLocalizacao(voluntario.abrigo)
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      voluntarios: voluntariosListados
    })
  })


  //----- Listar um só ----- (Importante para Detalhes-voluntario)
  // Método GET para buscar um voluntário específico pelo ID
  // Retorna TODOS os campos — usado pela tela de Detalhes
  // URL: http://localhost:3000/api/voluntarios/listar/:id
  app.get('/listar/:id', async (request, reply) => {

    const { id } = request.params

    const voluntario = await prisma.voluntario.findUnique({
      where: { id_voluntario: Number(id) },
      include: {
        abrigo: { select: { nome: true, ...selectLocalizacao } },
        // Antes era "doacoes" (model removido do schema).
        // Agora é "solicitacoesAjudaAtendidas" — as solicitações de ajuda que
        // este voluntário atendeu de fato (não confundir com "interessesAjuda",
        // que são só os interesses marcados, sem confirmação do ADM).
        solicitacoesAjudaAtendidas: {
          select: { id_solicitacao: true, titulo: true, categoria: true, status: true, createdAt: true }
        }
      }
    })

    if (!voluntario) {
      return reply.status(404).send({ mensagem: 'Voluntário não encontrado.' })
    }

    // Formata a data para exibição no padrão brasileiro antes de retornar
    // Nunca devolve o hash da senha
    const { senha, ...voluntarioSemSenha } = voluntario

    return reply.status(200).send({
      ...voluntarioSemSenha,
      abrigo: achatarLocalizacao(voluntario.abrigo),
      dataNascimento: voluntario.dataNascimento?.toLocaleDateString('pt-BR')
    })
  })


  //----- Atualizar -----
  // Rota PUT para atualizar os dados de um voluntário
  // URL http://localhost:3000/api/voluntarios/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {
    try {

      // Extrai o ID da URL e os dados do corpo
      const { id } = request.params
      const { nome, cpf, telefone, email, dataNascimento, genero, status, abrigoId } = request.body

      // Verifica se o voluntário existe
      const voluntarioExistente = await prisma.voluntario.findUnique({
        where: { id_voluntario: Number(id) }
      })

      // Se não existir, retorna erro 404
      if (!voluntarioExistente) {
        return reply.status(404).send({ mensagem: 'Voluntário não encontrado.' })
      }

      // Converte a string de data para objeto Date antes de salvar no banco
      // "01/02/2000" → split('/') → ['01','02','2000'] → reverse → ['2000','02','01'] → join('-') → "2000-02-01"
      // Se a data já vier no formato ISO (YYYY-MM-DD), o new Date() funciona normalmente
      const dataConvertida = dataNascimento.includes('/')
        ? new Date(dataNascimento.split('/').reverse().join('-'))
        : new Date(dataNascimento)

      const voluntarioAtualizado = await prisma.voluntario.update({
        where: { id_voluntario: Number(id) },
        data: {
          nome,
          cpf:            cpf      ?? voluntarioExistente.cpf,
          telefone:       telefone ?? voluntarioExistente.telefone,
          email:          email    ?? voluntarioExistente.email,
          dataNascimento: dataConvertida,
          genero,
          status:         status   ?? voluntarioExistente.status,
          abrigoId:       abrigoId ?? voluntarioExistente.abrigoId,
        }
      })

      return reply.status(200).send({
        mensagem:       'Informações do voluntário atualizadas com sucesso!',
        id_voluntario:  voluntarioAtualizado.id_voluntario,
        nome:           voluntarioAtualizado.nome,
        email:          voluntarioAtualizado.email,
        cpf:            voluntarioAtualizado.cpf,
        telefone:       voluntarioAtualizado.telefone,
        dataNascimento: voluntarioAtualizado.dataNascimento?.toLocaleDateString('pt-BR'),
        genero:         voluntarioAtualizado.genero,
        status:         voluntarioAtualizado.status,
        abrigoId:       voluntarioAtualizado.abrigoId,
      })

    } catch (erro) {
      // Vai mostrar o erro real no terminal
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })


  //----- Deletar -----
  // Rota DELETE para excluir um voluntário
  // URL http://localhost:3000/api/voluntarios/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    const { id } = request.params

    const voluntarioExistente = await prisma.voluntario.findUnique({
      where: { id_voluntario: Number(id) }
    })

    if (!voluntarioExistente) {
      return reply.status(404).send({ mensagem: 'Voluntário não encontrado.' })
    }

    await prisma.voluntario.delete({
      where: { id_voluntario: Number(id) }
    })

    return reply.status(200).send({ mensagem: 'Voluntário excluído com sucesso!' })
  })
}