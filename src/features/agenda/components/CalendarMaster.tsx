import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, LayoutGrid, Plus, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Appointment, CalendarView, ScheduleBlock, Therapist } from '../data/types'
import { CalendarDayView } from './CalendarDayView'
import { CalendarWeekView } from './CalendarWeekView'
import { CalendarMonthView } from './CalendarMonthView'
import {
  addDays,
  formatDateKey,
  formatDayLabel,
  getWeekDays,
  parseLocalDate,
} from '../data/utils/timeUtils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarMasterProps {
  therapists: Therapist[]
  appointments: Appointment[]
  blocks: ScheduleBlock[]
  isLoading?: boolean
  /** Abre modal de nueva cita para un slot específico */
  onScheduleRequest: (therapistId: number, date: string, time: string) => void
  /** Abre modal de detalle/edición de cita */
  onAppointmentClick: (appointment: Appointment) => void
  /** Abre modal de bloqueo de horario */
  onBlockRequest: () => void
  onBlockRemove?: (block: ScheduleBlock) => void
  /** Cambia de vista a Día en la fecha seleccionada (desde MonthView) */
  onDateChange?: (date: string) => void
  /**
   * Notifica el rango visible actual.
   * AgendaPage lo usa para saber cuándo refetchear appointments/blocks.
   */
  onRangeChange?: (startDate: string, endDate: string) => void
  className?: string
}

// ─── Subcomponente: tabs de vista ─────────────────────────────────────────────

const VIEW_OPTIONS: { value: CalendarView; label: string; Icon: React.ElementType }[] = [
  { value: 'day',   label: 'Día',    Icon: CalendarDays  },
  { value: 'week',  label: 'Semana', Icon: CalendarRange },
  { value: 'month', label: 'Mes',    Icon: LayoutGrid    },
]

interface ViewTabsProps {
  current: CalendarView
  onChange: (v: CalendarView) => void
}

