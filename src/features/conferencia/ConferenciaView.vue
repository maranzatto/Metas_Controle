<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConferenciaStore, type GrupoChips } from '@/stores/conferencia'
import { ICCIDS_PER_PACKAGE, normalizarIccid } from '@/utils/iccid'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

type Etapa = 'preparar' | 'conferir'
type ModoEntrada = 'sap' | 'caixa' | 'pacote' | 'unitario'

const auth = useAuthStore()
const conferencia = useConferenciaStore()
const scannerInput = ref<HTMLInputElement | null>(null)
const etapa = ref<Etapa>('preparar')
const modoEntrada = ref<ModoEntrada>('sap')
const entradaScanner = ref('')
const colunaIccids = ref('')
const inicioCaixa = ref('')
const fimCaixa = ref('')
const inicioPacote = ref('')
const fimPacote = ref('')
const iccidUnitario = ref('')
const mensagem = ref('')
const tipoMensagem = ref<'sucesso' | 'erro' | 'info'>('info')
const resultadoScanner = ref<'idle' | 'sucesso' | 'erro'>('idle')
const importando = ref(false)
let timerLeitura: ReturnType<typeof setTimeout> | undefined

const porcentagem = computed(() => Math.round(conferencia.percentual))

onMounted(async () => {
  await auth.whenReady()
  conferencia.carregar(auth.user?.uid ?? null)
  if (conferencia.total) etapa.value = 'conferir'
  if (etapa.value === 'conferir') await focarScanner()
})

onUnmounted(() => {
  if (timerLeitura) clearTimeout(timerLeitura)
})

watch(
  () => auth.user?.uid,
  async (uid) => {
    conferencia.carregar(uid ?? null)
    etapa.value = conferencia.total ? 'conferir' : 'preparar'
    entradaScanner.value = ''
    if (etapa.value === 'conferir') await focarScanner()
  },
)

async function focarScanner() {
  await nextTick()
  scannerInput.value?.focus()
}

function informar(texto: string, tipo: 'sucesso' | 'erro' | 'info') {
  mensagem.value = texto
  tipoMensagem.value = tipo
}

function importarColuna() {
  if (!colunaIccids.value.trim()) {
    informar('Cole primeiro a coluna de ICCIDs exportada do SAP.', 'erro')
    return
  }
  importando.value = true
  try {
    const resultado = conferencia.adicionarColagem(colunaIccids.value)
    colunaIccids.value = ''
    informar(
      `${resultado.adicionados} chip(s) adicionados · ${resultado.duplicados} duplicado(s) ignorados · ${resultado.invalidos} inválido(s) ignorados.`,
      resultado.adicionados ? 'sucesso' : 'info',
    )
    if (resultado.adicionados) iniciarBipagem()
  } catch {
    informar('Não foi possível importar a coluna.', 'erro')
  } finally {
    importando.value = false
  }
}

function adicionarCaixa() {
  try {
    const resultado = conferencia.adicionarCaixa(inicioCaixa.value, fimCaixa.value)
    inicioCaixa.value = ''
    fimCaixa.value = ''
    informar(`Caixa adicionada: ${resultado.adicionados} chips em 10 pacotes.`, 'sucesso')
    iniciarBipagem()
  } catch (error) {
    informar(error instanceof Error ? error.message : 'Não foi possível adicionar a caixa.', 'erro')
  }
}

function adicionarPacote() {
  try {
    const resultado = conferencia.adicionarPacote(inicioPacote.value, fimPacote.value)
    inicioPacote.value = ''
    fimPacote.value = ''
    informar(`Pacote adicionado com ${resultado.adicionados} chips.`, 'sucesso')
    iniciarBipagem()
  } catch (error) {
    informar(error instanceof Error ? error.message : 'Não foi possível adicionar o pacote.', 'erro')
  }
}

function adicionarUnitario() {
  try {
    const iccid = conferencia.adicionarUnitario(iccidUnitario.value)
    iccidUnitario.value = ''
    informar(`Chip ${iccid} adicionado à conferência.`, 'sucesso')
    iniciarBipagem()
  } catch (error) {
    informar(error instanceof Error ? error.message : 'Não foi possível adicionar o chip.', 'erro')
  }
}

function iniciarBipagem() {
  etapa.value = 'conferir'
  focarScanner()
}

function prepararMais() {
  etapa.value = 'preparar'
  mensagem.value = ''
}

