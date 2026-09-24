// Cliente HTTP das telas administrativas
//
// • Usa a URL da API do .env do Vite (VITE_API_URL) ou localhost:3000
// • Envia o token do admin (salvo no login) no cabeçalho Authorization
// • Lança um erro com a mensagem da API quando a resposta não é 2xx —
//   assim a tela só mostra "sucesso" quando a operação deu certo de verdade
// • Se o login expirou, manda para a tela de login

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function apiAdmin(caminho, { metodo = 'GET', corpo } = {}) {
  const token = localStorage.getItem('token_adm')

  const resposta = await fetch(`${API_URL}/api${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  })

  let dados = {}
  try {
    dados = await resposta.json()
  } catch {
    // resposta sem corpo
  }

  if (resposta.status === 401) {
    alert(dados.mensagem ?? 'Sua sessão expirou. Faça login novamente.')
    window.location.href = '/login-adm'
    throw new Error(dados.mensagem ?? 'Não autenticado')
  }

  if (!resposta.ok) {
    throw new Error(dados.mensagem ?? `Erro ${resposta.status}`)
  }

  return dados
}

// Converte "2026-06-24T03:55:54.000Z" em "Há 15 min", "Há 2h", etc.
export function formatarTempo(dataISO) {
  const diffMin = Math.floor((Date.now() - new Date(dataISO)) / 1000 / 60)

  if (diffMin < 1)  return 'Agora mesmo'
  if (diffMin < 60) return `Há ${diffMin} min`

  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24) return `Há ${diffHoras}h`

  return `Há ${Math.floor(diffHoras / 24)} dias`
}

// "5512982487132" → "+55 (12) 98248-7132". Se não parecer um telefone
// brasileiro, devolve os dígitos como vieram.
export function formatarTelefone(telefone) {
  const d = String(telefone ?? '').replace(/\D/g, '')
  if (!d) return null
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : d
}

export function formatarDataHora(dataISO) {
  if (!dataISO) return '—'
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
