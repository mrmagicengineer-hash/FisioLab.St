import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { usePatientContext } from '../data/hooks/usePatientContext'
import { SessionProgressIndicator } from './SessionProgressIndicator'


interface ClinicalContextSelectorProps {
  patientId: number | null
  episodioId: string
  planId?: string
  onChangeEpisodio: (id: string, diagnostico: string) => void
  onChangePlan: (id: string | undefined, planResumen: string | undefined) => void
  error?: string
}

export function ClinicalContextSelector({
  patientId,
  episodioId,
  planId,
  onChangeEpisodio,
  onChangePlan,
  error
}: ClinicalContextSelectorProps) {
  const { data, isLoading, error: fetchError } = usePatientContext(patientId)

  // Si cambia el paciente o se recarga, e intenta preseleccionar si hay solo 1 activo
  useEffect(() => {
    if (data && data.episodios.length > 0 && !episodioId) {
      const activeEpisode = data.episodios[0]
      onChangeEpisodio(String(activeEpisode.id), activeEpisode.diagnostico)
    }
  }, [data, episodioId, onChangeEpisodio])

  if (!patientId) return null

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground p-2 rounded border border-dashed border-slate-200">
        <Loader2 className="size-3 animate-spin" />
        <span>Cargando contexto clínico del paciente...</span>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="text-[11px] text-destructive p-2 rounded border border-destructive/20 bg-destructive/5">
        Error al cargar episodios: {fetchError}
      </div>
    )
  }

  if (!data || data.episodios.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground p-2 rounded border border-dashed border-slate-200">
        El paciente no tiene episodios clínicos activos. Se creará una cita independiente.
      </div>
    )
  }

  const selectedEpisode = data.episodios.find(e => String(e.id) === episodioId)
  const selectedPlan = selectedEpisode?.planes.find(p => String(p.id) === planId)

  const handleEpisodioChange = (value: string | null) => {
    if (value === 'none') {
      onChangeEpisodio('', '')
      onChangePlan(undefined, undefined)
      return
    }
    const ep = data.episodios.find(e => String(e.id) === value)
    if (ep) {
      onChangeEpisodio(String(ep.id), ep.diagnostico)
      // Auto-select plan si hay solo uno
      if (ep.planes.length === 1) {
        onChangePlan(String(ep.planes[0].id), ep.planes[0].tipoTratamiento)
      } else {
        onChangePlan(undefined, undefined)
      }
    }
  }

  const handlePlanChange = (value: string | null) => {
    if (value === 'none') {
      onChangePlan(undefined, undefined)
      return
    }
    const pl = selectedEpisode?.planes.find(p => String(p.id) === value)
    if (pl) {
      onChangePlan(String(pl.id), pl.tipoTratamiento)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-3 bg-slate-50/50">
      <div className="space-y-1.5">
        <Label className="text-xs">Episodio Clínico (Motivo de Consulta)</Label>
        <Select value={episodioId || 'none'} onValueChange={handleEpisodioChange}>
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder="Seleccione un episodio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-muted-foreground italic">
              Ninguno (Cita independiente)
            </SelectItem>
            {data.episodios.map((ep) => (
              <SelectItem key={ep.id} value={String(ep.id)}>
                {ep.diagnostico}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>

      {selectedEpisode && selectedEpisode.planes.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <Label className="text-xs text-muted-foreground">Plan de Tratamiento (Opcional)</Label>
          <Select value={planId || 'none'} onValueChange={handlePlanChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un plan vigente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-muted-foreground italic">
                Sin plan específico
              </SelectItem>
              {selectedEpisode.planes.map((plan) => (
                <SelectItem key={plan.id} value={String(plan.id)}>
                  {plan.tipoTratamiento} ({plan.sesionesRealizadas}/{plan.sesionesPlanificadas} sesiones)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPlan && (
            <SessionProgressIndicator 
              realizadas={selectedPlan.sesionesRealizadas} 
              planificadas={selectedPlan.sesionesPlanificadas} 
            />
          )}
        </div>
      )}
    </div>
  )
}