function agendarLeituraAutomatica() {
  resultadoScanner.value = 'idle'
  if (timerLeitura) clearTimeout(timerLeitura)

  const quantidadeDigitos = entradaScanner.value.replace(/\D/g, '').length
  if (![18, 20].includes(quantidadeDigitos) || !normalizarIccid(entradaScanner.value)) return

  timerLeitura = setTimeout(() => conferirChip(), 250)
}

function conferirChip() {
  if (timerLeitura) clearTimeout(timerLeitura)
  timerLeitura = undefined
  if (!entradaScanner.value.trim()) return

  const resultado = conferencia.registrarLeitura(entradaScanner.value)
  resultadoScanner.value = resultado === 'conferido' ? 'sucesso' : 'erro'
  if (resultado === 'conferido') {
    informar(`${conferencia.ultimaLeitura?.iccid} conferido.`, 'sucesso')
  } else if (resultado === 'duplicado') {
    informar(`${conferencia.ultimaLeitura?.iccid} já tinha sido conferido.`, 'info')
  } else if (resultado === 'fora-lista') {
    informar(`${conferencia.ultimaLeitura?.iccid} não está na lista carregada.`, 'erro')
  } else {
    informar('Leitura inválida. O ICCID deve ter 18 dígitos, com ou sem o prefixo 89.', 'erro')
  }
  entradaScanner.value = ''
  focarScanner()
}

function desfazerLeitura() {
  if (conferencia.desfazerUltimaLeitura()) {
    resultadoScanner.value = 'idle'
    informar('Última leitura desfeita.', 'info')
  }
  focarScanner()
}

function limparConferencia() {
  if (conferencia.total && window.confirm('Limpar toda a conferência deste usuário neste navegador?')) {
    conferencia.limpar()
    resultadoScanner.value = 'idle'
    etapa.value = 'preparar'
    informar('Conferência limpa.', 'info')
  }
}

function pacotes(grupo: GrupoChips) {
  const lista = []
  for (let inicio = 0; inicio < grupo.iccids.length; inicio += ICCIDS_PER_PACKAGE) {
    lista.push({
      numero: Math.floor(inicio / ICCIDS_PER_PACKAGE) + 1,
      iccids: grupo.iccids.slice(inicio, inicio + ICCIDS_PER_PACKAGE),
    })
  }
  return lista
}

function progressoPacote(iccids: string[]) {
  return iccids.filter((iccid) => conferencia.conferidos[iccid]).length
}

