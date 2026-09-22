import alertasRoutes from './routes/alertas.js'
//Os imports necessários para o servidor

import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import authRoutes from './routes/auth.js'
import abrigoRoutes from './routes/abrigos.js'
import regiaoRoutes from './routes/regiao.js'
import vitimaRoutes from './routes/vitima.js'
import solicitacaoAbrigoRoutes from './routes/solicitacao_abrigo.js'
import voluntarioRoutes from './routes/voluntario.js'
import solicitacaoAjudaRoutes from './routes/solicitacao_ajuda.js'
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

app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ mensagem: 'Token inválido ou expirado.' })
  }
})

// Registra as suas rotas
app.register(authRoutes, { prefix: '/api/auth' })
app.register(abrigoRoutes, { prefix: '/api/abrigos' })
app.register(regiaoRoutes, { prefix: '/api/regioes' })
app.register(vitimaRoutes, { prefix: '/api/vitimas' })
app.register(solicitacaoAbrigoRoutes, { prefix: '/api/solicitacoes'})
app.register(voluntarioRoutes, { prefix: '/api/voluntarios' })
app.register(solicitacaoAjudaRoutes, { prefix: '/api/solicitacoes-ajuda' })


app.register(alertasRoutes, { prefix: '/api/alertas' })

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