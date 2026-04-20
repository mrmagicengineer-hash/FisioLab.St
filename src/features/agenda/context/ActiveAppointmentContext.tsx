import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Appointment, Patient } from '../data/types'
import { draftSessionStorage } from '../data/storage/draftSessionStorage'

interface ActiveAppointmentState {
  patient: Patient | null
  appointment: Appointment | null
  /**
   * Activa el "paciente en atención" y persiste borrador en sessionStorage.
   * Llamar antes de navegar al módulo de Sesiones.
   */
  setActiveAppointment: (patient: Patient, appointment: Appointment) => void
  /**
   * Limpia el estado activo y el borrador guardado.
   * Llamar al completar o cancelar la atención.
   */
  clearActive: () => void
}

const ActiveAppointmentContext = createContext<ActiveAppointmentState | undefined>(
  undefined
)

export function ActiveAppointmentProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  const setActiveAppointment = (p: Patient, appt: Appointment) => {
    setPatient(p)
    setAppointment(appt)
    draftSessionStorage.save({ patient: p, appointment: appt })
  }

  const clearActive = () => {
    setPatient(null)
    setAppointment(null)
    draftSessionStorage.clear()
  }

  return (
    <ActiveAppointmentContext.Provider
      value={{ patient, appointment, setActiveAppointment, clearActive }}
    >
      {children}
    </ActiveAppointmentContext.Provider>
  )
}

export function useActiveAppointment(): ActiveAppointmentState {
  const context = useContext(ActiveAppointmentContext)
  if (context === undefined) {
    throw new Error(
      'useActiveAppointment debe usarse dentro de ActiveAppointmentProvider'
    )
  }
  return context
}
