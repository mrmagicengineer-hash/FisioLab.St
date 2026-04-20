import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Appointment, ScheduleBlock, Therapist } from '../data/types'
import { AppointmentCell, BlockCell, EmptyCell } from './CalendarCell'
import {
  GRID_HEIGHT_PX,
  HOUR_HEIGHT_PX,
  appointmentHeight,
  appointmentTop,
  blockOverlapsDate,
  formatDateKey,
  formatDayLabel,
  generateHourLabels,
  generateTimeSlots,
  getWeekDays,
  isoToTime,
  parseLocalDate,
} from '../data/utils/timeUtils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarWeekViewProps {
  /** Cualquier fecha dentro de la semana deseada */
  referenceDate: string                                          // 'YYYY-MM-DD'
  /** Vista semana muestra un solo terapeuta (columnas = días) */
  therapist: Therapist
  appointments: Appointment[]
  blocks: ScheduleBlock[]
  dropTargetSlot?: { date: string; time: string }
  conflictSlot?: { date: string; time: string }
  onCellClick: (therapistId: number, date: string, time: string) => void
  onAppointmentClick: (appointment: Appointment) => void
  onBlockRemove?: (block: ScheduleBlock) => void
  className?: string
}

// ─── Subcomponente: columna de un día ─────────────────────────────────────────

interface DayColumnProps {
  date: Date
  therapist: Therapist
  appointments: Appointment[]
  blocks: ScheduleBlock[]
  timeSlots: string[]
  dropTargetSlot?: { date: string; time: string }
  conflictSlot?: { date: string; time: string }
  onCellClick: (therapistId: number, date: string, time: string) => void
  onAppointmentClick: (appointment: Appointment) => void
  onBlockRemove?: (block: ScheduleBlock) => void
}

function DayColumn({
  date,
  therapist,
  appointments,
  blocks,
  timeSlots,
  dropTargetSlot,
  conflictSlot,
  onCellClick,
  onAppointmentClick,
  onBlockRemove,
}: DayColumnProps) {
  const dateKey = formatDateKey(date)
  const today   = formatDateKey(new Date())
  const isToday = dateKey === today

  const dayAppts = appointments.filter(
    (a) => a.therapistId === therapist.id && a.date === dateKey
  )

  const dayBlocks = blocks.filter(
    (b) =>
      b.therapistId === therapist.id &&
      blockOverlapsDate(b.startDateTime, b.endDateTime, dateKey)
  )

  return (
    <div
      className={cn(
        'relative border-l border-border',
        isToday && 'bg-primary/[0.02]'
      )}
      style={{ height: GRID_HEIGHT_PX }}
    >
      {/* Slots vacíos */}
      {timeSlots.map((time) => {
        const isDropTarget =
          dropTargetSlot?.date === dateKey && dropTargetSlot?.time === time
        const hasConflict =
          conflictSlot?.date === dateKey && conflictSlot?.time === time

        return (
          <div
            key={time}
            className="absolute w-full border-t border-dashed border-border/30"
            style={{ top: appointmentTop(time), height: HOUR_HEIGHT_PX / 2 }}
          >
            <EmptyCell
              time={time}
              therapistId={therapist.id}
              date={dateKey}
              onClick={onCellClick}
              isDropTarget={isDropTarget}
              hasConflict={hasConflict}
            />
          </div>
        )
      })}

      {/* Bloqueos */}
      {dayBlocks.map((block) => {
        const startTime = isoToTime(block.startDateTime)
        const endTime   = isoToTime(block.endDateTime)
        return (
          <div
            key={block.id}
            className="absolute w-full px-0.5 z-10"
            style={{
              top:    appointmentTop(startTime),
              height: appointmentHeight(startTime, endTime),
            }}
          >
            <BlockCell block={block} onRemove={onBlockRemove} className="h-full" />
          </div>
        )
      })}

      {/* Citas */}
      {dayAppts.map((appt) => {
        const top    = appointmentTop(appt.startTime)
        const height = appointmentHeight(appt.startTime, appt.endTime)
        return (
          <div
            key={appt.id}
            className="absolute w-full px-0.5 z-20"
            style={{ top, height }}
          >
            <AppointmentCell
              appointment={appt}
              onClick={onAppointmentClick}
              isCompact={height < 48}
              className="h-full"
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CalendarWeekView({
  referenceDate,
  therapist,
  appointments,
  blocks,
  dropTargetSlot,
  conflictSlot,
  onCellClick,
  onAppointmentClick,
  onBlockRemove,
  className,
}: CalendarWeekViewProps) {
  const hourLabels = useMemo(generateHourLabels, [])
  const timeSlots  = useMemo(generateTimeSlots, [])

  const weekDays = useMemo(
    () => getWeekDays(parseLocalDate(referenceDate)),
    [referenceDate]
  )

  const today = formatDateKey(new Date())

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-background', className)}>
      {/* ── Cabecera: 7 días ── */}
      <div
        className="grid sticky top-0 z-30 bg-background border-b border-border"
        style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
      >
        {/* Esquina: nombre terapeuta */}
        <div className="flex items-center justify-center p-2 border-b border-border">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold select-none">
            {therapist.avatarInitials}
          </div>
        </div>

        {weekDays.map((day) => {
          const key     = formatDateKey(day)
          const isToday = key === today
          const label   = formatDayLabel(day)

          return (
            <div
              key={key}
              className={cn(
                'flex flex-col items-center justify-end py-2 border-b border-border border-l',
                isToday && 'bg-primary/5'
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium',
                  isToday ? 'text-primary' : 'text-foreground'
                )}
              >
                {label}
              </span>
              {isToday && (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Cuerpo scrollable ── */}
      <div className="overflow-y-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: '60px repeat(7, 1fr)', height: GRID_HEIGHT_PX }}
        >
          {/* Columna de horas */}
          <div className="relative" style={{ height: GRID_HEIGHT_PX }}>
            {hourLabels.map((label, i) => (
              <div
                key={label}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: i * HOUR_HEIGHT_PX - 8 }}
              >
                <span className="text-[10px] text-muted-foreground font-mono select-none">
                  {i === 0 ? '' : label}
                </span>
              </div>
            ))}
            {hourLabels.map((label, i) => (
              <div
                key={`line-${label}`}
                className="absolute w-full border-t border-border/50"
                style={{ top: i * HOUR_HEIGHT_PX }}
              />
            ))}
          </div>

          {/* Columna por día */}
          {weekDays.map((day) => (
            <DayColumn
              key={formatDateKey(day)}
              date={day}
              therapist={therapist}
              appointments={appointments}
              blocks={blocks}
              timeSlots={timeSlots}
              dropTargetSlot={dropTargetSlot}
              conflictSlot={conflictSlot}
              onCellClick={onCellClick}
              onAppointmentClick={onAppointmentClick}
              onBlockRemove={onBlockRemove}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
