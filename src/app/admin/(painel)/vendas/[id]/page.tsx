import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getInscricao,
  getEventos,
  labelProduto,
  brl,
  STATUS_LABEL,
  STATUS_COR,
} from '@/lib/admin-queries'
import SyncButton from './SyncButton'
import TesteButton from '../TesteButton'

export const dynamic = 'force-dynamic'

function fmtDataHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-[var(--azuris-surface)]/50 last:border-0">
      <span className="text-[var(--text-muted)]">{rotulo}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--azuris-cyan)] mb-3">{titulo}</h2>
      <div className="text-sm">{children}</div>
    </section>
  )
}

export default async function VendaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId)) notFound()

  const insc = await getInscricao(numId)
  if (!insc) notFound()
  const eventos = await getEventos(insc.asaas_payment_id)

  const end = insc.nf_endereco
  const endStr = end
    ? [end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.uf, end.cep].filter(Boolean).join(', ')
    : null

  return (
    <div className="space-y-6">
      <Link href="/admin/vendas" className="text-sm text-[var(--text-muted)] hover:text-[var(--azuris-cyan)]">
        ← voltar pras vendas
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{insc.nome}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {labelProduto(insc.curso_slug)} · #{insc.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {insc.is_teste && (
            <span className="inline-flex rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              teste
            </span>
          )}
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COR[insc.status] ?? ''}`}>
            {STATUS_LABEL[insc.status] ?? insc.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SyncButton id={insc.id} />
        <TesteButton id={insc.id} isTeste={insc.is_teste} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloco titulo="Cliente">
          <Linha rotulo="E-mail">{insc.email}</Linha>
          <Linha rotulo="CPF/CNPJ">{insc.cpf_cnpj}</Linha>
          <Linha rotulo="Telefone">{insc.telefone ?? '—'}</Linha>
          <Linha rotulo="Empresa">{insc.empresa ?? '—'}</Linha>
          <Linha rotulo="Cargo">{insc.cargo ?? '—'}</Linha>
          <Linha rotulo="Tipo">{insc.pessoa_tipo ?? '—'}</Linha>
          {insc.razao_social && <Linha rotulo="Razão social">{insc.razao_social}</Linha>}
          {endStr && <Linha rotulo="Endereço NF">{endStr}</Linha>}
          <Linha rotulo="Como conheceu">{insc.como_conheceu ?? '—'}</Linha>
          <Linha rotulo="Consentimento LGPD">
            {insc.consentimento_lgpd ? `Sim · ${fmtDataHora(insc.consentimento_em)}` : 'Não registrado'}
          </Linha>
        </Bloco>

        <Bloco titulo="Pagamento">
          <Linha rotulo="Forma">{insc.billing_type === 'PIX' ? 'PIX' : 'Cartão'}</Linha>
          <Linha rotulo="Parcelas">{insc.installments}x</Linha>
          <Linha rotulo="Valor cobrado (bruto)">{brl(insc.valor_centavos)}</Linha>
          <Linha rotulo="Valor líquido">{insc.valor_liquido_centavos != null ? brl(insc.valor_liquido_centavos) : '—'}</Linha>
          <Linha rotulo="Taxa Asaas">{insc.taxa_centavos != null ? brl(insc.taxa_centavos) : '—'}</Linha>
          <Linha rotulo="Vencimento">{insc.due_date ?? '—'}</Linha>
          <Linha rotulo="Status Asaas">{insc.asaas_status ?? '—'}</Linha>
          <Linha rotulo="Pago em">{fmtDataHora(insc.pago_em ?? insc.paid_at)}</Linha>
          <Linha rotulo="Criado em">{fmtDataHora(insc.created_at)}</Linha>
          <Linha rotulo="Última sync">{fmtDataHora(insc.last_synced_at)}</Linha>
          {insc.asaas_invoice_url && (
            <Linha rotulo="Cobrança">
              <a href={insc.asaas_invoice_url} target="_blank" rel="noreferrer" className="text-[var(--azuris-cyan)] hover:underline">
                abrir no Asaas ↗
              </a>
            </Linha>
          )}
        </Bloco>
      </div>

      {(insc.utm_source || insc.utm_medium || insc.utm_campaign) && (
        <Bloco titulo="Origem (UTM)">
          <Linha rotulo="Source">{insc.utm_source ?? '—'}</Linha>
          <Linha rotulo="Medium">{insc.utm_medium ?? '—'}</Linha>
          <Linha rotulo="Campaign">{insc.utm_campaign ?? '—'}</Linha>
          {insc.utm_content && <Linha rotulo="Content">{insc.utm_content}</Linha>}
          {insc.utm_term && <Linha rotulo="Term">{insc.utm_term}</Linha>}
        </Bloco>
      )}

      <Bloco titulo={`Histórico de eventos (${eventos.length})`}>
        {eventos.length === 0 ? (
          <p className="text-[var(--text-muted)]">Nenhum evento de webhook registrado pra esta cobrança.</p>
        ) : (
          <ul className="space-y-2">
            {eventos.map((ev) => (
              <li key={ev.id} className="flex justify-between gap-4 text-sm">
                <span className="font-mono text-[var(--text-secondary)]">{ev.event}</span>
                <span className="text-[var(--text-muted)]">{fmtDataHora(ev.received_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </div>
  )
}
