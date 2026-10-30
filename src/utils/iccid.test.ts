import { describe, expect, it } from 'vitest'
import { expandirCaixaIccid, normalizarIccid } from './iccid'

const INICIO = '551094360122857072'

describe('normalizarIccid', () => {
  it('remove o prefixo 89 quando o ICCID vem completo', () => {
    expect(normalizarIccid('89551094360122857072')).toBe(INICIO)
  })

  it('mantém a forma sem prefixo e ignora separadores do scanner', () => {
    expect(normalizarIccid('5510 9436 0122 8570 72')).toBe(INICIO)
  })

  it('rejeita números com tamanho inválido', () => {
    expect(normalizarIccid('895510')).toBeNull()
  })
})

describe('expandirCaixaIccid', () => {
  it('expande uma caixa inclusiva em 100 números e preserva zeros', () => {
    const caixa = expandirCaixaIccid(INICIO, '551094360122857171')
    expect(caixa).toHaveLength(100)
    expect(caixa[0]).toBe(INICIO)
    expect(caixa[99]).toBe('551094360122857171')
  })

  it('aceita início e fim com prefixo 89', () => {
    const caixa = expandirCaixaIccid('89' + INICIO, '89551094360122857171')
    expect(caixa).toHaveLength(100)
    expect(caixa[0]).toBe(INICIO)
  })

  it('rejeita intervalo que não contém exatamente 100 unidades', () => {
    expect(() => expandirCaixaIccid(INICIO, '551094360122857170')).toThrow(
      'exatamente 100',
    )
  })
})