function exportarCsv() {
  if (!conferencia.iccids.length) return
  const linhas = ['ICCID;Status;Conferido em']
  for (const iccid of conferencia.iccids) {
    const data = conferencia.conferidos[iccid]
    linhas.push(`${iccid};${data ? 'Conferido' : 'Pendente'};${data ?? ''}`)
  }
  const arquivo = new Blob(['\uFEFF' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = 'conferencia-chips.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-5">
    <nav class="flex gap-2" aria-label="Etapas da conferência">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-bold transition"
        :class="etapa === 'preparar' ? 'bg-brand-800 text-white' : 'border border-brand-200 bg-white text-brand-700'"
        :aria-current="etapa === 'preparar' ? 'step' : undefined"
        @click="prepararMais"
      >
        1. Preparar lista
      </button>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="etapa === 'conferir' ? 'bg-brand-800 text-white' : 'border border-brand-200 bg-white text-brand-700'"
        :disabled="!conferencia.total"
        :aria-current="etapa === 'conferir' ? 'step' : undefined"
        @click="iniciarBipagem"
      >
        2. Bipar chips <span v-if="conferencia.total">({{ conferencia.pendentes }} pendentes)</span>
      </button>
    </nav>

    <template v-if="etapa === 'preparar'">
      <section class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
        <div>
          <h2 class="font-bold text-brand-950">Como você quer adicionar os chips?</h2>
          <p class="mt-1 text-sm text-brand-900/60">Escolha uma origem. Depois, a conferência abre direto na leitura.</p>
        </div>

        <div class="mt-4 inline-flex flex-wrap gap-1 rounded-lg bg-brand-50 p-1" role="tablist" aria-label="Origem dos chips">
          <button
            v-for="opcao in [{ id: 'sap', label: 'Coluna do SAP' }, { id: 'caixa', label: 'Caixa · 100' }, { id: 'pacote', label: 'Pacote · 10' }, { id: 'unitario', label: 'Chip avulso' }] as const"
            :key="opcao.id"
            type="button"
            role="tab"
            class="rounded-md px-3 py-2 text-sm font-semibold transition"
            :class="modoEntrada === opcao.id ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-900'"
            :aria-selected="modoEntrada === opcao.id"
            @click="modoEntrada = opcao.id"
          >
            {{ opcao.label }}
          </button>
        </div>

        <form v-if="modoEntrada === 'sap'" class="mt-4 space-y-3" @submit.prevent="importarColuna">
          <label for="coluna-iccid" class="block text-sm font-semibold text-brand-950">Cole a coluna de ICCIDs exportada do SAP</label>
          <textarea
            id="coluna-iccid"
            v-model="colunaIccids"
            rows="6"
            placeholder="89551094360122857072&#10;89551094360122857073&#10;…"
            class="w-full resize-y rounded-lg border border-brand-200 bg-brand-50/30 p-3 font-mono text-sm text-brand-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-brand-900/50">Uma coluna, um ICCID por linha. Cabeçalho e linhas inválidas são ignorados; `89` é removido automaticamente.</p>
            <BaseButton type="submit" :disabled="importando || !colunaIccids.trim()">
              {{ importando ? 'Importando…' : 'Preparar chips' }}
            </BaseButton>
          </div>
        </form>

        <form v-else-if="modoEntrada === 'caixa'" class="mt-4 space-y-3" @submit.prevent="adicionarCaixa">
          <p class="text-sm text-brand-900/60">Informe o primeiro e o último ICCID. O intervalo precisa ser exatamente 100 números sequenciais; será dividido em 10 pacotes de 10.</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <BaseInput v-model="inicioCaixa" label="Início da caixa" placeholder="8955… ou sem 89" inputmode="numeric" required />
            <BaseInput v-model="fimCaixa" label="Final da caixa" placeholder="8955… ou sem 89" inputmode="numeric" required />
          </div>
          <div class="flex justify-end">
            <BaseButton type="submit" :disabled="!inicioCaixa.trim() || !fimCaixa.trim()">Preparar caixa · 100 chips</BaseButton>
          </div>
        </form>

        <form v-else-if="modoEntrada === 'pacote'" class="mt-4 space-y-3" @submit.prevent="adicionarPacote">
          <p class="text-sm text-brand-900/60">Informe o início e o fim de um pacote. O intervalo precisa conter exatamente 10 ICCIDs sequenciais.</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <BaseInput v-model="inicioPacote" label="Início do pacote" placeholder="8955… ou sem 89" inputmode="numeric" required />
            <BaseInput v-model="fimPacote" label="Final do pacote" placeholder="8955… ou sem 89" inputmode="numeric" required />
          </div>
          <div class="flex justify-end">
            <BaseButton type="submit" :disabled="!inicioPacote.trim() || !fimPacote.trim()">Preparar pacote · 10 chips</BaseButton>
          </div>
        </form>

        <form v-else class="mt-4 space-y-3" @submit.prevent="adicionarUnitario">
          <p class="text-sm text-brand-900/60">Adicione um ICCID avulso à lista esperada. Depois, basta bipar o chip para confirmar.</p>
          <BaseInput v-model="iccidUnitario" label="ICCID do chip" placeholder="8955… ou sem 89" inputmode="numeric" required />
          <div class="flex justify-end">
            <BaseButton type="submit" :disabled="!iccidUnitario.trim()">Preparar chip</BaseButton>
          </div>
        </form>
      </section>

      <div v-if="conferencia.total" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white px-4 py-3">
        <p class="text-sm text-brand-900/70">Conferência atual: <strong>{{ conferencia.totalConferidos }}/{{ conferencia.total }}</strong> chips lidos.</p>
        <BaseButton variant="secondary" @click="iniciarBipagem">Continuar bipagem</BaseButton>
      </div>
    </template>

    <template v-else>
      <section class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-lg border border-brand-100 bg-white px-4 py-3">
          <p class="text-xs font-semibold tracking-wide text-brand-700 uppercase">Total</p>
          <p class="mt-1 text-xl font-extrabold text-brand-950">{{ conferencia.total }}</p>
        </div>
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p class="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Conferidos</p>
          <p class="mt-1 text-xl font-extrabold text-emerald-900">{{ conferencia.totalConferidos }}</p>
        </div>
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p class="text-xs font-semibold tracking-wide text-amber-800 uppercase">Pendentes</p>
          <p class="mt-1 text-xl font-extrabold text-amber-900">{{ conferencia.pendentes }}</p>
        </div>
      </section>

      <section class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-bold text-brand-950">Bipagem automática</h2>
            <p class="mt-1 text-sm text-brand-900/60">Aponte e leia. O chip é confirmado sozinho assim que o código termina.</p>
            <p class="mt-1 text-xs text-brand-900/50">Aceita leitor com ou sem Enter. `89` é removido antes da comparação.</p>
          </div>
          <BaseButton variant="ghost" :disabled="!conferencia.ultimaLeitura || conferencia.ultimaLeitura.resultado !== 'conferido'" @click="desfazerLeitura">
            Desfazer último
          </BaseButton>
        </div>

        <input
          ref="scannerInput"
          v-model="entradaScanner"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Leitura automática do ICCID"
          placeholder="Aguardando pistola…"
          class="mt-4 w-full rounded-lg border-2 px-4 py-4 font-mono text-xl outline-none transition focus:ring-4 focus:ring-brand-500/15"
          :class="resultadoScanner === 'sucesso' ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : resultadoScanner === 'erro' ? 'border-rose-400 bg-rose-50 text-rose-950' : 'border-brand-200 bg-brand-50/40 text-brand-950 focus:border-brand-500'"
          @input="agendarLeituraAutomatica"
          @keydown.enter.prevent="conferirChip"
        />
        <p v-if="mensagem" class="mt-3 text-sm font-semibold" :class="tipoMensagem === 'sucesso' ? 'text-emerald-700' : tipoMensagem === 'erro' ? 'text-rose-600' : 'text-brand-700'" aria-live="polite">
          {{ mensagem }}
        </p>
        <p v-if="conferencia.avisoPersistencia" class="mt-2 text-sm text-amber-700">{{ conferencia.avisoPersistencia }}</p>

        <div class="mt-4 h-2 overflow-hidden rounded-full bg-brand-100" role="progressbar" :aria-valuenow="porcentagem" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${porcentagem}%` }" />
        </div>
        <p class="mt-1 text-right text-xs text-brand-900/50">{{ porcentagem }}%</p>
      </section>

      <section class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <BaseButton variant="secondary" @click="prepararMais">Adicionar itens</BaseButton>
          <BaseButton variant="secondary" :disabled="!conferencia.total" @click="exportarCsv">Exportar CSV</BaseButton>
        </div>
        <BaseButton variant="danger" :disabled="!conferencia.total" @click="limparConferencia">Encerrar e limpar</BaseButton>
      </section>

      <details class="rounded-xl border border-brand-100 bg-white shadow-sm">
        <summary class="cursor-pointer list-none px-5 py-4 font-semibold text-brand-950 hover:bg-brand-50">
          Ver pacotes e chips <span class="ml-2 text-sm font-normal text-brand-700">{{ conferencia.totalConferidos }}/{{ conferencia.total }} conferidos</span>
        </summary>
        <div v-if="!conferencia.grupos.length" class="border-t border-brand-100 px-5 py-8 text-center text-sm text-brand-900/50">
          Nenhum chip preparado.
        </div>
        <div v-else class="divide-y divide-brand-100 border-t border-brand-100">
          <details v-for="grupo in conferencia.grupos" :key="grupo.id">
            <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-3 font-semibold text-brand-950 hover:bg-brand-50">
              <span>{{ grupo.titulo }}</span>
              <span class="text-xs font-medium text-brand-700">{{ progressoPacote(grupo.iccids) }}/{{ grupo.iccids.length }} conferidos</span>
            </summary>
            <div class="space-y-3 px-5 pb-5">
              <div v-for="pacote in pacotes(grupo)" :key="`${grupo.id}-${pacote.numero}`" class="rounded-lg border border-brand-100 p-3">
                <div class="mb-2 flex items-center justify-between text-xs font-semibold text-brand-700">
                  <span>{{ grupo.tipo === 'caixa' ? `Pacote ${pacote.numero}/10` : grupo.tipo === 'unitario' ? 'Chip avulso' : grupo.tipo === 'pacote' ? 'Pacote de 10' : `Pacote ${pacote.numero}` }}</span>
                  <span>{{ progressoPacote(pacote.iccids) }}/{{ pacote.iccids.length }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <div
                    v-for="iccid in pacote.iccids"
                    :key="iccid"
                    class="rounded-md border px-2 py-2 font-mono text-xs transition-colors"
                    :class="conferencia.conferidos[iccid] ? 'border-emerald-300 bg-emerald-100 text-emerald-900' : 'border-brand-100 bg-white text-brand-800'"
                  >
                    <span class="mr-1 text-[10px] opacity-60">{{ conferencia.conferidos[iccid] ? '✓' : '·' }}</span>{{ iccid }}
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </details>

      <p class="text-xs text-brand-900/50">A conferência fica salva neste navegador e nesta conta. Exporte o CSV para levar o resultado a outro dispositivo.</p>
    </template>
  </div>
</template>