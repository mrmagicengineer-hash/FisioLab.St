import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface SessionProgressIndicatorProps {
  realizadas: number
  planificadas: number
  episodioId?: string
  planId?: string
}

export function SessionProgressIndicator({ realizadas, planificadas, episodioId, planId }: SessionProgressIndicatorProps) {
  const isExhausted = realizadas >= planificadas
  const percentage = Math.min((realizadas / planificadas) * 100, 100)
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  useEffect(() => {
    if (episodioId && planId) {
      import('../../dashboard/data/services/clinicalHistoryService').then(m => {
        m.getHistorialSesionesPorEpisodio(Number(episodioId)).then(sesiones => {
          const signed = sesiones
            .filter((s: any) => String(s.planTratamientoId) === planId && s.estado === 'FIRMADA')
            .sort((a: any, b: any) => new Date(b.fechaHoraInicio).getTime() - new Date(a.fechaHoraInicio).getTime())
          setRecentSessions(signed)
        }).catch(() => {})
      })
    } else {
      setRecentSessions([])
    }
  }, [episodioId, planId])

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <div className="flex w-full items-center justify-between text-[11px] font-medium">
        <span className={cn(isExhausted ? 'text-destructive' : 'text-muted-foreground')}>
          {isExhausted ? 'Sesiones agotadas' : `Progreso de plan activo: Sesión ${realizadas + 1} de ${planificadas}`}
        </span>
        <span className="text-muted-foreground">{realizadas}/{planificadas} realizadas</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            isExhausted ? 'bg-destructive' : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {recentSessions.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          <span className="text-[10px] font-medium text-slate-500">Últimas sesiones realizadas:</span>
          <div className="flex flex-wrap gap-1.5">
            {recentSessions.slice(0, 3).map((ses) => (
              <span key={ses.id} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                #{ses.numeroSesionEnPlan ?? '?'} - {new Date(ses.fechaHoraInicio).toLocaleDateString('es-EC')}
              </span>
            ))}
            {recentSessions.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 text-slate-400">+{recentSessions.length - 3} más</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
