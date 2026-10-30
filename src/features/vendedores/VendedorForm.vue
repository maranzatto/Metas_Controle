<script setup lang="ts">
import { ref, watch } from 'vue'
import { useVendedoresStore } from '@/stores/vendedores'
import type { Vendedor } from '@/types'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps<{ open: boolean; vendedor: Vendedor | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useVendedoresStore()

const nome = ref('')
const email = ref('')
const telefone = ref('')
const ativo = ref(true)
const erro = ref('')
const salvando = ref(false)

watch(
  () => props.open,
  () => {
    if (!props.open) return
    nome.value = props.vendedor?.nome ?? ''
    email.value = props.vendedor?.email ?? ''
    telefone.value = props.vendedor?.telefone ?? ''
    ativo.value = props.vendedor?.ativo ?? true
    erro.value = ''
  },
  { immediate: true },
)

async function salvar() {
  if (!nome.value.trim()) {
    erro.value = 'Informe o nome do vendedor.'
    return
  }
  if (nome.value.trim().length > 100) {
    erro.value = 'O nome do vendedor deve ter no máximo 100 caracteres.'
    return
  }
  if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    erro.value = 'Informe um e-mail válido.'
    return
  }
  const digitosTelefone = telefone.value.replace(/\D/g, '')
  if (digitosTelefone && ![10, 11].includes(digitosTelefone.length)) {
    erro.value = 'Informe um telefone com DDD e número completo.'
    return
  }
  salvando.value = true
  try {
    await store.salvar({
      id: props.vendedor?.id,
      nome: nome.value,
      email: email.value || undefined,
      telefone: telefone.value || undefined,
      ativo: ativo.value,
    })
    emit('close')
  } catch {
    erro.value = 'Não foi possível salvar. Tente novamente.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="vendedor ? 'Editar vendedor' : 'Novo vendedor'"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <BaseInput v-model="nome" label="Nome" required />
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput v-model="email" label="E-mail" type="email" />
        <BaseInput v-model="telefone" label="Telefone" mask="phone" placeholder="(00) 00000-0000" />
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="ativo" type="checkbox" class="size-4" />
        Vendedor ativo
      </label>

      <p v-if="erro" class="text-sm text-red-600">{{ erro }}</p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Cancelar</BaseButton>
      <BaseButton :disabled="salvando" @click="salvar">
        {{ salvando ? 'Salvando…' : 'Salvar' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
