import { useState, useEffect } from 'react'
import {
  getClinicalHistoryByPatientId,
  getClinicalEpisodeHistory,
  getPlan,
} from '@/features/dashboard/data/services/clinicalHistoryService'
import { clinicalEpisodeService } from '@/features/dashboard/data/services/clinicalEpisodeService'
import { parseTechniques } from '@/features/dashboard/data/config/treatmentConfig'

type PlanTechniquesResult = {
  techniques: string[]
  loading: boolean
}

/**
 * Resolves the list of suggested techniques from the patient's active
 * treatment plan. Used to show "favorites" in the SessionEditorPanel.
 */
export function usePlanTechniques(patientId: number | null): PlanTechniquesResult {
  const [techniques, setTechniques] = useState<string[]>([])
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!patientId) { setTechniques([]); return }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const hcl      = await getClinicalHistoryByPatientId(patientId!)
        const episodes = await getClinicalEpisodeHistory(hcl.numeroHcl)
        const openEp   = episodes.find(e => e.estado === 'ABIERTO')
        if (!openEp || cancelled) return

        const fullData   = await clinicalEpisodeService.getFullEpisodeContent(openEp.id)
        if (cancelled) return

        const problems: any[] = fullData?.problemas ?? []
        const activeProblemIds = problems
          .filter((p: any) => p.estado === 'ACTIVO' || p.estado === 'CRONICO')
          .map((p: any) => p.id as number)

        if (activeProblemIds.length === 0) return

        const plans = await Promise.all(
          activeProblemIds.map(problemId =>
            getPlan(openEp.id, problemId).catch(() => null)
          )
        )
        if (cancelled) return

        const allTechs = plans
          .filter(Boolean)
          .flatMap(p => parseTechniques(p!.indicacionesEducativas ?? ''))

        setTechniques([...new Set(allTechs)])
      } catch { /**/ } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [patientId])

  return { techniques, loading }
}
