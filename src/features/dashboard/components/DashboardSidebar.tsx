import { useState } from 'react'
import type { NavigationItem } from '../data/config/navigation'

type DashboardSidebarProps = {
  roleTitle: string
  navigationItems: NavigationItem[]
  modules: string[]
  collapsed: boolean
}

export function DashboardSidebar({ roleTitle, navigationItems, modules, collapsed }: DashboardSidebarProps) {
  const moduleMenuItems = modules.map((module) => ({
    key: `module-${module}`,
    label: module
  }))

  const footerMenuItems = [
    { key: 'settings', label: 'Configuracion' },
    { key: 'help', label: 'Ayuda' }
  ]

  const defaultKey = navigationItems[0]?.key ?? moduleMenuItems[0]?.key ?? 'Inicio'
  const [selectedKeys, setSelectedKeys] = useState<string[]>([defaultKey])

  return (
    <aside
      className="flex h-full flex-col border-r border-slate-200 bg-[#031a33]"
      style={{ width: collapsed ? 88 : 264 }}
    >
      <div style={{ padding: collapsed ? '20px 12px' : '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 40 }}>
          <img src="/logo/logofisiolab.png" alt="Fisiolab" className="h-8 w-auto object-contain" />
          {!collapsed ? (
            <span style={{ color: '#dbeafe', fontSize: 12, letterSpacing: '0.03em' }}>{roleTitle}</span>
          ) : null}
        </div>

        {!collapsed ? (
          <div
            style={{
              marginTop: 14,
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(15,23,42,0.45)',
              color: '#94a3b8',
              fontSize: 12,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>?</span>
            <span>Buscar modulo...</span>
          </div>
        ) : null}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingInline: 8 }}>
        {!collapsed ? (
          <span style={{ color: 'rgba(203,213,225,0.7)', fontSize: 11, padding: '0 8px 6px' }}>Principal</span>
        ) : null}
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedKeys([item.key])}
              className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                selectedKeys.includes(item.key)
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {!collapsed ? (
          <span style={{ color: 'rgba(203,213,225,0.7)', fontSize: 11, padding: '10px 8px 6px' }}>Modulos</span>
        ) : null}
        <nav className="space-y-1">
          {moduleMenuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedKeys([item.key])}
              className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                selectedKeys.includes(item.key)
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: collapsed ? '8px' : '10px 12px 14px' }}>
        <nav className="space-y-1">
          {footerMenuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedKeys([item.key])}
              className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                selectedKeys.includes(item.key)
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div
          style={{
            marginTop: 10,
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.55)',
            padding: collapsed ? '8px 6px' : '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8
          }}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-white">
            U
          </span>
          {!collapsed ? (
            <div style={{ lineHeight: 1.2 }}>
              <span style={{ color: '#e2e8f0', fontSize: 12 }}>Usuario Activo</span>
              <br />
              <span style={{ color: '#94a3b8', fontSize: 11 }}>sesion iniciada</span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
