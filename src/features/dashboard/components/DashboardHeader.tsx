import { useState } from 'react'
import { Button } from '@/components/ui/button'

type DashboardHeaderProps = {
  accentColor: string
  userDisplayName: string
  collapsed: boolean
  onToggleSidebar: () => void
  onViewAccount: () => void
  onLogout: () => void
}

export function DashboardHeader({
  accentColor,
  userDisplayName,
  collapsed,
  onToggleSidebar,
  onViewAccount,
  onLogout
}: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function handleMenuClose() {
    setIsMenuOpen(false)
  }

  return (
    <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
      {/* Sidebar toggle */}
      <Button
        type="button"
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
        aria-expanded={!collapsed}
        variant="ghost"
        size="sm"
        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        {collapsed ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </Button>

      {/* Brand */}
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: accentColor }}
          aria-hidden="true"
        />
        <img src="/logo/logofisiolab.png" alt="Fisiolab" className="h-10 w-auto object-contain" />
      </div>

      <div className="flex-1" />

      {/* User menu */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 rounded-full border bg-white px-2 py-1"
          style={{ borderColor: 'rgba(74, 127, 165, 0.28)' }}
          aria-label="Opciones de usuario"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          >
            {userDisplayName.slice(0, 1).toUpperCase()}
          </span>
          <span style={{ fontSize: 13 }}>{userDisplayName}</span>
          <svg
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {/* Click-away backdrop */}
        {isMenuOpen ? (
          <div
            className="fixed inset-0 z-10"
            onClick={handleMenuClose}
            aria-hidden="true"
          />
        ) : null}

        {/* Dropdown */}
        {isMenuOpen ? (
          <div
            role="menu"
            aria-label="Menu de usuario"
            className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className="block h-auto w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => {
                handleMenuClose()
                onViewAccount()
              }}
            >
              Ver mi cuenta
            </Button>
            <div className="my-1 h-px bg-slate-100" role="separator" />
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className="block h-auto w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                handleMenuClose()
                onLogout()
              }}
            >
              Cerrar sesion
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
