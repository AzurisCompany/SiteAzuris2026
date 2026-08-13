import Link from 'next/link'
import { redirect } from 'next/navigation'
import { estaLogado } from '@/lib/admin-auth'
import LogoutButton from './LogoutButton'

export const dynamic = 'force-dynamic'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  if (!(await estaLogado())) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-[var(--azuris-ink)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--azuris-surface)] bg-[var(--azuris-deep)]">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <span className="font-bold text-[var(--azuris-cyan)]">Azuris · Financeiro</span>
            <Link href="/admin" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Visão geral
            </Link>
            <Link href="/admin/vendas" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Vendas
            </Link>
            <Link href="/admin/financeiro" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Financeiro
            </Link>
            <Link href="/admin/cobranca" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Cobrança
            </Link>
            <Link href="/admin/assinaturas" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Assinaturas
            </Link>
            <Link href="/admin/ingressos" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Ingressos
            </Link>
            <Link href="/admin/cupons" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Cupons
            </Link>
            <Link href="/admin/saude" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Saúde
            </Link>
            <Link href="/admin/importar" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Importar
            </Link>
            <Link href="/admin/trafego" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Tráfego
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
