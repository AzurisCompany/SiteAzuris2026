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
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
