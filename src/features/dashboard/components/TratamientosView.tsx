import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Search, ClipboardList, ChevronRight, Loader2,
  Activity, AlertTriangle, TrendingUp, Users,
} from 'lucide-react'
import {
  getResumenPacientes,
  getEstadisticasDashboard,
  getContextoPlanes,
  type PacienteResumenDto,
  type ContextoPlanesDto,
  type PlanContextoDto,
  type EstadisticasDashboardDto,
  type CodigoAlarma,
} from '../data/services/clinicalHistoryService'
import { PlanDetailView } from './patient-record/PlanDetailView'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700',
]

function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const ALARM_META: Record<CodigoAlarma, { dot: string; glow: string; label: string; badge: string }> = {
  VERDE:    { dot: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',  label: 'Estable',     badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  AMARILLO: { dot: 'bg-amber-400',   glow: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]',  label: 'En revisión', badge: 'bg-amber-50 text-amber-700 border-amber-200'       },
  NARANJA:  { dot: 'bg-orange-500',  glow: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]',  label: 'Riesgo alto', badge: 'bg-orange-50 text-orange-700 border-orange-200'    },
  ROJO:     { dot: 'bg-rose-500',    glow: 'shadow-[0_0_8px_rgba(244,63,94,0.5)]',   label: 'En riesgo',   badge: 'bg-rose-50 text-rose-700 border-rose-200'          },
}

function alarmMeta(code: string) {
  return ALARM_META[(code?.toUpperCase() as CodigoAlarma)] ?? ALARM_META['VERDE']
}

// ── Tipos locales ─────────────────────────────────────────────────────────────

type FilterKey = 'todos' | 'riesgo' | 'finalizando'

