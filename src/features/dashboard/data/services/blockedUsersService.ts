export type BlockedUserDto = {
  id: number
  cedula: string
  email: string
  name: string
  lastName: string
  rol: string
  activo: boolean
  especialidad: string | null
  tipoProfesional: string | null
  codigoRegistro: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

function getAuthHeader(): string {
  const token = localStorage.getItem('authToken')
  const tokenType = localStorage.getItem('auth_token_type') ?? 'Bearer'

  if (!token) {
    throw new Error('No hay sesion activa para consultar usuarios bloqueados.')
  }

  return `${tokenType} ${token}`
}

export async function getBlockedUsers(): Promise<BlockedUserDto[]> {
  const response = await fetch(`${API_BASE_URL}/admin/usuarios/bloqueados`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader()
    }
  })

  if (!response.ok) {
    let message = 'No fue posible cargar los usuarios bloqueados.'

    try {
      const payload = (await response.json()) as { message?: string; error?: string; detail?: string }
      message = payload.message ?? payload.error ?? payload.detail ?? message
    } catch {
      // fallback to default message
    }

    throw new Error(message)
  }

  return (await response.json()) as BlockedUserDto[]
}