<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { FirebaseError } from 'firebase/app'
import { CATEGORIA_LABELS } from '@/constants/categorias'
import { useVendasStore } from '@/stores/vendas'
import { useVendedoresStore } from '@/stores/vendedores'
import type { Venda } from '@/types'
import { competenciaAtual, competenciaValida, intervaloMes, formatarData } from '@/utils/date'
import { formatarMoeda, formatarNumero } from '@/utils/format'
import type { VendaInput } from '@/services/vendas.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import VendaForm from './VendaForm.vue'

const vendasStore = useVendasStore()
const vendedoresStore = useVendedoresStore()

const competencia = ref(competenciaAtual())
const filtroVendedor = ref('')
const intervalo = computed(() => intervaloMes(competencia.value))

const formAberto = ref(false)
const editando = ref<Venda | null>(null)
const excluindo = ref<Venda | null>(null)
const erro = ref('')
const erroCarregamento = ref('')

const lista = computed(() =>
  filtroVendedor.value
    ? vendasStore.lista.filter((v) => v.vendedorId === filtroVendedor.value)
    : vendasStore.lista,
)

function nomeVendedor(id: string) {
  return vendedoresStore.porId.get(id)?.nome ?? '—'
}

function mensagemErroCarregamento(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === 'failed-precondition') {
      return 'O índice de vendas ainda não está disponível. Publique os índices do Firestore e tente novamente.'
    }
    if (error.code === 'permission-denied') {
      return 'O Firestore negou a consulta. Confira as regras publicadas e o ownerUid dos documentos.'
    }
    return `Falha ao carregar vendas (${error.code}).`
  }
  return 'Não foi possível carregar as vendas.'
}

async function carregarListagem() {
  erroCarregamento.value = ''
  if (!competenciaValida(competencia.value)) {
    erroCarregamento.value = 'Informe um mês válido para listar as vendas.'
    return
  }
  try {
    await vendedoresStore.carregar()
    await vendasStore.carregar(intervalo.value)
  } catch (error) {
    erroCarregamento.value = mensagemErroCarregamento(error)
  }
}

onMounted(carregarListagem)

watch(intervalo, carregarListagem)

function nova() {
  editando.value = null
  formAberto.value = true
}

function editar(v: Venda) {
  editando.value = v
  formAberto.value = true
}

async function salvar(input: VendaInput) {
  try {
    if (editando.value) await vendasStore.atualizar(editando.value.id, input, intervalo.value)
    else await vendasStore.criar(input, intervalo.value)
    formAberto.value = false
  } catch {
    erro.value = 'Não foi possível salvar a venda.'
  }
}

async function confirmarExclusao() {
  if (!excluindo.value) return
  try {
    await vendasStore.excluir(excluindo.value.id, intervalo.value)
    excluindo.value = null
  } catch {
    erro.value = 'Não foi possível excluir a venda.'
  }
}
</script>

<template>
  <div class="space-y-5">
    <div
      class="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm"
    >
      <div class="flex flex-wrap items-end gap-3">
        <BaseInput v-model="competencia" label="Mês" type="month" required />
        <BaseSelect v-model="filtroVendedor" label="Vendedor">
          <option value="">Todos</option>
          <option v-for="v in vendedoresStore.lista" :key="v.id" :value="v.id">{{ v.nome }}</option>
        </BaseSelect>
      </div>
      <BaseButton @click="nova">+ Nova venda</BaseButton>
    </div>

    <p v-if="erro" class="text-sm font-medium text-rose-600">{{ erro }}</p>
    <p v-if="erroCarregamento" class="text-sm font-medium text-rose-600">
      {{ erroCarregamento }}
    </p>

    <section
      class="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-100"
    >
      <table class="w-full min-w-[720px] text-sm">
        <thead>
          <tr class="border-b border-brand-100 bg-brand-50/60 text-left">
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">Data</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">Vendedor</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">Categoria</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">Qtd.</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">Valor</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">Obs.</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="vendasStore.carregando">
            <td colspan="7" class="px-5 py-10 text-center text-brand-300">Carregando…</td>
          </tr>
          <tr v-else-if="erroCarregamento">
            <td colspan="7" class="px-5 py-10 text-center text-rose-600">
              A listagem não foi carregada.
            </td>
          </tr>
          <tr v-else-if="lista.length === 0">
            <td colspan="7" class="px-5 py-10 text-center text-brand-300">
              Nenhuma venda no período.
            </td>
          </tr>
          <tr
            v-for="v in lista"
            v-else
            :key="v.id"
            class="border-b border-brand-50 transition-colors last:border-0 hover:bg-brand-50/50"
          >
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 font-medium text-brand-950">
              {{ formatarData(v.data.toDate()) }}
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5">{{ nomeVendedor(v.vendedorId) }}</td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5">
              <span
                class="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800"
              >
                {{ CATEGORIA_LABELS[v.categoria] }}
              </span>
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right font-semibold">{{ formatarNumero(v.quantidade) }}</td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-brand-900/70">
              {{ v.valor != null ? formatarMoeda(v.valor) : '—' }}
            </td>
            <td class="max-w-40 truncate px-3 py-3 sm:px-5 sm:py-3.5 text-brand-900/50">{{ v.observacao || '—' }}</td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right whitespace-nowrap">
              <BaseButton variant="ghost" class="!px-3 !py-1.5 text-xs" @click="editar(v)">
                Editar
              </BaseButton>
              <BaseButton
                variant="ghost"
                class="!px-3 !py-1.5 text-xs !text-rose-600 hover:!bg-rose-50"
                @click="excluindo = v"
              >
                Excluir
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <VendaForm :open="formAberto" :venda="editando" @close="formAberto = false" @save="salvar" />

    <BaseModal :open="!!excluindo" title="Excluir venda" @close="excluindo = null">
      <p class="text-sm text-brand-900/70">
        Excluir a venda de
        <strong>{{ excluindo ? nomeVendedor(excluindo.vendedorId) : '' }}</strong>
        em <strong>{{ excluindo ? formatarData(excluindo.data.toDate()) : '' }}</strong
        >? Esta ação não pode ser desfeita.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="excluindo = null">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="confirmarExclusao">Excluir</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
