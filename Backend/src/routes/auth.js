// Importa o PrismaClient para acessar o banco de dados
import { PrismaClient } from '@prisma/client'

// Importa o bcrypt para criptografar e comparar senhas
// Nunca salvar a senha pura no banco
import bcrypt from 'bcrypt'

// Cria a instância do Prisma
const prisma = new PrismaClient()

// Exporta as rotas
export default async function authRoutes(app) {

  // rota de cadastro
  // POST /api/auth/cadastrar
  // Recebe nome, email, senha e cargo do frontend
  app.post('/cadastrar', async (request, reply) => {

    // Extrai os dados do corpo da requisição
    const { nome, email, senha, cargo } = request.body

    // Verifica se já existe um admin com esse email
    const adminExistente = await prisma.admin.findUnique({
      where: { email }
    })

    // Se já existir, retorna erro 400
    if (adminExistente) {
      return reply.status(400).send({ mensagem: 'Email já cadastrado.' })
    }

    // Criptografa a senha — o 10 é o nível de segurança
    // Quanto maior o número, mais seguro e mais lento
    const senhaCriptografada = await bcrypt.hash(senha, 10)

    // Salva o admin no banco com a senha criptografada
    const admin = await prisma.admin.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        cargo: cargo || 'operador' // se não informar, usa operador como padrão
      }
    })

    // Retorna sucesso — nunca retornando a senha
    return reply.status(201).send({
      mensagem: 'Administrador cadastrado com sucesso!',
      id: admin.id,
      nome: admin.nome,
      email: admin.email
    })
  })


  // Rota de login 
  // POST /api/auth/login
  // Recebe email e senha, retorna o token JWT
  app.post('/login', async (request, reply) => {

    // Extrai email e senha do corpo da requisição
    const { email, senha } = request.body

    // Busca o admin no banco pelo email
    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    // Se não encontrar, retorna erro
    if (!admin) {
      return reply.status(401).send({ mensagem: 'Email ou senha incorretos.' })
    }

    // Compara a senha digitada com a criptografada no banco
    const senhaCorreta = await bcrypt.compare(senha, admin.senha)

    // Se a senha não bater, retorna erro
    if (!senhaCorreta) {
      return reply.status(401).send({ mensagem: 'Email ou senha incorretos.' })
    }

    // Gera o token JWT com os dados do admin
    // Esses dados ficam dentro do token e podem ser lidos depois
    // O token expira em 8 horas
    const token = app.jwt.sign(
      { id: admin.id, email: admin.email, cargo: admin.cargo, tipo: 'admin' },
      { expiresIn: '8h' }
    )

    // Retorna o token e os dados do admin
    // O frontend salva esse token e usa em todas as próximas requisições
    return reply.send({
      mensagem: 'Login realizado com sucesso!',
      token,
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        cargo: admin.cargo
      }
    })
  })
}