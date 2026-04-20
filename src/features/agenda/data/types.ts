// Tipos del módulo Gestión de Agenda y Citas
// Alineados con la API: /api/v1/citas, /api/v1/agenda/bloqueos

// ─── Enums (exactos del backend) ──────────────────────────────────────────────

export type EstadoCita =
  | 'PROGRAMADA'
  | 'REALIZADA'
  | 'CANCELADA'
  | 'NO_ASISTIDA'

/** Alias para compatibilidad interna */
export type AppointmentStatus = EstadoCita

export type MotivoBloqueo =
  | 'VACACIONES'
  | 'PERMISO'
  | 'CAPACITACION'
  | 'FERIADO'
  | 'OTRO'

export type CalendarView = 'day' | 'week' | 'month'

// ─── DTOs del backend ─────────────────────────────────────────────────────────

/** CitaResponse — respuesta de POST /citas, GET /citas/{id}, PATCH /citas/{id}/estado */
export type CitaResponse = {
  id: number
  pacienteId: number
  pacienteNombre: string
  profesionalId: number
  profesionalNombre: string
  creadoPorId: number
  fechaHoraInicio: string   // ISO LocalDateTime: '2026-04-20T09:00:00'
  fechaHoraFin: string      // ISO LocalDateTime
  estado: EstadoCita
  motivoConsulta: string
  codigoCie10Sugerido?: string | null
  observaciones?: string | null
  episodioClinicoId?: number | null
  planTratamientoId?: number | null
  sesionGeneradaId?: number | null
  diagnostico?: string | null
  planResumen?: string | null
  fechaCreacion: string
  fechaModificacion: string
}

/** BloqueoResponse — respuesta de POST /agenda/bloqueos, GET /agenda/bloqueos */
export type BloqueoResponse = {
  id: number
  profesionalId: number
  profesionalNombre: string
  creadoPorId: number
  fechaHoraInicio: string
  fechaHoraFin: string
  motivo: MotivoBloqueo
  descripcion?: string | null
  fechaCreacion: string
}

/**
 * CalendarEventResponse — respuesta de GET /citas/agenda/view
 * Formato FullCalendar con tipo discriminante.
 */
export type CalendarEventResponse = {
  id: string                   // 'cita-42' | 'bloqueo-7'
  title: string
  start: string                // ISO datetime
  end: string                  // ISO datetime
  color: string
  tipo: 'CITA' | 'BLOQUEO'
  extendedProps: CalendarEventCitaProps | CalendarEventBloqueoProps
}

export type CalendarEventCitaProps = {
  estado: EstadoCita
  pacienteId: number
  profesionalId?: number
  profesionalNombre: string
  citaId: number
  motivoConsulta?: string
  episodioId?: string
  planId?: string
  diagnostico?: string
  planResumen?: string
}

export type CalendarEventBloqueoProps = {
  motivo: MotivoBloqueo
  profesionalId: number
  descripcion?: string | null
  bloqueoId?: number
}

// ─── Payloads de creación / actualización ────────────────────────────────────

export type CrearCitaPayload = {
  pacienteId: number
  profesionalId: number
  fechaHoraInicio: string     // 'YYYY-MM-DDTHH:mm:00'
  fechaHoraFin: string        // 'YYYY-MM-DDTHH:mm:00'
  motivoConsulta: string
  codigoCie10Sugerido?: string
  observaciones?: string
  episodioClinicoId?: number
  planTratamientoId?: number
}

export type ActualizarEstadoCitaPayload = {
  citaId: number
  estado: EstadoCita
  observaciones?: string
}

export type CrearBloqueoPayload = {
  profesionalId: number
  fechaHoraInicio: string
  fechaHoraFin: string
  motivo: MotivoBloqueo
  descripcion?: string
}

// ─── Tipos internos del frontend ──────────────────────────────────────────────

/** Vista interna de una cita, mapeada desde CitaResponse o CalendarEventResponse */
export type Appointment = {
  id: string                  // string del citaId para keys React
  citaId: number              // ID numérico para llamadas API
  patientId: number
  patientName: string
  therapistId: number
  therapistName: string
  date: string                // 'YYYY-MM-DD'
  startTime: string           // 'HH:mm'
  endTime: string             // 'HH:mm'
  status: EstadoCita
  motivoConsulta: string
  observaciones?: string | null
  sesionGeneradaId?: number | null
  episodioId?: string
  planId?: string
  diagnostico?: string
  planResumen?: string
}

/** Vista interna de un bloqueo */
export type ScheduleBlock = {
  id: string                  // string del id
  blockId: number
  therapistId: number
  therapistName: string
  startDateTime: string       // ISO datetime completo
  endDateTime: string
  motivo: MotivoBloqueo
  descripcion?: string | null
}

/** Terapeuta (extraído de ActiveUserDto) */
export type Therapist = {
  id: number
  fullName: string
  specialty: string | null
  avatarInitials: string
}

/** Paciente para búsqueda — alineado con Módulo 3 */
export type Patient = {
  id: number
  fullName: string
  documentNumber: string
  documentType: string
  phone?: string
  email?: string
  numeroHcl?: string
  estadoArchivo?: 'ACTIVO' | 'PASIVO' | string
}

// ─── Conflicto (validación frontend pre-submit) ───────────────────────────────

export type ConflictItem = {
  type: 'appointment' | 'block'
  id: string
  description: string
  startTime: string
  endTime: string
}

export type ConflictResult = {
  hasConflict: boolean
  conflicts: ConflictItem[]
}

// ─── Borrador sesión (sessionStorage) ────────────────────────────────────────

export type SessionDraft = {
  patient: Patient
  appointment: Appointment
  savedAt: string
}

// ─── Resultados paginados ─────────────────────────────────────────────────────

export type PatientSearchResult = {
  items: Patient[]
  total: number
}

// ─── Contexto de Agendamiento ─────────────────────────────────────────────────

export interface ContextoAgendamientoPlan {
  id: number
  tipoTratamiento: string
  sesionesRealizadas: number
  sesionesPlanificadas: number
  sesionesRestantes?: number
  costoSesion?: number
  estado: string
}

export interface ContextoAgendamientoEpisodio {
  id: number
  numeroEpisodio?: string
  diagnostico: string
  estado: string
  planes: ContextoAgendamientoPlan[]
}

export interface ContextoAgendamientoResponse {
  episodios: ContextoAgendamientoEpisodio[]
}

// ─── Tipos crudos de la API (para mapping en usePatientContext) ───────────────

export interface ApiContextoPlan {
  planId: number
  objetivoGeneral: string
  sesionesPlanificadas: number
  sesionesRealizadas: number
  sesionesRestantes: number
  costoSesion: number
  estadoPlan: string
}

export interface ApiContextoEpisodio {
  episodioId: number
  numeroEpisodio?: string
  motivoConsulta: string
  estadoEpisodio: string
  planes: ApiContextoPlan[]
}

export interface ApiContextoAgendamientoResponse {
  pacienteId?: number
  pacienteNombre?: string
  episodiosAbiertos: ApiContextoEpisodio[]
}

// ─── Respuesta de PATCH /citas/{id}/atender ───────────────────────────────────

export interface SesionTerapiaResponse {
  id: number
  citaId: number
  planTratamientoId?: number | null
  pacienteId: number
  pacienteNombre: string
  episodioClinicoId?: number | null
  profesionalId: number
  profesionalNombre: string
  costoSesion?: number
  numeroSesionEnPlan?: number
  fechaHoraInicio: string
  estado: string
}

