import { fetchWithAuth } from '../../../auth/data/services/apiClient'

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

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string; detail?: string }
    return payload.message ?? payload.error ?? payload.detail ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export async function getBlockedUsers(): Promise<BlockedUserDto[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/usuarios/bloqueados`, {
    method: 'GET',
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'No fue posible cargar los usuarios bloqueados.')
    throw new Error(message)
  }

  return (await response.json()) as BlockedUserDto[]
}

export async function deactivateTemporaryBlock(userId: number): Promise<void> {
  const attempts = [
    {
      endpoint: `${API_BASE_URL}/admin/usuarios/${userId}/desactivar-bloqueo`,
      method: 'PATCH'
    },
    {
      endpoint: `${API_BASE_URL}/admin/usuarios/${userId}/desactivar-bloqueo-temporal`,
      method: 'PATCH'
    },
    {
      endpoint: `${API_BASE_URL}/admin/usuarios/${userId}/desbloquear`,
      method: 'POST'
    }
  ]

  let lastMessage = 'No fue posible desbloquear la cuenta.'

  for (const attempt of attempts) {
    const response = await fetchWithAuth(attempt.endpoint, {
      method: attempt.method,
    })

    if (response.ok) {
      return
    }

    if (response.status === 404) {
      continue
    }

    lastMessage = await extractErrorMessage(response, lastMessage)
    throw new Error(lastMessage)
  }

  throw new Error(lastMessage)
}