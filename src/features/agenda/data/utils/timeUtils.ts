// Utilidades de tiempo para el módulo de Agenda
// Usa Date nativo — sin dependencias externas

export const HOUR_HEIGHT_PX = 64   // px por hora en la grilla
export const DAY_START_HOUR = 7    // 07:00
export const DAY_END_HOUR   = 20   // 20:00
export const SLOT_MINUTES   = 30   // granularidad de slots vacíos

/** 'HH:mm' → minutos totales desde medianoche */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

/** minutos → 'HH:mm' */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Convierte minutos de duración a píxeles en la grilla */
export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT_PX
}

/**
 * Calcula `top` CSS en px para una cita dado su startTime.
 * Relativo al inicio del día (DAY_START_HOUR).
 */
export function appointmentTop(startTime: string): number {
  const startMin = timeToMinutes(startTime)
  const offsetMin = startMin - DAY_START_HOUR * 60
  return minutesToPx(Math.max(0, offsetMin))
}

/**
 * Calcula `height` CSS en px para una cita dado su rango.
 * Mínimo 24px para que sea siempre clicable.
 */
export function appointmentHeight(startTime: string, endTime: string): number {
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime)
  return Math.max(24, minutesToPx(duration))
}

/** Altura total de la grilla en px */
export const GRID_HEIGHT_PX = minutesToPx(
  (DAY_END_HOUR - DAY_START_HOUR) * 60
)

/** Lista de labels de hora para la columna izquierda */
export function generateHourLabels(): string[] {
  const labels: string[] = []
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    labels.push(`${String(h).padStart(2, '0')}:00`)
  }
  return labels
}

/** Lista de slots vacíos de SLOT_MINUTES para una columna */
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (
    let m = DAY_START_HOUR * 60;
    m < DAY_END_HOUR * 60;
    m += SLOT_MINUTES
  ) {
    slots.push(minutesToTime(m))
  }
  return slots
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

/** 'YYYY-MM-DD' → Date (medianoche local) */
export function parseLocalDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d)
}

/** Date → 'YYYY-MM-DD' */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Date → etiqueta legible: 'lun 14 abr' */
export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** Añade N días a una fecha */
export function addDays(date: Date, n: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + n)
  return result
}

/** Retorna los 7 días de la semana que contiene `date` (lunes a domingo) */
export function getWeekDays(date: Date): Date[] {
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = addDays(date, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Extrae 'HH:mm' de un ISO datetime string */
export function isoToTime(isoDatetime: string): string {
  const d = new Date(isoDatetime)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Extrae 'YYYY-MM-DD' de un ISO datetime string */
export function isoToDate(isoDatetime: string): string {
  return isoDatetime.split('T')[0]
}

/** Verdadero si un bloqueo ISO range solapa con una fecha 'YYYY-MM-DD' */
export function blockOverlapsDate(
  startIso: string,
  endIso: string,
  date: string
): boolean {
  const blockStart = isoToDate(startIso)
  const blockEnd   = isoToDate(endIso)
  return blockStart <= date && date <= blockEnd
}
