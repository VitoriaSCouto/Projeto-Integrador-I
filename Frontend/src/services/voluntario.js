// Chamadas do módulo Voluntário que precisam do login (token_voluntario)
import { API_URL } from './api'

// Vincula o voluntário logado a um abrigo (abrigoId = null desvincula).
// Retorna { mensagem, abrigo } ou lança erro com a mensagem da API.
export async function alterarVinculoAbrigo(abrigoId) {
  const token = localStorage.getItem('token_voluntario')

  const resposta = await fetch(`${API_URL}/api/voluntarios/me/abrigo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ abrigoId }),
  })
  const dados = await resposta.json().catch(() => ({}))

  if (resposta.status === 401) {
    window.location.href = '/login-voluntario'
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }
  if (!resposta.ok) throw new Error(dados.mensagem ?? 'Não foi possível salvar o vínculo.')

  return dados
}
