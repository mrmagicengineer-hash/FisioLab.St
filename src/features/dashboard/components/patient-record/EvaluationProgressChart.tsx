import type { EvaluacionDto } from '../../data/services/clinicalHistoryService'
import { ESCALAS_CONFIG } from '../../data/config/evaluationConfig'

type Props = {
  evaluaciones: EvaluacionDto[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function buildPolyline(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  padX: number,
  padY: number,
  min: number,
  max: number
): string {
  if (points.length === 0) return ''
  const range = max - min || 1
  return points
    .map(p => {
      const cx = padX + (p.x / (points.length - 1 || 1)) * (width - padX * 2)
      const cy = padY + (1 - (p.y - min) / range) * (height - padY * 2)
      return `${cx},${cy}`
    })
    .join(' ')
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EvaluationProgressChart({ evaluaciones }: Props) {
  if (evaluaciones.length < 2) return null

  const sorted = [...evaluaciones].sort(
    (a, b) => new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime()
  )

  // Datos EVA
  const evaPoints = sorted.map((e, i) => ({ x: i, y: e.dolor.escalaDolor }))

  // Datos escalas funcionales — una línea por tipo de escala presente
  const escalaTipos = Array.from(
    new Set(sorted.flatMap(e => (e.escalasFuncionales ?? []).map(ef => ef.tipo)))
  )

  const escalaLines = escalaTipos.map(tipo => ({
    tipo,
    label: ESCALAS_CONFIG[tipo].nombre.split('–')[0].trim(),
    points: sorted.map((e, i) => {
      const ef = (e.escalasFuncionales ?? []).find(f => f.tipo === tipo)
      return ef ? { x: i, y: ef.puntajeTotal } : null
    }).filter(Boolean) as { x: number; y: number }[],
  })).filter(l => l.points.length >= 2)

  const W = 560
  const H = 140
  const PX = 36
  const PY = 16

  // EVA: 0-10, invertido (menos es mejor)
  const evaPolyline = buildPolyline(evaPoints, W, H, PX, PY, 0, 10)

  // Colores de líneas para escalas
  const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

  const ticksX = sorted.map((e, i) => {
    const cx = PX + (i / (sorted.length - 1 || 1)) * (W - PX * 2)
    return { cx, label: formatDate(e.fechaRegistro), tipo: e.tipoEvaluacion }
  })

  const evaY = (v: number) => PY + (1 - v / 10) * (H - PY * 2)

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">
        Progreso del episodio ({evaluaciones.length} evaluaciones)
      </p>

      {/* Gráfico EVA */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-slate-500 mb-1">Evolución EVA (dolor)</p>
        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map(v => {
              const y = evaY(v)
              return (
                <g key={v}>
                  <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
                  <text x={PX - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
                </g>
              )
            })}

            {/* Zona verde (EVA 0-3) */}
            <rect x={PX} y={evaY(3)} width={W - PX * 2} height={evaY(0) - evaY(3)}
              fill="#dcfce7" opacity="0.4" />

            {/* Zona roja (EVA 7-10) */}
            <rect x={PX} y={evaY(10)} width={W - PX * 2} height={evaY(7) - evaY(10)}
              fill="#fee2e2" opacity="0.4" />

            {/* Línea EVA */}
            <polyline
              points={evaPolyline}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Puntos EVA */}
            {evaPoints.map((p, i) => {
              const cx = PX + (p.x / (sorted.length - 1 || 1)) * (W - PX * 2)
              const cy = evaY(p.y)
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="4" fill="white" stroke="#ef4444" strokeWidth="2" />
                  <text x={cx} y={cy - 8} textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">{p.y}</text>
                </g>
              )
            })}

            {/* Ticks X */}
            {ticksX.map(({ cx, label, tipo }, i) => (
              <g key={i}>
                <text x={cx} y={H - 2} textAnchor="middle" fontSize="8" fill="#94a3b8">{label}</text>
                {tipo !== 'INICIAL' && (
                  <text x={cx} y={H - 10} textAnchor="middle" fontSize="7" fill="#64748b" fontStyle="italic">
                    {tipo === 'REEVALUACION' ? 'Rev.' : 'Alta'}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Gráficos de escalas funcionales */}
      {escalaLines.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 mb-1">Escalas funcionales</p>
          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(v => {
                const y = PY + (1 - v / 100) * (H - PY * 2)
                return (
                  <g key={v}>
                    <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
                    <text x={PX - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
                  </g>
                )
              })}

              {/* Líneas de escalas */}
              {escalaLines.map(({ points, tipo }, li) => {
                const color = COLORS[li % COLORS.length]
                const pl = buildPolyline(points, W, H, PX, PY, 0, 100)
                return (
                  <g key={tipo}>
                    <polyline points={pl} fill="none" stroke={color} strokeWidth="2"
                      strokeLinejoin="round" strokeLinecap="round" />
                    {points.map((p, i) => {
                      const cx = PX + (p.x / (sorted.length - 1 || 1)) * (W - PX * 2)
                      const cy = PY + (1 - p.y / 100) * (H - PY * 2)
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="4" fill="white" stroke={color} strokeWidth="2" />
                          <text x={cx} y={cy - 7} textAnchor="middle" fontSize="9" fill={color} fontWeight="bold">{p.y}</text>
                        </g>
                      )
                    })}
                  </g>
                )
              })}

              {/* Ticks X */}
              {ticksX.map(({ cx, label }, i) => (
                <text key={i} x={cx} y={H - 2} textAnchor="middle" fontSize="8" fill="#94a3b8">{label}</text>
              ))}
            </svg>
          </div>

          {/* Leyenda */}
          <div className="flex gap-3 mt-2 flex-wrap">
            {escalaLines.map(({ label, tipo }, li) => (
              <span key={tipo} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: COLORS[li % COLORS.length] }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
