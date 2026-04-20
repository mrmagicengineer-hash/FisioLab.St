import { EvolutionNotesHistory } from '../sidebar/EvolutionNotesHistory'
import { VitalSignsQuickView } from '../sidebar/VitalSignsQuickView'
import type { VitalSigns } from '@/features/dashboard/components/patient-record/ClinicalStatusBar'
import type { Patient } from '@/features/agenda/data/types'
import { useActiveAppointment } from '@/features/agenda/context/ActiveAppointmentContext'

type Props = {
  patient: Patient
  vitals?: VitalSigns
}

export function SessionSidebar({ patient, vitals }: Props) {
  const { appointment } = useActiveAppointment()

  return (
    <aside className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-6 overflow-y-auto pb-4">
      {/* Patient chip */}
      <div className="rounded-xl border border-[#1A5276]/15 bg-[#1A5276]/[0.04] px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1A5276]/60">
          Paciente en atención
        </p>
        <p className="mt-1 font-semibold text-slate-800">{patient.fullName}</p>
        <p className="text-xs text-slate-500">
          {patient.documentType} {patient.documentNumber}
        </p>
      </div>

      <VitalSignsQuickView vitals={vitals} />

      <div className="h-px bg-slate-100" />

      <EvolutionNotesHistory 
        episodioId={appointment?.episodioId} 
        planId={appointment?.planId} 
      />
    </aside>
  )
}
