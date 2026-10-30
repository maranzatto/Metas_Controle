import type { Directive } from 'vue'
import {
  maskCpf,
  maskData,
  maskInteiro,
  maskMoeda,
  maskTelefone,
  type MaskName,
} from '@/utils/masks'

const FUNCOES: Record<MaskName, (v: string) => string> = {
  currency: maskMoeda,
  phone: maskTelefone,
  cpf: maskCpf,
  date: maskData,
  int: maskInteiro,
}

function fnDe(binding: { value: MaskName | undefined }) {
  return binding.value ? FUNCOES[binding.value] : undefined
}

/**
 * Uso: <input v-model="x" v-mask="'currency'" /> ou via BaseInput mask="phone".
 * - No foco, seleciona o valor inteiro: digitar substitui em vez de concatenar
 *   (essencial p/ moeda, onde os dígitos entram pela direita).
 * - Após formatar, o cursor vai para o fim.
 * - `updated` reformata quando o v-model muda por fora (ex.: dados do Firestore).
 */
export const vMask: Directive<HTMLInputElement, MaskName | undefined> = {
  mounted(el, binding) {
    const fn = fnDe(binding)
    if (!fn) return
    el.addEventListener('focus', () => requestAnimationFrame(() => el.select()))
    el.addEventListener('input', () => {
      const masked = fn(el.value)
      if (masked !== el.value) {
        el.value = masked
        el.setSelectionRange(masked.length, masked.length)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    if (fn(el.value) !== el.value) el.value = fn(el.value)
  },
  updated(el, binding) {
    const fn = fnDe(binding)
    if (fn && fn(el.value) !== el.value) el.value = fn(el.value)
  },
}
