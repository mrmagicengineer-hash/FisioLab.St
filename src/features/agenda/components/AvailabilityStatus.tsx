import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { checkDisponibilidad } from '../data/services/availabilityService'
import { cn } from '@/lib/utils'

interface AvailabilityStatusProps {
  fecha: string
  startTime: string
  endTime: string
  profesionalId: number | null
  onAvailabilityChange?: (available: boolean) => void
}

export function AvailabilityStatus({
  fecha,
  startTime,
  endTime,
  profesionalId,
  onAvailabilityChange,
}: AvailabilityStatusProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'conflict' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!fecha || !startTime || !endTime || !profesionalId) {
      setStatus('idle')
      return
    }

    const check = async () => {
      setStatus('checking')
      try {
        const desde = `${fecha}T${startTime}:00`
        const hasta = `${fecha}T${endTime}:00`
        const disponible = await checkDisponibilidad(profesionalId, desde, hasta)

        if (disponible) {
          setStatus('available')
          setMessage('Horario disponible')
          onAvailabilityChange?.(true)
        } else {
          setStatus('conflict')
          setMessage('Horario no disponible')
          onAvailabilityChange?.(false)
        }
      } catch {
        setStatus('error')
        setMessage('No se pudo verificar disponibilidad')
        onAvailabilityChange?.(true) // no bloquear submit en error de red
      }
    }

    const timer = setTimeout(check, 400)
    return () => clearTimeout(timer)
  }, [fecha, startTime, endTime, profesionalId, onAvailabilityChange])

  if (status === 'idle') return null

  return (
    <div className={cn(
      'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium border w-fit transition-colors',
      status === 'checking' && 'border-slate-200 bg-slate-50 text-slate-500',
      status === 'available' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
      status === 'conflict' && 'border-destructive/40 bg-destructive/10 text-destructive',
      status === 'error' && 'border-amber-200 bg-amber-50 text-amber-700'
    )}>
      {status === 'checking' && <Loader2 className="size-3 animate-spin" />}
      {status === 'available' && <CheckCircle2 className="size-3" />}
      {(status === 'conflict' || status === 'error') && <AlertTriangle className="size-3" />}
      {status === 'checking' ? 'Verificando disponibilidad...' : message}
    </div>
  )
}
