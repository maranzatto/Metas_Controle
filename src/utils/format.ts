export function formatarNumero(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function formatarMoeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarPercentual(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

/** "2026-10" → "out/2026" */
export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(
    new Date(ano, mes - 1, 1),
  )
}
