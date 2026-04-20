import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type {
  SoapNote, Modalidad, Ejercicio, SessionStatus, TherapySession
} from '../data/types'
import { EMPTY_SOAP } from '../data/types'

interface SessionEditorState {
  soap:       SoapNote
  costo:      number
  templateId: string | null
  modalidades: Modalidad[]
  ejercicios:  Ejercicio[]
  status:     SessionStatus
  isDirty:    boolean
  isSaving:   boolean
  sessionId:  number | null

  setSoap:        (soap: SoapNote) => void
  setSoapField:   (field: keyof SoapNote, value: string) => void
  setCosto:       (costo: number) => void
  setTemplateId:  (id: string | null) => void
  setModalidades: (modalidades: Modalidad[]) => void
  setEjercicios:  (ejercicios: Ejercicio[]) => void
  setIsSaving:    (saving: boolean) => void
  lockSession:    (session: TherapySession) => void
  reset:          () => void
}

const SessionEditorContext = createContext<SessionEditorState | undefined>(undefined)

type ProviderProps = {
  children:   ReactNode
  initialCosto?: number
}

export function SessionEditorProvider({ children, initialCosto = 0 }: ProviderProps) {
  const [soap,       setSoap]       = useState<SoapNote>(EMPTY_SOAP)
  const [costo,      setCosto]      = useState(initialCosto)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [modalidades, setModalidades] = useState<Modalidad[]>([])
  const [ejercicios,  setEjercicios]  = useState<Ejercicio[]>([])
  const [status,     setStatus]     = useState<SessionStatus>('draft')
  const [isDirty,    setIsDirty]    = useState(false)
  const [isSaving,   setIsSaving]   = useState(false)
  const [sessionId,  setSessionId]  = useState<number | null>(null)

  const markDirty = useCallback(() => setIsDirty(true), [])

  const handleSetSoap = useCallback((next: SoapNote) => {
    setSoap(next)
    markDirty()
  }, [markDirty])

  const setSoapField = useCallback((field: keyof SoapNote, value: string) => {
    setSoap((prev) => ({ ...prev, [field]: value }))
    markDirty()
  }, [markDirty])

  const handleSetCosto = useCallback((next: number) => {
    setCosto(next)
    markDirty()
  }, [markDirty])

  const handleSetTemplateId = useCallback((id: string | null) => {
    setTemplateId(id)
    markDirty()
  }, [markDirty])

  const handleSetModalidades = useCallback((next: Modalidad[]) => {
    setModalidades(next)
    markDirty()
  }, [markDirty])

  const handleSetEjercicios = useCallback((next: Ejercicio[]) => {
    setEjercicios(next)
    markDirty()
  }, [markDirty])

  const lockSession = useCallback((session: TherapySession) => {
    setSoap(session.soap)
    setCosto(session.costo)
    setTemplateId(session.templateId)
    setModalidades(session.modalidades)
    setEjercicios(session.ejercicios)
    setStatus('locked')
    setSessionId(session.id ?? null)
    setIsDirty(false)
  }, [])

  const reset = useCallback(() => {
    setSoap(EMPTY_SOAP)
    setCosto(0)
    setTemplateId(null)
    setModalidades([])
    setEjercicios([])
    setStatus('draft')
    setIsDirty(false)
    setIsSaving(false)
    setSessionId(null)
  }, [])

  return (
    <SessionEditorContext.Provider
      value={{
        soap,
        costo,
        templateId,
        modalidades,
        ejercicios,
        status,
        isDirty,
        isSaving,
        sessionId,
        setSoap:        handleSetSoap,
        setSoapField,
        setCosto:       handleSetCosto,
        setTemplateId:  handleSetTemplateId,
        setModalidades: handleSetModalidades,
        setEjercicios:  handleSetEjercicios,
        setIsSaving,
        lockSession,
        reset,
      }}
    >
      {children}
    </SessionEditorContext.Provider>
  )
}

export function useSessionEditor(): SessionEditorState {
  const ctx = useContext(SessionEditorContext)
  if (!ctx) {
    throw new Error('useSessionEditor debe usarse dentro de SessionEditorProvider')
  }
  return ctx
}
