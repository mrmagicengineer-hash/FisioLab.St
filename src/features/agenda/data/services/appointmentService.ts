import { fetchWithAuth } from '../../../auth/data/services/apiClient'
import type {
  Appointment,
  ActualizarEstadoCitaPayload,
  CalendarEventResponse,
  CalendarEventCitaProps,
  CalendarEventBloqueoProps,
  CitaResponse,
  CrearCitaPayload,
  EstadoCita,
  ScheduleBlock,
  SesionTerapiaResponse,
} from '../types'
import { isoToDate, isoToTime } from '../utils/timeUtils'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// ─── Error ────────────────────────────────────────────────────────────────────

export class AppointmentApiError extends Error {
  status: number
  code: 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'FORBIDDEN' | 'UNKNOWN'

  constructor(
    message: string,
    status: number,
    code: AppointmentApiError['code']
  ) {
    super(message)
    this.status = status
    this.code = code
  }
}

function inferCode(status: number): AppointmentApiError['code'] {
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status === 403) return 'FORBIDDEN'
  return 'UNKNOWN'
}

async function parseError(response: Response): Promise<AppointmentApiError> {
  let rawMessage = ''
  try {
    const payload = (await response.json()) as Record<string, unknown>
    const value = payload.message ?? payload.error ?? payload.detail
    rawMessage = typeof value === 'string' ? value : ''
  } catch { /* ignore */ }
  return new AppointmentApiError(
    rawMessage || 'Error al procesar la cita.',
    response.status,
    inferCode(response.status)
  )
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapCitaResponseToAppointment(cita: CitaResponse): Appointment {
  return {
    id:             String(cita.id),
    citaId:         cita.id,
    patientId:      cita.pacienteId,
    patientName:    cita.pacienteNombre,
    therapistId:    cita.profesionalId,
    therapistName:  cita.profesionalNombre,
    date:           isoToDate(cita.fechaHoraInicio),
    startTime:      isoToTime(cita.fechaHoraInicio),
    endTime:        isoToTime(cita.fechaHoraFin),
    status:         cita.estado,
    motivoConsulta: cita.motivoConsulta,
    observaciones:  cita.observaciones,
    sesionGeneradaId: cita.sesionGeneradaId,
    episodioId:     cita.episodioClinicoId ? String(cita.episodioClinicoId) : undefined,
    planId:         cita.planTratamientoId ? String(cita.planTratamientoId) : undefined,
    diagnostico:    cita.diagnostico ?? undefined,
    planResumen:    cita.planResumen ?? undefined,
  }
}

/**
 * Mapea CalendarEventResponse (FullCalendar) a tipos internos.
 * Retorna `{ appointments, blocks }` separados por tipo.
 */
export function mapCalendarEvents(
  events: CalendarEventResponse[],
  fallbackProfesionalId?: number
): {
  appointments: Appointment[]
  blocks: ScheduleBlock[]
} {
  const appointments: Appointment[] = []
  const blocks: ScheduleBlock[] = []

  for (const event of events) {
    if (event.tipo === 'CITA') {
      const props = event.extendedProps as CalendarEventCitaProps
      // Fallback: extrae citaId desde 'cita-42' si extendedProps no lo incluye
      const numericCitaId = props.citaId ?? Number(event.id.replace('cita-', ''))
      appointments.push({
        id:             String(numericCitaId),
        citaId:         numericCitaId,
        patientId:      props.pacienteId,
        patientName:    event.title.split('—')[0].trim(),
        therapistId:    props.profesionalId ?? fallbackProfesionalId ?? 0,
        therapistName:  props.profesionalNombre,
        date:           isoToDate(event.start),
        startTime:      isoToTime(event.start),
        endTime:        isoToTime(event.end),
        status:         props.estado,
        motivoConsulta: props.motivoConsulta ?? event.title.split('—')[1]?.trim() ?? '',
        episodioId:     props.episodioId,
        planId:         props.planId,
        diagnostico:    props.diagnostico,
        planResumen:    props.planResumen,
      })
    } else {
      const props = event.extendedProps as CalendarEventBloqueoProps
      // Extrae ID numérico desde 'bloqueo-7' → 7
      const numericId = props.bloqueoId ?? Number(event.id.replace('bloqueo-', ''))
      blocks.push({
        id:           String(numericId),
        blockId:      numericId,
        therapistId:  props.profesionalId,
        therapistName: event.title.split('—')[1]?.trim() ?? '',
        startDateTime: event.start,
        endDateTime:   event.end,
        motivo:        props.motivo,
        descripcion:   props.descripcion,
      })
    }
  }

  return { appointments, blocks }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * GET /citas/agenda/view — endpoint unificado FullCalendar.
 * Retorna citas + bloqueos mezclados para el rango y profesional.
 */
export async function getAgendaView(
  desde: string,
  hasta: string,
  profesionalId?: number
): Promise<CalendarEventResponse[]> {
  const params = new URLSearchParams({
    desde: desde.length === 10 ? `${desde}T00:00:00` : desde,
    hasta: hasta.length === 10  ? `${hasta}T23:59:59` : hasta,
  })
  if (profesionalId !== undefined) {
    params.set('profesionalId', String(profesionalId))
  }

  const response = await fetchWithAuth(
    `${API_BASE_URL}/citas/agenda/view?${params.toString()}`
  )
  if (!response.ok) throw await parseError(response)
  return response.json() as Promise<CalendarEventResponse[]>
}

export async function getCitaById(id: number): Promise<Appointment> {
  const response = await fetchWithAuth(`${API_BASE_URL}/citas/${id}`)
  if (!response.ok) throw await parseError(response)
  const cita = (await response.json()) as CitaResponse
  return mapCitaResponseToAppointment(cita)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * POST /citas — crea cita con validación de disponibilidad en el servidor.
 * FISIOTERAPEUTA: el backend valida que profesionalId == usuario autenticado.
 */
export async function crearCita(payload: CrearCitaPayload): Promise<Appointment> {
  const response = await fetchWithAuth(`${API_BASE_URL}/citas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await parseError(response)
  const cita = (await response.json()) as CitaResponse
  return mapCitaResponseToAppointment(cita)
}

/**
 * PATCH /citas/{id}/estado — cambia estado de la cita.
 * Al pasar a REALIZADA, el backend publica CitaRealizadaEvent → Módulo 7.
 */
export async function actualizarEstadoCita(
  payload: ActualizarEstadoCitaPayload
): Promise<Appointment> {
  const { citaId, ...body } = payload
  const response = await fetchWithAuth(
    `${API_BASE_URL}/citas/${citaId}/estado`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado: body.estado, observaciones: body.observaciones ?? null }),
    }
  )
  if (!response.ok) throw await parseError(response)
  const cita = (await response.json()) as CitaResponse
  return mapCitaResponseToAppointment(cita)
}

// ─── Lista de citas (ADMIN: todas, FISIO: solo las suyas) ────────────────────

export async function listarCitas(
  desde?: string,
  hasta?: string
): Promise<Appointment[]> {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)

  const response = await fetchWithAuth(
    `${API_BASE_URL}/citas${params.size ? `?${params.toString()}` : ''}`
  )
  if (!response.ok) throw await parseError(response)
  const citas = (await response.json()) as CitaResponse[]
  return citas.map(mapCitaResponseToAppointment)
}

/**
 * PATCH /citas/{id}/atender — trigger principal Módulo 7.
 * Marca cita PROGRAMADA → REALIZADA + crea SesionTerapia + NotaSOAP en borrador.
 * Responde con SesionTerapiaResponse (no CitaResponse); se hace fetch de la cita
 * para devolver un Appointment completo.
 */
export async function atenderCita(citaId: number): Promise<Appointment> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/citas/${citaId}/atender`,
    { method: 'PATCH' }
  )
  if (!response.ok) throw await parseError(response)
  const sesion = (await response.json()) as SesionTerapiaResponse
  // SesionTerapiaResponse no incluye fechaHoraFin ni motivoConsulta completos;
  // se obtiene la cita actualizada para devolver un Appointment canónico.
  return getCitaById(sesion.citaId)
}

// ─── Helper: construye EstadoCita a partir de EstadoCita ─────────────────────

export function isTerminalStatus(status: EstadoCita): boolean {
  return status === 'REALIZADA' || status === 'CANCELADA'
}
