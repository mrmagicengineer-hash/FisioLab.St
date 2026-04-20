// src/App.tsx
import { AuthProvider, useAuth } from './features/auth/context/AuthContext'
import { ActiveAppointmentProvider } from './features/agenda/context/ActiveAppointmentContext'
import { SonnerToaster } from './SonnerToaster';
import { LoginPage } from './features/auth/scenes/LoginPage'
import { RoleDashboardPage } from './features/dashboard/scenes/RoleDashboardPage'

// Este componente decide qué renderizar basado en el contexto
function AppContent() {
  const { isAuthenticated, role, login, logout } = useAuth()

  if (isAuthenticated) {
    return <RoleDashboardPage role={role} onLogout={logout} />
  }

  return <LoginPage onLoginSuccess={login} />
}

// App envuelve toda la aplicación con el Provider
function App() {
  return (
    <AuthProvider>
      <ActiveAppointmentProvider>
        <AppContent />
        <SonnerToaster />
      </ActiveAppointmentProvider>
    </AuthProvider>
  )
}

export default App