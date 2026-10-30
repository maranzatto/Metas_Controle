export const ICCID_DIGITS = 18
export const ICCIDS_PER_BOX = 100
export const ICCIDS_PER_PACKAGE = 10

/** Retorna o ICCID canônico sem o prefixo 89 ou null quando inválido. */
export function normalizarIccid(valor: string): string | null {
  const digitos = valor.replace(/\D/g, '')
  const canonico = digitos.length === ICCID_DIGITS + 2 && digitos.startsWith('89')
    ? digitos.slice(2)
    : digitos
  return new RegExp(`^\\d{${ICCID_DIGITS}}$`).test(canonico) ? canonico : null
}

/** Expande um intervalo inclusivo e exige a quantidade sequencial informada. */
export function expandirFaixaIccid(inicio: string, fim: string, quantidade: number): string[] {
  const primeiro = normalizarIccid(inicio)
  const ultimo = normalizarIccid(fim)
  if (!primeiro || !ultimo) throw new Error('Informe ICCIDs válidos para início e fim.')

  const numeroInicial = BigInt(primeiro)
  const numeroFinal = BigInt(ultimo)
  if (numeroFinal - numeroInicial + 1n !== BigInt(quantidade)) {
    throw new Error(`O intervalo precisa conter exatamente ${quantidade} ICCIDs sequenciais.`)
  }

  return Array.from({ length: quantidade }, (_, indice) =>
    (numeroInicial + BigInt(indice)).toString().padStart(ICCID_DIGITS, '0'),
  )
}

/** Expande o intervalo inclusivo e exige exatamente 100 ICCIDs sequenciais. */
export function expandirCaixaIccid(inicio: string, fim: string): string[] {
  return expandirFaixaIccid(inicio, fim, ICCIDS_PER_BOX)
}

/** Expande o intervalo inclusivo e exige exatamente 10 ICCIDs sequenciais. */
export function expandirPacoteIccid(inicio: string, fim: string): string[] {
  return expandirFaixaIccid(inicio, fim, ICCIDS_PER_PACKAGE)
}