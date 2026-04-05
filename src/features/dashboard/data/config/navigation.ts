import type { UserRole } from '../../../auth/data/types'

export type NavigationItem = {
  key: string
  label: string
}

const COMMON_NAVIGATION_ITEMS: NavigationItem[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'pacientes', label: 'Pacientes' },
  { key: 'reportes', label: 'Reportes' }
]

export function getTopNavigationItemsByRole(role: UserRole): NavigationItem[] {
  if (role === 'ADMINISTRADOR') {
    return [{ key: 'nuevo-usuario', label: 'Nuevo Usuario' }]
  }

  return COMMON_NAVIGATION_ITEMS
}
