// Normaliza os campos extras do checkout (empresa, cargo, NF, como conheceu)
// vindos do client em colunas prontas pro banco. Usado pelos 2 produtos.

export interface ExtrasInput {
  empresa?: string
  cargo?: string
  como_conheceu?: string
  consentimento?: boolean
  pessoa_tipo?: string
  razao_social?: string
  nf_endereco?: Record<string, string>
}

export interface ExtrasColunas {
  empresa: string | null
  cargo: string | null
  como_conheceu: string | null
  pessoa_tipo: 'PF' | 'PJ' | null
  razao_social: string | null
  nf_endereco: Record<string, string> | null
}

function limpar(s: string | undefined): string | null {
  const v = (s ?? '').trim()
  return v.length ? v : null
}

export function normalizarExtras(b: ExtrasInput): ExtrasColunas {
  const tipo = b.pessoa_tipo === 'PJ' ? 'PJ' : b.pessoa_tipo === 'PF' ? 'PF' : null

  // Só guarda o endereço de NF se algum campo veio preenchido.
  let nf: Record<string, string> | null = null
  if (b.nf_endereco && typeof b.nf_endereco === 'object') {
    const limpo: Record<string, string> = {}
    for (const [k, v] of Object.entries(b.nf_endereco)) {
      if (typeof v === 'string' && v.trim()) limpo[k] = v.trim()
    }
    if (Object.keys(limpo).length) nf = limpo
  }

  return {
    empresa: limpar(b.empresa),
    cargo: limpar(b.cargo),
    como_conheceu: limpar(b.como_conheceu),
    pessoa_tipo: nf || tipo ? tipo : null,
    razao_social: tipo === 'PJ' ? limpar(b.razao_social) : null,
    nf_endereco: nf,
  }
}
