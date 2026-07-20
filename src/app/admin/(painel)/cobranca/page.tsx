import Link from 'next/link'
import { getInscricao, listarVendas, precosSugeridosCobranca } from '@/lib/admin-queries'
import { notaInicial } from '@/components/checkout/DadosNota'
import type { InscricaoRow } from '@/lib/db'
import CobrancaForm, { type Prefill } from './CobrancaForm'
import ListaCobrancas from './ListaCobrancas'

export const dynamic = 'force-dynamic'

/**
 * `?de=<id>` copia o cadastro do cliente daquela venda pro formulário — é o caminho
 * de "o cliente mudou de ideia: mesmo cliente, outro produto". Copia SÓ o cadastro;
 * produto, valor e descrição ficam em branco de propósito. Não mexe na venda de
 * origem: se ela tiver que morrer, é o botão cancelar, decisão separada.
 */
async function copiarDadosDe(id: number): Promise<{ prefill: Prefill; nome: string; id: number } | null> {
  const v = await getInscricao(id)
  if (!v) return null
  const e = v.nf_endereco ?? {}
  return {
    id: v.id,
    nome: v.nome,
    prefill: {
      nome: v.nome,
      email: v.email,
      cpf: v.cpf_cnpj,
      telefone: v.telefone ?? '',
      pessoaTipo: v.pessoa_tipo === 'PJ' ? 'PJ' : 'PF',
      nota: {
        ...notaInicial,
        razaoSocial: v.razao_social ?? '',
        cep: e.cep ?? '',
        logradouro: e.logradouro ?? '',
        numero: e.numero ?? '',
        complemento: e.complemento ?? '',
        bairro: e.bairro ?? '',
        cidade: e.cidade ?? '',
        uf: e.uf ?? '',
      },
    },
  }
}

export default async function CobrancaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const deId = Number(sp.de)
  const copiado = Number.isInteger(deId) && deId > 0 ? await copiarDadosDe(deId) : null
  let rows: InscricaoRow[] = []
  let total = 0
  let erro: string | null = null
  try {
    // manual: cobrança gerada aqui, em qualquer produto (não só as 'proposta' antigas).
    const res = await listarVendas({ manual: true, limit: 30 })
    rows = res.rows
    total = res.total
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro ao consultar o banco.'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cobrança avulsa</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Gera um link de pagamento pra uma proposta fechada — valor e descrição livres. Escolha o produto pra a venda
          cair na aba certa do painel. Marque um ou vários meios de pagamento. A cobrança entra na lista abaixo e o
          status fecha sozinho quando o cliente paga.
        </p>
      </div>

      {copiado && (
        <div className="rounded-lg border border-[var(--azuris-cyan)]/30 bg-[var(--azuris-cyan)]/5 px-4 py-3 text-sm">
          Dados de <strong>{copiado.nome}</strong> copiados da{' '}
          <Link href={`/admin/vendas/${copiado.id}`} className="text-[var(--azuris-cyan)] hover:underline">
            venda #{copiado.id}
          </Link>
          . Escolha o produto e o valor da cobrança nova — a antiga continua como está.
        </div>
      )}

      <CobrancaForm key={copiado?.id ?? 'novo'} precos={precosSugeridosCobranca()} prefill={copiado?.prefill} />

      {erro ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{erro}</div>
      ) : (
        <ListaCobrancas rows={rows} total={total} />
      )}
    </div>
  )
}
