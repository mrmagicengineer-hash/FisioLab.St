import { useState } from 'react'
import type { Appointment, EstadoCita, Patient } from '../types'
import {
  actualizarEstadoCita,
  atenderCita,
  AppointmentApiError,
} from '../services/appointmentService'
import { useSessionHandoff } from './useSessionHandoff'

interface FlowState {
  isLoading:  boolean
  error:      string | null
}

/**
 * Gestiona cambios de estado de citas.
 *
 * Caso especial: markAsRealizada dispara useSessionHandoff automáticamente
 * → redirige al módulo de Sesiones con datos del paciente pre-cargados.
 */
export function useAppointmentFlow() {
  const [state, setState] = useState<FlowState>({ isLoading: false, error: null })
  const { handoff } = useSessionHandoff()

  const run = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setState({ isLoading: true, error: null })
    try {
      const result = await fn()
      setState({ isLoading: false, error: null })
      return result
    } catch (err) {
      const message =
        err instanceof AppointmentApiError
          ? err.message
          : 'Error al actualizar la cita.'
      setState({ isLoading: false, error: message })
      return null
    }
  }

  /**
   * Marca la cita como "Realizada" y dispara handoff → módulo de Sesiones.
   * Requiere el objeto Patient completo para pre-llenar la sesión.
   */
  const markAsRealizada = async (
    appointment: Appointment,
    patient: Patient,
    _observaciones?: string
  ): Promise<Appointment | null> => {
    const updated = await run(() => atenderCita(appointment.citaId))
    if (updated) {
      handoff(patient, updated)
    }
    return updated
  }

  const markStatus = async (
    appointment: Appointment,
    estado: Exclude<EstadoCita, 'REALIZADA'>,
    observaciones?: string
  ): Promise<Appointment | null> =>
    run(() => actualizarEstadoCita({ citaId: appointment.citaId, estado, observaciones }))

  const cancel = async (
    appointment: Appointment,
    observaciones?: string
  ): Promise<void> => {
    await run(() =>
      actualizarEstadoCita({ citaId: appointment.citaId, estado: 'CANCELADA', observaciones })
    )
  }

  const clearError = () => setState((prev) => ({ ...prev, error: null }))

  return {
    isLoading:      state.isLoading,
    error:          state.error,
    clearError,
    markAsRealizada,
    markStatus,
    cancel,
  }
}
