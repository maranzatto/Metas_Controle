<script setup lang="ts">
import { ref, watch } from 'vue'
import { CATEGORIAS, CATEGORIA_LABELS, type Categoria } from '@/constants/categorias'
import { useVendedoresStore } from '@/stores/vendedores'
import type { Venda } from '@/types'
import { fromDateInput, toDateInput } from '@/utils/date'
import { moedaParaInput, parseMoeda } from '@/utils/masks'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const props = defineProps<{ open: boolean; venda: Venda | null }>()
const emit = defineEmits<{
  close: []
  save: [
    input: {
      vendedorId: string
      categoria: Categoria
      quantidade: number
      valor?: number
      data: Date
      observacao?: string
    },
  ]
}>()

const vendedoresStore = useVendedoresStore()

const vendedorId = ref('')
const categoria = ref<Categoria>('POS')
const quantidade = ref<number>(1)
const valor = ref('') // string mascarada "1.234,56"; convertida ao salvar
const data = ref(toDateInput(new Date()))
const observacao = ref('')
const erro = ref('')
const salvando = ref(false)

watch(
  () => props.open,
  () => {
    if (!props.open) return
    vendedorId.value = props.venda?.vendedorId ?? ''
    categoria.value = props.venda?.categoria ?? 'POS'
    quantidade.value = props.venda?.quantidade ?? 1
    valor.value = props.venda?.valor != null ? moedaParaInput(props.venda.valor) : ''
    data.value = props.venda ? toDateInput(props.venda.data.toDate()) : toDateInput(new Date())
    observacao.value = props.venda?.observacao ?? ''
    erro.value = ''
  },
  { immediate: true },
)

async function salvar() {
  if (!vendedorId.value) {
    erro.value = 'Selecione o vendedor.'
    return
  }
  const qtd = Number(quantidade.value)
  if (!Number.isFinite(qtd) || qtd < 0) {
    erro.value = 'Quantidade deve ser um número maior ou igual a zero.'
    return
  }
  const valorNumerico = parseMoeda(valor.value)
  salvando.value = true
  try {
    emit('save', {
      vendedorId: vendedorId.value,
      categoria: categoria.value,
      quantidade: qtd,
      valor: valorNumerico > 0 ? valorNumerico : undefined,
      data: fromDateInput(data.value),
      observacao: observacao.value || undefined,
    })
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" :title="venda ? 'Editar venda' : 'Nova venda'" @close="emit('close')">
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseSelect v-model="vendedorId" label="Vendedor" required>
          <option value="" disabled>Selecione…</option>
          <option v-for="v in vendedoresStore.ativos" :key="v.id" :value="v.id">
            {{ v.nome }}
          </option>
        </BaseSelect>

        <BaseSelect v-model="categoria" label="Categoria" required>
          <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ CATEGORIA_LABELS[c] }}</option>
        </BaseSelect>

        <BaseInput v-model="quantidade" label="Quantidade" mask="int" required />
        <BaseInput v-model="valor" label="Valor (R$, opcional)" mask="currency" placeholder="0,00" />
        <BaseInput v-model="data" label="Data" type="date" required />
      </div>

      <BaseInput v-model="observacao" label="Observação (opcional)" />

      <p v-if="erro" class="text-sm text-red-600">{{ erro }}</p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Cancelar</BaseButton>
      <BaseButton :disabled="salvando" @click="salvar">Salvar</BaseButton>
    </template>
  </BaseModal>
</template>
