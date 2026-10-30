/** Competência no formato "YYYY-MM" usada como id do doc de metas. */
export function competenciaDeData(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mes}`
}

export function competenciaAtual(): string {
  return competenciaDeData(new Date())
}

export function competenciaValida(valor: string): boolean {
  const correspondencia = /^(\d{4})-(\d{2})$/.exec(valor)
  if (!correspondencia) return false
  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  return ano > 0 && mes >= 1 && mes <= 12
}

export function dataInputValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const data = new Date(`${valor}T00:00:00.000Z`)
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor
}

export function diasNoMes(competencia: string): number {
  const [ano, mes] = competencia.split('-').map(Number)
  return new Date(ano, mes, 0).getDate()
}

/** Segunda-feira 00:00 da semana que contém `d`. */
export function inicioDaSemana(d: Date): Date {
  const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diaSemana = (inicio.getDay() + 6) % 7 // 0 = segunda
  inicio.setDate(inicio.getDate() - diaSemana)
  return inicio
}

export interface Intervalo {
  inicio: Date
  fim: Date // exclusivo
}

export function intervaloDia(d: Date): Intervalo {
  const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 1)
  return { inicio, fim }
}

export function intervaloSemana(d: Date): Intervalo {
  const inicio = inicioDaSemana(d)
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 7)
  return { inicio, fim }
}

export function intervaloMes(competencia: string): Intervalo {
  const [ano, mes] = competencia.split('-').map(Number)
  return { inicio: new Date(ano, mes - 1, 1), fim: new Date(ano, mes, 1) }
}

/** Valor para <input type="date"> em horário local (evita bugs de fuso). */
export function toDateInput(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Converte "YYYY-MM-DD" para Date local ao meio-dia (meio-dia evita virada de dia por fuso/DST). */
export function fromDateInput(v: string): Date {
  const [ano, mes, dia] = v.split('-').map(Number)
  return new Date(ano, mes - 1, dia, 12, 0, 0, 0)
}

export function formatarData(d: Date): string {
  return d.toLocaleDateString('pt-BR')
}
