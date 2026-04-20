import { useState, useCallback } from 'react'
import type { Appointment, Patient, ScheduleBlock } from '../data/types'
import { CalendarMaster } from '../components/CalendarMaster'
import { AppointmentQuickModal } from '../components/AppointmentQuickModal'
import { AppointmentDetailModal } from '../components/AppointmentDetailModal'
import { BlockScheduleModal } from '../components/BlockScheduleModal'
import { useCalendarView } from '../data/hooks/useCalendarView'
import { eliminarBloqueo } from '../data/services/availabilityService'
import { getPatientById } from '../data/services/patientSearchService'

// ─── Estado de modales ────────────────────────────────────────────────────────

interface ScheduleModalState {
  open:         boolean
  therapistId:  number
  date:         string
  time:         string
}

interface DetailModalState {
  open:        boolean
  appointment: Appointment | null
  patient:     Patient | null
}

interface BlockModalState {
  open:        boolean
  therapistId: number
  date:        string
}

const CLOSED_SCHEDULE: ScheduleModalState = { open: false, therapistId: 0, date: '', time: '' }
const CLOSED_DETAIL: DetailModalState     = { open: false, appointment: null, patient: null }
const CLOSED_BLOCK: BlockModalState       = { open: false, therapistId: 0, date: '' }

// ─── Componente ───────────────────────────────────────────────────────────────

export function AgendaPage() {
  const calendar = useCalendarView()

  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>(CLOSED_SCHEDULE)
  const [detailModal, setDetailModal]     = useState<DetailModalState>(CLOSED_DETAIL)
  const [blockModal, setBlockModal]       = useState<BlockModalState>(CLOSED_BLOCK)

  // ── Refetch cuando CalendarMaster cambia su rango visible ──
  const handleRangeChange = useCallback(
    (startDate: string, endDate: string) => {
      if (calendar.isCatalogReady && calendar.therapists.length > 0) {
        calendar.loadRange(startDate, endDate)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calendar.isCatalogReady, calendar.therapists.length, calendar.loadRange]
  )

  // ── Abrir modal de nueva cita desde slot vacío ──
  const handleScheduleRequest = useCallback(
    (therapistId: number, date: string, time: string) => {
      setScheduleModal({ open: true, therapistId, date, time })
    },
    []
  )

  // ── Cita creada exitosamente ──
  const handleAppointmentCreated = useCallback(
    (appt: Appointment) => {
      calendar.addAppointment(appt)
      setScheduleModal(CLOSED_SCHEDULE)
      calendar.reload()
    },
    [calendar]
  )

  // ── Clic en cita existente → cargar paciente + abrir detalle ──
  const handleAppointmentClick = useCallback(
    async (appt: Appointment) => {
      setDetailModal({ open: true, appointment: appt, patient: null })
      // Carga el paciente en paralelo — el modal muestra los datos de cita de inmediato
      const patient = await getPatientById(appt.patientId)
      setDetailModal((prev) =>
        prev.appointment?.id === appt.id ? { ...prev, patient } : prev
      )
    },
    []
  )

  // ── Estado de cita actualizado desde DetailModal ──
  const handleStatusChange = useCallback(
    (updated: Appointment) => {
      calendar.updateAppointment(updated)
    },
    [calendar]
  )

  // ── Abrir modal de bloqueo ──
  const handleBlockRequest = useCallback(() => {
    setBlockModal({ open: true, therapistId: 0, date: '' })
  }, [])

  // ── Bloqueo creado ──
  const handleBlockCreated = useCallback(
    (block: ScheduleBlock) => {
      calendar.addBlock(block)
      setBlockModal(CLOSED_BLOCK)
    },
    [calendar]
  )

  // ── Eliminar bloqueo ──
  const handleBlockRemove = useCallback(
    async (block: ScheduleBlock) => {
      try {
        await eliminarBloqueo(block.blockId)
        calendar.removeBlock(block.id)
      } catch {
        // Silencioso — el bloqueo permanece en UI si falla
      }
    },
    [calendar]
  )

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      {/* Error de carga */}
      {calendar.error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2">
          <p className="text-sm text-destructive">{calendar.error}</p>
          <button
            type="button"
            onClick={calendar.clearError}
            className="text-xs text-destructive underline outline-none focus-visible:ring-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Calendario principal */}
      <CalendarMaster
        therapists={calendar.therapists}
        appointments={calendar.appointments}
        blocks={calendar.blocks}
        isLoading={calendar.isLoading || !calendar.isCatalogReady}
        onScheduleRequest={handleScheduleRequest}
        onAppointmentClick={handleAppointmentClick}
        onBlockRequest={handleBlockRequest}
        onBlockRemove={handleBlockRemove}
        onRangeChange={handleRangeChange}
        className="flex-1 min-h-0"
      />

      {/* Modal: nueva cita */}
      <AppointmentQuickModal
        open={scheduleModal.open}
        onClose={() => setScheduleModal(CLOSED_SCHEDULE)}
        onSuccess={handleAppointmentCreated}
        therapists={calendar.therapists}
        initialDate={scheduleModal.date}
        initialTime={scheduleModal.time}
        initialTherapistId={scheduleModal.therapistId}
      />

      {/* Modal: detalle y cambio de estado */}
      <AppointmentDetailModal
        open={detailModal.open}
        onClose={() => setDetailModal(CLOSED_DETAIL)}
        appointment={detailModal.appointment}
        patient={detailModal.patient}
        onStatusChange={handleStatusChange}
      />

      {/* Modal: bloqueo de horario */}
      <BlockScheduleModal
        open={blockModal.open}
        onClose={() => setBlockModal(CLOSED_BLOCK)}
        onSuccess={handleBlockCreated}
        therapists={calendar.therapists}
        initialTherapistId={blockModal.therapistId}
        initialDate={blockModal.date}
      />
    </div>
  )
}
