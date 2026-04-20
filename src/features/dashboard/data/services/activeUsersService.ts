import { fetchWithAuth } from '../../../auth/data/services/apiClient'

export type ActiveUserDto = {
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

export async function getActiveUsers(): Promise<ActiveUserDto[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/usuarios/activos`, {
    method: 'GET',
  })

  if (!response.ok) {
    let message = 'No fue posible cargar los usuarios activos.'

    try {
      const payload = (await response.json()) as { message?: string; error?: string; detail?: string }
      message = payload.message ?? payload.error ?? payload.detail ?? message
    } catch {
      // fallback to default message
    }

    throw new Error(message)
  }

  return (await response.json()) as ActiveUserDto[]
}
