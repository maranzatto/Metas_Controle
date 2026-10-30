<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CATEGORIAS, CATEGORIA_LABELS, type Categoria } from '@/constants/categorias'
import { useVendedoresStore } from '@/stores/vendedores'
import type { MetasPorCategoria } from '@/types'
import { competenciaAtual } from '@/utils/date'
import { formatarCompetencia } from '@/utils/format'
import { moedaParaInput, parseMoeda } from '@/utils/masks'
import { metasValidas, metasVazias } from '@/utils/metas'
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
const carregando = ref(true)
const erro = ref('')
const salvando = ref(false)

function formVazio() {
  const m = {} as Record<Categoria, { meta80: string; meta100: string }>
  for (const c of CATEGORIAS) m[c] = { meta80: '', meta100: '' }
  return m
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
  carregando.value = true
  const salvas = (
    await (props.loja
      ? store.buscarMetaLoja(competencia.value)
      : store.buscarMetas(vendedorId, competencia.value))
  )?.categorias
  const form = formVazio()
  if (salvas) {
    for (const c of CATEGORIAS) {
      form[c].meta80 = salvas[c]?.meta80 ? moedaParaInput(salvas[c].meta80) : ''
      form[c].meta100 = salvas[c]?.meta100 ? moedaParaInput(salvas[c].meta100) : ''
    }
  }
  metas.value = form
  carregando.value = false
}

onMounted(async () => {
  if (!props.loja) await store.carregar()
  await carregarMetas()
})

watch(competencia, carregarMetas)

async function salvar() {
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
        <BaseInput v-model="competencia" label="Mês" type="month" class="w-40" />
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
            <BaseInput
              v-model="metas[c].meta80"
              label="Meta 80% (R$)"
              mask="currency"
              placeholder="0,00"
            />
            <BaseInput
              v-model="metas[c].meta100"
              label="Meta 100% (R$)"
              mask="currency"
              placeholder="0,00"
            />
          </div>
        </section>
      </div>

      <p class="text-xs text-brand-900/50">
        Metas em valor (R$). Deixe em branco para ignorar a categoria.
      </p>
    </template>
  </div>
</template>
