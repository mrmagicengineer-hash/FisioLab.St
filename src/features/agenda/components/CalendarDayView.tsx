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
  formatDayLabel,
  generateHourLabels,
  generateTimeSlots,
  isoToTime,
  parseLocalDate,
} from '../data/utils/timeUtils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarDayViewProps {
  date: string                                              // 'YYYY-MM-DD'
  therapists: Therapist[]
  appointments: Appointment[]
  blocks: ScheduleBlock[]
  dropTargetSlot?: { therapistId: number; time: string }
  conflictSlot?: { therapistId: number; time: string }
  onCellClick: (therapistId: number, date: string, time: string) => void
  onAppointmentClick: (appointment: Appointment) => void
  onBlockRemove?: (block: ScheduleBlock) => void
  className?: string
}

// ─── Subcomponente: cabecera de terapeuta ─────────────────────────────────────

function TherapistHeader({ therapist }: { therapist: Therapist }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 px-3 border-b border-border">
      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold select-none">
        {therapist.avatarInitials}
      </div>
      <p className="text-xs font-medium text-foreground truncate max-w-full text-center">
        {therapist.fullName}
      </p>
      <p className="text-[10px] text-muted-foreground truncate max-w-full text-center">
        {therapist.specialty}
      </p>
    </div>
  )
}

// ─── Subcomponente: columna de un terapeuta ───────────────────────────────────

interface TherapistColumnProps {
  therapist: Therapist
  date: string
  appointments: Appointment[]
  blocks: ScheduleBlock[]
  timeSlots: string[]
  dropTargetSlot?: { therapistId: number; time: string }
  conflictSlot?: { therapistId: number; time: string }
  onCellClick: (therapistId: number, date: string, time: string) => void
  onAppointmentClick: (appointment: Appointment) => void
  onBlockRemove?: (block: ScheduleBlock) => void
}

function TherapistColumn({
  therapist,
  date,
  appointments,
  blocks,
  timeSlots,
  dropTargetSlot,
  conflictSlot,
  onCellClick,
  onAppointmentClick,
  onBlockRemove,
}: TherapistColumnProps) {
  const colAppointments = appointments.filter(
    (a) => a.therapistId === therapist.id && a.date === date
  )

  const colBlocks = blocks.filter(
    (b) =>
      b.therapistId === therapist.id &&
      blockOverlapsDate(b.startDateTime, b.endDateTime, date)
  )

  return (
    <div className="relative border-l border-border" style={{ height: GRID_HEIGHT_PX }}>
      {/* Slots vacíos clickables — base layer */}
      {timeSlots.map((time) => {
        const isDropTarget =
          dropTargetSlot?.therapistId === therapist.id &&
          dropTargetSlot?.time === time
        const hasConflict =
          conflictSlot?.therapistId === therapist.id &&
          conflictSlot?.time === time

        return (
          <div
            key={time}
            className="absolute w-full border-t border-dashed border-border/30"
            style={{
              top: appointmentTop(time),
              height: HOUR_HEIGHT_PX / 2, // 30-min slot height
            }}
          >
            <EmptyCell
              time={time}
              therapistId={therapist.id}
              date={date}
              onClick={onCellClick}
              isDropTarget={isDropTarget}
              hasConflict={hasConflict}
            />
          </div>
        )
      })}

      {/* Bloques de horario — capa media */}
      {colBlocks.map((block) => {
        const startTime = isoToTime(block.startDateTime)
        const endTime   = isoToTime(block.endDateTime)
        const top    = appointmentTop(startTime)
        const height = appointmentHeight(startTime, endTime)

        return (
          <div
            key={block.id}
            className="absolute w-full px-0.5 z-10"
            style={{ top, height }}
          >
            <BlockCell
              block={block}
              onRemove={onBlockRemove}
              className="h-full"
            />
          </div>
        )
      })}

      {/* Citas — capa superior */}
      {colAppointments.map((appt) => {
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

export function CalendarDayView({
  date,
  therapists,
  appointments,
  blocks,
  dropTargetSlot,
  conflictSlot,
  onCellClick,
  onAppointmentClick,
  onBlockRemove,
  className,
}: CalendarDayViewProps) {
  const hourLabels = useMemo(generateHourLabels, [])
  const timeSlots  = useMemo(generateTimeSlots, [])
  const dayLabel   = useMemo(
    () => formatDayLabel(parseLocalDate(date)),
    [date]
  )

  if (therapists.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Sin fisioterapeutas para mostrar
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-background', className)}>
      {/* ── Cabecera: fecha + columnas de terapeuta ── */}
      <div
        className="grid sticky top-0 z-30 bg-background border-b border-border"
        style={{
          gridTemplateColumns: `60px repeat(${therapists.length}, 1fr)`,
        }}
      >
        {/* Celda esquina */}
        <div className="flex items-end justify-center pb-2 px-1 border-b border-border">
          <span className="text-[10px] text-muted-foreground font-medium">
            {dayLabel}
          </span>
        </div>

        {/* Cabecera por terapeuta */}
        {therapists.map((t) => (
          <TherapistHeader key={t.id} therapist={t} />
        ))}
      </div>

      {/* ── Cuerpo scrollable ── */}
      <div className="overflow-y-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `60px repeat(${therapists.length}, 1fr)`,
            height: GRID_HEIGHT_PX,
          }}
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

            {/* Líneas de hora */}
            {hourLabels.map((label, i) => (
              <div
                key={`line-${label}`}
                className="absolute w-full border-t border-border/50"
                style={{ top: i * HOUR_HEIGHT_PX }}
              />
            ))}
          </div>

          {/* Columna por terapeuta */}
          {therapists.map((therapist) => (
            <TherapistColumn
              key={therapist.id}
              therapist={therapist}
              date={date}
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
