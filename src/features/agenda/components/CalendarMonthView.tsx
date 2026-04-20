import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Appointment } from '../data/types'
import { StatusBadge, chipColorByStatus } from './StatusBadge'
import {
  addDays,
  formatDateKey,
  parseLocalDate,
} from '../data/utils/timeUtils'

// ─── Constantes ───────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MAX_VISIBLE_CHIPS = 3

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarMonthViewProps {
  /** Cualquier fecha dentro del mes deseado */
  referenceDate: string             // 'YYYY-MM-DD'
  appointments: Appointment[]
  /** Opcional: filtrar por terapeuta */
  therapistId?: number
  onDayClick: (date: string) => void
  onAppointmentClick: (appointment: Appointment) => void
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera todas las celdas del grid de mes (lunes-inicio, hasta 6 semanas) */
function buildMonthGrid(referenceDate: string): Date[] {
  const ref   = parseLocalDate(referenceDate)
  const year  = ref.getFullYear()
  const month = ref.getMonth()

  // Primer día del mes
  const firstOfMonth = new Date(year, month, 1)
  // Día de semana (0=dom → convertir a lunes-inicio)
  const dow = firstOfMonth.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const gridStart = addDays(firstOfMonth, mondayOffset)

  // Siempre 42 celdas (6 semanas)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

function isSameMonth(date: Date, referenceDate: string): boolean {
  const ref = parseLocalDate(referenceDate)
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth()    === ref.getMonth()
  )
}

// ─── Subcomponente: chip de cita ──────────────────────────────────────────────

interface AppointmentChipProps {
  appointment: Appointment
  onClick: (appointment: Appointment) => void
}

function AppointmentChip({ appointment, onClick }: AppointmentChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick(appointment)
      }}
      aria-label={`Cita: ${appointment.patientName}`}
      className={cn(
        'w-full text-left truncate rounded px-1 py-px text-[10px] font-medium transition-opacity hover:opacity-80',
        chipColorByStatus(appointment.status)
      )}
    >
      {appointment.startTime} {appointment.patientName}
    </button>
  )
}


// ─── Subcomponente: celda de día ──────────────────────────────────────────────

interface DayCellProps {
  date: Date
  isCurrentMonth: boolean
  appointments: Appointment[]
  onDayClick: (date: string) => void
  onAppointmentClick: (appointment: Appointment) => void
}

function DayCell({
  date,
  isCurrentMonth,
  appointments,
  onDayClick,
  onAppointmentClick,
}: DayCellProps) {
  const dateKey     = formatDateKey(date)
  const today       = formatDateKey(new Date())
  const isToday     = dateKey === today
  const dayNumber   = date.getDate()

  const sorted = [...appointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )
  const visible  = sorted.slice(0, MAX_VISIBLE_CHIPS)
  const overflow = sorted.length - MAX_VISIBLE_CHIPS

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onDayClick(dateKey)}
      onKeyDown={(e) => e.key === 'Enter' && onDayClick(dateKey)}
      aria-label={`${dateKey}, ${appointments.length} citas`}
      className={cn(
        'min-h-24 p-1.5 flex flex-col gap-0.5 cursor-pointer border-b border-r border-border',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'transition-colors duration-100',
        !isCurrentMonth && 'bg-muted/20',
      )}
    >
      {/* Número del día */}
      <div className="flex items-center justify-end">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs font-medium select-none',
            isToday
              ? 'bg-primary text-primary-foreground'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground/50'
          )}
        >
          {dayNumber}
        </span>
      </div>

      {/* Chips de citas */}
      <div className="flex flex-col gap-px flex-1">
        {visible.map((appt) => (
          <AppointmentChip
            key={appt.id}
            appointment={appt}
            onClick={onAppointmentClick}
          />
        ))}

        {overflow > 0 && (
          <span className="px-1 text-[10px] text-muted-foreground font-medium">
            +{overflow} más
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CalendarMonthView({
  referenceDate,
  appointments,
  therapistId,
  onDayClick,
  onAppointmentClick,
  className,
}: CalendarMonthViewProps) {
  const grid = useMemo(() => buildMonthGrid(referenceDate), [referenceDate])

  const filteredAppointments = useMemo(
    () =>
      therapistId
        ? appointments.filter((a) => a.therapistId === therapistId)
        : appointments,
    [appointments, therapistId]
  )

  /** Map dateKey → Appointment[] para O(1) lookup por celda */
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const appt of filteredAppointments) {
      const existing = map.get(appt.date) ?? []
      map.set(appt.date, [...existing, appt])
    }
    return map
  }, [filteredAppointments])

  const ref = parseLocalDate(referenceDate)
  const monthLabel = ref.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-background', className)}>
      {/* ── Cabecera mes ── */}
      <div className="px-4 py-2 border-b border-border">
        <span className="text-sm font-semibold text-foreground capitalize">
          {monthLabel}
        </span>
      </div>

      {/* ── Labels días de semana ── */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1.5 text-center text-[11px] font-medium text-muted-foreground select-none"
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Grid 6 semanas × 7 días ── */}
      <div className="grid grid-cols-7 flex-1">
        {grid.map((day) => {
          const dateKey = formatDateKey(day)
          return (
            <DayCell
              key={dateKey}
              date={day}
              isCurrentMonth={isSameMonth(day, referenceDate)}
              appointments={appointmentsByDate.get(dateKey) ?? []}
              onDayClick={onDayClick}
              onAppointmentClick={onAppointmentClick}
            />
          )
        })}
      </div>

      {/* ── Leyenda de estados ── */}
      <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-border">
        {(['PROGRAMADA', 'REALIZADA', 'CANCELADA', 'NO_ASISTIDA'] as const).map(
          (status) => (
            <StatusBadge key={status} status={status} showDot className="text-[10px]" />
          )
        )}
      </div>
    </div>
  )
}
