// Linha de retorno abaixo de um campo (busca de CEP, localização no mapa...)
// feedback = { tipo: 'sucesso' | 'aviso' | 'erro' | 'buscando', mensagem } ou null
const cores = {
  sucesso:  '#16a34a',
  aviso:    '#b45309',
  erro:     '#ef4444',
  buscando: '#64748b',
}

function MensagemFeedback({ feedback }) {
  if (!feedback) return null

  return (
    <p style={{ fontSize: '12px', marginTop: '4px', color: cores[feedback.tipo] ?? cores.buscando }}>
      {feedback.mensagem}
    </p>
  )
}

export default MensagemFeedback;
