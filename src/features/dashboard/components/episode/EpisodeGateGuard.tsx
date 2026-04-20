import { useEffect, useState } from 'react'
import { AlertTriangle, FolderOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getClinicalHistoryByPatientId,
  getClinicalEpisodeHistory,
} from '@/features/dashboard/data/services/clinicalHistoryService'
import type { Patient } from '@/features/agenda/data/types'

type GateStatus = 'loading' | 'ok' | 'no-hcl' | 'no-episode'

type Props = {
  patient: Patient
  onNavigateToRecord?: () => void
  children: React.ReactNode
}

export function EpisodeGateGuard({ patient, onNavigateToRecord, children }: Props) {
  const [status, setStatus] = useState<GateStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const hcl = await getClinicalHistoryByPatientId(patient.id)
        const episodes = await getClinicalEpisodeHistory(hcl.numeroHcl)
        const hasOpen = episodes.some(e => e.estado === 'ABIERTO')
        if (!cancelled) setStatus(hasOpen ? 'ok' : 'no-episode')
      } catch {
        if (!cancelled) setStatus('no-hcl')
      }
    }

    check()
    return () => { cancelled = true }
  }, [patient.id])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-400">Verificando episodio clínico...</span>
      </div>
    )
  }

  if (status === 'no-hcl' || status === 'no-episode') {
    const isNoHcl = status === 'no-hcl'
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <p className="text-base font-semibold text-amber-800">
          {isNoHcl ? 'Sin historia clínica' : 'Sin episodio clínico activo'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-amber-600">
          {isNoHcl
            ? `${patient.fullName} no tiene historia clínica registrada. Crea la historia antes de registrar sesiones.`
            : `${patient.fullName} no tiene un episodio clínico abierto. Abre un episodio desde el expediente antes de registrar la sesión.`}
        </p>
        {onNavigateToRecord && (
          <Button
            className="mt-5 bg-[#1A5276] text-white hover:bg-[#154360]"
            onClick={onNavigateToRecord}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Ir al expediente
          </Button>
        )}
      </div>
    )
  }

  return <>{children}</>
}
