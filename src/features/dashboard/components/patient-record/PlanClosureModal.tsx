import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, LogOut, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  registerPlanFollowUp,
  type ResultadoGeneral,
} from '../../data/services/clinicalHistoryService'

type ClosureType = 'ALTA' | 'ABANDONO'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodioId: number
  problemaId: number
  numeroEpisodio: string
  sesionesRealizadas: number
  onSuccess?: () => void
}

const CLOSURE_OPTIONS: {
  value: ClosureType
  label: string
  desc: string
  icon: React.ReactNode
  color: string
  bg: string
  border: string
}[] = [
  {
    value: 'ALTA',
    label: 'Alta terapéutica',
    desc: 'El paciente alcanzó los objetivos del plan. Se otorga el alta con recomendaciones de mantenimiento.',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  {
    value: 'ABANDONO',
    label: 'Abandono / cierre anticipado',
    desc: 'El plan se cierra sin cumplir todos los objetivos. Documentar la razón en la conclusión.',
    icon: <LogOut className="w-5 h-5" />,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
  },
]

export function PlanClosureModal({
  open,
  onOpenChange,
  episodioId,
  problemaId,
  numeroEpisodio,
  sesionesRealizadas,
  onSuccess,
}: Props) {
  const [loading, setLoading]         = useState(false)
  const [closureType, setClosureType] = useState<ClosureType>('ALTA')
  const [conclusion, setConclusion]   = useState('')
  const [confirmed, setConfirmed]     = useState(false)

  if (!open) return null

  const isValid = conclusion.trim().length >= 20 && confirmed

  const handleClose = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      await registerPlanFollowUp(episodioId, problemaId, {
        fechaSeguimiento: new Date().toISOString().slice(0, 10),
        porcentajeAvance: closureType === 'ALTA' ? 100 : undefined as unknown as number,
        resultadosObtenidos: conclusion.trim(),
        resultadoGeneral: closureType as ResultadoGeneral,
      })
      toast.success(
        closureType === 'ALTA' ? 'Alta terapéutica registrada' : 'Plan cerrado',
        { description: `Episodio ${numeroEpisodio} — ${sesionesRealizadas} sesiones realizadas.` }
      )
      onOpenChange(false)
      setConclusion('')
      setConfirmed(false)
      setClosureType('ALTA')
      onSuccess?.()
    } catch (error) {
      toast.error('Error al cerrar el plan', {
        description: error instanceof Error ? error.message : 'Intente nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Cierre de Plan</h2>
              <p className="text-xs text-slate-500">Episodio: {numeroEpisodio}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Esta acción es irreversible. El plan quedará cerrado y no se podrán registrar más sesiones.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Tipo de cierre */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
              Tipo de cierre
            </label>
            <div className="space-y-2">
              {CLOSURE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setClosureType(opt.value)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${
                    closureType === opt.value
                      ? `${opt.bg} ${opt.border} ${opt.color}`
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className={`text-[11px] mt-0.5 font-normal ${closureType === opt.value ? 'opacity-80' : 'text-slate-400'}`}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conclusión */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
              Conclusión clínica <span className="text-red-500">*</span>
              <span className="ml-1 text-slate-300 normal-case font-normal">(mín. 20 caracteres)</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 resize-none min-h-24 transition"
              placeholder={
                closureType === 'ALTA'
                  ? 'Paciente alcanzó objetivos funcionales. Se otorga alta con programa de mantenimiento en domicilio...'
                  : 'Paciente abandona el tratamiento antes de completar el plan por... Se recomienda...'
              }
              value={conclusion}
              onChange={e => setConclusion(e.target.value)}
            />
            <p className={`text-[10px] mt-0.5 text-right ${conclusion.trim().length >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {conclusion.trim().length}/20 caracteres mínimos
            </p>
          </div>

          {/* Resumen */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Sesiones realizadas</span>
            <span className="text-sm font-bold text-slate-800">{sesionesRealizadas}</span>
          </div>

          {/* Confirmación */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1A5276]"
            />
            <span className="text-xs text-slate-600">
              Confirmo que he revisado el historial del plan y que el cierre es apropiado para este paciente.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className={`min-w-36 font-bold text-white transition ${
              isValid
                ? closureType === 'ALTA'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
            onClick={handleClose}
            disabled={loading || !isValid}
          >
            {loading
              ? <><Loader2 className="animate-spin mr-2" size={16} />Cerrando...</>
              : closureType === 'ALTA'
                ? 'Registrar Alta'
                : 'Cerrar Plan'
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
