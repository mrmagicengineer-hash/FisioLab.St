import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import {
  registerPlanFollowUp,
  type CreatePlanFollowUpRequest,
  type ResultadoGeneral,
} from '../../data/services/clinicalHistoryService'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodioId: number
  problemaId: number
  numeroEpisodio: string
  onSuccess?: () => void
}

type ResultadoOption = {
  value: ResultadoGeneral
  label: string
  description: string
  color: string
}

const RESULTADO_OPTIONS: ResultadoOption[] = [
  { value: 'MEJORA',    label: 'Mejora',      description: 'El paciente muestra progreso positivo',   color: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'ESTABLE',   label: 'Estable',     description: 'Sin cambios significativos',              color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'DETERIORO', label: 'Deterioro',   description: 'El estado ha empeorado o hay regresión',  color: 'border-orange-300 bg-orange-50 text-orange-700' },
]

const todayIso = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: CreatePlanFollowUpRequest = {
  fechaSeguimiento: todayIso(),
  porcentajeAvance: 0,
  resultadosObtenidos: '',
  ajustes: '',
  resultadoGeneral: 'MEJORA',
}

export function CreatePlanFollowUpDrawer({
  open,
  onOpenChange,
  episodioId,
  problemaId,
  numeroEpisodio,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreatePlanFollowUpRequest>(EMPTY_FORM)

  useEffect(() => {
    if (!open) setForm({ ...EMPTY_FORM, fechaSeguimiento: todayIso() })
  }, [open])

  const set = <K extends keyof CreatePlanFollowUpRequest>(
    key: K,
    value: CreatePlanFollowUpRequest[K]
  ) => setForm(prev => ({ ...prev, [key]: value }))

  const selectedResultado = RESULTADO_OPTIONS.find(o => o.value === form.resultadoGeneral)!

  const isValid =
    form.fechaSeguimiento !== '' &&
    form.resultadosObtenidos.trim() !== ''

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      await registerPlanFollowUp(episodioId, problemaId, {
        ...form,
        resultadosObtenidos: form.resultadosObtenidos.trim(),
        ajustes: form.ajustes?.trim() || undefined,
      })
      toast.success('Seguimiento registrado', {
        description: `Sesión registrada — ${selectedResultado.label} · Episodio ${numeroEpisodio}.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Error al registrar el seguimiento', {
        description: error instanceof Error ? error.message : 'Intente nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        {/* HEADER */}
        <DrawerHeader className="border-b border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50">
              <Activity className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex flex-col gap-0.5">
              <DrawerTitle className="text-xl font-bold text-slate-800">
                Seguimiento del Plan
              </DrawerTitle>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Episodio: {numeroEpisodio}
              </span>
            </div>
          </div>
        </DrawerHeader>

        {/* BODY */}
        <DrawerBody className="py-6 px-6 overflow-y-auto space-y-5">

          {/* Fecha de seguimiento */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Fecha de Seguimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 transition"
              value={form.fechaSeguimiento}
              onChange={e => set('fechaSeguimiento', e.target.value)}
            />
          </div>

          {/* Porcentaje de avance */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Porcentaje de Avance del Plan
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.porcentajeAvance}
                onChange={e => set('porcentajeAvance', Number(e.target.value))}
                className="flex-1 accent-[#1A5276]"
              />
              <span className="w-14 text-center text-xl font-bold text-[#1A5276] bg-slate-50 border border-slate-200 rounded-lg py-1">
                {form.porcentajeAvance}%
              </span>
            </div>
            {/* Barra visual */}
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A5276] rounded-full transition-all"
                style={{ width: `${form.porcentajeAvance}%` }}
              />
            </div>
          </div>

          {/* Resultados obtenidos */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Resultados Obtenidos <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 resize-none min-h-22.5 transition"
              placeholder="Describe los resultados observados en esta sesión de seguimiento..."
              value={form.resultadosObtenidos}
              onChange={e => set('resultadosObtenidos', e.target.value)}
            />
          </div>

          {/* Ajustes al plan */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Ajustes Realizados al Plan
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 resize-none min-h-[70px] transition"
              placeholder="Ej: Se aumentó la intensidad de los ejercicios, se incorporó termoterapia..."
              value={form.ajustes}
              onChange={e => set('ajustes', e.target.value)}
            />
          </div>

          {/* Resultado general */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Resultado General <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {RESULTADO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('resultadoGeneral', opt.value)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm text-left border transition ${
                    form.resultadoGeneral === opt.value
                      ? opt.color + ' border-2 font-semibold'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold">{opt.label}</span>
                  <span className="ml-2 text-[11px] opacity-75">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className={`min-w-[180px] text-white font-bold transition ${
                isValid ? 'bg-[#1A5276] hover:bg-[#154360]' : 'bg-slate-300 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={loading || !isValid}
            >
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} />Guardando...</>
                : 'Registrar Seguimiento'
              }
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
