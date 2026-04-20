import { useState } from 'react'
import type { NavigationItem } from '../data/config/navigation'
import { Button } from '@/components/ui/button'

type DashboardSidebarProps = {
  roleTitle: string
  navigationItems: NavigationItem[]
  modules: string[]
  collapsed: boolean
}

function NavButton({
  label,
  isSelected,
  onClick
}: {
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-current={isSelected ? 'page' : undefined}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all flex items-center ${
        isSelected
          ? 'bg-white text-[var(--text-main)] shadow-sm border-l-[3px] border-l-[var(--fisiolab-blue)] rounded-l-none'
          : 'text-[#6B7280] hover:bg-slate-100 hover:text-[var(--text-main)]'
      }`}
    >
      {label}
    </Button>
  )
}

export function DashboardSidebar({ roleTitle, navigationItems, modules, collapsed }: DashboardSidebarProps) {
  const moduleMenuItems = modules.map((module) => ({
    key: `module-${module}`,
    label: module
  }))

  const footerMenuItems = [
    { key: 'settings', label: 'Configuración' },
    { key: 'help', label: 'Ayuda' }
  ]

  const defaultKey = navigationItems[0]?.key ?? moduleMenuItems[0]?.key ?? 'Inicio'
  const [selectedKey, setSelectedKey] = useState(defaultKey)

  return (
    <aside
      className="flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-all duration-200"
      style={{ width: collapsed ? 88 : 260 }}
      aria-label="Menú de navegación"
    >
      {/* Header */}
      <div className={`${collapsed ? 'px-3 py-5' : 'px-4 py-5'}`}>
        <div className="flex min-h-10 items-center gap-2.5">
          <img src="/logo/logofisiolab.png" alt="Fisiolab" className="h-8 w-auto object-contain brightness-0" />
          {!collapsed ? (
            <span className="text-xs font-semibold tracking-wide text-[var(--fisiolab-blue)]">{roleTitle}</span>
          ) : null}
        </div>

        {/* Search placeholder */}
        {!collapsed ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-500 shadow-sm">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
            </svg>
            <span className="text-xs font-medium">Buscar módulo...</span>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3" aria-label="Navegación principal">
        <div>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Principal
            </p>
          ) : null}
          <ul className="space-y-1" role="list">
            {navigationItems.map((item) => (
              <li key={item.key}>
                <NavButton
                  label={item.label}
                  isSelected={selectedKey === item.key}
                  onClick={() => setSelectedKey(item.key)}
                />
              </li>
            ))}
          </ul>
        </div>

        {!collapsed ? (
          <div>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Módulos
            </p>
            <ul className="space-y-1" role="list">
              {moduleMenuItems.map((item) => (
                <li key={item.key}>
                  <NavButton
                    label={item.label}
                    isSelected={selectedKey === item.key}
                    onClick={() => setSelectedKey(item.key)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      {/* Footer */}
      <div className={`${collapsed ? 'px-3 py-3' : 'px-3 pb-5 pt-3'}`}>
        <nav aria-label="Navegación secundaria">
          <ul className="space-y-1" role="list">
            {footerMenuItems.map((item) => (
              <li key={item.key}>
                <NavButton
                  label={item.label}
                  isSelected={selectedKey === item.key}
                  onClick={() => setSelectedKey(item.key)}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Active user card */}
        <div
          className={`mt-4 flex items-center gap-3 rounded-[12px] border border-slate-200 bg-white shadow-sm ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-3'
          }`}
        >
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--fisiolab-blue)] text-xs font-bold text-white"
            aria-hidden="true"
          >
            U
          </span>
          {!collapsed ? (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-[var(--text-main)]">Usuario Activo</p>
              <p className="truncate text-xs text-slate-500">sesión iniciada</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
