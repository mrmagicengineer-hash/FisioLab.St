import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../../../auth/data/services/apiClient'
import type {
  ContextoAgendamientoResponse,
  ContextoAgendamientoEpisodio,
  ContextoAgendamientoPlan,
  ApiContextoAgendamientoResponse,
  ApiContextoEpisodio,
  ApiContextoPlan,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

function mapPlan(p: ApiContextoPlan): ContextoAgendamientoPlan {
  return {
    id:                  p.planId,
    tipoTratamiento:     p.objetivoGeneral,
    sesionesRealizadas:  p.sesionesRealizadas,
    sesionesPlanificadas: p.sesionesPlanificadas,
    sesionesRestantes:   p.sesionesRestantes,
    costoSesion:         p.costoSesion,
    estado:              p.estadoPlan,
  }
}

function mapEpisodio(ep: ApiContextoEpisodio): ContextoAgendamientoEpisodio {
  return {
    id:             ep.episodioId,
    numeroEpisodio: ep.numeroEpisodio,
    diagnostico:    ep.motivoConsulta,
    estado:         ep.estadoEpisodio,
    planes:         (ep.planes ?? []).map(mapPlan),
  }
}

function normalizeResponse(raw: unknown): ContextoAgendamientoResponse {
  if (!raw || typeof raw !== 'object') return { episodios: [] }

  const obj = raw as Record<string, unknown>

  // API canonical format: { episodiosAbiertos: [...] }
  if (Array.isArray(obj.episodiosAbiertos)) {
    return {
      episodios: (obj.episodiosAbiertos as ApiContextoEpisodio[]).map(mapEpisodio),
    }
  }

  // Fallback: array legacy format or { episodios: [...] } already normalized
  if (Array.isArray(obj.episodios)) {
    // Check if already normalized (has `diagnostico`) or raw (has `motivoConsulta`)
    const first = obj.episodios[0] as Record<string, unknown> | undefined
    if (first && 'episodioId' in first) {
      return {
        episodios: (obj.episodios as ApiContextoEpisodio[]).map(mapEpisodio),
      }
    }
    return { episodios: obj.episodios as ContextoAgendamientoEpisodio[] }
  }

  if (Array.isArray(raw)) {
    const arr = raw as ApiContextoEpisodio[]
    const first = arr[0] as Record<string, unknown> | undefined
    if (first && 'episodioId' in first) {
      return { episodios: arr.map(mapEpisodio) }
    }
    return { episodios: arr as unknown as ContextoAgendamientoEpisodio[] }
  }

  return { episodios: [] }
}

export function usePatientContext(patientId: number | null) {
  const [data, setData] = useState<ContextoAgendamientoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchContext = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchWithAuth(
          `${API_BASE_URL}/pacientes/${patientId}/contexto-agendamiento`
        )
        if (!response.ok) {
          let detail = ''
          try { detail = await response.text() } catch { /* ignore */ }
          throw new Error(`HTTP ${response.status} - ${detail || 'Error al cargar contexto clínico'}`)
        }
        const rawResult = await response.json()
        setData(normalizeResponse(rawResult))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContext()
  }, [patientId])

  return { data, isLoading, error }
}
