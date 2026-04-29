// // Importa o Fastify — framework que cria o servidor web
// import Fastify from 'fastify'

// // Importa o plugin JWT para gerar e validar tokens de autenticação
// import fastifyJwt from '@fastify/jwt'

// // Importa as rotas de autenticação (cadastro e login)
// import authRoutes from './routes/auth.js'

// // Cria a instância do servidor com logs ativados
// // Os logs mostram no terminal o que está acontecendo
// const app = Fastify({ logger: true })

// // Registra o plugin JWT no servidor
// // O secret é a chave secreta do .env usada para assinar os tokens
// app.register(fastifyJwt, {
//   secret: process.env.JWT_SECRET
// })

// // Registra as rotas de autenticação com prefixo /api/auth
// // Todas as rotas do auth.js começam com /api/auth
// // Exemplo: /api/auth/login, /api/auth/cadastrar
// app.register(authRoutes, { prefix: '/api/auth' })

// // Inicia o servidor na porta 3000
// app.listen({ port: 3000 }, (err) => {
//   if (err) { 
//     console.error(err)  // Se der erro ao iniciar, mostra o erro e encerra
//     process.exit(1)
//   }
//   console.log('Servidor rodando em http://localhost:3000')
// })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import authRoutes from './routes/auth.js'
import 'dotenv/config' // Garante que o process.env funcione

//cria a instância
const app = Fastify({ logger: true })

// registra o CORS (necessário para conectar com o frontend)
await app.register(cors, { 
  origin: true 
})

// Registra o JWT usando a sua chave do .env
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET
})

// Registra as suas rotas
app.register(authRoutes, { prefix: '/api/auth' })

// Inicia o servidor
const start = async () => {
  try {
    await app.listen({ port: 3000 })
    console.log('Servidor rodando em http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()