import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { SignosVitales } from '@/features/dashboard/data/services/clinicalHistoryService'

type VitalsWithDolor = SignosVitales & { escalaDolor?: number }

type Props = {
  current: VitalsWithDolor
  previous: VitalsWithDolor
  currentLabel?: string
  previousLabel?: string
}

type VitalDef = {
  key: keyof VitalsWithDolor
  label: string
  unit: string
  lowerIsBetter?: boolean
  format?: (v: number | string) => string
}

const VITAL_DEFS: VitalDef[] = [
  { key: 'escalaDolor',          label: 'EVA Dolor',   unit: '/10',   lowerIsBetter: true },
  { key: 'frecuenciaCardiaca',   label: 'FC',          unit: 'lpm' },
  { key: 'frecuenciaRespiratoria', label: 'FR',        unit: 'rpm' },
  { key: 'saturacionOxigeno',    label: 'SpO₂',        unit: '%' },
  { key: 'temperatura',          label: 'Temp.',       unit: '°C' },
]

function delta(curr: number, prev: number, lowerIsBetter: boolean) {
  const d = curr - prev
  if (d === 0) return { d, improved: false, worsened: false }
  const improved = lowerIsBetter ? d < 0 : d > 0
  return { d, improved, worsened: !improved }
}

export function VitalsComparisonCard({
  current,
  previous,
  currentLabel = 'Sesión actual',
  previousLabel = 'Evaluación inicial',
}: Props) {
  const rows = VITAL_DEFS.filter(def => {
    const c = current[def.key]
    const p = previous[def.key]
    return c !== undefined || p !== undefined
  })

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
        Sin datos de signos vitales para comparar.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        <span className="col-span-1">Indicador</span>
        <span className="col-span-1 text-center">{previousLabel}</span>
        <span className="col-span-1 text-center">{currentLabel}</span>
        <span className="col-span-1 text-center">Δ</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50">
        {rows.map(def => {
          const rawCurr = current[def.key]
          const rawPrev = previous[def.key]
          const currVal = typeof rawCurr === 'number' ? rawCurr : undefined
          const prevVal = typeof rawPrev === 'number' ? rawPrev : undefined
          const hasDelta = currVal !== undefined && prevVal !== undefined
          const { d, improved, worsened } = hasDelta
            ? delta(currVal, prevVal, def.lowerIsBetter ?? false)
            : { d: 0, improved: false, worsened: false }

          return (
            <div key={String(def.key)} className="grid grid-cols-4 items-center px-3 py-2.5">
              <span className="col-span-1 text-xs font-medium text-slate-600">
                {def.label}
                <span className="ml-0.5 text-[10px] text-slate-400">{def.unit}</span>
              </span>

              <span className="col-span-1 text-center text-xs text-slate-400">
                {prevVal !== undefined ? prevVal : typeof rawPrev === 'string' ? rawPrev : '—'}
              </span>

              <span className="col-span-1 text-center text-xs font-bold text-slate-800">
                {currVal !== undefined ? currVal : typeof rawCurr === 'string' ? rawCurr : '—'}
              </span>

              <span className="col-span-1 flex items-center justify-center gap-0.5 text-xs font-bold">
                {!hasDelta ? (
                  <span className="text-slate-300">—</span>
                ) : improved ? (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <TrendingDown className="h-3 w-3" />
                    {d > 0 ? `+${d}` : d}
                  </span>
                ) : worsened ? (
                  <span className="flex items-center gap-0.5 text-red-500">
                    <TrendingUp className="h-3 w-3" />
                    {d > 0 ? `+${d}` : d}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-slate-400">
                    <Minus className="h-3 w-3" />0
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
