import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useSessionEditor } from '../../context/SessionEditorContext'
import {
  atenderCita,
  updateNotaSOAP,
  firmarSesion,
  sendBillingHandoff,
  TherapySessionApiError,
} from '../services/therapySessionService'
import { therapyDraftStorage } from '../storage/therapyDraftStorage'
import type { Appointment, Patient } from '../../../agenda/data/types'

type State = {
  isSubmitting: boolean
  isSigning:    boolean
  error:        string | null
}

export function useTherapySession(patient: Patient, appointment: Appointment) {
  const editor = useSessionEditor()
  const [state, setState] = useState<State>({
    isSubmitting: false,
    isSigning:    false,
    error:        null,
  })

  const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), [])

  const saveDraft = useCallback(() => {
    therapyDraftStorage.save({
      citaId:      appointment.citaId,
      patientId:   patient.id,
      soap:        editor.soap,
      costo:       editor.costo,
      templateId:  editor.templateId,
      modalidades: editor.modalidades,
      ejercicios:  editor.ejercicios,
    })
    toast.success('Borrador guardado')
  }, [appointment, patient, editor])

  const signAndSave = useCallback(async () => {
    setState({ isSubmitting: true, isSigning: true, error: null })

    try {
      // 1. Determinar el ID de la sesión
      let sesionId = editor.sessionId || appointment.sesionGeneradaId || null;
      
      // Si no tenemos ID de sesión, intentamos crearla atendiendo la cita
      if (!sesionId) {
        if (appointment.status !== 'PROGRAMADA') {
            throw new TherapySessionApiError(`No se puede crear una sesión para una cita en estado ${appointment.status}`, 400);
        }
        const session = await atenderCita(appointment.citaId)
        sesionId = session.id
      }

      // 2. Guardar el borrador del SOAP
      await updateNotaSOAP(sesionId, {
        subjetivo: editor.soap.subjetivo,
        objetivo:  editor.soap.objetivo,
        analisis:  editor.soap.analisis,
        plan:      editor.soap.plan,
      })

      // 3. Firmar la sesión
      const signed = await firmarSesion(sesionId)

      // 4. (Opcional) Enviar facturación
      await sendBillingHandoff({
        citaId:     appointment.citaId,
        pacienteId: patient.id,
        costo:      editor.costo,
        sessionId:  signed.id,
      })

      therapyDraftStorage.clear()
      
      // Adaptar el nuevo modelo al modelo antiguo del context
      editor.lockSession({
        id: signed.id,
        citaId: appointment.citaId,
        pacienteId: patient.id,
        profesionalId: appointment.therapistId,
        soap: {
          subjetivo: signed.notaSOAP.subjetivo || '',
          objetivo:  signed.notaSOAP.objetivo || '',
          analisis:  signed.notaSOAP.analisis || '',
          plan:      signed.notaSOAP.plan || ''
        },
        costo: editor.costo,
        templateId: editor.templateId,
        modalidades: editor.modalidades,
        ejercicios: editor.ejercicios,
        status: 'locked'
      })

      toast.success('Sesión firmada y guardada correctamente')
    } catch (err) {
      const message =
        err instanceof TherapySessionApiError
          ? err.message
          : 'Error al guardar la sesión. Intente nuevamente.'
      setState((p) => ({ ...p, error: message }))
      toast.error(message)
    } finally {
      setState((p) => ({ ...p, isSubmitting: false, isSigning: false }))
    }
  }, [appointment, patient, editor])

  return {
    isSubmitting: state.isSubmitting,
    isSigning:    state.isSigning,
    error:        state.error,
    clearError,
    saveDraft,
    signAndSave,
  }
}
