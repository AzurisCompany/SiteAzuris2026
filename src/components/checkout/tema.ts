// Classes dos campos de checkout nos temas em uso: 'dark' (Lakehouse e DSSBR,
// dentro do site), 'light' (GU BigData, que imita marketplace tipo Sympla — ver
// [[project-gubigdata-checkout]]) e 'admin' (cobrança avulsa, rótulos em caixa
// alta como o resto do painel).
//
// Existe porque CampoDocumento/DadosNota são compartilhados por 4 formulários e
// cada um vive num tema. Sem isso, o componente ou duplica ou sai errado fora do
// tema em que nasceu.

export type TemaCheckout = 'dark' | 'light' | 'admin'

export interface ClassesCheckout {
  campo: string
  rotulo: string
  caixa: string
  ajuda: string
  acento: string
}

export const CLASSES: Record<TemaCheckout, ClassesCheckout> = {
  dark: {
    campo:
      'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--azuris-cyan)] focus:outline-none',
    rotulo: 'block text-sm font-medium text-[var(--text-secondary)] mb-1',
    caixa: 'rounded-lg border border-[var(--azuris-surface)] p-3',
    ajuda: 'mt-1 text-xs text-[var(--text-muted)]',
    acento: 'accent-[var(--azuris-cyan)]',
  },
  light: {
    campo:
      'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none',
    rotulo: 'mb-1 block text-sm font-medium text-slate-700',
    caixa: 'rounded-lg border border-slate-200 p-3',
    ajuda: 'mt-1 text-xs text-slate-500',
    acento: 'accent-emerald-600',
  },
  // Mesmo visual do painel: campo mais compacto e rótulo em caixa alta.
  admin: {
    campo:
      'w-full rounded-lg border border-[var(--azuris-surface)] bg-[var(--azuris-ink)] px-3 py-2 text-sm focus:border-[var(--azuris-cyan)] focus:outline-none placeholder:text-[var(--text-muted)]',
    rotulo: 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1',
    caixa: 'rounded-lg border border-[var(--azuris-surface)] p-3',
    ajuda: 'mt-1 text-xs text-[var(--text-muted)]',
    acento: 'accent-[var(--azuris-cyan)]',
  },
}
