import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getInscricao,
  getEventos,
  labelProduto,
  brl,
  whatsappUrl,
  STATUS_LABEL,
  STATUS_COR,
} from '@/lib/admin-queries'
import { labelBilling } from '@/lib/billing'
import SyncButton from './SyncButton'
import TesteButton from '../TesteButton'
import AcoesCobranca from './AcoesCobranca'
import NotaFiscal from './NotaFiscal'

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

  const editavel = !!insc.asaas_payment_id && (insc.status === 'pending' || insc.status === 'overdue')

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
          <Linha rotulo="Telefone">
            {insc.telefone ? (
              <a
                href={whatsappUrl(insc.telefone) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--accent-emerald)] hover:underline"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                {insc.telefone}
              </a>
            ) : (
              '—'
            )}
          </Linha>
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
          <Linha rotulo="Forma">{labelBilling(insc.billing_type)}</Linha>
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

      {editavel && insc.asaas_invoice_url && (
        <Bloco titulo="Ações da cobrança">
          <AcoesCobranca
            id={insc.id}
            invoiceUrl={insc.asaas_invoice_url}
            telefone={insc.telefone}
            nome={insc.nome}
            descricao={labelProduto(insc.curso_slug)}
            valorReais={insc.valor_centavos / 100}
            dueDate={insc.due_date}
            installments={insc.installments}
            billingType={insc.billing_type}
          />
        </Bloco>
      )}

      {(insc.status === 'paid' || insc.nf_id) && insc.asaas_payment_id && (
        <Bloco titulo="Nota Fiscal">
          <NotaFiscal
            id={insc.id}
            nfId={insc.nf_id}
            nfStatus={insc.nf_status}
            nfNumero={insc.nf_numero}
            nfPdfUrl={insc.nf_pdf_url}
            nfXmlUrl={insc.nf_xml_url}
          />
        </Bloco>
      )}

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
