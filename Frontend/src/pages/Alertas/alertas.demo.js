// Cenários fictícios, criados em memória a cada abertura. Não são avisos reais.
export function criarDadosDemo() {
  const agora = Date.now();
  const horario = (horas) => new Date(agora + horas * 3_600_000).toISOString();
  const admin = { id: 1, nome: 'Operador de demonstração' };
  const regioes = [
    { id_regiao: 1, bairro: 'Centro', cidade: 'Taubaté', estado: 'SP', populacaoEstimada: null },
    { id_regiao: 2, bairro: 'Vila Menino Jesus', cidade: 'Caçapava', estado: 'SP', populacaoEstimada: null },
    { id_regiao: 3, bairro: 'Moreira César', cidade: 'Pindamonhangaba', estado: 'SP', populacaoEstimada: null },
  ];
  const cenarios = [
    ['Elevação do nível da água', 'inundacao', 'critica', 'publicado', 1, -2, 5,
      'Cenário fictício para demonstrar um comunicado sobre elevação de água na região.',
      'Exemplo de campo: registre aqui as orientações confirmadas pela equipe responsável.'],
    ['Monitoramento de encostas', 'deslizamento', 'alta', 'publicado', 2, -1, 30,
      'Exemplo fictício de acompanhamento preventivo de uma área de encosta.',
      'Exemplo de campo: descreva os pontos monitorados e as instruções validadas para essa região.'],
    ['Possibilidade de chuva intensa', 'tempestade', 'moderada', 'em_revisao', 3, 0, 12,
      'Texto de demonstração aguardando revisão do responsável antes da publicação.',
      'Exemplo de campo: revise a fonte e confirme o período de validade antes de publicar.'],
    ['Ventos fortes no município', 'vento_forte', 'alta', 'rascunho', 1, 1, 18,
      'Rascunho fictício que pode ser editado para conhecer o formulário de alertas.',
      'Exemplo de campo: inclua as orientações aprovadas pela coordenação.'],
    ['Comunicado preventivo regional', 'outro', 'baixa', 'publicado', 3, 8, 32,
      'Exemplo de alerta publicado cujo período de validade ainda não começou.',
      'Exemplo de campo: mantenha a mensagem objetiva e indique sua fonte.'],
    ['Acompanhamento de chuva encerrado', 'tempestade', 'moderada', 'publicado', 2, -25, -1,
      'Exemplo de comunicado que deixou de ser ativo ao chegar ao fim da validade.',
      'Exemplo de campo: uma nova condição deve gerar um novo comunicado validado.'],
  ];
  const alertas = cenarios.map(([titulo, tipo, severidade, status, regiaoId, inicio, fim, descricao, orientacoes], i) => {
    const createdAt = horario(-30 - i);
    const historico = [{ id: `demo-${i}-1`, acao: 'criar', observacao: 'Registro fictício para conhecer a tela.', createdAt, ator: admin }];
    if (status !== 'rascunho') historico.unshift({ id: `demo-${i}-2`, acao: 'enviar_revisao', observacao: '', createdAt: horario(-29), ator: admin });
    if (status === 'publicado') historico.unshift({ id: `demo-${i}-3`, acao: 'publicar', observacao: 'Publicação simulada no painel.', createdAt: horario(-28), ator: admin });
    return { id_alerta: i + 1, titulo, tipo, severidade, status, regiaoId, descricao, orientacoes,
      regiao: regioes.find((r) => r.id_regiao === regiaoId), inicioEm: horario(inicio), expiraEm: horario(fim),
      fonteNome: 'Fonte de demonstração • sem vínculo oficial', fonteUrl: '', versao: historico.length,
      criadoPor: admin, createdAt, updatedAt: historico[0].createdAt,
      publicadoEm: status === 'publicado' ? horario(-28) : null, historico };
  });
  return { admin, regioes, alertas };
}
