import { ClinicalStatusBar, type VitalSigns } from '@/features/dashboard/components/patient-record/ClinicalStatusBar'

type Props = {
  vitals?: VitalSigns
}

export function VitalSignsQuickView({ vitals }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        Signos vitales
      </p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <ClinicalStatusBar vitals={vitals} />
      </div>
    </div>
  )
}
