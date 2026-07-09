import CobrancaForm from './CobrancaForm'

export const dynamic = 'force-dynamic'

export default function CobrancaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cobrança avulsa</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Gera um link de pagamento pra uma proposta fechada — valor e descrição livres. A cobrança entra na lista de
          vendas e o status fecha sozinho quando o cliente paga.
        </p>
      </div>
      <CobrancaForm />
    </div>
  )
}
