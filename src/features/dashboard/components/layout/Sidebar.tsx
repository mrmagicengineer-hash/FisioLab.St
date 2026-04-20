import type { ReactNode } from 'react'
import type { UserRole } from '../../../auth/data/types'

export type DashboardView =
    | 'dashboard'
    | 'agenda'
    | 'user-management'
    | 'blocked-accounts'
    | 'roles-permissions'
    | 'audit'
    | 'patients'
    | 'consultations'
    | 'treatment-plans'
    | 'therapy-sessions'
    | 'settings'
    | 'passive-file'
    | 'reports'

type SidebarProps = {
    role: UserRole
    isCollapsed: boolean
    onToggleCollapse: () => void
    activeView: DashboardView
    onNavigate: (view: DashboardView) => void
}

type NavItemProps = {
    label: string
    icon: ReactNode
    isCollapsed: boolean
    isActive?: boolean
    onClick?: () => void
}

function NavItem({ label, icon, isCollapsed, isActive = false, onClick }: NavItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={isCollapsed ? label : undefined}
            className={`group relative flex w-full items-center rounded-xl py-3 text-left transition-all duration-200 ${
                isActive
                    ? 'bg-[#1A5276]/8 text-[#1A5276] shadow-sm ring-1 ring-[#1A5276]/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            } ${
                isCollapsed ? 'justify-center px-0' : 'gap-3.5 px-4'
            }`}
        >
            <span
                className={`flex shrink-0 items-center justify-center transition-all duration-200 ${
                    isActive ? 'text-[#1A5276]' : 'text-slate-400 group-hover:text-slate-600'
                } ${isCollapsed ? 'h-11 w-11' : 'h-5.5 w-5.5'}`}
            >
                {icon}
            </span>
            <span
                className={`overflow-hidden whitespace-nowrap text-[1.0625rem] leading-tight tracking-[-0.01em] transition-all duration-300 ${
                    isActive ? 'font-semibold' : 'font-medium'
                } ${
                    isCollapsed ? 'max-w-0 opacity-0' : 'max-w-52 opacity-100'
                }`}
            >
                {label}
            </span>
            {isActive && !isCollapsed && (
                <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#1A5276]" />
            )}
        </button>
    )
}

export const Sidebar = ({ role, isCollapsed, onToggleCollapse, activeView, onNavigate }: SidebarProps) => {
    const isPhysio = role === 'FISIOTERAPEUTA'

    return (
        <aside
            id="top-bar-sidebar"
            className={`fixed top-0 left-0 z-40 h-full transition-all duration-300 ${isCollapsed ? 'w-[4.5rem]' : 'w-[17rem]'}`}
            aria-label="Sidebar"
        >
            <div className="relative flex h-full flex-col border-r border-slate-200/80 bg-white px-3 py-5">
                {/* Logo Section */}
                <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0 mb-6' : 'px-3 mb-8'}`}>
                    <a href="/" className="flex items-center">
                        {isCollapsed ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A5276]/8">
                                <span className="text-lg font-bold text-[#1A5276]">F</span>
                            </div>
                        ) : (
                            <img src="/logo/logofisiolab.png" className="h-9 w-auto" alt="Fisiolab" />
                        )}
                    </a>
                </div>

                {/* Navigation */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto">
                        {/* Dashboard - standalone */}
                        <NavItem
                            label="Dashboard"
                            isCollapsed={isCollapsed}
                            isActive={activeView === 'dashboard'}
                            onClick={() => onNavigate('dashboard')}
                            icon={
                                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                    <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                                    <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                                    <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                                    <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                                </svg>
                            }
                        />

                        {/* Section divider */}
                        <div className="pt-4 pb-2">
                            <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-4'}`}>
                                <div className="h-px flex-1 bg-slate-200" />
                                {!isCollapsed && (
                                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                                        {isPhysio ? 'Clinica' : 'Usuarios'}
                                    </span>
                                )}
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                        </div>

                        {/* Main nav items */}
                        <div className="space-y-1">
                            {isPhysio ? (
                                <>
                                    <NavItem
                                        label="Pacientes"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'patients'}
                                        onClick={() => onNavigate('patients')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        }
                                    />
                                    <NavItem
                                        label="Consultas"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'consultations'}
                                        onClick={() => onNavigate('consultations')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        }
                                    />
                                    <NavItem
                                        label="Planes de Tratamiento"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'treatment-plans'}
                                        onClick={() => onNavigate('treatment-plans')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
                                                <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                            </svg>
                                        }
                                    />
                                    <NavItem
                                        label="Agenda"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'agenda'}
                                        onClick={() => onNavigate('agenda')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                                <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                            </svg>
                                        }
                                    />
                                    <NavItem
                                        label="Sesiones"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'therapy-sessions'}
                                        onClick={() => onNavigate('therapy-sessions')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                                                <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                            </svg>
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <NavItem
                                        label="Gestion de Cuentas"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'user-management'}
                                        onClick={() => onNavigate('user-management')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        }
                                    />
                                    <NavItem
                                        label="Cuentas Bloqueadas"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'blocked-accounts'}
                                        onClick={() => onNavigate('blocked-accounts')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path d="M19 16v-2a2 2 0 0 0-4 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9.5 15H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                                                <rect x="13" y="16" width="8" height="5" rx="0.899" stroke="currentColor" strokeWidth="1.8" />
                                            </svg>
                                        }
                                    />
                                    <NavItem
                                        label="Roles y Permisos"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'roles-permissions'}
                                        onClick={() => onNavigate('roles-permissions')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path d="M20 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M20 13h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 2.072.578" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                                                <circle cx="20" cy="19" r="2" stroke="currentColor" strokeWidth="1.8" />
                                            </svg>
                                        }
                                    />
                                </>
                            )}
                        </div>

                        {/* Seguridad section — admin only */}
                        {!isPhysio && (
                            <>
                                <div className="pt-4 pb-2">
                                    <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-4'}`}>
                                        <div className="h-px flex-1 bg-slate-200" />
                                        {!isCollapsed && (
                                            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                                                Seguridad
                                            </span>
                                        )}
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <NavItem
                                        label="Auditoria"
                                        isCollapsed={isCollapsed}
                                        isActive={activeView === 'audit'}
                                        onClick={() => onNavigate('audit')}
                                        icon={
                                            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
                                                <path d="M15 12h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M15 8h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M19 17V5a2 2 0 0 0-2-2H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </nav>

                    {/* Bottom section */}
                    <div className="mt-auto pt-4">
                        <div className="mb-3 h-px bg-slate-200" />

                        {isCollapsed ? (
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                    aria-label="Ayuda"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <path d="M12 17h.01" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-slate-400">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <path d="M12 17h.01" />
                                </svg>
                                Ayuda
                            </button>
                        )}
                    </div>
                </div>

                {/* Collapse toggle */}
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    aria-label={isCollapsed ? 'Expandir sidebar' : 'Plegar sidebar'}
                    className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-slate-700 hover:shadow"
                >
                    {isCollapsed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    )}
                </button>
            </div>
        </aside>
    );
};