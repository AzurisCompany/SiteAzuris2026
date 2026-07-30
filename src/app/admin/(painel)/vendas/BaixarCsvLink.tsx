// Botão de download do CSV de contatos. É só um <a download> apontando pra
// /api/admin/exportar — não precisa de client component: quem monta o arquivo é
// a rota, o browser faz o resto.
//
// Duas formas, iguais às do CopiarEmailsButton ao lado: `full` no cabeçalho
// (aba ativa) e `icon` em cada aba de produto.

const IconeDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
)

export default function BaixarCsvLink({
  href,
  variant = 'full',
  titulo,
  vazio = false,
}: {
  href: string
  variant?: 'full' | 'icon'
  /** rótulo do que está sendo baixado, pro tooltip */
  titulo?: string
  /** sem nenhum registro no filtro — vira um botão apagado e sem link */
  vazio?: boolean
}) {
  const hint = `Baixar CSV${titulo ? ` — ${titulo}` : ''}\nnome, email, telefone e dados da compra`

  if (variant === 'icon') {
    const classe =
      'inline-flex items-center justify-center rounded-md p-1 transition-colors text-[var(--text-muted)]'
    if (vazio) {
      return (
        <span className={`${classe} cursor-not-allowed opacity-30`} title="Nenhum registro pra exportar" aria-hidden="true">
          <IconeDownload />
        </span>
      )
    }
    return (
      <a
        href={href}
        download
        title={hint}
        aria-label={`Baixar CSV${titulo ? ` de ${titulo}` : ''}`}
        className={`${classe} hover:text-[var(--azuris-cyan)]`}
      >
        <IconeDownload />
      </a>
    )
  }

  const classe =
    'inline-flex items-center gap-1.5 rounded-lg border border-[var(--azuris-surface)] px-3 py-1.5 text-sm font-semibold transition-colors text-[var(--text-muted)]'
  if (vazio) {
    return (
      <span className={`${classe} cursor-not-allowed opacity-50`} title="Nenhum registro pra exportar">
        <IconeDownload />
        Baixar CSV
      </span>
    )
  }
  return (
    <a
      href={href}
      download
      title={hint}
      className={`${classe} hover:border-[var(--azuris-cyan)]/40 hover:text-[var(--azuris-cyan)]`}
    >
      <IconeDownload />
      Baixar CSV
    </a>
  )
}
