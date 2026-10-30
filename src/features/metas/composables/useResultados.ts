import { computed, ref, watch, type Ref } from 'vue'
import { CATEGORIAS, type Categoria } from '@/constants/categorias'
import { buscarMetaLoja, buscarMetasDeVarios } from '@/services/vendedores.service'
import { listarVendas } from '@/services/vendas.service'
import type { Venda } from '@/types'
import {
  competenciaDeData,
  fromDateInput,
  intervaloDia,
  intervaloMes,
  intervaloSemana,
  type Intervalo,
} from '@/utils/date'
import {
  faixaAtingimento,
  metaDoPeriodo,
  percentualAtingido,
  realizadoPorCategoria,
  somarMetas,
  type FaixaAtingimento,
  type Periodo,
} from '@/utils/metas'

export interface LinhaResultado {
  categoria: Categoria
  realizado: number // R$
  meta80: number // R$
  meta100: number // R$
  percentual: number
  faixa: FaixaAtingimento
}

/**
 * Calcula realizado × meta por categoria para um período e um conjunto de
 * vendedores (1 = visão individual; N = visão loja). Metas e realizado são em
 * valor (R$). O realizado sempre vem das vendas — nada é persistido como total.
 */
export function useResultados(
  periodo: Ref<Periodo>,
  dataRef: Ref<string>, // "YYYY-MM-DD" — referência para dia/semana
  competencia: Ref<string>, // "YYYY-MM" — referência para mês
  vendedorIds: Ref<string[]>,
  // Quando true (visão loja), prefere a meta global de metasLoja/{competencia};
  // se não houver doc, cai na soma das metas dos vendedores selecionados.
  usarMetaLoja: Ref<boolean> = ref(false),
) {
  const linhas = ref<LinhaResultado[]>([])
  const vendas = ref<Venda[]>([])
  const carregando = ref(false)
  const erro = ref('')

  // Metas são mensais: dia/semana usam a competência do mês da data de referência.
  const competenciaEfetiva = computed(() =>
    periodo.value === 'mes' ? competencia.value : competenciaDeData(fromDateInput(dataRef.value)),
  )

  const intervalo = computed<Intervalo>(() => {
    if (periodo.value === 'dia') return intervaloDia(fromDateInput(dataRef.value))
    if (periodo.value === 'semana') return intervaloSemana(fromDateInput(dataRef.value))
    return intervaloMes(competenciaEfetiva.value)
  })

  async function recarregar() {
    if (vendedorIds.value.length === 0) {
      linhas.value = []
      vendas.value = []
      return
    }
    carregando.value = true
    erro.value = ''
    try {
      const [todasVendas, mapaMetas, metaLoja] = await Promise.all([
        listarVendas(intervalo.value),
        buscarMetasDeVarios(vendedorIds.value, competenciaEfetiva.value),
        usarMetaLoja.value ? buscarMetaLoja(competenciaEfetiva.value) : Promise.resolve(null),
      ])
      const selecionados = new Set(vendedorIds.value)
      vendas.value = todasVendas.filter((v) => selecionados.has(v.vendedorId))
      const realizado = realizadoPorCategoria(vendas.value)
      const metasMes =
        metaLoja?.categorias ??
        somarMetas([...mapaMetas.values()].map((m) => m.categorias))
      const comp = competenciaEfetiva.value
      const per = periodo.value

      linhas.value = CATEGORIAS.map((categoria) => {
        const r = realizado[categoria]
        const meta80 = metaDoPeriodo(metasMes[categoria].meta80, per, comp)
        const meta100 = metaDoPeriodo(metasMes[categoria].meta100, per, comp)
        return {
          categoria,
          realizado: r,
          meta80,
          meta100,
          percentual: percentualAtingido(r, meta100),
          faixa: faixaAtingimento(r, meta100),
        }
      })
    } catch {
      erro.value = 'Não foi possível carregar os resultados.'
    } finally {
      carregando.value = false
    }
  }

  watch([periodo, dataRef, competencia, vendedorIds, usarMetaLoja], recarregar, {
    immediate: true,
    deep: true,
  })

  return { linhas, vendas, carregando, erro, intervalo, competenciaEfetiva, recarregar }
}