function ViewTabs({ current, onChange }: ViewTabsProps) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {VIEW_OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={current === value}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring/50',
            current === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Subcomponente: selector de terapeuta ─────────────────────────────────────

interface TherapistFilterProps {
  therapists: Therapist[]
  selectedIds: number[]
  mode: 'multi' | 'single'
  onChange: (ids: number[]) => void
}

function TherapistFilter({ therapists, selectedIds, mode, onChange }: TherapistFilterProps) {
  const toggle = (id: number) => {
    if (mode === 'single') {
      onChange([id])
      return
    }
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((s) => s !== id)
      onChange(next.length > 0 ? next : [id]) // mínimo 1
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {therapists.map((t) => {
        const selected = selectedIds.includes(t.id)
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            aria-pressed={selected}
            title={t.fullName}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring/50',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-current/20 text-[9px] font-bold">
              {t.avatarInitials}
            </span>
            <span className="hidden sm:inline">{t.fullName.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Helper: label de navegación ──────────────────────────────────────────────

function buildNavLabel(view: CalendarView, date: string): string {
  const d = parseLocalDate(date)

  if (view === 'day') {
    return formatDayLabel(d)
  }

  if (view === 'week') {
    const days = getWeekDays(d)
    const start = days[0]
    const end   = days[6]
    const startLabel = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    const endLabel   = end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startLabel} – ${endLabel}`
  }

  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

function navigateDate(view: CalendarView, date: string, direction: -1 | 1): string {
  const d = parseLocalDate(date)
  if (view === 'day')   return formatDateKey(addDays(d, direction))
  if (view === 'week')  return formatDateKey(addDays(d, direction * 7))
  // month
  const next = new Date(d.getFullYear(), d.getMonth() + direction, 1)
  return formatDateKey(next)
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CalendarMaster({
  therapists,
  appointments,
  blocks,
  isLoading = false,
  onScheduleRequest,
  onAppointmentClick,
  onBlockRequest,
  onBlockRemove,
  onDateChange,
  onRangeChange,
  className,
}: CalendarMasterProps) {
  const [view, setView]           = useState<CalendarView>('day')
  const [currentDate, setCurrentDate] = useState(formatDateKey(new Date()))
  const [selectedTherapistIds, setSelectedTherapistIds] = useState<number[]>(
    () => therapists.slice(0, 3).map((t) => t.id)
  )

  // Sync selection when therapists load asynchronously (initial state captures empty array)
  useEffect(() => {
    setSelectedTherapistIds((prev) => {
      if (prev.length > 0) return prev
      return therapists.slice(0, 3).map((t) => t.id)
    })
  }, [therapists])

  const navLabel = useMemo(
    () => buildNavLabel(view, currentDate),
    [view, currentDate]
  )

  // Notifica rango visible al padre para refetch
  useEffect(() => {
    if (!onRangeChange) return
    const d = parseLocalDate(currentDate)
    if (view === 'day') {
      onRangeChange(currentDate, currentDate)
    } else if (view === 'week') {
      const days = getWeekDays(d)
      onRangeChange(formatDateKey(days[0]), formatDateKey(days[6]))
    } else {
      // month: primer día del mes → último
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      onRangeChange(formatDateKey(start), formatDateKey(end))
    }
  }, [view, currentDate, onRangeChange])

  const goToday = () => setCurrentDate(formatDateKey(new Date()))

  const navigate = (dir: -1 | 1) =>
    setCurrentDate((prev) => navigateDate(view, prev, dir))

  const handleViewChange = (v: CalendarView) => {
    setView(v)
    // En week/month, forzar un solo terapeuta si no hay ninguno seleccionado
    if (v !== 'day' && selectedTherapistIds.length === 0 && therapists.length > 0) {
      setSelectedTherapistIds([therapists[0].id])
    }
  }

  const handleMonthDayClick = useCallback(
    (date: string) => {
      setCurrentDate(date)
      setView('day')
      onDateChange?.(date)
    },
    [onDateChange]
  )

  // Terapeutas activos según vista
  const visibleTherapists = useMemo(
    () => therapists.filter((t) => selectedTherapistIds.includes(t.id)),
    [therapists, selectedTherapistIds]
  )

  const primaryTherapist = visibleTherapists[0] ?? therapists[0]

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Navegación de fecha */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <button
            type="button"
            onClick={goToday}
            className={cn(
              'min-w-[160px] px-3 py-1.5 text-sm font-medium text-center',
              'rounded-md border border-border hover:bg-muted transition-colors outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring/50 capitalize'
            )}
          >
            {navLabel}
          </button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(1)}
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Botón "Hoy" */}
        <Button variant="outline" size="sm" onClick={goToday}>
          Hoy
        </Button>

        {/* Separador */}
        <div className="flex-1" />

        {/* Selector de vista */}
        <ViewTabs current={view} onChange={handleViewChange} />

        {/* Acciones */}
        <Button size="sm" onClick={() => onScheduleRequest(0, currentDate, '08:00')}>
          <Plus className="size-4" />
          Nueva cita
        </Button>

        <Button variant="outline" size="sm" onClick={onBlockRequest}>
          <Lock className="size-4" />
          Bloquear
        </Button>
      </div>

      {/* ── Filtro de terapeutas ── */}
      {therapists.length > 1 && (
        <TherapistFilter
          therapists={therapists}
          selectedIds={selectedTherapistIds}
          mode={view === 'day' ? 'multi' : 'single'}
          onChange={setSelectedTherapistIds}
        />
      )}

      {/* ── Skeleton de carga ── */}
      {isLoading && (
        <div className="flex items-center justify-center h-48 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Cargando agenda…
          </div>
        </div>
      )}

      {/* ── Vista activa ── */}
      {!isLoading && view === 'day' && (
        <CalendarDayView
          date={currentDate}
          therapists={visibleTherapists}
          appointments={appointments}
          blocks={blocks}
          onCellClick={onScheduleRequest}
          onAppointmentClick={onAppointmentClick}
          onBlockRemove={onBlockRemove}
        />
      )}

      {!isLoading && view === 'week' && primaryTherapist && (
        <CalendarWeekView
          referenceDate={currentDate}
          therapist={primaryTherapist}
          appointments={appointments}
          blocks={blocks}
          onCellClick={onScheduleRequest}
          onAppointmentClick={onAppointmentClick}
          onBlockRemove={onBlockRemove}
        />
      )}

      {!isLoading && view === 'month' && (
        <CalendarMonthView
          referenceDate={currentDate}
          appointments={appointments}
          therapistId={primaryTherapist?.id}
          onDayClick={handleMonthDayClick}
          onAppointmentClick={onAppointmentClick}
        />
      )}
    </div>
  )
}
