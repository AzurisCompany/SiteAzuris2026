'use client'

import { useState } from 'react'

import { copiarTexto, IconeCopiar, IconeCheck } from './copiar'

/**
 * Copia num clique tudo que o cliente digitou sobre si mesmo — nome, e-mail,
 * telefone, documento, razão social e endereço — pra colar no formulário da
 * nota fiscal sem precisar abrir a venda.
 *
 * Recebe o texto **pronto**: quem monta é `dadosClienteTexto` (puro e testado),
 * no servidor. Assim a linha da tabela não precisa serializar a InscricaoRow
 * inteira pro client — e as colunas DATE do Neon, que chegam como `Date`, nem
 * atravessam a fronteira.
 */
export default function CopiarClienteButton({ nome, texto }: { nome: string; texto: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar(e: React.MouseEvent) {
    // A célula é um link pra /admin/vendas/[id]: sem isto, copiar navega.
    e.preventDefault()
    e.stopPropagation()
    if (!texto) return
    await copiarTexto(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copiar}
      disabled={!texto}
      title={texto ? `Copiar dados do cliente\n\n${texto}` : 'Nenhum dado preenchido'}
      aria-label={`Copiar dados de ${nome}`}
      className={`ml-1.5 inline-flex translate-y-px items-center justify-center rounded-md p-0.5 align-middle transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        copiado ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-muted)] hover:text-[var(--azuris-cyan)]'
      }`}
    >
      {copiado ? <IconeCheck /> : <IconeCopiar />}
    </button>
  )
}
