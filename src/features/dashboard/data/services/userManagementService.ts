import { fetchWithAuth } from '../../../auth/data/services/apiClient'

export type CreateUserRole = 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO'

export type CreateUserRequest = {
  cedula: string
  email: string
  name: string
  lastName: string
  password: string
  rol: CreateUserRole
  especialidad?: string
  tipoProfesional?: string
  codigoRegistro?: string
}

export type CreatedUserDto = {
  id: number
  cedula: string
  email: string
  name: string
  lastName: string
  rol: CreateUserRole
  activo: boolean
  especialidad: string | null
  tipoProfesional: string | null
  codigoRegistro: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const errorPayload = (await response.json()) as {
      message?: string
      error?: string
      detail?: string
    }

    return errorPayload.message ?? errorPayload.error ?? errorPayload.detail ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function normalizePayload(payload: CreateUserRequest): CreateUserRequest {
  return {
    ...payload,
    cedula: payload.cedula.trim(),
    email: payload.email.trim(),
    name: payload.name.trim(),
    lastName: payload.lastName.trim(),
    password: payload.password.trim(),
    especialidad: payload.especialidad?.trim() || undefined,
    tipoProfesional: payload.tipoProfesional?.trim() || undefined,
    codigoRegistro: payload.codigoRegistro?.trim() || undefined
  }
}

export async function createUser(payload: CreateUserRequest): Promise<CreatedUserDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizePayload(payload))
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'No fue posible crear el usuario.')
    throw new Error(message)
  }

  return (await response.json()) as CreatedUserDto
}

export async function getUsers(): Promise<CreatedUserDto[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/usuarios`, {
    method: 'GET'
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'No fue posible cargar los usuarios.')
    throw new Error(message)
  }

  return (await response.json()) as CreatedUserDto[]
}
