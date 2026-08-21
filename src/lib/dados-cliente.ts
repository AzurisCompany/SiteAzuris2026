// Monta o bloco de texto com TUDO que o cliente digitou sobre si mesmo no
// checkout — pra colar num formulário de nota fiscal, num e-mail ou no WhatsApp.
//
// Puro de propósito (sem banco, sem DOM): quem copia pro clipboard é o
// CopiarClienteButton em /admin/vendas. Aqui só tem transformação, e por isso
// dá pra testar.
//
// O que entra: só o que a PESSOA preencheu. Valor, status, taxa e ids do Asaas
// ficam de fora — isso é dado da venda, não do cliente.

import type { InscricaoRow } from '@/lib/db'
import { descricaoManual } from '@/lib/cobranca-manual'
import { maskCep, maskCnpj, maskCpf, maskPhone, onlyDigits } from '@/lib/format'

/** Só os campos preenchidos pelo cliente — o resto da InscricaoRow não interessa aqui. */
export type DadosCliente = Pick<
  InscricaoRow,
  | 'nome'
  | 'email'
  | 'cpf_cnpj'
  | 'telefone'
  | 'pessoa_tipo'
  | 'razao_social'
  | 'empresa'
  | 'cargo'
  | 'nf_endereco'
  | 'como_conheceu'
>

function limpo(v: string | null | undefined): string {
  return (v ?? '').trim()
}

/**
 * Endereço do tomador numa linha só, no formato que se usa pra preencher nota:
 * `Rua X, 100, sala 2 — Centro, Curitiba/PR — CEP 80000-000`.
 *
 * Cada trecho some inteiro se estiver vazio: meio endereço não pode virar
 * `Rua X, , , /  — CEP `.
 */
export function enderecoTexto(end: Record<string, string> | null | undefined): string | null {
  if (!end) return null
  const rua = [limpo(end.logradouro), limpo(end.numero), limpo(end.complemento)].filter(Boolean).join(', ')
  const cidadeUf = [limpo(end.cidade), limpo(end.uf)].filter(Boolean).join('/')
  const local = [limpo(end.bairro), cidadeUf].filter(Boolean).join(', ')
  const cepDigitos = onlyDigits(end.cep)
  const cep = cepDigitos ? `CEP ${maskCep(cepDigitos)}` : ''
  const partes = [rua, local, cep].filter(Boolean)
  return partes.length ? partes.join(' — ') : null
}

/**
 * Formata o documento e devolve o rótulo certo junto. O tipo vem dos dígitos,
 * não do `pessoa_tipo`: registro antigo pode ter o tipo NULL e o CNPJ preenchido.
 */
export function documentoTexto(cpfCnpj: string | null | undefined): { rotulo: string; valor: string } | null {
  const d = onlyDigits(cpfCnpj)
  if (d.length === 14) return { rotulo: 'CNPJ', valor: maskCnpj(d) }
  if (d.length === 11) return { rotulo: 'CPF', valor: maskCpf(d) }
  if (!d) return null
  return { rotulo: 'Documento', valor: d } // tamanho estranho: mostra cru em vez de mascarar errado
}

const LABEL_PESSOA: Record<'PF' | 'PJ', string> = { PF: 'Pessoa física', PJ: 'Pessoa jurídica' }

/**
 * Bloco de texto pronto pra colar. Linha 1 é o nome; o resto vem rotulado, uma
 * linha por campo, e **campo vazio não vira linha** — colar `Cargo: —` num
 * formulário de nota é pior que não colar nada.
 */
export function dadosClienteTexto(insc: DadosCliente): string {
  const linhas: string[] = []
  const nome = limpo(insc.nome)
  if (nome) linhas.push(nome)

  const push = (rotulo: string, valor: string | null | undefined) => {
    const v = limpo(valor)
    if (v) linhas.push(`${rotulo}: ${v}`)
  }

  push('E-mail', insc.email)

  const tel = onlyDigits(insc.telefone)
  if (tel) linhas.push(`Telefone: ${maskPhone(tel)}`)

  const doc = documentoTexto(insc.cpf_cnpj)
  if (doc) linhas.push(`${doc.rotulo}: ${doc.valor}`)

  if (insc.pessoa_tipo) linhas.push(`Tipo: ${LABEL_PESSOA[insc.pessoa_tipo]}`)

  push('Razão social', insc.razao_social)
  push('Empresa', insc.empresa)
  push('Cargo', insc.cargo)
  push('Endereço', enderecoTexto(insc.nf_endereco))

  // `como_conheceu` é sequestrado pela cobrança avulsa pra guardar a descrição
  // que o ADMIN digitou (ver descricaoManual). Nesse caso não é dado do cliente
  // e não entra aqui.
  if (descricaoManual(insc.como_conheceu) == null) push('Como conheceu', insc.como_conheceu)

  return linhas.join('\n')
}
