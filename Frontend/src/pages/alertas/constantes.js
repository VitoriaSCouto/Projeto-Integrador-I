// Rótulos usados nas telas de Alertas, Inscritos e Regiões

export const STATUS_ALERTA = {
  em_verificacao: 'Em verificação',
  ativo:          'Ativo',
  encerrado:      'Encerrado',
  cancelado:      'Cancelado',
}

export const STATUS_NOTIFICACAO = {
  pendente:  'Na fila',
  enviando:  'Enviando',
  enviada:   'Enviadas',
  falha:     'Falharam',
  cancelada: 'Canceladas',
}

export const NIVEIS_RISCO = [
  { valor: 'baixo',   label: 'Baixo' },
  { valor: 'medio',   label: 'Médio' },
  { valor: 'alto',    label: 'Alto' },
  { valor: 'critico', label: 'Crítico' },
]
