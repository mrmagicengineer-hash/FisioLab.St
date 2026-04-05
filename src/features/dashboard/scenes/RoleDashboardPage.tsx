import type { UserRole } from '../../auth/data/types'

type RoleDashboardPageProps = {
  role: UserRole
  onLogout: () => void
}

export function RoleDashboardPage({ role, onLogout }: RoleDashboardPageProps) {
  void role

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <button
        type="button"
        onClick={onLogout}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Retornar al login
      </button>
    </main>
  )
}
