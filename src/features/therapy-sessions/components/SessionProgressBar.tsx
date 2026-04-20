import type { SessionProgress } from '../data/types'

type Props = {
  progress: SessionProgress
  isLocked?: boolean
}

export function SessionProgressBar({ progress, isLocked }: Props) {
  const { current, total } = progress
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Progreso
        </span>
        <span className="text-sm font-semibold text-slate-700">
          Sesión {current}{total > 0 ? ` de ${total}` : ''}
        </span>
      </div>

      {total > 0 && (
        <div className="flex flex-1 items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#1A5276] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-slate-400">
            {Math.round(pct)}%
          </span>
        </div>
      )}

      {isLocked && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Firmada
        </span>
      )}
    </div>
  )
}
