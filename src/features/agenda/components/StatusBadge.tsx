import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '../data/types'

const statusBadgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap select-none',
  {
    variants: {
      status: {
        PROGRAMADA:  'border-blue-300   bg-blue-100   text-blue-800   dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        REALIZADA:   'border-green-300  bg-green-100  text-green-800  dark:border-green-700 dark:bg-green-900/40 dark:text-green-300',
        CANCELADA:   'border-red-300    bg-red-100    text-red-800    dark:border-red-700 dark:bg-red-900/40 dark:text-red-300',
        NO_ASISTIDA: 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        // bloqueos usan la misma celda pero no tienen StatusBadge propio
        bloqueado:   'border-gray-300   bg-gray-100   text-gray-500   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
    },
    defaultVariants: {
      status: 'PROGRAMADA',
    },
  }
)

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROGRAMADA:  'Programada',
  REALIZADA:   'Realizada',
  CANCELADA:   'Cancelada',
  NO_ASISTIDA: 'No asistida',
}

const STATUS_DOT: Record<AppointmentStatus, string> = {
  PROGRAMADA:  'bg-blue-500',
  REALIZADA:   'bg-green-500',
  CANCELADA:   'bg-red-500',
  NO_ASISTIDA: 'bg-orange-500',
}

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: AppointmentStatus
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {showDot && (
        <span
          className={cn('size-1.5 rounded-full shrink-0', STATUS_DOT[status])}
          aria-hidden="true"
        />
      )}
      {STATUS_LABELS[status]}
    </span>
  )
}

/**
 * Solo el color de borde izquierdo para CalendarCell.
 * Exportado para reusar en otros componentes de calendar.
 */
export const STATUS_BORDER_COLOR: Record<AppointmentStatus, string> = {
  PROGRAMADA:  'border-l-blue-500',
  REALIZADA:   'border-l-green-500',
  CANCELADA:   'border-l-red-400',
  NO_ASISTIDA: 'border-l-orange-400',
}

export const STATUS_BG_COLOR: Record<AppointmentStatus, string> = {
  PROGRAMADA:  'bg-blue-50   dark:bg-blue-950/30',
  REALIZADA:   'bg-green-50  dark:bg-green-950/30',
  CANCELADA:   'bg-red-50    dark:bg-red-950/30',
  NO_ASISTIDA: 'bg-orange-50 dark:bg-orange-950/30',
}

/** Colores para chips del mes view (inline, no usa cva) */
export function chipColorByStatus(status: AppointmentStatus): string {
  switch (status) {
    case 'PROGRAMADA':  return 'bg-blue-100  text-blue-800  dark:bg-blue-900/40 dark:text-blue-300'
    case 'REALIZADA':   return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    case 'CANCELADA':   return 'bg-red-100   text-red-800   dark:bg-red-900/40 dark:text-red-300'
    case 'NO_ASISTIDA': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  }
}
