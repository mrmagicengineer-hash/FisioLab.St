import { useEffect } from 'react'
import { useActiveAppointment } from '@/features/agenda/context/ActiveAppointmentContext'
import { draftSessionStorage } from '@/features/agenda/data/storage/draftSessionStorage'
import { EpisodeGateGuard } from '@/features/dashboard/components/episode/EpisodeGateGuard'
import { SessionEditorProvider } from '../context/SessionEditorContext'
import { SessionEditorPanel } from '../components/layout/SessionEditorPanel'
import { SessionSidebar } from '../components/layout/SessionSidebar'
import { useSessionAutosave } from '../data/hooks/useSessionAutosave'
import { useTherapySession } from '../data/hooks/useTherapySession'
import { useSessionProgress } from '../data/hooks/useSessionProgress'

// ─── Inner component (needs editor context) ───────────────────────────────────

function SessionContent() {
  const { patient, appointment } = useActiveAppointment()

  // Autosave activo mientras la sesión está en borrador
  useSessionAutosave({
    citaId:    appointment?.citaId ?? 0,
    patientId: patient?.id ?? 0,
  })

  const { saveDraft, signAndSave, isSigning } = useTherapySession(patient!, appointment!)

  const progress = useSessionProgress({ 
    episodioId: appointment?.episodioId,
    planId: appointment?.planId 
  })

  if (!patient || !appointment) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <SessionEditorPanel
        patient={patient}
        appointment={appointment}
        progress={progress}
        onSaveDraft={saveDraft}
        onSignAndSave={signAndSave}
        isSigning={isSigning}
      />
      <SessionSidebar patient={patient} />
    </div>
  )
}

// ─── Root scene ───────────────────────────────────────────────────────────────

export function TherapySessionPage() {
  const { patient, appointment } = useActiveAppointment()

  // Fallback: si el context se vació (refresh), intentar restaurar desde sessionStorage
  const { setActiveAppointment } = useActiveAppointment()

  useEffect(() => {
    if (!patient || !appointment) {
      const draft = draftSessionStorage.load()
      if (draft) {
        setActiveAppointment(draft.patient, draft.appointment)
      }
    }
  }, [patient, appointment, setActiveAppointment])

  if (!patient || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
        <svg
          className="mb-4 h-12 w-12 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h10M7 13h6" strokeLinecap="round" />
        </svg>
        <p className="text-base font-semibold text-slate-600">No hay sesión activa</p>
        <p className="mt-1 text-sm text-slate-400">
          Marca una cita como "Realizada" desde la Agenda para iniciar una sesión.
        </p>
      </div>
    )
  }

  function handleNavigateToRecord() {
    if (patient) {
      window.dispatchEvent(
        new CustomEvent('therapy:navigate-to-record', { detail: { patientId: patient.id } })
      )
    }
  }

  return (
    <EpisodeGateGuard patient={patient} onNavigateToRecord={handleNavigateToRecord}>
      <SessionEditorProvider>
        <SessionContent />
      </SessionEditorProvider>
    </EpisodeGateGuard>
  )
}
