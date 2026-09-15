import { motivoPedidoNota, situacaoNota, type LinhaNota } from '@/lib/nota-fiscal'

const ESTILO = {
  a_emitir: 'bg-amber-400/12 text-amber-300',
  aguardando_pagamento: 'bg-[var(--azuris-surface)] text-[var(--text-muted)]',
  emitida: 'bg-[var(--accent-emerald)]/12 text-[var(--accent-emerald)]',
} as const

const TEXTO = {
  a_emitir: 'NF a emitir',
  aguardando_pagamento: 'pediu NF',
  emitida: 'NF emitida',
} as const

/** Selo de nota fiscal da venda. Não renderiza nada pra quem não pediu nota. */
export default function NotaBadge({ venda }: { venda: LinhaNota }) {
  const situacao = situacaoNota(venda)
  if (situacao === 'nao_pediu') return null
  const motivo = motivoPedidoNota(venda)
  const porque =
    motivo === 'cnpj'
      ? 'Comprou com CNPJ'
      : motivo === 'endereco'
        ? 'Marcou "Preciso de nota fiscal" no checkout'
        : 'Nota emitida sem pedido registrado'
  const quando =
    situacao === 'aguardando_pagamento' ? ' — a nota sai depois do pagamento' : venda.nf_status === 'AUTHORIZED' ? ' — autorizada no Asaas' : ''
  return (
    <span
      title={`${porque}${quando}`}
      className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ESTILO[situacao]}`}
    >
      {TEXTO[situacao]}
    </span>
  )
}
