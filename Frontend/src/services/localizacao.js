// Endereço a partir do CEP e coordenadas para o mapa
// (usado nos formulários de abrigo)
import { API_URL, apiAdmin } from './api'

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ─── CEP → endereço ──────────────────────────────────────────────────────────
// Consulta o CEP (ViaCEP, pela nossa API) e devolve a localidade pronta para o
// formulário. Se o bairro do CEP ainda não estiver cadastrado, cadastra.
//
// Retorna { cep, logradouro, cidadeId, bairroId, estado, cidade, bairro, criouBairro }
// Lança erro com mensagem amigável se o CEP não existir.
export async function preencherPorCep(cep) {
  const digitos = String(cep ?? '').replace(/\D/g, '')
  if (digitos.length !== 8) throw new Error('O CEP deve ter 8 números.')

  const resposta = await fetch(`${API_URL}/api/bairros/cep/${digitos}`)
  const dados = await resposta.json().catch(() => ({}))
  if (resposta.status === 404) throw new Error('CEP não encontrado.')
  if (!resposta.ok) throw new Error(dados.mensagem ?? 'Não foi possível consultar o CEP.')

  const localidade = {
    cep:        dados.cep,
    logradouro: dados.logradouro ?? '',
    estado:     dados.uf,
    cidade:     dados.cidade,
    bairro:     dados.bairro ?? '',
    cidadeId:   dados.cidadeId,
    bairroId:   dados.bairroId,
    criouBairro: false,
  }

  // Bairro (ou cidade) ainda não cadastrado: cadastra a partir do CEP
  if (dados.bairro && !dados.bairroId) {
    const criado = await apiAdmin('/bairros/cep', { metodo: 'POST', corpo: { cep: digitos } })
    localidade.cidadeId = criado.bairro.cidadeId
    localidade.bairroId = criado.bairro.id_bairro
    localidade.criouBairro = criado.criouBairro
  }

  return localidade
}

// ─── Endereço → coordenadas ──────────────────────────────────────────────────
// Usa o Nominatim (OpenStreetMap). Muitos endereços brasileiros não são
// encontrados pelo nome da rua, então tentamos do mais preciso ao mais geral
// até achar: endereço completo → rua + cidade → CEP → bairro → cidade.
//
// Retorna { latitude, longitude, precisao, descricao } ou null se nada for achado.
// "precisao" diz de onde veio o ponto, para avisar quando é aproximado.
export async function geocodificar({ endereco, bairro, cidade, estado, cep }) {
  const base = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br'
  const q = (texto) => `&q=${encodeURIComponent(texto)}`
  const partes = (...itens) => itens.filter(Boolean).join(', ')
  const cepFormatado = String(cep ?? '').replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')

  const tentativas = [
    endereco && cidade && { precisao: 'endereco', descricao: 'pelo endereço',              busca: q(partes(endereco, bairro, cidade, estado, 'Brasil')) },
    endereco && cidade && { precisao: 'rua',      descricao: 'pela rua',                    busca: `&street=${encodeURIComponent(endereco)}&city=${encodeURIComponent(cidade)}&state=${encodeURIComponent(estado ?? '')}` },
    cepFormatado.length === 9 && { precisao: 'cep', descricao: 'aproximada, pelo CEP',     busca: `&postalcode=${cepFormatado}` },
    bairro && cidade && { precisao: 'bairro',     descricao: 'aproximada, centro do bairro', busca: q(partes(bairro, cidade, estado, 'Brasil')) },
    cidade && { precisao: 'cidade',               descricao: 'aproximada, centro da cidade', busca: q(partes(cidade, estado, 'Brasil')) },
  ].filter(Boolean)

  for (const [indice, tentativa] of tentativas.entries()) {
    // O Nominatim pede no máximo 1 consulta por segundo
    if (indice > 0) await esperar(1100)

    try {
      const resposta = await fetch(base + tentativa.busca, { headers: { 'Accept-Language': 'pt-BR' } })
      const resultado = await resposta.json()
      if (resultado.length > 0) {
        return {
          latitude:  parseFloat(resultado[0].lat),
          longitude: parseFloat(resultado[0].lon),
          precisao:  tentativa.precisao,
          descricao: tentativa.descricao,
        }
      }
    } catch (erro) {
      console.error('Erro no geocoding:', erro)
    }
  }

  return null
}
