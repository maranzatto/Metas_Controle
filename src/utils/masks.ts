export type MaskName = 'currency' | 'phone' | 'cpf' | 'date' | 'int'

const digitos = (v: string) => v.replace(/\D/g, '')

/** "123456" → "1.234,56" — moeda BRL, sempre 2 casas. Vazio permanece vazio. */
export function maskMoeda(v: string): string {
  const brutos = digitos(v).slice(0, 15)
  if (!brutos) return ''
  // "0025000" → "25000": sem o strip, zeros do valor anterior grudam na frente.
  const d = brutos.replace(/^0+/, '') || '0'
  const centavos = d.padStart(3, '0')
  const inteiro = centavos.slice(0, -2)
  const decimal = centavos.slice(-2)
  return `${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimal}`
}

/** "1.234,56" → 1234.56 */
export function parseMoeda(v: string): number {
  const d = digitos(v)
  return d ? Number(d) / 100 : 0
}

/** number → string para input mascarado ("1234.5" → "1.234,50") */
export function moedaParaInput(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** "(00) 00000-0000" ou "(00) 0000-0000" */
export function maskTelefone(v: string): string {
  const d = digitos(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** "000.000.000-00" */
export function maskCpf(v: string): string {
  const d = digitos(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** "DD/MM/AAAA" */
export function maskData(v: string): string {
  const d = digitos(v).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

export function maskInteiro(v: string): string {
  return digitos(v)
}
