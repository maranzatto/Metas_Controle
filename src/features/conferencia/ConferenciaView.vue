<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConferenciaStore, type GrupoChips } from '@/stores/conferencia'
import { ICCIDS_PER_PACKAGE } from '@/utils/iccid'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const auth = useAuthStore()
const conferencia = useConferenciaStore()
const scannerInput = ref<HTMLInputElement | null>(null)
const entradaScanner = ref('')
const colunaIccids = ref('')
const inicioCaixa = ref('')
const fimCaixa = ref('')
const mensagem = ref('')
const tipoMensagem = ref<'sucesso' | 'erro' | 'info'>('info')
const resultadoScanner = ref<'idle' | 'sucesso' | 'erro'>('idle')
const importando = ref(false)

const porcentagem = computed(() => Math.round(conferencia.percentual))

onMounted(async () => {
  await auth.whenReady()
  conferencia.carregar(auth.user?.uid ?? null)
  await focarScanner()
})

watch(
  () => auth.user?.uid,
  async (uid) => {
    conferencia.carregar(uid ?? null)
    entradaScanner.value = ''
    await focarScanner()
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
      `${resultado.adicionados} ICCID(s) adicionados · ${resultado.duplicados} duplicado(s) ignorados · ${resultado.invalidos} inválido(s) ignorados.`,
      resultado.adicionados ? 'sucesso' : 'info',
    )
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
    informar(`Caixa adicionada com ${resultado.adicionados} chips em 10 pacotes de 10.`, 'sucesso')
    focarScanner()
  } catch (error) {
    informar(error instanceof Error ? error.message : 'Não foi possível adicionar a caixa.', 'erro')
  }
}

function conferirChip() {
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
    informar('Conferência limpa.', 'info')
    focarScanner()
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
  focarScanner()
}
</script>

