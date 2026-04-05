import { useState } from 'react'
import { LoginPage } from './features/auth/scenes/LoginPage'
import { RoleDashboardPage } from './features/dashboard/scenes/RoleDashboardPage'
import type { UserRole } from './features/auth/data/types'

const AUTH_ROLE_STORAGE_KEY = 'auth_role'

function getStoredRole(): UserRole {
  const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY)
  if (storedRole === 'ADMINISTRADOR' || storedRole === 'FISIOTERAPEUTA' || storedRole === 'MEDICO') {
    return storedRole
  }

  return 'DESCONOCIDO'
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('authToken')))
  const [role, setRole] = useState<UserRole>(() => getStoredRole())

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('auth_token_type')
    localStorage.removeItem('auth_expires_in')
    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
    setRole('DESCONOCIDO')
    setIsAuthenticated(false)
  }

  function handleLoginSuccess() {
    setRole(getStoredRole())
    setIsAuthenticated(true)
  }

  if (isAuthenticated) {
    return <RoleDashboardPage role={role} onLogout={handleLogout} />
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />
}

export default App