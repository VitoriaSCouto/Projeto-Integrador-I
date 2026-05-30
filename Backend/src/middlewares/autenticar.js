// Verifica se o token JWT enviado pelo frontend é válido

export async function autenticar(request, reply) {
  try {
    // jwtVerify lê o token do cabeçalho Authorization
    // e verifica se foi assinado com o JWT_SECRET correto
    await request.jwtVerify()
  } catch (err) {
    // Token inválido ou expirado
    reply.status(401).send({ mensagem: 'Token inválido ou expirado.' })
  }
}