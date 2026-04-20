import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  ChevronDown, ChevronRight, ArrowLeft, Loader2,
  Target, Clock, Activity, AlertTriangle,
  Calendar, CheckCircle2, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getPlanTimeline,
  iniciarSesionDirecta,
  type PlanContextoDto,
  type TimelineEventDto,
} from '../../data/services/clinicalHistoryService'
import { UnifiedTimeline } from './UnifiedTimeline'
import { CreatePlanFollowUpDrawer } from './CreatePlanFollowUpDrawer'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ALARMA_META: Record<string, { dot: string; text: string; badge: string }> = {
  VERDE:    { dot: 'bg-emerald-400', text: 'Estable',        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  AMARILLO: { dot: 'bg-yellow-400',  text: 'En revisión',    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'   },
  NARANJA:  { dot: 'bg-orange-400',  text: 'Riesgo alto',    badge: 'bg-orange-50 text-orange-700 border-orange-200'   },
  ROJO:     { dot: 'bg-red-500',     text: 'Crítico',        badge: 'bg-red-50 text-red-700 border-red-200'            },
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({
  id, title, icon, defaultOpen = true, children,
}: {
  id: string
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
        aria-expanded={open}
        aria-controls={id}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A5276]/10 text-[#1A5276]">
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-400" />
          : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div id={id} className="border-t border-slate-100 px-5 py-5">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  plan:            PlanContextoDto
  pacienteNombre:  string
  hcl:             string
  episodioId:      number
  pacienteId?:     number
  onBack:          () => void
  onRefresh?:      () => void
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PlanDetailView({
  plan,
  pacienteNombre,
  hcl,
  episodioId,
  onBack,
  onRefresh,
}: Props) {
  const [timeline, setTimeline]         = useState<TimelineEventDto[]>([])
  const [loadingTL, setLoadingTL]       = useState(true)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [startingSession, setStarting]  = useState(false)

  const loadTimeline = useCallback(async () => {
    setLoadingTL(true)
    try {
      const data = await getPlanTimeline(plan.planId)
      setTimeline(data)
    } catch {
      setTimeline([])
    } finally {
      setLoadingTL(false)
    }
  }, [plan.planId])

  useEffect(() => { void loadTimeline() }, [loadTimeline])

  const handleIniciarSesion = async () => {
    setStarting(true)
    try {
      const sesion = await iniciarSesionDirecta(plan.planId)
      toast.success('Sesión iniciada', {
        description: `Sesión #${sesion.numeroSesionEnPlan ?? '?'} creada en borrador.`,
      })
      void loadTimeline()
      onRefresh?.()
    } catch (err) {
      toast.error('No se pudo iniciar la sesión', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setStarting(false)
    }
  }

  const alarma = ALARMA_META[plan.codigoAlarma] ?? ALARMA_META['VERDE']
  const pct = plan.sesionesPlanificadas > 0
    ? Math.round((plan.sesionesRealizadas / plan.sesionesPlanificadas) * 100)
    : 0
  const isClosed = plan.estado !== 'ACTIVO'
  const isFinishing = pct >= 80 && !isClosed

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">

      {/* Back */}
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          Volver a planes
        </Button>
      </div>

      {/* ── Cabecera del plan ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Plan de Tratamiento</p>
            <h2 className="text-xl font-bold text-slate-900">{pacienteNombre}</h2>
            <p className="text-xs font-mono text-[#1A5276] mt-0.5">{hcl}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${alarma.badge}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${alarma.dot}`} />
            <span className="text-xs font-bold">{alarma.text}</span>
          </div>
        </div>

        {/* Problema */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3 flex items-start gap-3">
          <span className="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-mono shrink-0">
            {plan.codigoCie10}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Problema vinculado</p>
            <p className="text-sm font-semibold text-slate-800">{plan.problemaDescripcion}</p>
          </div>
        </div>

        {/* Estado badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
            plan.estado === 'ACTIVO'
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {plan.estado}
          </span>
          {isFinishing && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              Finalizando
            </span>
          )}
          {(plan.codigoAlarma === 'ROJO' || plan.codigoAlarma === 'NARANJA') && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              Requiere atención prioritaria
            </div>
          )}
        </div>
      </div>

      {/* ── Progreso de sesiones ──────────────────────────────────────────── */}
      <Section id="sesiones" title="Progreso de Sesiones" icon={<Clock className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fecha de Inicio
              </p>
              <p className="text-sm font-bold text-slate-800 mt-1">{fmtDate(plan.fechaInicio)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fin Estimado
              </p>
              <p className="text-sm font-bold text-slate-800 mt-1">{fmtDate(plan.fechaFinEstimada)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sesiones</p>
                <p className="text-3xl font-black text-[#1A5276] leading-none">
                  {plan.sesionesRealizadas}
                  <span className="text-base font-normal text-slate-400">/{plan.sesionesPlanificadas}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">realizadas / planificadas</p>
              </div>
              <span className="text-xl font-black text-[#1A5276]">{pct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-sky-500' : 'bg-[#1A5276]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Dot grid */}
          {plan.sesionesPlanificadas > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from({ length: Math.min(plan.sesionesPlanificadas, 40) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border transition ${
                    i < plan.sesionesRealizadas
                      ? 'bg-[#1A5276] border-[#1A5276]'
                      : 'bg-white border-slate-200'
                  }`}
                />
              ))}
              {plan.sesionesPlanificadas > 40 && (
                <span className="self-center text-[10px] text-slate-400">
                  +{plan.sesionesPlanificadas - 40} más
                </span>
              )}
            </div>
          )}

          {/* Avance clínico del contexto */}
          {plan.porcentajeAvance > 0 && plan.porcentajeAvance !== pct && (
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400">Avance clínico reportado: {plan.porcentajeAvance}%</p>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, plan.porcentajeAvance)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Objetivo general ─────────────────────────────────────────────── */}
      <Section id="objetivo" title="Objetivo del Tratamiento" icon={<Target className="h-4 w-4" />}>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          {plan.objetivoGeneral || '—'}
        </p>
      </Section>

      {/* ── Acciones ──────────────────────────────────────────────────────── */}
      {!isClosed && (
        <Section id="acciones" title="Acciones Clínicas" icon={<Zap className="h-4 w-4" />} defaultOpen={false}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="sm"
              onClick={handleIniciarSesion}
              disabled={startingSession}
              className="flex-1 gap-2 bg-[#1A5276] hover:bg-[#154360] text-white"
            >
              {startingSession
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircle2 className="h-3.5 w-3.5" />}
              Iniciar sesión directa
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDrawerOpen(true)}
              className="flex-1 gap-2 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
            >
              <Activity className="h-3.5 w-3.5" />
              Registrar seguimiento
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            "Sesión directa" crea una sesión sin cita previa. Úsala cuando el paciente llegue de imprevisto.
          </p>
        </Section>
      )}

      {/* ── Timeline unificado ────────────────────────────────────────────── */}
      <Section id="timeline" title="Timeline Clínico" icon={<Activity className="h-4 w-4" />}>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Historial cronológico de sesiones SOAP y seguimientos del plan.
            {!loadingTL && timeline.length > 0 && (
              <span className="ml-1 font-semibold text-slate-600">{timeline.length} eventos registrados.</span>
            )}
          </p>
          <UnifiedTimeline events={timeline} loading={loadingTL} />
        </div>
      </Section>

      {/* Alerta riesgo */}
      {plan.codigoAlarma === 'ROJO' && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-700">
            Plan con semáforo rojo — requiere seguimiento estrecho y evaluación prioritaria.
          </p>
        </div>
      )}

      {/* Drawer de seguimiento */}
      <CreatePlanFollowUpDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        episodioId={episodioId}
        problemaId={plan.problemaId}
        numeroEpisodio={String(episodioId)}
        onSuccess={() => {
          setDrawerOpen(false)
          void loadTimeline()
          onRefresh?.()
        }}
      />
    </div>
  )
}
