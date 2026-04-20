import { Zap, Loader2, Star } from 'lucide-react'

type Props = {
  techniques: string[]
  loading?: boolean
}

/**
 * Shows techniques from the patient's active treatment plan as
 * "recommended" chips above the ModalidadesForm in SessionEditorPanel.
 */
export function PlanTechniquesBar({ techniques, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Cargando técnicas sugeridas del plan...
      </div>
    )
  }

  if (techniques.length === 0) return null

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="h-3.5 w-3.5 text-violet-500 fill-violet-500" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
          Técnicas sugeridas en el plan de tratamiento
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {techniques.map(t => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-white border border-violet-200 text-violet-700"
          >
            <Zap className="h-2.5 w-2.5" />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
