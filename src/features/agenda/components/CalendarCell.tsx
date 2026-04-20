import { cn } from '@/lib/utils'
import type { Appointment, ScheduleBlock } from '../data/types'
import { StatusBadge, STATUS_BORDER_COLOR, STATUS_BG_COLOR } from './StatusBadge'

// ─── Cita normal ──────────────────────────────────────────────────────────────

interface AppointmentCellProps {
  appointment: Appointment
  onClick?: (appointment: Appointment) => void
  isDragging?: boolean
  isCompact?: boolean
  className?: string
}

export function AppointmentCell({
  appointment,
  onClick,
  isDragging = false,
  isCompact = false,
  className,
}: AppointmentCellProps) {
  const { patientName, motivoConsulta, startTime, endTime, status } = appointment

  return (
    <button
      type="button"
      onClick={() => onClick?.(appointment)}
      aria-label={`Cita: ${patientName} — ${motivoConsulta} — ${startTime}`}
      className={cn(
        // base
        'group w-full text-left rounded-md border-l-[3px] px-2 py-1.5 transition-all duration-150 outline-none',
        // estado visual
        STATUS_BORDER_COLOR[status],
        STATUS_BG_COLOR[status],
        // interacción
        'hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/50',
        // arrastre
        isDragging && 'opacity-60 shadow-lg scale-[1.02] cursor-grabbing',
        !isDragging && 'cursor-pointer',
        className
      )}
    >
      {/* Nombre paciente */}
      <p className="truncate text-xs font-semibold text-foreground leading-tight">
        {patientName}
      </p>

      {/* Tipo terapia + hora (oculto en modo compacto extremo) */}
      {!isCompact && (
        <p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
          {motivoConsulta} · {startTime}–{endTime}
        </p>
      )}

      {/* Badge de estado */}
      <div className="mt-1">
        <StatusBadge status={status} showDot={false} className="text-[9px] h-4 px-1.5" />
      </div>
    </button>
  )
}

// ─── Bloqueo de horario ───────────────────────────────────────────────────────

interface BlockCellProps {
  block: ScheduleBlock
  onRemove?: (block: ScheduleBlock) => void
  className?: string
}

export function BlockCell({ block, onRemove, className }: BlockCellProps) {
  return (
    <div
      role="img"
      aria-label={`Bloqueado: ${block.motivo}`}
      className={cn(
        'w-full rounded-md border-l-[3px] border-l-gray-400 px-2 py-1.5',
        'bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.04)_4px,rgba(0,0,0,0.04)_8px)]',
        'bg-gray-100 dark:bg-gray-800/50',
        className
      )}
    >
      <p className="truncate text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
        🔒 {block.motivo}
      </p>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(block)}
          aria-label="Eliminar bloqueo"
          className="mt-0.5 text-[9px] text-gray-400 hover:text-red-500 transition-colors outline-none focus-visible:underline"
        >
          Eliminar
        </button>
      )}
    </div>
  )
}

// ─── Celda vacía (slot disponible) ────────────────────────────────────────────

interface EmptyCellProps {
  time: string
  therapistId: number
  date: string
  onClick?: (therapistId: number, date: string, time: string) => void
  isDropTarget?: boolean
  hasConflict?: boolean
  className?: string
}

export function EmptyCell({
  time,
  therapistId,
  date,
  onClick,
  isDropTarget = false,
  hasConflict = false,
  className,
}: EmptyCellProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(therapistId, date, time)}
      aria-label={`Slot disponible ${time}`}
      className={cn(
        'w-full h-full min-h-[40px] rounded-md border border-dashed transition-all duration-150 outline-none',
        // estado normal
        !isDropTarget && !hasConflict && 'border-border/40 hover:border-primary/50 hover:bg-primary/5',
        // drop válido
        isDropTarget && !hasConflict && 'border-primary bg-primary/10 border-solid',
        // drop con conflicto
        hasConflict && 'border-destructive bg-destructive/10 border-solid',
        className
      )}
    >
      <span className="sr-only">Agendar cita a las {time}</span>
    </button>
  )
}
