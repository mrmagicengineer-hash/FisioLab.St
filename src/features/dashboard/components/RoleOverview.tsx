import { useEffect, useMemo, useState } from 'react'
import type { UserRole } from '../../auth/data/types'
import { getActiveUsers } from '../data/services/activeUsersService'
import { getBlockedUsers } from '../data/services/blockedUsersService'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './ui/StatusBadge'

type RoleOverviewProps = {
  role: UserRole
  title: string
  subtitle: string
  modules: string[]
  actions: string[]
  accentColor: string
  onLogout: () => void
}

type CuentaUsuario = {
  nombre: string
  rol: string
  estado: 'activa' | 'bloqueada' | 'desactivada'
}

function normalizeRoleLabel(role: string): string {
  const normalized = role.toUpperCase()

  if (normalized === 'ADMINISTRADOR') {
    return 'Administrador'
  }

  if (normalized === 'FISIOTERAPEUTA') {
    return 'Fisioterapeuta'
  }

  if (normalized === 'MEDICO') {
    return 'Medico'
  }

  return role
}

export function RoleOverview({
  role,
  title,
  subtitle,
  modules,
  actions,
  accentColor,
  onLogout
}: RoleOverviewProps) {
  const [cuentas, setCuentas] = useState<CuentaUsuario[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsError, setAccountsError] = useState('')

  useEffect(() => {
    if (role !== 'ADMINISTRADOR') {
      return
    }

    let isMounted = true

    async function loadAccounts() {
      setAccountsLoading(true)
      setAccountsError('')

      try {
        const [activeUsers, blockedUsers] = await Promise.all([getActiveUsers(), getBlockedUsers()])
        if (!isMounted) {
          return
        }

        const activeAccounts: CuentaUsuario[] = activeUsers.map((user) => ({
          nombre: `${user.name} ${user.lastName}`.trim(),
          rol: normalizeRoleLabel(user.rol),
          estado: user.activo ? 'activa' : 'desactivada'
        }))

        const blockedAccounts: CuentaUsuario[] = blockedUsers.map((user) => ({
          nombre: `${user.name} ${user.lastName}`.trim(),
          rol: normalizeRoleLabel(user.rol),
          estado: 'bloqueada'
        }))

        const mergedByName = new Map<string, CuentaUsuario>()

        for (const account of activeAccounts) {
          mergedByName.set(account.nombre.toLowerCase(), account)
        }

        for (const account of blockedAccounts) {
          mergedByName.set(account.nombre.toLowerCase(), account)
        }

        setCuentas(Array.from(mergedByName.values()))
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'No fue posible cargar usuarios activos.'
        setAccountsError(message)
        setCuentas([])
      } finally {
        if (isMounted) {
          setAccountsLoading(false)
        }
      }
    }

    void loadAccounts()

    return () => {
      isMounted = false
    }
  }, [role])

  const kpis = useMemo(
    () => ({
      usuariosActivos: cuentas.filter((cuenta) => cuenta.estado === 'activa').length,
      cuentasBloqueadas: cuentas.filter((cuenta) => cuenta.estado === 'bloqueada').length,
      cuentasDesactivadas: cuentas.filter((cuenta) => cuenta.estado === 'desactivada').length
    }),
    [cuentas]
  )

  if (role === 'ADMINISTRADOR') {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mb-4 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Bienvenido, Administrador</h2>
          <p className="mt-1 text-sm text-slate-600">Panel de administracion del sistema · Fisiolab</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={onLogout}
          >
            Cerrar sesion
          </Button>
        </section>

        <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Metricas del sistema">
          <article className="flex items-start gap-4 rounded-xl border-l-4 border-emerald-500 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50" aria-hidden="true">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Usuarios activos</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600">{kpis.usuariosActivos}</p>
            </div>
          </article>

          <article className="flex items-start gap-4 rounded-xl border-l-4 border-red-500 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50" aria-hidden="true">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cuentas bloqueadas</p>
              <p className="mt-1 text-3xl font-bold text-red-600">{kpis.cuentasBloqueadas}</p>
            </div>
          </article>

          <article className="flex items-start gap-4 rounded-xl border-l-4 border-amber-400 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50" aria-hidden="true">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cuentas desactivadas</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{kpis.cuentasDesactivadas}</p>
            </div>
          </article>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Estado de cuentas</h3>
          {accountsLoading ? <p className="text-sm text-slate-500">Cargando usuarios...</p> : null}
          {accountsError ? <p className="text-sm text-red-600">{accountsError}</p> : null}

          {!accountsLoading && !accountsError ? (
            <ul className="space-y-2">
              {cuentas.map((cuenta) => (
                <li key={`${cuenta.nombre}-${cuenta.estado}`} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cuenta.nombre}</p>
                    <p className="text-xs text-slate-500">{cuenta.rol}</p>
                  </div>
                  <StatusBadge
                    label={cuenta.estado}
                    variant={
                      cuenta.estado === 'activa' ? 'success' : cuenta.estado === 'bloqueada' ? 'error' : 'neutral'
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Dashboard</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Bienvenido {title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Modulos disponibles</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {modules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Acciones permitidas</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          onClick={onLogout}
        >
          Salir
        </Button>
        <Button
          type="button"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: accentColor }}
        >
          Ver agenda
        </Button>
      </div>
    </main>
  )
}
