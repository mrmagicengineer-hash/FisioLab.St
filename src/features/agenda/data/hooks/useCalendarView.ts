import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import type { Appointment, ScheduleBlock, Therapist } from '../types'
import { getAgendaView, mapCalendarEvents, AppointmentApiError } from '../services/appointmentService'
import { getFisioterapeutas, buildSelfTherapist } from '../services/availabilityService'

interface CalendarViewState {
  appointments:   Appointment[]
  blocks:         ScheduleBlock[]
  therapists:     Therapist[]
  isLoading:      boolean
  isCatalogReady: boolean
  error:          string | null
}

/**
 * Gestiona datos de la vista de calendario.
 *
 * Comportamiento por rol:
 * - FISIOTERAPEUTA: therapists = [self], agenda/view filtra por su profesionalId
 * - ADMINISTRADOR:  therapists = lista de fisioterapeutas activos, puede ver todos
 */
export function useCalendarView() {
  const { role, userId } = useAuth()
  const isFisio = role === 'FISIOTERAPEUTA'

  const [state, setState] = useState<CalendarViewState>({
    appointments:   [],
    blocks:         [],
    therapists:     [],
    isLoading:      false,
    isCatalogReady: false,
    error:          null,
  })

  // ── Carga catálogos al montar ──
  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      try {
        if (isFisio) {
          if (userId === null) {
            // FISIO sin userId: no podemos filtrar agenda ni construir el perfil.
            // Mostramos error en lugar de llamar al endpoint de admin (daría 403).
            if (!cancelled) {
              setState((prev) => ({
                ...prev,
                isCatalogReady: true,
                error: 'No se pudo identificar tu usuario. Cierra sesión e inicia de nuevo.',
              }))
            }
            return
          }
          const self = buildSelfTherapist(userId, 'Mi agenda')
          if (!cancelled) {
            setState((prev) => ({ ...prev, therapists: [self], isCatalogReady: true }))
          }
        } else {
          // ADMIN: carga la lista de fisioterapeutas
          const therapists = await getFisioterapeutas()
          if (!cancelled) {
            setState((prev) => ({ ...prev, therapists, isCatalogReady: true }))
          }
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isCatalogReady: true,
            error: 'No se pudo cargar la lista de profesionales.',
          }))
        }
      }
    }

    loadCatalog()
    return () => { cancelled = true }
  }, [isFisio, userId])

  const lastRangeRef = useRef<{ start: string; end: string } | null>(null)

  // ── Fetch unificado agenda/view para el rango visible ──
  const loadRange = useCallback(
    async (startDate: string, endDate: string) => {
      lastRangeRef.current = { start: startDate, end: endDate }
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        // FISIO: filtra siempre por su propio profesionalId
        // ADMIN: sin filtro (ve todos) o filtra si selecciona uno
        const profesionalId = isFisio && userId !== null ? userId : undefined

        const events = await getAgendaView(startDate, endDate, profesionalId)
        const { appointments, blocks } = mapCalendarEvents(events, profesionalId)

        setState((prev) => ({
          ...prev,
          appointments,
          blocks,
          isLoading: false,
        }))
      } catch (err) {
        const message =
          err instanceof AppointmentApiError
            ? err.message || 'Error al cargar la agenda.'
            : 'Error al cargar la agenda.'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
      }
    },
    [isFisio, userId]
  )

  // ── Mutadores optimistas ──────────────────────────────────────────────────

  const addAppointment = useCallback((appt: Appointment) => {
    setState((prev) => ({ ...prev, appointments: [...prev.appointments, appt] }))
  }, [])

  const updateAppointment = useCallback((updated: Appointment) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === updated.id ? updated : a
      ),
    }))
  }, [])

  const removeAppointment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }))
  }, [])

  const addBlock = useCallback((block: ScheduleBlock) => {
    setState((prev) => ({ ...prev, blocks: [...prev.blocks, block] }))
  }, [])

  const removeBlock = useCallback((blockId: string) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const reload = useCallback(() => {
    if (lastRangeRef.current) {
      loadRange(lastRangeRef.current.start, lastRangeRef.current.end)
    }
  }, [loadRange])

  return {
    ...state,
    isFisio,
    currentUserId: userId,
    loadRange,
    reload,
    addAppointment,
    updateAppointment,
    removeAppointment,
    addBlock,
    removeBlock,
    clearError,
  }
}
