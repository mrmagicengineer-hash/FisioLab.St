import type { UserRole } from '../data/types'
import { RoleDashboardPage } from '../../dashboard/scenes/RoleDashboardPage'

type RoleHomeProps = {
  role: UserRole
  onLogout: () => void
}

export function RoleHome({ role, onLogout }: RoleHomeProps) {
  return <RoleDashboardPage role={role} onLogout={onLogout} />
}