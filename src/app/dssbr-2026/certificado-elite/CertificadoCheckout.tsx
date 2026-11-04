import { getProduto } from '@/lib/produtos'
import InscricaoForm from '../inscricao/InscricaoForm'

// UPGRADE ELITE do DSS 2026 — checkout do certificado. Um componente, dois produtos
// (digital R$30 · impresso R$50), cada um com link próprio. Preço fixo no registry,
// sem tipo no banco: a página nem consulta o banco. 1x no cartão, PIX na nossa tela.
export type Formato = 'digital' | 'impresso'

const SLUG: Record<Formato, string> = {
  digital: 'certificado-elite-digital-dss-2026',
  impresso: 'certificado-elite-impresso-dss-2026',
}

const ENTREGA: Record<Formato, string> = {
  digital: 'O certificado digital chega no e-mail cadastrado.',
  impresso: 'Depois do pagamento, a gente chama você no WhatsApp cadastrado pra combinar a entrega.',
}

const WA_PHONE = '5541998003687' // +55 (41) 99800-3687

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CertificadoCheckout({ formato }: { formato: Formato }) {
  const PRODUTO = getProduto(SLUG[formato])
  const preco = PRODUTO.precoCentavos / 100
  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
    `Oi! Estava no checkout do certificado ${formato} (Upgrade Elite) do DSS 2026 e tenho uma dúvida.`,
  )}`

  return (
    <main className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <a
          href={PRODUTO.voltarUrl}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--azuris-cyan)] transition-colors"
        >
          {PRODUTO.voltarLabel}
        </a>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight">
          Upgrade <span className="text-[var(--azuris-cyan)]">Elite</span> — certificado {formato}
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          O certificado do Data Science Summit Brasil 2026, para quem participou do congresso. {ENTREGA[formato]}
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--azuris-surface)] bg-[var(--azuris-deep)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--azuris-cyan)]">Certificado {formato}</div>
          <div className="text-4xl font-black">{brl(preco)}</div>
          <div className="text-xs text-[var(--text-muted)]">PIX ou cartão à vista</div>
        </div>

        <InscricaoForm
          precoDeVendaReais={0}
          precoPixReais={preco}
          precoCartaoBaseReais={preco}
          maxParcelas={PRODUTO.maxParcelas}
          endpoint={`/api/dss-certificado-elite/${formato}`}
          pixStatusEndpoint="/api/dss-certificado-elite/status"
          gaItem={{ id: PRODUTO.slug, name: PRODUTO.nome }}
          enderecoObrigatorioPJ={PRODUTO.enderecoObrigatorioPJ}
        />

        <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
          Dúvida?{' '}
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--azuris-cyan)]">
            Fale com a gente no WhatsApp
          </a>
          . Pagamento processado pelo Asaas com segurança.
        </p>
      </div>
    </main>
  )
}
