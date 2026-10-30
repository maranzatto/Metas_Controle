<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CATEGORIAS, CATEGORIA_LABELS, type Categoria } from '@/constants/categorias'
import { useVendedoresStore } from '@/stores/vendedores'
import type { MetasPorCategoria } from '@/types'
import { competenciaAtual, competenciaValida } from '@/utils/date'
import { formatarCompetencia } from '@/utils/format'
import { moedaParaInput, parseMoeda } from '@/utils/masks'
import { calcularMeta80, metasValidas, metasVazias } from '@/utils/metas'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const route = useRoute()
const router = useRouter()
const store = useVendedoresStore()

// /metas/loja usa esta mesma página com a prop `loja` (sem vendedor associado).
const props = withDefaults(defineProps<{ loja?: boolean }>(), { loja: false })

const vendedorId = route.params.id as string
const vendedor = computed(() => store.porId.get(vendedorId))

const competencia = ref(competenciaAtual())
// O formulário trabalha com strings mascaradas ("1.234,56"); converte para number ao salvar.
const metas = ref<Record<Categoria, { meta80: string; meta100: string }>>(formVazio())
const meta80Automatica = ref<Record<Categoria, boolean>>(automaticoPorCategoria())
const carregando = ref(true)
const erro = ref('')
const salvando = ref(false)

function formVazio() {
  const m = {} as Record<Categoria, { meta80: string; meta100: string }>
  for (const c of CATEGORIAS) m[c] = { meta80: '', meta100: '' }
  return m
}

function automaticoPorCategoria(valor = true) {
  const estado = {} as Record<Categoria, boolean>
  for (const categoria of CATEGORIAS) estado[categoria] = valor
  return estado
}

function atualizarMeta80Automatica(categoria: Categoria) {
  const meta100 = metas.value[categoria].meta100
  if (!meta100.trim()) {
    metas.value[categoria].meta80 = ''
    return
  }
  metas.value[categoria].meta80 = moedaParaInput(calcularMeta80(parseMoeda(meta100)))
}

function alterarMeta100(categoria: Categoria, valor: string | number) {
  metas.value[categoria].meta100 = String(valor)
  if (meta80Automatica.value[categoria]) atualizarMeta80Automatica(categoria)
}

function alterarMeta80(categoria: Categoria, valor: string | number) {
  metas.value[categoria].meta80 = String(valor)
  meta80Automatica.value[categoria] = false
}

function ativarMeta80Automatica(categoria: Categoria) {
  meta80Automatica.value[categoria] = true
  atualizarMeta80Automatica(categoria)
}

function paraNumeros(): MetasPorCategoria {
  const m = metasVazias()
  for (const c of CATEGORIAS) {
    m[c].meta80 = parseMoeda(metas.value[c].meta80)
    m[c].meta100 = parseMoeda(metas.value[c].meta100)
  }
  return m
}

async function carregarMetas() {
  erro.value = ''
  if (!competenciaValida(competencia.value)) {
    erro.value = 'Informe um mês válido para carregar as metas.'
    carregando.value = false
    return
  }
  carregando.value = true
  try {
    const salvas = (
      await (props.loja
        ? store.buscarMetaLoja(competencia.value)
        : store.buscarMetas(vendedorId, competencia.value))
    )?.categorias
    const form = formVazio()
    const automatico = automaticoPorCategoria()
    if (salvas) {
      for (const c of CATEGORIAS) {
        form[c].meta80 = salvas[c]?.meta80 != null ? moedaParaInput(salvas[c].meta80) : ''
        form[c].meta100 = salvas[c]?.meta100 != null ? moedaParaInput(salvas[c].meta100) : ''
        automatico[c] = salvas[c]?.meta80 == null
        if (automatico[c] && form[c].meta100) {
          form[c].meta80 = moedaParaInput(calcularMeta80(parseMoeda(form[c].meta100)))
        }
      }
    }
    metas.value = form
    meta80Automatica.value = automatico
  } catch {
    erro.value = 'Não foi possível carregar as metas.'
  } finally {
    carregando.value = false
  }
}

