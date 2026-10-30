import { CATEGORIAS, type Categoria } from '@/constants/categorias'
import type { MetasPorCategoria, Venda } from '@/types'
import { diasNoMes } from './date'

export type Periodo = 'dia' | 'semana' | 'mes'

/**
 * REGRA DE PROPORÇÃO (padrão): dias corridos.
 *   mês    → meta mensal cheia
 *   semana → meta mensal × 7 / diasNoMes   (semana sempre seg–dom)
 *   dia    → meta mensal / diasNoMes
 *
 * Para trocar a regra (ex.: dias úteis), basta alterar `diasDeReferencia`
 * para contar apenas dias úteis no mês e no período.
 */
function diasDeReferencia(periodo: Periodo, competencia: string): { alvo: number; total: number } {
  const total = diasNoMes(competencia)
  if (periodo === 'dia') return { alvo: 1, total }
  if (periodo === 'semana') return { alvo: 7, total }
  return { alvo: total, total }
}

/** Fração da meta mensal que cabe ao período (0–1). */
export function proporcaoPeriodo(periodo: Periodo, competencia: string): number {
  const { alvo, total } = diasDeReferencia(periodo, competencia)
  return total === 0 ? 0 : alvo / total
}

/** Calcula a meta de 80% a partir da meta de 100%, arredondando para centavos. */
export function calcularMeta80(meta100: number): number {
  return Math.round(meta100 * 0.8 * 100) / 100
}

/** Converte meta mensal em meta do período, arredondada para 2 casas. */
export function metaDoPeriodo(metaMensal: number, periodo: Periodo, competencia: string): number {
  return Math.round(metaMensal * proporcaoPeriodo(periodo, competencia) * 100) / 100
}

/** Soma as metas de vários vendedores (visão LOJA). */
export function somarMetas(lista: MetasPorCategoria[]): MetasPorCategoria {
  const acc = metasVazias()
  for (const metas of lista) {
    for (const categoria of CATEGORIAS) {
      acc[categoria].meta80 += metas[categoria]?.meta80 ?? 0
      acc[categoria].meta100 += metas[categoria]?.meta100 ?? 0
    }
  }
  return acc
}

/** Realizado (R$) por categoria a partir das vendas (nunca persistido). */
export function realizadoPorCategoria(
  vendas: Pick<Venda, 'categoria' | 'valor'>[],
): Record<Categoria, number> {
  const acc = {} as Record<Categoria, number>
  for (const categoria of CATEGORIAS) acc[categoria] = 0
  for (const venda of vendas) acc[venda.categoria] += venda.valor ?? 0
  return acc
}

/** % de atingimento em relação à meta de 100%. */
export function percentualAtingido(realizado: number, meta100: number): number {
  if (meta100 <= 0) return realizado > 0 ? Infinity : 0
  return (realizado / meta100) * 100
}

export type FaixaAtingimento = 'abaixo80' | 'entre80e100' | 'acima100'

export function faixaAtingimento(realizado: number, meta100: number): FaixaAtingimento {
  const pct = percentualAtingido(realizado, meta100)
  if (pct >= 100) return 'acima100'
  if (pct >= 80) return 'entre80e100'
  return 'abaixo80'
}

/** Metas mensais zeradas — valor inicial de formulários. */
export function metasVazias(): MetasPorCategoria {
  const m = {} as MetasPorCategoria
  for (const categoria of CATEGORIAS) m[categoria] = { meta80: 0, meta100: 0 }
  return m
}

export function metasValidas(metas: MetasPorCategoria): boolean {
  return CATEGORIAS.every((categoria) => {
    const meta = metas?.[categoria]
    return (
      !!meta &&
      Number.isFinite(meta.meta80) &&
      Number.isFinite(meta.meta100) &&
      meta.meta80 >= 0 &&
      meta.meta100 >= meta.meta80
    )
  })
}
