import { useState } from 'react'
import { CalendarClock, User, Stethoscope, Clock, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Appointment, EstadoCita, Patient } from '../data/types'
import { StatusBadge } from './StatusBadge'
import { useAppointmentFlow } from '../data/hooks/useAppointmentFlow'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentDetailModalProps {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  /** Necesario para handoff → módulo sesiones al marcar "Realizada" */
  patient: Patient | null
  onStatusChange?: (updated: Appointment) => void
}

// ─── Subcomponente: fila de detalle ──────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    </div>
  )
}

// ─── Botones de acción por estado ─────────────────────────────────────────────

// Transiciones permitidas según la máquina de estados del backend
const ALLOWED_TRANSITIONS: Partial<Record<EstadoCita, EstadoCita[]>> = {
  PROGRAMADA:  ['REALIZADA', 'CANCELADA', 'NO_ASISTIDA'],
  NO_ASISTIDA: ['PROGRAMADA'],
}

const ACTION_LABELS: Partial<Record<EstadoCita, string>> = {
  REALIZADA:   'Marcar Realizada',
  CANCELADA:   'Cancelar cita',
  NO_ASISTIDA: 'No asistió',
  PROGRAMADA:  'Reprogramar',
}

const ACTION_VARIANTS: Partial<Record<EstadoCita, 'default' | 'outline' | 'destructive'>> = {
  REALIZADA:   'default',
  CANCELADA:   'destructive',
  NO_ASISTIDA: 'outline',
  PROGRAMADA:  'outline',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  patient,
  onStatusChange,
}: AppointmentDetailModalProps) {
  const [notes, setNotes]           = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { isLoading, error, clearError, markAsRealizada, markStatus, cancel } =
    useAppointmentFlow()

  if (!appointment) return null

  const transitions = ALLOWED_TRANSITIONS[appointment.status] ?? []
  const isTerminal  = appointment.status === 'REALIZADA' || appointment.status === 'CANCELADA'

  const handleAction = async (nextStatus: EstadoCita) => {
    if (nextStatus === 'CANCELADA') {
      if (!confirmCancel) {
        setConfirmCancel(true)
        return
      }
      await cancel(appointment, notes || undefined)
      onStatusChange?.({ ...appointment, status: 'CANCELADA' })
      onClose()
      return
    }

    if (nextStatus === 'REALIZADA') {
      if (!patient) return
      const updated = await markAsRealizada(appointment, patient, notes || undefined)
      if (updated) {
        onStatusChange?.(updated)
        onClose()
      }
      return
    }

    const updated = await markStatus(appointment, nextStatus, notes || undefined)
    if (updated) {
      onStatusChange?.(updated)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setConfirmCancel(false)
          setNotes('')
          clearError()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Detalle de cita
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Estado actual */}
          <div className="flex items-center justify-between">
            <StatusBadge status={appointment.status} />
            <span className="text-xs text-muted-foreground">
              {appointment.date} · {appointment.startTime}–{appointment.endTime}
            </span>
          </div>

          {/* Datos */}
          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <DetailRow icon={User}        label="Paciente"      value={appointment.patientName} />
            <DetailRow icon={Stethoscope} label="Fisioterapeuta" value={appointment.therapistName} />
            <DetailRow icon={Clock}       label="Motivo"        value={appointment.motivoConsulta} />
            {appointment.observaciones && (
              <DetailRow icon={FileText} label="Observaciones" value={appointment.observaciones} />
            )}
          </div>

          {/* Acciones de cambio de estado */}
          {!isTerminal && transitions.length > 0 && (
            <div className="flex flex-col gap-2">
              {/* Notas opcionales antes de acción */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Notas de la atención (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones, tratamiento aplicado…"
                  rows={2}
                  disabled={isLoading}
                />
              </div>

              {/* Confirmación cancelar */}
              {confirmCancel && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <AlertTriangle className="size-4 shrink-0 text-destructive mt-px" />
                  <p className="text-xs text-destructive">
                    ¿Confirmar cancelación? Esta acción no se puede deshacer fácilmente.
                  </p>
                </div>
              )}

              {/* Botones de transición */}
              <div className="flex flex-wrap gap-2">
                {transitions.map((nextStatus) => (
                  <Button
                    key={nextStatus}
                    size="sm"
                    variant={
                      confirmCancel && nextStatus === 'CANCELADA'
                        ? 'destructive'
                        : (ACTION_VARIANTS[nextStatus] ?? 'outline')
                    }
                    disabled={isLoading}
                    onClick={() => handleAction(nextStatus)}
                    className={cn(
                      nextStatus === 'REALIZADA' && 'flex-1'
                    )}
                  >
                    {isLoading
                      ? <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      : confirmCancel && nextStatus === 'CANCELADA'
                        ? 'Sí, cancelar'
                        : ACTION_LABELS[nextStatus]}
                  </Button>
                ))}
                {confirmCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                    disabled={isLoading}
                  >
                    No, volver
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Estado terminal */}
          {isTerminal && (
            <p className="text-xs text-muted-foreground text-center py-1">
              Esta cita ya fue {appointment.status === 'REALIZADA' ? 'realizada' : 'cancelada'}.
            </p>
          )}

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
