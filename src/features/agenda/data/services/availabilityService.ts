import { fetchWithAuth } from '../../../auth/data/services/apiClient'
import type { ActiveUserDto } from '../../../dashboard/data/services/activeUsersService'
import type {
  BloqueoResponse,
  CrearBloqueoPayload,
  ScheduleBlock,
  Therapist,
} from '../types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBloqueoToBlock(b: BloqueoResponse): ScheduleBlock {
  return {
    id:            String(b.id),
    blockId:       b.id,
    therapistId:   b.profesionalId,
    therapistName: b.profesionalNombre,
    startDateTime: b.fechaHoraInicio,
    endDateTime:   b.fechaHoraFin,
    motivo:        b.motivo,
    descripcion:   b.descripcion,
  }
}

function mapUserToTherapist(user: ActiveUserDto): Therapist {
  const nameParts  = `${user.name} ${user.lastName}`.trim()
  const first = user.name.trim().charAt(0).toUpperCase()
  const last  = user.lastName.trim().charAt(0).toUpperCase()
  return {
    id:             user.id,
    fullName:       nameParts,
    specialty:      user.especialidad,
    avatarInitials: `${first}${last}`,
  }
}

// ─── Disponibilidad ───────────────────────────────────────────────────────────

/**
 * GET /citas/disponibilidad — valida que el profesional esté libre en el rango.
 * Devuelve true si está disponible, false si hay solapamiento.
 */
export async function checkDisponibilidad(
  profesionalId: number,
  desde: string,   // ISO datetime: '2025-04-20T10:00:00'
  hasta: string    // ISO datetime: '2025-04-20T11:00:00'
): Promise<boolean> {
  const params = new URLSearchParams({
    profesionalId: String(profesionalId),
    desde,
    hasta,
  })
  const response = await fetchWithAuth(
    `${API_BASE_URL}/citas/disponibilidad?${params.toString()}`
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as { disponible: boolean }
  return data.disponible
}

// ─── Bloqueos ─────────────────────────────────────────────────────────────────

/**
 * GET /agenda/bloqueos
 * ADMIN: ve todos. FISIO: solo los propios (backend filtra por ownership).
 */
export async function getBloqueos(
  desde?: string,
  hasta?: string,
  profesionalId?: number
): Promise<ScheduleBlock[]> {
  const params = new URLSearchParams()
  if (desde)          params.set('desde', desde)
  if (hasta)          params.set('hasta', hasta)
  if (profesionalId)  params.set('profesionalId', String(profesionalId))

  const response = await fetchWithAuth(
    `${API_BASE_URL}/agenda/bloqueos${params.size ? `?${params.toString()}` : ''}`
  )
  if (!response.ok) return []
  const data = (await response.json()) as BloqueoResponse[]
  return data.map(mapBloqueoToBlock)
}

/**
 * POST /agenda/bloqueos — solo ADMINISTRADOR.
 */
export async function crearBloqueo(
  payload: CrearBloqueoPayload
): Promise<ScheduleBlock> {
  const response = await fetchWithAuth(`${API_BASE_URL}/agenda/bloqueos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error('No se pudo crear el bloqueo de horario.')
  }
  const data = (await response.json()) as BloqueoResponse
  return mapBloqueoToBlock(data)
}

/**
 * DELETE /agenda/bloqueos/{id} — solo ADMINISTRADOR.
 */
export async function eliminarBloqueo(blockId: number): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/agenda/bloqueos/${blockId}`,
    { method: 'DELETE' }
  )
  if (!response.ok) {
    throw new Error('No se pudo eliminar el bloqueo.')
  }
}

// ─── Terapeutas (para ADMIN — lista de fisioterapeutas activos) ───────────────

/**
 * Obtiene lista de fisioterapeutas activos filtrando /admin/usuarios/activos.
 * Solo ADMINISTRADOR tiene acceso a este endpoint.
 * FISIOTERAPEUTA usa su propio userId directamente.
 */
export async function getFisioterapeutas(): Promise<Therapist[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/usuarios/activos`)
  if (!response.ok) return []
  const users = (await response.json()) as ActiveUserDto[]
  return users
    .filter((u) => u.activo && u.rol?.toUpperCase().includes('FISIO'))
    .map(mapUserToTherapist)
}

/**
 * Construye un Therapist a partir del usuario autenticado (FISIOTERAPEUTA).
 * Usado cuando el rol es FISIO — no necesita llamada API.
 */
export function buildSelfTherapist(
  userId: number,
  fullName: string,
  specialty?: string | null
): Therapist {
  const parts   = fullName.trim().split(' ')
  const initials = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
  return {
    id:             userId,
    fullName,
    specialty:      specialty ?? null,
    avatarInitials: initials,
  }
}
