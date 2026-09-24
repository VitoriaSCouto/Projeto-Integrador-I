// Auxiliares das telas de listagem com filtros (styles/listagem.css):
// Abrigos do voluntário, Abrigos do admin e Vítimas do admin.
import { FaPaw, FaWheelchair, FaStethoscope, FaSyringe, FaUtensils } from 'react-icons/fa';

// Estrutura do abrigo: campo da API → rótulo e ícone (filtros e cards)
export const ESTRUTURAS = [
  { campo: 'possuiPets',              label: 'Aceita pets',        icone: <FaPaw /> },
  { campo: 'possuiAcessibilidade',    label: 'Acessibilidade',     icone: <FaWheelchair /> },
  { campo: 'possuiAtendimentoMedico', label: 'Atendimento médico', icone: <FaStethoscope /> },
  { campo: 'possuiEnfermagem',        label: 'Enfermagem',         icone: <FaSyringe /> },
  { campo: 'possuiCozinha',           label: 'Cozinha',            icone: <FaUtensils /> },
]

// Situação pela ocupação (chips de filtro)
export const SITUACOES = [
  { valor: 'todas',   label: 'Todos' },
  { valor: 'vagas',   label: 'Com vagas' },
  { valor: 'quase',   label: 'Quase lotados' },
  { valor: 'lotados', label: 'Lotados' },
]

export const ocupacaoDe = (abrigo) => abrigo.capacidadeTotal > 0
  ? Math.min(100, Math.round((abrigo.capacidadeOcupada / abrigo.capacidadeTotal) * 100))
  : 0

export const vagasDe = (abrigo) => Math.max(0, abrigo.capacidadeTotal - abrigo.capacidadeOcupada)

export const corOcupacao = (pct) => pct >= 100 ? '#dc2626' : pct >= 80 ? '#f59e0b' : '#16a34a'

// O abrigo passa no filtro de situação escolhido?
export const passaSituacao = (abrigo, situacao) => {
  const pct = ocupacaoDe(abrigo)
  if (situacao === 'vagas')   return vagasDe(abrigo) > 0
  if (situacao === 'quase')   return pct >= 80 && pct < 100
  if (situacao === 'lotados') return pct >= 100
  return true
}

// Minúsculo e sem acento, para as buscas ("São José" acha "sao jose")
export const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// "12 abrigos encontrados" / "1 abrigo encontrado"
export const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`
