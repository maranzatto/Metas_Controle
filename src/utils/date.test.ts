import { describe, expect, it } from 'vitest'
import { competenciaValida, dataInputValida } from './date'

describe('competenciaValida', () => {
  it('aceita competência com mês válido', () => {
    expect(competenciaValida('2026-10')).toBe(true)
  })

  it('rejeita competência vazia, incompleta ou com mês inválido', () => {
    expect(competenciaValida('')).toBe(false)
    expect(competenciaValida('2026-1')).toBe(false)
    expect(competenciaValida('2026-13')).toBe(false)
  })
})

describe('dataInputValida', () => {
  it('aceita uma data válida e rejeita vazia ou inexistente', () => {
    expect(dataInputValida('2026-10-29')).toBe(true)
    expect(dataInputValida('')).toBe(false)
    expect(dataInputValida('2026-02-30')).toBe(false)
  })
})