import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Plus, Activity, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp,
  Target, BarChart2,
} from 'lucide-react'
import type { ProblemStatus, TreatmentPlanDto } from '../../data/services/clinicalHistoryService'
import { AddProblemForm } from './AddProblemForm'
import { PlanProgressCard } from './PlanProgressCard'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Problem = {
  id: number
  numeroSecuencial?: number
  descripcion: string
  codigoCie10: string
  estado: ProblemStatus
  fechaRegistro?: string
}

type Props = {
  episodioId: number
  numeroEpisodio: string
  problemas: Problem[]
  planesTratamiento?: TreatmentPlanDto[]
  onReload: () => void
}

// ── Configuración de estados ──────────────────────────────────────────────────

const STATUS_META: Record<ProblemStatus, {
  label: string
  cls: string
  dot: string
  icon: React.ReactNode
}> = {
  ACTIVO:     { label: 'Activo',     dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 border-green-200',   icon: <Activity className="w-3 h-3" /> },
  CRONICO:    { label: 'Crónico',    dot: 'bg-amber-400',  cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock className="w-3 h-3" /> },
  RESUELTO:   { label: 'Resuelto',   dot: 'bg-blue-400',   cls: 'bg-blue-50 text-blue-700 border-blue-200',      icon: <CheckCircle className="w-3 h-3" /> },
  DESCARTADO: { label: 'Descartado', dot: 'bg-slate-300',  cls: 'bg-slate-50 text-slate-500 border-slate-200',   icon: <XCircle className="w-3 h-3" /> },
}

function StatusBadge({ estado }: { estado: ProblemStatus }) {
  const m = STATUS_META[estado]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.icon}
      {m.label}
    </span>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ProblemasYPlanView({
  episodioId,
  numeroEpisodio,
  problemas,
  planesTratamiento,
  onReload,
}: Props) {
  const [showAddForm, setShowAddForm]   = useState(false)
  const [expandedId, setExpandedId]     = useState<number | null>(
    problemas.find(p => p.estado === 'ACTIVO' || p.estado === 'CRONICO')?.id ?? null
  )
  const [showResolved, setShowResolved] = useState(false)

  const sorted = [...problemas].sort((a, b) => {
    const order: Record<ProblemStatus, number> = { ACTIVO: 0, CRONICO: 1, RESUELTO: 2, DESCARTADO: 3 }
    return order[a.estado] - order[b.estado]
  })

  const active   = sorted.filter(p => p.estado === 'ACTIVO' || p.estado === 'CRONICO')
  const inactive = sorted.filter(p => p.estado === 'RESUELTO' || p.estado === 'DESCARTADO')

  // Stats
  const withPlan = planesTratamiento?.length ?? 0

  const renderProblem = (problema: Problem, index: number) => {
    const isExpanded = expandedId === problema.id
    const isInactive = problema.estado === 'RESUELTO' || problema.estado === 'DESCARTADO'
    const planCached = planesTratamiento?.find(
      p => p.problemaId === problema.id
    )

    return (
      <div
        key={problema.id}
        className={`rounded-xl border overflow-hidden transition-all ${
          isInactive
            ? 'border-slate-100 opacity-60'
            : isExpanded
              ? 'border-[#1A5276]/20 shadow-sm'
              : 'border-slate-200'
        }`}
      >
        {/* Row del problema */}
        <button
          type="button"
          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition ${
            isExpanded ? 'bg-white' : 'bg-white hover:bg-slate-50'
          }`}
          onClick={() => setExpandedId(isExpanded ? null : problema.id)}
        >
          {/* Número */}
          <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
            {problema.numeroSecuencial ?? index + 1}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Código */}
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-200">
                {problema.codigoCie10}
              </span>
              <StatusBadge estado={problema.estado} />
              {/* Indicador de plan */}
              {planCached && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded border border-violet-200 flex items-center gap-0.5">
                  <Target className="w-2.5 h-2.5" />Plan
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1 line-clamp-2">
              {problema.descripcion}
            </p>
            {problema.fechaRegistro && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(problema.fechaRegistro).toLocaleDateString('es-EC')}
              </p>
            )}
          </div>

          {isExpanded
            ? <ChevronUp className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
          }
        </button>

        {/* Panel expandible */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-slate-50/60 border-t border-slate-100">
            {isInactive ? (
              <p className="text-xs text-slate-400 italic pt-3">
                Este problema está {STATUS_META[problema.estado].label.toLowerCase()} — no se puede modificar el plan.
              </p>
            ) : (
              <PlanProgressCard
                episodioId={episodioId}
                problemaId={problema.id}
                problemaDescripcion={problema.descripcion}
                numeroEpisodio={numeroEpisodio}
                planFromCache={planCached ?? null}
                onPlanCreated={onReload}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/30">
      <div className="p-5 space-y-4">
        {/* Header con stats */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Lista de Problemas</h3>
            {problemas.length > 0 ? (
              <div className="flex items-center gap-3 mt-1">
                {(Object.keys(STATUS_META) as ProblemStatus[]).map(s => {
                  const count = problemas.filter(p => p.estado === s).length
                  if (count === 0) return null
                  const m = STATUS_META[s]
                  return (
                    <span key={s} className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                      {count} {m.label.toLowerCase()}
                    </span>
                  )
                })}
                {withPlan > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-violet-500">
                    <BarChart2 className="w-3 h-3" />
                    {withPlan} con plan
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">Sin problemas registrados</p>
            )}
          </div>

          {!showAddForm && (
            <Button
              size="sm"
              className="bg-[#1A5276] hover:bg-[#154360] text-white gap-1.5 text-xs"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Problema
            </Button>
          )}
        </div>

        {/* Formulario nuevo problema */}
        {showAddForm && (
          <AddProblemForm
            episodioId={episodioId}
            onSuccess={() => { setShowAddForm(false); onReload() }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Empty state */}
        {problemas.length === 0 && !showAddForm && (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No hay problemas registrados</p>
            <p className="text-xs text-slate-300 mt-1">
              Registra los hallazgos de la evaluación inicial
            </p>
          </div>
        )}

        {/* Problemas activos y crónicos */}
        {active.length > 0 && (
          <div className="space-y-2">
            {active.map((p, i) => renderProblem(p, i))}
          </div>
        )}

        {/* Problemas resueltos / descartados */}
        {inactive.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowResolved(v => !v)}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition mb-2"
            >
              {showResolved
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
              {inactive.length} problema{inactive.length !== 1 ? 's' : ''} resuelto{inactive.length !== 1 ? 's' : ''} / descartado{inactive.length !== 1 ? 's' : ''}
            </button>

            {showResolved && (
              <div className="space-y-2">
                {inactive.map((p, i) => renderProblem(p, active.length + i))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
