

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