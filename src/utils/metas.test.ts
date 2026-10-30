import { describe, expect, it } from 'vitest'
import {
  faixaAtingimento,
  metaDoPeriodo,
  metasValidas,
  metasVazias,
  percentualAtingido,
  proporcaoPeriodo,
  realizadoPorCategoria,
  somarMetas,
} from './metas'
import { diasNoMes } from './date'
import { CATEGORIAS } from '@/constants/categorias'
import type { MetasPorCategoria } from '@/types'

// Outubro/2026 tem 31 dias.
const COMP = '2026-10'

describe('proporcaoPeriodo (regra: dias corridos)', () => {
  it('mês retorna 100% da meta', () => {
    expect(proporcaoPeriodo('mes', COMP)).toBe(1)
  })

  it('dia retorna 1/diasNoMes', () => {
    expect(proporcaoPeriodo('dia', COMP)).toBeCloseTo(1 / 31)
    // Fevereiro de ano bissexto: 2028-02 tem 29 dias
    expect(diasNoMes('2028-02')).toBe(29)
    expect(proporcaoPeriodo('dia', '2028-02')).toBeCloseTo(1 / 29)
  })

  it('semana retorna 7/diasNoMes', () => {
    expect(proporcaoPeriodo('semana', COMP)).toBeCloseTo(7 / 31)
  })
})

describe('metaDoPeriodo', () => {
  it('meta mensal é preservada', () => {
    expect(metaDoPeriodo(310, 'mes', COMP)).toBe(310)
  })

  it('meta diária é a mensal dividida pelos dias do mês', () => {
    expect(metaDoPeriodo(310, 'dia', COMP)).toBe(10)
  })

  it('meta semanal é 7x a diária', () => {
    expect(metaDoPeriodo(310, 'semana', COMP)).toBe(70)
  })

  it('arredonda para 2 casas decimais', () => {
    expect(metaDoPeriodo(100, 'dia', COMP)).toBeCloseTo(3.23, 2)
  })
})

describe('somarMetas', () => {
  function metasDe(v80: number, v100: number): MetasPorCategoria {
    const m = metasVazias()
    for (const c of CATEGORIAS) m[c] = { meta80: v80, meta100: v100 }
    return m
  }

  it('soma meta80 e meta100 (R$) por categoria', () => {
    const total = somarMetas([metasDe(800, 1000), metasDe(1600, 2000)])
    expect(total.POS).toEqual({ meta80: 2400, meta100: 3000 })
    expect(total.SVA).toEqual({ meta80: 2400, meta100: 3000 })
  })

  it('lista vazia retorna zeros', () => {
    const total = somarMetas([])
    for (const c of CATEGORIAS) expect(total[c]).toEqual({ meta80: 0, meta100: 0 })
  })
})

describe('realizadoPorCategoria', () => {
  it('soma o valor (R$) das vendas por categoria', () => {
    const r = realizadoPorCategoria([
      { categoria: 'POS', valor: 300 },
      { categoria: 'POS', valor: 100 },
      { categoria: 'SVA', valor: 50 },
      { categoria: 'SVA' }, // venda sem valor conta 0
    ])
    expect(r.POS).toBe(400)
    expect(r.SVA).toBe(50)
    expect(r.FIXA).toBe(0)
  })
})

describe('percentualAtingido / faixaAtingimento', () => {
  it('percentual em relação à meta de 100%', () => {
    expect(percentualAtingido(50, 100)).toBe(50)
    expect(percentualAtingido(120, 100)).toBe(120)
  })

  it('meta zero com realizado zero é 0%; com realizado > 0 é Infinity', () => {
    expect(percentualAtingido(0, 0)).toBe(0)
    expect(percentualAtingido(5, 0)).toBe(Infinity)
  })

  it('faixas: <80, 80–100, 100+', () => {
    expect(faixaAtingimento(79, 100)).toBe('abaixo80')
    expect(faixaAtingimento(80, 100)).toBe('entre80e100')
    expect(faixaAtingimento(99, 100)).toBe('entre80e100')
    expect(faixaAtingimento(100, 100)).toBe('acima100')
    expect(faixaAtingimento(150, 100)).toBe('acima100')
  })
})

describe('metasValidas', () => {
  it('aceita meta100 >= meta80', () => {
    const m = metasVazias()
    m.POS = { meta80: 800, meta100: 1000 }
    expect(metasValidas(m)).toBe(true)
  })

  it('rejeita meta100 < meta80', () => {
    const m = metasVazias()
    m.POS = { meta80: 1000, meta100: 800 }
    expect(metasValidas(m)).toBe(false)
  })

  it('rejeita valores negativos ou não numéricos', () => {
    const m = metasVazias()
    m.SVA = { meta80: -1, meta100: 0 }
    expect(metasValidas(m)).toBe(false)
    m.SVA = { meta80: Number.NaN, meta100: 10 }
    expect(metasValidas(m)).toBe(false)
  })
})