<template>
  <div class="space-y-5">
    <section class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-brand-100 bg-white p-4">
        <p class="text-xs font-semibold tracking-wide text-brand-700 uppercase">Total na conferência</p>
        <p class="mt-1 text-2xl font-extrabold text-brand-950">{{ conferencia.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p class="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Conferidos</p>
        <p class="mt-1 text-2xl font-extrabold text-emerald-900">{{ conferencia.totalConferidos }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p class="text-xs font-semibold tracking-wide text-amber-800 uppercase">Pendentes</p>
        <p class="mt-1 text-2xl font-extrabold text-amber-900">{{ conferencia.pendentes }}</p>
      </div>
    </section>

    <section class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="font-bold text-brand-950">Leitura dos chips</h2>
          <p class="mt-1 text-sm text-brand-900/60">Bipe com a pistola; cada leitura confirmada fica verde.</p>
          <p class="mt-1 text-xs text-brand-900/50">O prefixo 89 é removido automaticamente, com ou sem ele na leitura ou importação.</p>
          <p class="mt-1 text-xs text-brand-900/50">A conferência fica salva neste navegador e nesta conta. Exporte o CSV para levar o resultado a outro dispositivo.</p>
        </div>
        <div class="flex gap-2">
          <BaseButton variant="secondary" :disabled="!conferencia.iccids.length" @click="exportarCsv">
            Exportar CSV
          </BaseButton>
          <BaseButton variant="ghost" :disabled="!conferencia.ultimaLeitura || conferencia.ultimaLeitura.resultado !== 'conferido'" @click="desfazerLeitura">
            Desfazer leitura
          </BaseButton>
        </div>
      </div>

      <form class="mt-4 flex flex-col gap-3 sm:flex-row" @submit.prevent="conferirChip">
        <input
          ref="scannerInput"
          v-model="entradaScanner"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Ler ICCID do chip"
          placeholder="Aguardando leitura do ICCID…"
          class="min-w-0 flex-1 rounded-lg border-2 px-4 py-3 font-mono text-lg outline-none transition focus:ring-4 focus:ring-brand-500/15"
          :class="resultadoScanner === 'sucesso' ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : resultadoScanner === 'erro' ? 'border-rose-400 bg-rose-50 text-rose-950' : 'border-brand-200 bg-brand-50/40 text-brand-950 focus:border-brand-500'"
          @input="resultadoScanner = 'idle'"
          @keydown.enter.prevent="conferirChip"
        />
        <BaseButton type="submit">Conferir chip</BaseButton>
      </form>
      <p v-if="mensagem" class="mt-3 text-sm font-semibold" :class="tipoMensagem === 'sucesso' ? 'text-emerald-700' : tipoMensagem === 'erro' ? 'text-rose-600' : 'text-brand-700'">
        {{ mensagem }}
      </p>
      <p v-if="conferencia.avisoPersistencia" class="mt-2 text-sm text-amber-700">
        {{ conferencia.avisoPersistencia }}
      </p>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-brand-100" role="progressbar" :aria-valuenow="porcentagem" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${porcentagem}%` }" />
      </div>
      <p class="mt-1 text-right text-xs text-brand-900/50">{{ porcentagem }}%</p>
    </section>

    <section class="grid gap-5 xl:grid-cols-2">
      <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 class="font-bold text-brand-950">Importar coluna do SAP</h2>
        <p class="mt-1 text-sm text-brand-900/60">Cole a coluna inteira de ICCIDs. Cabeçalho e linhas inválidas são ignorados.</p>
        <textarea
          v-model="colunaIccids"
          rows="5"
          placeholder="89551094360122857072&#10;89551094360122857073&#10;…"
          class="mt-3 w-full resize-y rounded-lg border border-brand-200 bg-brand-50/30 p-3 font-mono text-sm text-brand-950 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          aria-label="Colar coluna de ICCIDs do SAP"
        />
        <div class="mt-3 flex justify-end">
          <BaseButton :disabled="importando || !colunaIccids.trim()" @click="importarColuna">
            {{ importando ? 'Importando…' : 'Importar ICCIDs' }}
          </BaseButton>
        </div>
      </div>

      <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 class="font-bold text-brand-950">Adicionar caixa fechada</h2>
        <p class="mt-1 text-sm text-brand-900/60">Informe o primeiro e o último ICCID. O intervalo deve conter 100 números sequenciais.</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <BaseInput v-model="inicioCaixa" label="Início da caixa" placeholder="8955… ou sem 89" inputmode="numeric" required />
          <BaseInput v-model="fimCaixa" label="Final da caixa" placeholder="8955… ou sem 89" inputmode="numeric" required />
        </div>
        <div class="mt-3 flex justify-end">
          <BaseButton :disabled="!inicioCaixa.trim() || !fimCaixa.trim()" @click="adicionarCaixa">
            Adicionar 100 chips
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-brand-100 bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 p-5">
        <div>
          <h2 class="font-bold text-brand-950">Chips por pacote</h2>
          <p class="mt-1 text-sm text-brand-900/60">Cada pacote mostra 10 unidades; verde indica leitura confirmada.</p>
        </div>
        <BaseButton variant="danger" :disabled="!conferencia.total" @click="limparConferencia">
          Limpar conferência
        </BaseButton>
      </div>

      <div v-if="!conferencia.grupos.length" class="px-5 py-12 text-center text-sm text-brand-900/50">
        Cole uma lista do SAP ou adicione uma caixa para começar.
      </div>

      <div v-else class="divide-y divide-brand-100">
        <details v-for="grupo in conferencia.grupos" :key="grupo.id" class="group" open>
          <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-3 font-semibold text-brand-950 hover:bg-brand-50">
            <span>{{ grupo.titulo }}</span>
            <span class="text-xs font-medium text-brand-700">{{ progressoPacote(grupo.iccids) }}/{{ grupo.iccids.length }} conferidos</span>
          </summary>
          <div class="space-y-3 px-5 pb-5">
            <div v-for="pacote in pacotes(grupo)" :key="`${grupo.id}-${pacote.numero}`" class="rounded-lg border border-brand-100 p-3">
              <div class="mb-2 flex items-center justify-between text-xs font-semibold text-brand-700">
                <span>{{ grupo.tipo === 'caixa' ? `Pacote ${pacote.numero}/10` : `Pacote ${pacote.numero}` }}</span>
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
    </section>
  </div>
</template>
