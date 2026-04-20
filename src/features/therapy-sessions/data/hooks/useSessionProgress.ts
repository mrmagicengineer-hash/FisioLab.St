import { useState, useEffect } from 'react'
import { getHistorialSesiones } from '../services/therapySessionService'
import type { SessionProgress } from '../types'

type Options = {
  episodioId?: string | number
  planId?: string | number
  totalFromPlan?: number
}

export function useSessionProgress({ episodioId, planId, totalFromPlan }: Options): SessionProgress {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!episodioId) {
      setCurrent(1)
      return
    }

    let isMounted = true

    getHistorialSesiones(Number(episodioId)).then((sesiones) => {
      if (isMounted) {
        // Only count signed sessions for the SAME plan (or all if no plan)
        const relevant = sesiones.filter(s => 
          s.estado === 'FIRMADA' && 
          (!planId || String(s.planTratamientoId) === String(planId))
        )
        setCurrent(relevant.length + 1)
      }
    }).catch(() => {
      if (isMounted) setCurrent(1)
    })

    return () => { isMounted = false }
  }, [episodioId, planId])

  return {
    current,
    total: totalFromPlan ?? 0,
  }
}