onMounted(async () => {
  if (!props.loja) await store.carregar()
  await carregarMetas()
})

watch(competencia, carregarMetas)

async function salvar() {
  if (!competenciaValida(competencia.value)) {
    erro.value = 'Informe um mês válido antes de salvar.'
    return
  }
  const categoriaIncompleta = CATEGORIAS.find(
    (categoria) => !metas.value[categoria].meta80.trim() || !metas.value[categoria].meta100.trim(),
  )
  if (categoriaIncompleta) {
    erro.value = `Preencha as metas 80% e 100% de ${CATEGORIA_LABELS[categoriaIncompleta]}. Use 0,00 se não houver meta para a categoria.`
    return
  }
  const numeros = paraNumeros()
  if (!metasValidas(numeros)) {
    erro.value = 'Revise as metas: a meta de 100% deve ser maior ou igual à de 80%.'
    return
  }
  salvando.value = true
  erro.value = ''
  try {
    if (props.loja) {
      await store.salvarMetaLoja(competencia.value, numeros)
      router.push({ name: 'metas' })
    } else {
      await store.salvarMetas(vendedorId, competencia.value, numeros)
      router.push({ name: 'vendedores' })
    }
  } catch {
    erro.value = 'Não foi possível salvar as metas.'
    salvando.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- barra de ação sempre no topo -->
    <div
      class="glass-light sticky top-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 p-4 shadow-sm"
    >
      <div class="flex min-w-0 items-center gap-3">
        <RouterLink
          :to="{ name: props.loja ? 'metas' : 'vendedores' }"
          class="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-700 transition hover:bg-brand-50"
        >
          ←
        </RouterLink>
        <div class="min-w-0">
          <h2 class="truncate font-bold text-brand-950">
            {{ props.loja ? 'Metas da loja' : `Metas — ${vendedor?.nome ?? 'Vendedor'}` }}
          </h2>
          <p class="text-xs text-brand-900/50">
            Competência: {{ formatarCompetencia(competencia) }}
          </p>
        </div>
      </div>
      <div class="flex items-end gap-2">
        <BaseInput v-model="competencia" label="Mês" type="month" class="w-40" required />
        <BaseButton
          variant="secondary"
          @click="router.push({ name: props.loja ? 'metas' : 'vendedores' })"
        >
          Cancelar
        </BaseButton>
        <BaseButton :disabled="salvando || carregando" @click="salvar">
          {{ salvando ? 'Salvando…' : 'Salvar metas' }}
        </BaseButton>
      </div>
    </div>

    <p v-if="!props.loja && !vendedor && !carregando" class="text-sm font-medium text-rose-600">
      Vendedor não encontrado.
    </p>
    <p v-if="erro" class="text-sm font-medium text-rose-600">{{ erro }}</p>
    <p v-if="carregando" class="text-sm text-brand-300">Carregando…</p>

    <template v-else-if="props.loja || vendedor">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <section
          v-for="c in CATEGORIAS"
          :key="c"
          class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
        >
          <h3 class="mb-4 font-bold text-brand-950">{{ CATEGORIA_LABELS[c] }}</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <BaseInput
                :model-value="metas[c].meta80"
                @update:model-value="alterarMeta80(c, $event)"
                label="Meta 80% (R$)"
                mask="currency"
                placeholder="0,00"
                required
              />
              <button
                v-if="!meta80Automatica[c]"
                type="button"
                class="mt-1 text-left text-xs font-semibold text-brand-700 hover:text-brand-900"
                @click="ativarMeta80Automatica(c)"
              >
                Calcular automaticamente
              </button>
              <p v-else class="mt-1 text-xs text-brand-500">80% da meta de 100%</p>
            </div>
            <BaseInput
              :model-value="metas[c].meta100"
              @update:model-value="alterarMeta100(c, $event)"
              label="Meta 100% (R$)"
              mask="currency"
              placeholder="0,00"
              required
            />
          </div>
        </section>
      </div>

      <p class="text-xs text-brand-900/50">
        Informe os valores em R$. Para categorias sem meta, use 0,00.
      </p>
    </template>
  </div>
</template>
