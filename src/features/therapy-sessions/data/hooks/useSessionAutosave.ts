import { useEffect, useRef } from 'react'
import { useSessionEditor } from '../../context/SessionEditorContext'
import { therapyDraftStorage } from '../storage/therapyDraftStorage'

const AUTOSAVE_INTERVAL_MS = 30_000

type Options = {
  citaId:    number
  patientId: number
}

export function useSessionAutosave({ citaId, patientId }: Options) {
  const { soap, costo, templateId, modalidades, ejercicios, isDirty, status, setIsSaving } =
    useSessionEditor()

  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  useEffect(() => {
    if (status === 'locked') return

    const save = () => {
      if (!isDirtyRef.current) return
      setIsSaving(true)
      therapyDraftStorage.save({ citaId, patientId, soap, costo, templateId, modalidades, ejercicios })
      setTimeout(() => setIsSaving(false), 400)
    }

    const id = setInterval(save, AUTOSAVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [citaId, patientId, soap, costo, templateId, modalidades, ejercicios, status, setIsSaving])

  // Guardar antes de cerrar la ventana
  useEffect(() => {
    if (status === 'locked') return

    const handler = () => {
      if (isDirtyRef.current) {
        therapyDraftStorage.save({ citaId, patientId, soap, costo, templateId, modalidades, ejercicios })
      }
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [citaId, patientId, soap, costo, templateId, modalidades, ejercicios, status])
}
