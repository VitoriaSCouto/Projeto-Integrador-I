import supabase from '../supabase.js'

// Extensões aceitas para fotos vindas do WhatsApp
const EXTENSOES = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

// Envia uma foto em base64 para o Storage do Supabase.
// Retorna a URL pública ou null se o upload falhar (quem chama decide se
// isso impede a operação).
export async function enviarFotoBase64(bucket, prefixo, base64, mimetype = 'image/jpeg') {
  const extensao = EXTENSOES[mimetype]
  if (!extensao) return null

  const buffer = Buffer.from(base64, 'base64')
  const nomeArquivo = `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${extensao}`

  // Modo teste (npm run back:teste): não sobe nada, só devolve um endereço falso
  // para os testes conseguirem conferir qual foto foi usada
  if (process.env.ARMAZENAMENTO_FALSO === '1') {
    return `https://teste.invalido/${bucket}/${nomeArquivo}`
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(nomeArquivo, buffer, { contentType: mimetype, upsert: false })

  if (error) {
    console.error(`[STORAGE] Erro ao enviar foto para o bucket ${bucket}:`, error.message)
    return null
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

// Remove do Storage os arquivos das URLs informadas (ignora nulos)
export async function removerFotos(bucket, urls) {
  const nomes = urls
    .filter(Boolean)
    .map(url => url.split('/').pop().split('?')[0])

  if (nomes.length === 0) return

  const { error } = await supabase.storage.from(bucket).remove(nomes)
  if (error) console.error(`[STORAGE] Erro ao remover fotos do bucket ${bucket}:`, error.message)
}
