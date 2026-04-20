import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2, BarChart2, Target, Calendar, BookOpen, AlertTriangle,
  CheckCircle2, Circle, ChevronDown, ChevronUp, Zap, Plus, X,
  TrendingUp, TrendingDown, Minus, XCircle,
} from 'lucide-react'
import {
  getPlan,
  getPlanFollowUps,
  type TreatmentPlanDto,
  type PlanFollowUpDto,
  type CodigoAlarma,
} from '../../data/services/clinicalHistoryService'
import {
  parseObjectiveTimeframe,
  parseTechniques,
  parseEducationalNotes,
  TIMEFRAME_CONFIG,
  type ObjectiveTimeframe,
} from '../../data/config/treatmentConfig'
import { CreatePlanFollowUpDrawer } from './CreatePlanFollowUpDrawer'
import { CreateTreatmentPlanDrawer } from './CreateTreatmentPlanDrawer'
import { PlanClosureModal } from './PlanClosureModal'

// ── Alarma visual ─────────────────────────────────────────────────────────────

const ALARMA_STYLE: Record<CodigoAlarma, { dot: string; badge: string; label: string }> = {
  VERDE:    { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Bajo riesgo' },
  AMARILLO: { dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',   label: 'Riesgo leve' },
  NARANJA:  { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200',   label: 'Riesgo moderado' },
  ROJO:     { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',            label: 'Riesgo alto' },
}

const RESULTADO_STYLE: Record<string, string> = {
  MEJORA:    'text-green-600 bg-green-50',
  ESTABLE:   'text-blue-600 bg-blue-50',
  DETERIORO: 'text-orange-600 bg-orange-50',
  ALTA:      'text-emerald-600 bg-emerald-50',
  ABANDONO:  'text-red-600 bg-red-50',
}

const RESULTADO_ICON: Record<string, React.ReactNode> = {
  MEJORA:    <TrendingDown className="w-3 h-3" />,
  ESTABLE:   <Minus className="w-3 h-3" />,
  DETERIORO: <TrendingUp className="w-3 h-3" />,
  ALTA:      <CheckCircle2 className="w-3 h-3" />,
  ABANDONO:  <XCircle className="w-3 h-3" />,
}

// ── localStorage key para checklist de objetivos ──────────────────────────────

const checklistKey = (planId: number) => `fisiolab_obj_check_${planId}`

function loadChecklist(planId: number): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(checklistKey(planId))
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch { return {} }
}

function saveChecklist(planId: number, state: Record<string, boolean>) {
  try { localStorage.setItem(checklistKey(planId), JSON.stringify(state)) } catch { /**/ }
}

// ── Subcomponente: Barra de progreso de sesiones ──────────────────────────────

function SessionProgressBar({
  completadas,
  planificadas,
  porcentajeAvance,
  estado,
}: {
  completadas: number
  planificadas: number
  porcentajeAvance: number
  estado: string
}) {
  const isClosed = estado === 'CERRADO' || estado === 'ALTA' || estado === 'ABANDONO'
  // const pct = planificadas > 0 ? Math.round((completadas / planificadas) * 100) : 0
  const overrun = completadas > planificadas

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            {completadas}
            <span className="text-slate-400 font-normal">/{planificadas}</span>
          </span>
          <span className="text-xs text-slate-400">sesiones realizadas</span>
          {overrun && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              +{completadas - planificadas} extra
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {porcentajeAvance > 0 && (
            <span className="text-xs font-bold text-[#1A5276]">{porcentajeAvance}% avance</span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isClosed ? 'bg-slate-100 text-slate-500' : overrun ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {isClosed ? 'Cerrado' : 'Activo'}
          </span>
        </div>
      </div>

      {/* Sesion blocks */}
      <div className="flex gap-0.5 flex-wrap">
        {Array.from({ length: Math.max(planificadas, completadas) }).map((_, i) => {
          const done  = i < completadas
          const extra = i >= planificadas
          return (
            <div
              key={i}
              title={`Sesión ${i + 1}${extra ? ' (extra)' : ''}`}
              className={`h-3 rounded-sm transition-all ${
                done
                  ? extra
                    ? 'bg-amber-400'
                    : isClosed ? 'bg-slate-400' : 'bg-[#1A5276]'
                  : 'bg-slate-100 border border-slate-200'
              }`}
              style={{
                width: `${Math.max(8, Math.min(24, 90 / Math.max(planificadas, completadas, 1)))}%`,
                maxWidth: 24,
              }}
            />
          )
        })}
      </div>

      {/* Progreso clínico */}
      {porcentajeAvance > 0 && (
        <div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-emerald-400"
              style={{ width: `${Math.min(100, porcentajeAvance)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Progreso clínico reportado</p>
        </div>
      )}
    </div>
  )
}

// ── Subcomponente: Checklist de objetivos ─────────────────────────────────────

function ObjectivesChecklist({
  planId,
  objetivos,
  locked,
}: {
  planId: number
  objetivos: string[]
  locked: boolean
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => loadChecklist(planId))
  const [open, setOpen]       = useState(false)

  const toggle = (obj: string) => {
    if (locked) return
    const next = { ...checked, [obj]: !checked[obj] }
    setChecked(next)
    saveChecklist(planId, next)
  }

  const total    = objetivos.length
  const achieved = objetivos.filter(o => checked[o]).length

  const byTimeframe = (tf: ObjectiveTimeframe) =>
    objetivos.filter(o => parseObjectiveTimeframe(o).timeframe === tf)

  const hasTimeframed = objetivos.some(o => parseObjectiveTimeframe(o).timeframe !== null)

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition"
      >
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">
            Checklist de objetivos
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            achieved === total ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {achieved}/{total}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-2 bg-white space-y-3">
          {/* Mini progress bar */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${total > 0 ? (achieved / total) * 100 : 0}%` }}
            />
          </div>

          {hasTimeframed
            ? (Object.keys(TIMEFRAME_CONFIG) as ObjectiveTimeframe[]).map(tf => {
                const rows = byTimeframe(tf)
                if (rows.length === 0) return null
                const cfg = TIMEFRAME_CONFIG[tf]
                return (
                  <div key={tf}>
                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${cfg.color}`}>
                      {cfg.label} · {cfg.desc}
                    </p>
                    <div className="space-y-1">
                      {rows.map(rawObj => {
                        const { body } = parseObjectiveTimeframe(rawObj)
                        const done = checked[rawObj]
                        return (
                          <button
                            key={rawObj}
                            type="button"
                            onClick={() => toggle(rawObj)}
                            disabled={locked}
                            className={`w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-lg border transition ${
                              done
                                ? `${cfg.bg} ${cfg.border}`
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {done
                              ? <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
                              : <Circle className="w-4 h-4 shrink-0 mt-0.5 text-slate-300" />
                            }
                            <span className={`text-xs leading-relaxed ${done ? `${cfg.color} line-through opacity-70` : 'text-slate-600'}`}>
                              {body}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            : (
              <div className="space-y-1">
                {objetivos.map(obj => {
                  const done = checked[obj]
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => toggle(obj)}
                      disabled={locked}
                      className={`w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-lg border transition ${
                        done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200'
                      } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {done
                        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        : <Circle className="w-4 h-4 shrink-0 mt-0.5 text-slate-300" />
                      }
                      <span className={`text-xs leading-relaxed ${done ? 'text-emerald-700 line-through opacity-70' : 'text-slate-600'}`}>
                        {obj}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          }

          {!locked && (
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Toca un objetivo para marcarlo como logrado
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Subcomponente: Técnicas favoritas ─────────────────────────────────────────

function TechniquesFavorites({ techniques }: { techniques: string[] }) {
  if (techniques.length === 0) return null
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? techniques : techniques.slice(0, 4)

  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-3.5 h-3.5 text-violet-500" />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Técnicas favoritas del plan
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(t => (
          <span
            key={t}
            className="text-[10px] font-medium px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200"
          >
            {t}
          </span>
        ))}
        {techniques.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition"
          >
            {expanded ? '− menos' : `+${techniques.length - 4} más`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Subcomponente: Extensión de plan ──────────────────────────────────────────

function PlanExtensionInline({
  currentTotal,
  onExtend,
  loading,
}: {
  currentTotal: number
  onExtend: (extra: number) => void
  loading: boolean
}) {
  const [extra, setExtra] = useState(4)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs font-bold text-amber-700">Sesiones agotadas</p>
      </div>
      <p className="text-[11px] text-amber-600">
        Se completaron las {currentTotal} sesiones planificadas. Puedes extender el plan para continuar el tratamiento.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExtra(Math.max(1, extra - 1))}
            className="w-7 h-7 rounded-lg border border-amber-300 bg-white flex items-center justify-center text-amber-600 font-bold hover:bg-amber-50 transition"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-lg font-black text-amber-700 w-8 text-center">{extra}</span>
          <button
            type="button"
            onClick={() => setExtra(extra + 1)}
            className="w-7 h-7 rounded-lg border border-amber-300 bg-white flex items-center justify-center text-amber-600 font-bold hover:bg-amber-50 transition"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-xs text-amber-600">sesiones adicionales</span>
        </div>
        <Button
          size="sm"
          className="ml-auto bg-amber-500 hover:bg-amber-600 text-white font-bold"
          onClick={() => onExtend(extra)}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin w-3 h-3" /> : 'Extender'}
        </Button>
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  episodioId:           number
  problemaId:           number
  problemaDescripcion:  string
  numeroEpisodio:       string
  planFromCache?:       TreatmentPlanDto | null
  onPlanCreated?:       () => void
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PlanProgressCard({
  episodioId,
  problemaId,
  // problemaDescripcion,
  numeroEpisodio,
  planFromCache,
  onPlanCreated,
}: Props) {
  const [plan,          setPlan]          = useState<TreatmentPlanDto | null>(planFromCache ?? null)
  const [seguimientos,  setSeguimientos]  = useState<PlanFollowUpDto[]>([])
  const [sesionesTerapia, setSesionesTerapia] = useState<any[]>([])
  const [loading,       setLoading]       = useState(!planFromCache)
  const [seguimientoOpen, setSeguimientoOpen] = useState(false)
  const [planDrawerOpen,  setPlanDrawerOpen]  = useState(false)
  const [closureOpen,     setClosureOpen]     = useState(false)
  const [showSeguimientos, setShowSeguimientos] = useState(false)
  const [extendLoading, setExtendLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const { getHistorialSesionesPorEpisodio } = await import('../../data/services/clinicalHistoryService');
      const [fetchedPlan, fetchedSegs, fetchedSesiones] = await Promise.all([
        getPlan(episodioId, problemaId),
        getPlanFollowUps(episodioId, problemaId).catch(() => [] as PlanFollowUpDto[]),
        getHistorialSesionesPorEpisodio(episodioId).catch(() => []),
      ])
      setPlan(fetchedPlan)
      setSeguimientos(fetchedSegs)
      setSesionesTerapia(fetchedSesiones.filter((s: any) => s.planTratamientoId === fetchedPlan?.id && s.estado === 'FIRMADA'))
    } catch { /* sin plan aún */ } finally {
      setLoading(false)
    }
  }, [episodioId, problemaId])

  useEffect(() => {
    if (!planFromCache) {
      loadData()
    } else {
      const fetchData = async () => {
          try {
             const { getHistorialSesionesPorEpisodio } = await import('../../data/services/clinicalHistoryService');
             const [fetchedSegs, fetchedSesiones] = await Promise.all([
                getPlanFollowUps(episodioId, problemaId).catch(() => [] as PlanFollowUpDto[]),
                getHistorialSesionesPorEpisodio(episodioId).catch(() => []),
             ]);
             setSeguimientos(fetchedSegs);
             setSesionesTerapia(fetchedSesiones.filter((s: any) => s.planTratamientoId === planFromCache.id && s.estado === 'FIRMADA'));
          } catch (e) {} finally {
             setLoading(false);
          }
      };
      fetchData();
    }
  }, [episodioId, problemaId, planFromCache, loadData])

  if (loading) return <div className="h-12 bg-slate-50 rounded-xl animate-pulse mt-2" />

  // ── Sin plan ──────────────────────────────────────────────────────────────
  if (!plan) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPlanDrawerOpen(true)}
          className="w-full mt-2 py-3 rounded-xl border-2 border-dashed border-emerald-200 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition flex items-center justify-center gap-2"
        >
          <Target className="w-3.5 h-3.5" />
          Crear Plan de Tratamiento
        </button>
        <CreateTreatmentPlanDrawer
          open={planDrawerOpen}
          onOpenChange={setPlanDrawerOpen}
          episodioId={episodioId}
          problemaId={problemaId}
          numeroEpisodio={numeroEpisodio}
          onSuccess={() => { loadData(); onPlanCreated?.() }}
        />
      </>
    )
  }

  // ── Con plan ──────────────────────────────────────────────────────────────
  const alarma      = ALARMA_STYLE[plan.codigoAlarma as CodigoAlarma] ?? ALARMA_STYLE['VERDE']
  const lastSeg     = seguimientos[seguimientos.length - 1]
  const completadas = Math.max(seguimientos.length, sesionesTerapia.length)
  const latestPct   = lastSeg?.porcentajeAvance ?? 0
  const isClosed    = plan.estado === 'CERRADO' || plan.estado === 'ALTA' || plan.estado === 'ABANDONO'
  const isExhausted = !isClosed && completadas >= plan.sesionesPlanificadas

  // Parse técnicas e indicaciones del campo indicacionesEducativas
  const rawIndicaciones  = plan.indicacionesEducativas ?? ''
  const techniques       = parseTechniques(rawIndicaciones)
  const educationalNotes = parseEducationalNotes(rawIndicaciones)

  // Handler extensión: registra seguimiento con ajuste
  const handleExtend = async (extra: number) => {
    setExtendLoading(true)
    try {
      const { registerPlanFollowUp } = await import('../../data/services/clinicalHistoryService')
      await registerPlanFollowUp(episodioId, problemaId, {
        fechaSeguimiento: new Date().toISOString().slice(0, 10),
        porcentajeAvance: latestPct,
        resultadosObtenidos: `Extensión de plan aprobada. Se agregan ${extra} sesiones adicionales.`,
        ajustes: `+${extra} sesiones. Total nuevo: ${plan.sesionesPlanificadas + extra}`,
        resultadoGeneral: 'ESTABLE',
      })
      // Actualiza el plan local con el nuevo total
      setPlan(prev => prev ? { ...prev, sesionesPlanificadas: prev.sesionesPlanificadas + extra } : prev)
      setSeguimientos(prev => [...prev, {
        id: Date.now(),
        planTratamientoId: plan.id,
        numeroSesion: completadas + 1,
        fechaSeguimiento: new Date().toISOString().slice(0, 10),
        porcentajeAvance: latestPct,
        resultadosObtenidos: `Extensión de plan: +${extra} sesiones`,
        ajustes: `+${extra} sesiones`,
        resultadoGeneral: 'ESTABLE',
        fechaRegistro: new Date().toISOString(),
      }])
    } catch { /* ignore */ } finally {
      setExtendLoading(false)
    }
  }

  // Combina las sesiones físicas y seguimientos para el UI
  const historyItems = [
    ...seguimientos.map(s => ({ ...s, isSeguimiento: true, key: `seg-${s.id}`, dateStr: s.fechaSeguimiento })),
    ...sesionesTerapia.map(s => ({ ...s, isSeguimiento: false, key: `ses-${s.id}`, dateStr: s.fechaHoraInicio }))
  ].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime())

  return (
    <>
      <div className="mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Header del plan */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${alarma.dot}`} />
            <span className="text-xs font-bold text-slate-700 truncate">Plan de Tratamiento</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${alarma.badge}`}>
              {alarma.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {lastSeg && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${RESULTADO_STYLE[lastSeg.resultadoGeneral] ?? ''}`}>
                {RESULTADO_ICON[lastSeg.resultadoGeneral]}
                {lastSeg.resultadoGeneral}
              </span>
            )}
            {isClosed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Cerrado
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Objetivo general */}
          <div>
            <p className="text-xs font-semibold text-slate-700">{plan.objetivoGeneral}</p>
          </div>

          {/* Checklist de objetivos específicos */}
          {plan.objetivosEspecificos && plan.objetivosEspecificos.length > 0 && (
            <ObjectivesChecklist
              planId={plan.id}
              objetivos={plan.objetivosEspecificos}
              locked={isClosed}
            />
          )}

          {/* Técnicas favoritas */}
          <TechniquesFavorites techniques={techniques} />

          {/* Fechas */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Inicio: <b className="text-slate-700">{new Date(plan.fechaInicio).toLocaleDateString('es-EC')}</b></span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Fin est.: <b className="text-slate-700">{new Date(plan.fechaFinEstimada).toLocaleDateString('es-EC')}</b></span>
            </div>
          </div>

          {/* Barra de progreso de sesiones */}
          <SessionProgressBar
            completadas={completadas}
            planificadas={plan.sesionesPlanificadas}
            porcentajeAvance={latestPct}
            estado={plan.estado ?? 'ACTIVO'}
          />

          {/* Indicaciones educativas */}
          {educationalNotes && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <BookOpen className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500">{educationalNotes}</p>
            </div>
          )}

          {/* Extensión de plan */}
          {isExhausted && (
            <PlanExtensionInline
              currentTotal={plan.sesionesPlanificadas}
              onExtend={handleExtend}
              loading={extendLoading}
            />
          )}

          {/* Historial de seguimientos y sesiones */}
          {historyItems.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowSeguimientos(v => !v)}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 transition"
              >
                {showSeguimientos
                  ? <><ChevronUp className="w-3 h-3" />Ocultar historial</>
                  : <><ChevronDown className="w-3 h-3" />Ver historial ({historyItems.length} registros)</>
                }
              </button>

              {showSeguimientos && (
                <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {historyItems.map(item => (
                    <div key={item.key} className="rounded-lg border border-slate-100 p-2.5 bg-slate-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-600">
                          {item.isSeguimiento ? `Seguimiento de Plan · ${new Date(item.fechaSeguimiento).toLocaleDateString('es-EC')}` : `Sesión de Terapia #${item.numeroSesionEnPlan ?? '?'} · ${new Date(item.fechaHoraInicio).toLocaleDateString('es-EC')}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.isSeguimiento && (
                            <>
                              <span className="text-[10px] font-bold text-[#1A5276]">{item.porcentajeAvance}%</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${RESULTADO_STYLE[item.resultadoGeneral] ?? ''}`}>
                                {RESULTADO_ICON[item.resultadoGeneral]}
                                {item.resultadoGeneral}
                              </span>
                            </>
                          )}
                          {!item.isSeguimiento && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Firmada
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {item.isSeguimiento ? item.resultadosObtenidos : (item.notaSOAP?.objetivo || item.notaSOAP?.subjetivo || 'Sin detalles registrados')}
                      </p>
                      {item.isSeguimiento && item.ajustes && (
                        <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                          {item.ajustes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          {!isClosed && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 gap-1.5 text-xs"
                onClick={() => setSeguimientoOpen(true)}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Sesión #{completadas + 1}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5 text-xs"
                onClick={() => setClosureOpen(true)}
              >
                <X className="w-3.5 h-3.5" />
                Cerrar plan
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreatePlanFollowUpDrawer
        open={seguimientoOpen}
        onOpenChange={setSeguimientoOpen}
        episodioId={episodioId}
        problemaId={problemaId}
        numeroEpisodio={numeroEpisodio}
        onSuccess={loadData}
      />

      <PlanClosureModal
        open={closureOpen}
        onOpenChange={setClosureOpen}
        episodioId={episodioId}
        problemaId={problemaId}
        numeroEpisodio={numeroEpisodio}
        sesionesRealizadas={completadas}
        onSuccess={loadData}
      />
    </>
  )
}
