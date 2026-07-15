// Normaliza e valida os campos extras do checkout (empresa, cargo, NF, como
// conheceu) vindos do client em colunas prontas pro banco. Usado pelos checkouts
// (Lakehouse, DSSBR, GU) e pela cobrança avulsa do admin.
//
// Regra central: o `pessoa_tipo` é DERIVADO DO DOCUMENTO no servidor, nunca do
// que o client afirma — 14 dígitos = PJ, 11 = PF. O seletor da interface só
// decide máscara e quais campos aparecem; a verdade fiscal sai do CPF/CNPJ.
import { onlyDigits } from '@/lib/format'

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

/** Endereço de NF já validado — o que emite nota, não um saco de strings. */
export interface EnderecoNf {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const

/** Campos do endereço exigidos pra emitir NFS-e (complemento é o único dispensável). */
const CAMPOS_ENDERECO_OBRIGATORIOS = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'] as const

const ROTULO_CAMPO: Record<string, string> = {
  cep: 'CEP',
  logradouro: 'logradouro',
  numero: 'número',
  bairro: 'bairro',
  cidade: 'cidade',
  uf: 'UF',
}

function limpar(s: string | undefined): string | null {
  const v = (s ?? '').trim()
  return v.length ? v : null
}

/** PJ quando o documento tem 14 dígitos; PF quando tem 11. Fora disso, indefinido. */
export function pessoaTipoDoDocumento(cpfCnpj: string | null | undefined): 'PF' | 'PJ' | null {
  const d = onlyDigits(cpfCnpj)
  if (d.length === 14) return 'PJ'
  if (d.length === 11) return 'PF'
  return null
}

/**
 * Valida os extras conforme o produto. Devolve a mensagem de erro (pt-BR, pro
 * usuário) ou null quando está tudo certo.
 *
 * - PJ sempre precisa de razão social (é o nome do tomador na nota).
 * - PJ precisa de endereço completo quando o produto exige (`enderecoObrigatorioPJ`).
 * - Qualquer endereço iniciado (PF pedindo nota, ou PJ num produto que não exige)
 *   tem que ser completo: meio endereço não emite nota nenhuma.
 */
export function validarExtras(
  b: ExtrasInput,
  opts: { cpfCnpj?: string | null; enderecoObrigatorioPJ?: boolean } = {}
): string | null {
  const tipo = pessoaTipoDoDocumento(opts.cpfCnpj) ?? (b.pessoa_tipo === 'PJ' ? 'PJ' : b.pessoa_tipo === 'PF' ? 'PF' : null)

  if (tipo === 'PJ' && !limpar(b.razao_social)) {
    return 'Informe a razão social da empresa'
  }

  const preenchidos = camposPreenchidos(b.nf_endereco)
  const exigeEndereco = (tipo === 'PJ' && opts.enderecoObrigatorioPJ === true) || preenchidos.length > 0

  if (!exigeEndereco) return null

  const end = b.nf_endereco ?? {}
  const faltando = CAMPOS_ENDERECO_OBRIGATORIOS.filter((c) => !(end[c] ?? '').trim())
  if (faltando.length > 0) {
    return `Endereço incompleto pra emissão da nota: falta ${faltando.map((c) => ROTULO_CAMPO[c]).join(', ')}`
  }
  if (onlyDigits(end.cep).length !== 8) return 'CEP inválido (8 dígitos)'
  if (!UFS.includes(end.uf.trim().toUpperCase() as (typeof UFS)[number])) return 'UF inválida'

  return null
}

function camposPreenchidos(end: Record<string, string> | undefined): string[] {
  if (!end || typeof end !== 'object') return []
  return Object.entries(end)
    .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
    .map(([k]) => k)
}

export function normalizarExtras(b: ExtrasInput, cpfCnpj?: string | null): ExtrasColunas {
  const tipo =
    pessoaTipoDoDocumento(cpfCnpj) ?? (b.pessoa_tipo === 'PJ' ? 'PJ' : b.pessoa_tipo === 'PF' ? 'PF' : null)

  // Só guarda o endereço de NF se algum campo veio preenchido.
  let nf: Record<string, string> | null = null
  if (b.nf_endereco && typeof b.nf_endereco === 'object') {
    const limpo: Record<string, string> = {}
    for (const [k, v] of Object.entries(b.nf_endereco)) {
      if (typeof v === 'string' && v.trim()) limpo[k] = k === 'uf' ? v.trim().toUpperCase() : v.trim()
    }
    if (Object.keys(limpo).length) nf = limpo
  }

  return {
    empresa: limpar(b.empresa),
    cargo: limpar(b.cargo),
    como_conheceu: limpar(b.como_conheceu),
    pessoa_tipo: tipo,
    razao_social: tipo === 'PJ' ? limpar(b.razao_social) : null,
    nf_endereco: nf,
  }
}

/**
 * Mapeia nosso endereço pros nomes que o Asaas usa no cadastro do cliente.
 * Cidade e UF ficam de fora de propósito: o Asaas resolve as duas a partir do
 * `postalCode`, e mandar texto livre lá só criaria divergência com o CEP.
 * Devolve null quando não há endereço aproveitável.
 */
export function enderecoParaAsaas(
  nf: Record<string, string> | null
): { postalCode: string; address: string; addressNumber: string; complement?: string; province: string } | null {
  if (!nf) return null
  const cep = onlyDigits(nf.cep)
  if (cep.length !== 8 || !nf.logradouro) return null
  return {
    postalCode: cep,
    address: nf.logradouro,
    addressNumber: nf.numero || 'S/N',
    complement: nf.complemento || undefined,
    province: nf.bairro || '',
  }
}
