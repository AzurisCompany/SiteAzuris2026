'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  async function sair() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.replace('/admin/login')
    router.refresh()
  }
  return (
    <button
      onClick={sair}
      className="text-sm text-[var(--text-muted)] hover:text-[var(--azuris-cyan)] transition-colors"
    >
      Sair
    </button>
  )
}
