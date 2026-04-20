import { useMemo } from 'react'
import { Stethoscope, BarChart2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { TimelineEventDto } from '../../data/services/clinicalHistoryService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isoDateKey(s: string) {
  return s.slice(0, 10)
}

const RESULTADO_META: Record<string, { label: string; dot: string; badge: string }> = {
  MEJORA:    { label: 'Mejora',    dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ESTABLE:   { label: 'Estable',   dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border-sky-200'           },
  DETERIORO: { label: 'Deterioro', dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200'  },
  ALTA:      { label: 'Alta',      dot: 'bg-teal-400',    badge: 'bg-teal-50 text-teal-700 border-teal-200'         },
  ABANDONO:  { label: 'Abandono',  dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200'            },
}

const ESTADO_SESION_META: Record<string, { label: string; dot: string; badge: string }> = {
  EN_PROGRESO: { label: 'En progreso', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200'    },
  FINALIZADA:  { label: 'Finalizada',  dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 border-slate-200'    },
  FIRMADA:     { label: 'Firmada',     dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

// ── Sub-items ─────────────────────────────────────────────────────────────────

function SesionSoapItem({ event }: { event: TimelineEventDto }) {
  const meta = ESTADO_SESION_META[event.estadoSesion ?? 'EN_PROGRESO'] ?? ESTADO_SESION_META['EN_PROGRESO']
  const isFirmada = event.notaFirmada === true

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 ${
      isFirmada ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
            isFirmada ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <Stethoscope className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-700">
            Sesión #{event.numeroSesion}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        {isFirmada && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Nota firmada
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 line-clamp-2">{event.resumen}</p>
    </div>
  )
}

function SeguimientoItem({ event }: { event: TimelineEventDto }) {
  const resultado = event.resultadoGeneral ?? 'ESTABLE'
  const meta = RESULTADO_META[resultado] ?? RESULTADO_META['ESTABLE']

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-violet-100 text-violet-600">
            <BarChart2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-700">
            Seguimiento #{event.numeroSesion}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${meta.badge}`}>
            {meta.label}
          </span>
        </div>
        {event.porcentajeAvance !== null && (
          <span className="text-xs font-black text-violet-700">{event.porcentajeAvance}%</span>
        )}
      </div>

      {event.porcentajeAvance !== null && (
        <div className="space-y-1">
          <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-400 transition-all"
              style={{ width: `${Math.min(100, event.porcentajeAvance)}%` }}
            />
          </div>
          <p className="text-[10px] text-violet-500">Avance clínico registrado</p>
        </div>
      )}

      <p className="text-xs text-slate-500 line-clamp-2">{event.resumen}</p>
    </div>
  )
}

// ── Nodo del día (puede agrupar SOAP + seguimiento) ───────────────────────────

type DayGroup = {
  dateKey: string
  displayDate: string
  events: TimelineEventDto[]
}

function DayNode({ group, isLast }: { group: DayGroup; isLast: boolean }) {
  const hasSeguimiento = group.events.some(e => e.tipo === 'SEGUIMIENTO_PLAN')

  return (
    <div className="relative pl-10">
      {/* línea vertical */}
      {!isLast && (
        <div className="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200" />
      )}

      {/* dot */}
      <div className={`absolute left-2 top-2 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ${
        hasSeguimiento ? 'bg-violet-400 ring-violet-200' : 'bg-sky-400 ring-sky-200'
      }`} />

      {/* fecha */}
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
        <span className="text-[11px] font-bold text-slate-500">{group.displayDate}</span>
      </div>

      {/* eventos del día */}
      <div className="space-y-2 mb-5">
        {group.events.map(ev =>
          ev.tipo === 'SESION_SOAP'
            ? <SesionSoapItem key={`soap-${ev.itemId}`} event={ev} />
            : <SeguimientoItem key={`seg-${ev.itemId}`} event={ev} />
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

type Props = {
  events: TimelineEventDto[]
  loading?: boolean
}

export function UnifiedTimeline({ events, loading }: Props) {
  const dayGroups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>()
    for (const ev of events) {
      const key = isoDateKey(ev.fecha)
      if (!map.has(key)) {
        map.set(key, { dateKey: key, displayDate: fmtDate(ev.fecha), events: [] })
      }
      map.get(key)!.events.push(ev)
    }
    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [events])

  if (loading) {
    return (
      <div className="space-y-3 pl-10 pt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (dayGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-slate-300">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm text-slate-400">Sin eventos registrados en este plan</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {dayGroups.map((group, idx) => (
        <DayNode
          key={group.dateKey}
          group={group}
          isLast={idx === dayGroups.length - 1}
        />
      ))}
    </div>
  )
}
