import { createContext, useContext, useState, useEffect} from "react";
import type { ReactNode } from "react";
import type { UserRole } from "../data/types";
import { extractUserIdFromToken, extractNameFromToken } from "../data/services/authService";


const AUTH_ROLE_STORAGE_KEY    = 'auth_role'
const REFRESH_TOKEN_STORAGE_KEY = 'auth_refresh_token'
const AUTH_USER_ID_STORAGE_KEY  = 'auth_user_id'

function getStoredUserName(): string | null {
  const token = localStorage.getItem('authToken')
  return token ? extractNameFromToken(token) : null
}

function getStoredRole(): UserRole {
    const storedRole = localStorage.getItem(AUTH_ROLE_STORAGE_KEY)
    if (storedRole == 'ADMINISTRADOR' || storedRole === 'FISIOTERAPEUTA' || storedRole === 'MEDICO') {
        return storedRole
    }
    return 'UNKNOWN'
}

function getStoredUserId(): number | null {
    const raw = localStorage.getItem(AUTH_USER_ID_STORAGE_KEY)
    if (raw) {
        const n = Number(raw)
        if (!Number.isNaN(n) && n > 0) return n
    }
    // Fallback: extract directly from stored JWT (handles sessions before userId saving was added)
    const token = localStorage.getItem('authToken')
    if (token) {
        const fromToken = extractUserIdFromToken(token)
        if (fromToken !== null) {
            localStorage.setItem(AUTH_USER_ID_STORAGE_KEY, String(fromToken))
            return fromToken
        }
    }
    return null
}


interface AuthContextType {
    isAuthenticated: boolean;
    role: UserRole
    userId: number | null
    userName: string | null
    login: () => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('authToken')))
  const [role, setRole]         = useState<UserRole>(() => getStoredRole())
  const [userId, setUserId]     = useState<number | null>(() => getStoredUserId())
  const [userName, setUserName] = useState<string | null>(() => getStoredUserName())

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('auth_token_type')
    localStorage.removeItem('auth_expires_in')
    localStorage.removeItem(AUTH_ROLE_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(AUTH_USER_ID_STORAGE_KEY)
    setRole('UNKNOWN')
    setUserId(null)
    setUserName(null)
    setIsAuthenticated(false)
  }

  const login = () => {
    setRole(getStoredRole())
    setUserId(getStoredUserId())
    setUserName(getStoredUserName())
    setIsAuthenticated(true)
  }

  // MAGIA AQUÍ: Escuchamos un evento global que nuestra API puede disparar
  useEffect(() => {
    const handleGlobalLogout = () => {
      logout()
    }

    window.addEventListener('auth:logout', handleGlobalLogout)
    
    return () => {
      window.removeEventListener('auth:logout', handleGlobalLogout)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userId, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}