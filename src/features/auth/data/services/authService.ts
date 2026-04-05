import type { Credentials, LoginResponse } from '../types'
import type { UserRole } from '../types'


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

const AUTH_ROLE_STORAGE_KEY = 'auth_role'


export class AuthApiError extends Error {
  status: number
  code: 'USER_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'UNKNOWN_AUTH'

  constructor(
    message: string,
    status: number,
    code: 'USER_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'UNKNOWN_AUTH'
  ) {
    super(message)
    this.status = status
    this.code = code
  }
}

function extractApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const candidate = payload as Record<string, unknown>
  const value = candidate.message ?? candidate.error ?? candidate.detail

  return typeof value === 'string' ? value : ''
}

function inferAuthError(status: number, rawMessage: string): {
  code: 'USER_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'UNKNOWN_AUTH'
  message: string
} {
  const normalized = rawMessage.toLowerCase()

  if (status === 404 || normalized.includes('usuario') && normalized.includes('encontr')) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'El usuario no fue encontrado.'
    }
  }

  if (
    status === 423 ||
    status === 429 ||
    normalized.includes('bloquead') ||
    normalized.includes('locked')
  ) {
    return {
      code: 'ACCOUNT_LOCKED',
      message: 'La cuenta esta bloqueada. Comuniquese con el administrador.'
    }
  }


  if (
    status === 401 ||
    status === 403 ||
    normalized.includes('credencial') ||
    normalized.includes('contrasen') ||
    normalized.includes('password') ||
    normalized.includes('incorrect')
  ) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Las credenciales son incorrectas.'
    }
  }

  return {
    code: 'UNKNOWN_AUTH',
    message: rawMessage || 'Error al iniciar sesion.'
  }
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return atob(`${normalized}${pad}`)
}

function normalizeRole(candidate: unknown): UserRole | null {
  if (typeof candidate !== 'string') {
    return null
  }

  const normalized = candidate.trim().toUpperCase()

  if (normalized.includes('ADMIN')) {
    return 'ADMINISTRADOR'
  }

  if (normalized.includes('FISIO')) {
    return 'FISIOTERAPEUTA'
  }

  if (normalized.includes('MEDIC')) {
    return 'MEDICO'
  }

  return null
}

function extractRoleFromPayload(payload: Record<string, unknown>): UserRole {
  const directCandidates = [payload.rol, payload.role, payload.authority]

  for (const candidate of directCandidates) {
    const role = normalizeRole(candidate)
    if (role) {
      return role
    }
  }

  const listCandidates = [payload.roles, payload.authorities]

  for (const value of listCandidates) {
    if (Array.isArray(value)) {
      for (const candidate of value) {
        const role = normalizeRole(candidate)
        if (role) {
          return role
        }
      }
    }

    if (typeof value === 'string') {
      const role = normalizeRole(value)
      if (role) {
        return role
      }
    }
  }

  if (typeof payload.scope === 'string') {
    const scopedRoles = payload.scope.split(/\s+/)
    for (const candidate of scopedRoles) {
      const role = normalizeRole(candidate)
      if (role) {
        return role
      }
    }
  }

  return 'DESCONOCIDO'
}

function extractRoleFromToken(token: string): UserRole {
  try {
    const parts = token.split('.')
    if (parts.length < 2) {
      return 'DESCONOCIDO'
    }

    const payloadRaw = base64UrlDecode(parts[1])
    const payload = JSON.parse(payloadRaw) as Record<string, unknown>
    return extractRoleFromPayload(payload)
  } catch {
    return 'DESCONOCIDO'
  }
}

export async function authenticate(credentials: Credentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  })

  if (!response.ok) {
    let rawMessage = ''

    try {
      const payload = (await response.json()) as unknown
      rawMessage = extractApiMessage(payload)
    } catch {
      // Ignore parse failures and fallback to status-based messages.
    }

    const parsedError = inferAuthError(response.status, rawMessage)
    throw new AuthApiError(parsedError.message, response.status, parsedError.code)
  }

  const data = (await response.json()) as LoginResponse

  localStorage.setItem('authToken', data.token)
  localStorage.setItem('auth_token_type', data.tokenType)
  localStorage.setItem('auth_expires_in', data.expiresIn.toString())
  localStorage.setItem(AUTH_ROLE_STORAGE_KEY, extractRoleFromToken(data.token))

  return data
}