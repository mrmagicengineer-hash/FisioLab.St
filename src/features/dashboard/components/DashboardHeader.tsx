import { useState } from 'react'

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

  return (
    <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={collapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
        className="rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#1890ff]"
      >
        {collapsed ? '>>' : '<<'}
      </button>

      <div className="flex items-center gap-2">
        <div
          style={{
            height: 10,
            width: 10,
            borderRadius: 999,
            background: accentColor
          }}
        />
        <img src="/logo/logofisiolab.png" alt="Fisiolab" className="h-10 w-auto object-contain" />
      </div>

      <div style={{ flex: 1 }} />

      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border bg-white px-2 py-1"
          style={{ borderColor: 'rgba(74, 127, 165, 0.28)' }}
          aria-label="Opciones de usuario"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {userDisplayName.slice(0, 1).toUpperCase()}
          </span>
          <span style={{ fontSize: 13 }}>{userDisplayName}</span>
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 mt-2 w-40 rounded-md border border-slate-200 bg-white p-1 shadow">
            <button
              type="button"
              className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
              onClick={() => {
                setIsMenuOpen(false)
                onViewAccount()
              }}
            >
              Ver mi cuenta
            </button>
            <button
              type="button"
              className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setIsMenuOpen(false)
                onLogout()
              }}
            >
              Salir
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