type SelectedPlan = {
  plan:           PlanContextoDto
  pacienteNombre: string
  hcl:            string
  episodioId:     number
  pacienteId:     number
}

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, onManage }: { plan: PlanContextoDto; onManage: () => void }) {
  const alarm = alarmMeta(plan.codigoAlarma)
  const pct   = plan.sesionesPlanificadas > 0
    ? Math.round((plan.sesionesRealizadas / plan.sesionesPlanificadas) * 100)
    : 0
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-sky-500' : 'bg-slate-400'

  return (
    <div className="border border-slate-100 rounded-xl p-5 hover:border-sky-200 hover:shadow-sm transition-all bg-white flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {plan.estado}
            </span>
            {plan.codigoCie10 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                {plan.codigoCie10}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-slate-800 mt-1.5 leading-snug line-clamp-2">
            {plan.problemaDescripcion}
          </h4>
        </div>
        {/* Semáforo */}
        <div className={`flex items-center gap-1.5 shrink-0 rounded-full border px-2 py-1 ${alarm.badge}`}>
          <span className={`h-2 w-2 rounded-full ${alarm.dot}`} />
          <span className="text-[10px] font-bold">{alarm.label}</span>
        </div>
      </div>

      {/* Progreso */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500">Sesiones realizadas</span>
          <span className="text-sky-600 font-bold">{plan.sesionesRealizadas} / {plan.sesionesPlanificadas}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-slate-400">{pct}% completado</p>
      </div>

      {plan.objetivoGeneral && (
        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 border-t border-slate-50 pt-2">
          <span className="font-semibold text-slate-600">Objetivo:</span> {plan.objetivoGeneral}
        </p>
      )}

      <div className="flex gap-3 text-[10px] text-slate-400">
        <span>Inicio: <b className="text-slate-600">{new Date(plan.fechaInicio).toLocaleDateString('es-EC')}</b></span>
        <span>Fin est.: <b className="text-slate-600">{new Date(plan.fechaFinEstimada).toLocaleDateString('es-EC')}</b></span>
      </div>

      <button
        type="button"
        onClick={onManage}
        className="mt-auto w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold h-9 hover:bg-slate-700 transition-colors"
      >
        <TrendingUp className="h-3.5 w-3.5" />
        Ver Timeline & Gestionar
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function TratamientosView() {
  const [pacientes, setPacientes]         = useState<PacienteResumenDto[]>([])
  const [stats, setStats]                 = useState<EstadisticasDashboardDto | null>(null)
  const [contexto, setContexto]           = useState<ContextoPlanesDto | null>(null)
  const [loadingList, setLoadingList]     = useState(false)
  const [loadingCtx, setLoadingCtx]       = useState(false)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState<FilterKey>('todos')
  const [selectedId, setSelectedId]       = useState<number | null>(null)
  const [detailPlan, setDetailPlan]       = useState<SelectedPlan | null>(null)

  // Carga inicial: lista + estadísticas en paralelo
  const loadInitial = useCallback(async () => {
    setLoadingList(true)
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        getResumenPacientes(),
        getEstadisticasDashboard(),
      ])
      if (listRes.status === 'fulfilled')  setPacientes(listRes.value)
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { void loadInitial() }, [loadInitial])

  // Seleccionar paciente → cargar su contexto
  const selectPaciente = useCallback(async (pacienteId: number) => {
    setSelectedId(pacienteId)
    setContexto(null)
    setLoadingCtx(true)
    try {
      const ctx = await getContextoPlanes(pacienteId)
      setContexto(ctx)
    } catch {
      setContexto(null)
    } finally {
      setLoadingCtx(false)
    }
  }, [])

  // Filtrado lista izquierda
  const visiblePacientes = useMemo(() => {
    let list = pacientes
    if (filter === 'riesgo') {
      list = list.filter(p => p.peorAlarma === 'ROJO' || p.peorAlarma === 'NARANJA')
    }
    // 'finalizando' no tiene campo en PacienteResumenDto — filtrar en backend via stats
    const q = search.toLowerCase()
    if (!q) return list
    return list.filter(
      p => p.pacienteNombre.toLowerCase().includes(q) || p.hcl.toLowerCase().includes(q)
    )
  }, [pacientes, filter, search])

  const selectedPaciente = pacientes.find(p => p.pacienteId === selectedId)
  const allPlanes = useMemo(
    () => contexto?.episodios.flatMap(ep => ep.planes) ?? [],
    [contexto]
  )

  if (detailPlan) {
    return (
      <div className="flex-1 overflow-y-auto pb-8">
        <PlanDetailView
          plan={detailPlan.plan}
          pacienteNombre={detailPlan.pacienteNombre}
          hcl={detailPlan.hcl}
          episodioId={detailPlan.episodioId}
          pacienteId={detailPlan.pacienteId}
          onBack={() => setDetailPlan(null)}
          onRefresh={() => {
            void loadInitial()
            if (detailPlan.pacienteId) void selectPaciente(detailPlan.pacienteId)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5" style={{ minHeight: 'calc(100vh - 6rem)' }}>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Planes de Tratamiento</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Supervisión de objetivos y progreso por paciente
            {stats && stats.total > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">
                <Activity className="h-3 w-3" />
                {stats.total} planes activos
              </span>
            )}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o HCL..."
            className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-sky-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* FILTROS PÍLDORA */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'todos'       as FilterKey, label: 'Todos',       count: stats?.total      ?? null, icon: null },
          { key: 'riesgo'      as FilterKey, label: 'En Riesgo',   count: stats?.enRiesgo   ?? null, icon: <AlertTriangle className="h-3 w-3" /> },
          { key: 'finalizando' as FilterKey, label: 'Finalizando', count: stats?.finalizando ?? null, icon: <TrendingUp className="h-3 w-3" /> },
        ]).map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setSelectedId(null); setContexto(null) }}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all outline-none flex items-center gap-1.5',
              'focus-visible:ring-2 focus-visible:ring-sky-400',
              filter === f.key
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700',
            ].join(' ')}
          >
            {f.icon}
            {f.label}
            {f.count !== null && (
              <span className={`font-bold ${filter === f.key ? 'opacity-80' : 'opacity-60'}`}>
                ({f.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">

        {/* IZQUIERDA: lista de pacientes */}
        <div className="lg:col-span-4 space-y-2 overflow-y-auto pr-1">
          {loadingList ? (
            <div className="flex flex-col items-center py-14 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin mb-2" />
              <p className="text-sm">Cargando pacientes...</p>
            </div>
          ) : visiblePacientes.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="p-4 rounded-full bg-slate-100">
                <Users className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500">
                  {search ? 'Sin resultados' : 'Sin pacientes'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {search
                    ? `No hay coincidencias para "${search}"`
                    : 'No hay planes activos con este filtro'}
                </p>
              </div>
            </div>
          ) : visiblePacientes.map(p => {
            const alarm      = alarmMeta(p.peorAlarma)
            const isSelected = selectedId === p.pacienteId
            return (
              <button
                key={p.pacienteId}
                type="button"
                onClick={() => selectPaciente(p.pacienteId)}
                className={[
                  'w-full text-left p-4 rounded-xl border transition-all group',
                  isSelected
                    ? 'bg-sky-50 border-sky-200 shadow-sm ring-1 ring-sky-200'
                    : 'bg-white border-slate-100 hover:border-sky-200 hover:shadow-sm',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(p.pacienteNombre)}`}>
                    {getInitials(p.pacienteNombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-sky-700">
                      {p.pacienteNombre}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">
                        {p.hcl}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.conteoPlanesActivos} plan{p.conteoPlanesActivos !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${alarm.dot} ${alarm.glow}`} title={alarm.label} />
                    <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'translate-x-0.5 text-sky-500' : 'text-slate-300'}`} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* DERECHA: episodios y planes del paciente */}
        <div className="lg:col-span-8 overflow-y-auto">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 gap-4" style={{ minHeight: 'calc(100vh - 18rem)' }}>
              <div className="p-5 rounded-full bg-slate-100">
                <ClipboardList className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-500">Selecciona un paciente</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">
                  para supervisar sus episodios, planes de tratamiento y timeline clínico
                </p>
              </div>
            </div>
          ) : loadingCtx ? (
            <div className="h-full min-h-96 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              <p className="text-sm text-slate-400">Cargando planes del paciente...</p>
            </div>
          ) : !contexto ? (
            <div className="h-full min-h-96 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 gap-3">
              <AlertTriangle className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-400">No se pudo cargar la información del paciente</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">

              {/* Stats bar */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex flex-wrap gap-5 items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(contexto.pacienteNombre)}`}>
                    {getInitials(contexto.pacienteNombre)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{contexto.pacienteNombre}</p>
                    <p className="text-xs text-slate-400 font-mono">{contexto.hcl}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-100 hidden md:block" />
                <div className="text-center">
                  <p className="text-xs text-slate-400">Episodios abiertos</p>
                  <p className="text-lg font-bold text-sky-600">{contexto.episodios.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Planes activos</p>
                  <p className="text-lg font-bold text-slate-700">
                    {allPlanes.filter(p => p.estado === 'ACTIVO').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Sesiones</p>
                  <p className="text-lg font-bold text-slate-700">
                    {allPlanes.reduce((s, p) => s + p.sesionesRealizadas, 0)}
                    <span className="text-xs font-normal text-slate-400">
                      /{allPlanes.reduce((s, p) => s + p.sesionesPlanificadas, 0)}
                    </span>
                  </p>
                </div>
                {selectedPaciente && (
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Estado general</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {(() => {
                        const alarm = alarmMeta(selectedPaciente.peorAlarma)
                        return (
                          <>
                            <div className={`h-2.5 w-2.5 rounded-full ${alarm.dot} ${alarm.glow}`} />
                            <span className="text-xs font-semibold text-slate-700">{alarm.label}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Episodios agrupados */}
              {contexto.episodios.map(ep => (
                <div key={ep.episodioId} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                      {ep.numeroEpisodio}
                    </span>
                    <p className="text-xs font-semibold text-slate-600 truncate">{ep.motivoConsulta}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(ep.fechaApertura).toLocaleDateString('es-EC')}
                    </span>
                  </div>

                  {ep.planes.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 flex flex-col items-center gap-2 text-slate-400">
                      <ClipboardList className="h-7 w-7 opacity-30" />
                      <p className="text-xs">Sin planes activos en este episodio</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ep.planes.map(plan => (
                        <PlanCard
                          key={plan.planId}
                          plan={plan}
                          onManage={() => setDetailPlan({
                            plan,
                            pacienteNombre: contexto.pacienteNombre,
                            hcl:            contexto.hcl,
                            episodioId:     ep.episodioId,
                            pacienteId:     contexto.pacienteId,
                          })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
