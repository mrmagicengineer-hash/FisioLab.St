import { useActiveAppointment } from '../../context/ActiveAppointmentContext'
import type { Appointment, Patient } from '../types'

/**
 * Dispara la transición Agenda → Módulo de Sesiones de Terapia.
 *
 * Flujo:
 * 1. Persiste paciente + cita en ActiveAppointmentContext (memoria React)
 *    → draftSessionStorage se actualiza automáticamente via el context
 * 2. Despacha evento global 'agenda:session-handoff'
 *    → RoleDashboardPage escucha y cambia activeView a 'therapy-sessions'
 *
 * El módulo de Sesiones lee useActiveAppointment() al montar
 * y draftSessionStorage.load() como fallback si la conexión falló.
 */
export function useSessionHandoff() {
  const { setActiveAppointment } = useActiveAppointment()

  const handoff = (patient: Patient, appointment: Appointment) => {
    // 1. Persistencia (Context + sessionStorage)
    setActiveAppointment(patient, appointment)

    // 2. Navegación vía evento global — mismo patrón que auth:logout
    window.dispatchEvent(
      new CustomEvent('agenda:session-handoff', {
        detail: { patient, appointment },
      })
    )
  }

  return { handoff }
}
