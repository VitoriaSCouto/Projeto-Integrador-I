// Conexão ÚNICA com o banco, compartilhada por todas as rotas
//
// Antes cada arquivo de rota fazia "new PrismaClient()", e cada um abria o
// seu próprio grupo de conexões. Com 12 arquivos, a API passava do limite de
// conexões do Supabase (erro "EMAXCONN") e as telas recebiam erro 500.
//
// Use sempre:  import prisma from '../lib/prisma.js'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Limita quantas conexões a API mantém abertas (o pooler do Supabase no
// plano gratuito aceita poucas). Se a URL já define connection_limit, respeita.
function urlComLimite() {
  const url = new URL(process.env.DATABASE_URL)
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '5')
  }
  return url.toString()
}

const prisma = new PrismaClient({ datasourceUrl: urlComLimite() })

export default prisma
