import { useState, useEffect } from 'react'
import {
  getClinicalHistoryByPatientId,
  getClinicalEpisodeHistory,
} from '@/features/dashboard/data/services/clinicalHistoryService'
import { clinicalEpisodeService } from '@/features/dashboard/data/services/clinicalEpisodeService'
import { parseTechniques } from '@/features/dashboard/data/config/treatmentConfig'

export type PlanStatusLevel = 'none' | 'loading' | 'no-hcl' | 'no-episode' | 'no-plan' | 'active' | 'exhausted' | 'closed'

export type PlanStatus = {
  level: PlanStatusLevel
  sesionesPlanificadas: number
  sesionesRealizadas: number   // sum of seguimientos across all active plans
  techniques: string[]
  message: string
}

const IDLE: PlanStatus = {
  level: 'none',
  sesionesPlanificadas: 0,
  sesionesRealizadas: 0,
  techniques: [],
  message: '',
}

/**
 * Given a patientId, asynchronously resolves the patient's active treatment
 * plan status. Used in AppointmentQuickModal to warn when sessions are exhausted.
 */
export function usePlanStatus(patientId: number | null): PlanStatus {
  const [status, setStatus] = useState<PlanStatus>(IDLE)

  useEffect(() => {
    if (!patientId) { setStatus(IDLE); return }

    let cancelled = false
    setStatus(prev => ({ ...prev, level: 'loading' }))

    async function load() {
      try {
        // Step 1: get HCL
        const hcl = await getClinicalHistoryByPatientId(patientId!)
        if (cancelled) return

        // Step 2: get episodes
        const episodes = await getClinicalEpisodeHistory(hcl.numeroHcl)
        if (cancelled) return

        const openEp = episodes.find(e => e.estado === 'ABIERTO')
        if (!openEp) {
          setStatus({ ...IDLE, level: 'no-episode', message: 'Sin episodio clínico activo.' })
          return
        }

        // Step 3: full episode content
        const fullData = await clinicalEpisodeService.getFullEpisodeContent(openEp.id)
        if (cancelled) return

        const plans: any[] = fullData?.planesTratamiento ?? []
        if (plans.length === 0) {
          setStatus({ ...IDLE, level: 'no-plan', message: 'Sin plan de tratamiento registrado.' })
          return
        }

        // Active plans only
        const activePlans = plans.filter(
          (p: any) => p.estado !== 'CERRADO' && p.estado !== 'ALTA' && p.estado !== 'ABANDONO'
        )

        if (activePlans.length === 0) {
          setStatus({ ...IDLE, level: 'closed', message: 'El plan de tratamiento está cerrado.' })
          return
        }

        // Step 4: follow-up counts per active plan (parallel)
        const { getPlanFollowUps } = await import('@/features/dashboard/data/services/clinicalHistoryService')
        const seguimientoCounts = await Promise.all(
          activePlans.map((p: any) =>
            getPlanFollowUps(openEp.id, p.problemaId ?? p.problema_id)
              .then(segs => segs.length)
              .catch(() => 0)
          )
        )
        if (cancelled) return

        const totalPlanificadas = activePlans.reduce((s: number, p: any) => s + (p.sesionesPlanificadas ?? 0), 0)
        const totalRealizadas   = seguimientoCounts.reduce((a, b) => a + b, 0)

        // Extract techniques from all active plans
        const allTechniques = activePlans.flatMap((p: any) =>
          parseTechniques(p.indicacionesEducativas ?? '')
        )
        const techniques = [...new Set(allTechniques)]

        const exhausted = totalRealizadas >= totalPlanificadas && totalPlanificadas > 0

        setStatus({
          level: exhausted ? 'exhausted' : 'active',
          sesionesPlanificadas: totalPlanificadas,
          sesionesRealizadas:   totalRealizadas,
          techniques,
          message: exhausted
            ? `Sesiones agotadas: ${totalRealizadas}/${totalPlanificadas} realizadas.`
            : `Plan activo: ${totalRealizadas}/${totalPlanificadas} sesiones realizadas.`,
        })
      } catch {
        if (!cancelled) setStatus({ ...IDLE, level: 'no-hcl', message: '' })
      }
    }

    load()
    return () => { cancelled = true }
  }, [patientId])

  return status
}
