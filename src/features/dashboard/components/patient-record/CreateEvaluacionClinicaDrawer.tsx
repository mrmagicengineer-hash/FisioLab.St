import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Loader2, Stethoscope, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../../auth/context/AuthContext'
import {
  createEvaluacionClinica,
  type CreateEvaluacionClinicaRequest,
} from '../../data/services/clinicalHistoryService'

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodioId: number
  numeroEpisodio: string
  motivoConsulta?: string
  onSuccess?: () => void
}

// ── Form state ────────────────────────────────────────────────────────────────

type LocalForm = {
  fechaEvaluacion:      string
  fisioterapeutaId:     string
  pa:                   string
  fc:                   string
  motivoConsulta:       string
  observacionGeneral:   string
  hallazgosPrincipales: string[]
  escalaEva:            number
  impresionDiagnostica: string
  planInicial:          string
}

const todayLocalIso = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const EMPTY_FORM = (): LocalForm => ({
  fechaEvaluacion:      todayLocalIso(),
  fisioterapeutaId:     '',
  pa:                   '',
  fc:                   '',
  motivoConsulta:       '',
  observacionGeneral:   '',
  hallazgosPrincipales: [''],
  escalaEva:            0,
  impresionDiagnostica: '',
  planInicial:          '',
})

// ── UI helpers ────────────────────────────────────────────────────────────────

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 transition'
const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase mb-1.5'

const evaColor = (v: number) => {
  if (v <= 3) return 'bg-emerald-500 text-white border-emerald-500 scale-110 shadow-md'
  if (v <= 5) return 'bg-yellow-400 text-white border-yellow-400 scale-110 shadow-md'
  if (v <= 7) return 'bg-orange-500 text-white border-orange-500 scale-110 shadow-md'
  return 'bg-red-600 text-white border-red-600 scale-110 shadow-md'
}

const evaLabel = (v: number) => {
  if (v === 0) return 'Sin dolor'
  if (v <= 2)  return 'Leve'
  if (v <= 4)  return 'Moderado'
  if (v <= 6)  return 'Intenso'
  if (v <= 8)  return 'Severo'
  if (v <= 9)  return 'Muy severo'
  return 'Insoportable'
}

const evaTextCls = (v: number) => {
  if (v <= 3) return 'text-emerald-700 bg-emerald-50'
  if (v <= 5) return 'text-yellow-700 bg-yellow-50'
  if (v <= 7) return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CreateEvaluacionClinicaDrawer({
  open,
  onOpenChange,
  episodioId,
  numeroEpisodio,
  motivoConsulta,
  onSuccess,
}: Props) {
  const { userName } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState<LocalForm>(() => ({
    ...EMPTY_FORM(),
    fisioterapeutaId: userName ? `Fstp ${userName}` : '',
    motivoConsulta: motivoConsulta ?? '',
  }))

  useEffect(() => {
    if (!open) {
      setForm({
        ...EMPTY_FORM(),
        fisioterapeutaId: userName ? `Fstp ${userName}` : '',
        motivoConsulta: motivoConsulta ?? '',
      })
    }
  }, [open, userName, motivoConsulta])

  const patch = (p: Partial<LocalForm>) => setForm(prev => ({ ...prev, ...p }))

  const addHallazgo = () => patch({ hallazgosPrincipales: [...form.hallazgosPrincipales, ''] })

  const updateHallazgo = (i: number, v: string) =>
    patch({ hallazgosPrincipales: form.hallazgosPrincipales.map((h, idx) => idx === i ? v : h) })

  const removeHallazgo = (i: number) =>
    patch({ hallazgosPrincipales: form.hallazgosPrincipales.filter((_, idx) => idx !== i) })

  const isValid =
    form.motivoConsulta.trim() !== '' &&
    form.impresionDiagnostica.trim() !== '' &&
    form.planInicial.trim() !== '' &&
    form.hallazgosPrincipales.some(h => h.trim() !== '') &&
    form.pa.trim() !== '' &&
    form.fc !== '' &&
    Number(form.fc) >= 30 && Number(form.fc) <= 250

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      const hallazgos = form.hallazgosPrincipales.filter(h => h.trim() !== '')
      const payload: CreateEvaluacionClinicaRequest = {
        fechaEvaluacion:      form.fechaEvaluacion + ':00',
        fisioterapeutaId:     form.fisioterapeutaId.trim() || undefined,
        signosVitales:        { pa: form.pa.trim(), fc: Number(form.fc) },
        motivoConsulta:       form.motivoConsulta.trim(),
        observacionGeneral:   form.observacionGeneral.trim() || undefined,
        hallazgosPrincipales: hallazgos,
        escalaEva:            form.escalaEva,
        impresionDiagnostica: form.impresionDiagnostica.trim(),
        planInicial:          form.planInicial.trim(),
      }
      await createEvaluacionClinica(episodioId, payload)
      toast.success('Evaluación clínica registrada', {
        description: `EVA ${form.escalaEva}/10 · Episodio ${numeroEpisodio}.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Error al registrar la evaluación', {
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
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 shrink-0">
              <Stethoscope className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <DrawerTitle className="text-lg font-bold text-slate-800">
                Evaluación Clínica Rápida
              </DrawerTitle>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Episodio: {numeroEpisodio}
              </span>
            </div>
          </div>
        </DrawerHeader>

        {/* BODY */}
        <DrawerBody className="py-5 px-6 overflow-y-auto space-y-5">

          {/* Fecha y fisioterapeuta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha y hora <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                className={fieldCls}
                value={form.fechaEvaluacion}
                onChange={e => patch({ fechaEvaluacion: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>ID Fisioterapeuta</label>
              <input
                className={fieldCls}
                placeholder="Ej: FT-001"
                value={form.fisioterapeutaId}
                onChange={e => patch({ fisioterapeutaId: e.target.value })}
              />
            </div>
          </div>

          {/* Signos vitales */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Signos Vitales</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Presión arterial (PA) <span className="text-red-500">*</span></label>
                <input
                  className={fieldCls}
                  placeholder="120/80"
                  maxLength={20}
                  value={form.pa}
                  onChange={e => patch({ pa: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>FC (lpm) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  className={fieldCls}
                  placeholder="75"
                  value={form.fc}
                  onChange={e => patch({ fc: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Motivo de consulta */}
          <div>
            <label className={labelCls}>Motivo de consulta <span className="text-red-500">*</span></label>
            <textarea
              className={`${fieldCls} resize-none min-h-18`}
              maxLength={500}
              placeholder="Ej: Dolor punzante en zona lumbar y limitación en tobillo..."
              value={form.motivoConsulta}
              onChange={e => patch({ motivoConsulta: e.target.value })}
            />
          </div>

          {/* Observación general */}
          <div>
            <label className={labelCls}>Observación general</label>
            <textarea
              className={`${fieldCls} resize-none min-h-16`}
              maxLength={500}
              placeholder="Ej: Marcha claudicante, evita apoyo en MID..."
              value={form.observacionGeneral}
              onChange={e => patch({ observacionGeneral: e.target.value })}
            />
          </div>

          {/* Hallazgos principales */}
          <div>
            <label className={labelCls}>Hallazgos principales <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {form.hallazgosPrincipales.map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={`${fieldCls} flex-1`}
                    maxLength={300}
                    placeholder={`Hallazgo ${i + 1}...`}
                    value={h}
                    onChange={e => updateHallazgo(i, e.target.value)}
                  />
                  {form.hallazgosPrincipales.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHallazgo(i)}
                      className="text-slate-400 hover:text-red-400 transition shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addHallazgo}
                className="flex items-center gap-1.5 text-xs text-[#1A5276] font-semibold hover:underline mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar hallazgo
              </button>
            </div>
          </div>

          {/* Escala EVA */}
          <div>
            <label className={labelCls}>Escala EVA (0–10) <span className="text-red-500">*</span></label>
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => patch({ escalaEva: n })}
                  className={`flex-1 h-10 rounded-lg text-xs font-bold border-2 transition-all ${
                    form.escalaEva === n
                      ? evaColor(n)
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden flex mb-2">
              {Array.from({ length: 11 }, (_, n) => (
                <div
                  key={n}
                  className={`flex-1 transition-opacity ${
                    n <= 3 ? 'bg-emerald-400' : n <= 5 ? 'bg-yellow-400' : n <= 7 ? 'bg-orange-500' : 'bg-red-600'
                  } ${n > form.escalaEva ? 'opacity-20' : 'opacity-100'}`}
                />
              ))}
            </div>
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ${evaTextCls(form.escalaEva)}`}>
              <span className="text-xl font-black">{form.escalaEva}</span>
              <span className="text-sm font-semibold">{evaLabel(form.escalaEva)}</span>
            </div>
          </div>

          {/* Impresión diagnóstica */}
          <div>
            <label className={labelCls}>Impresión diagnóstica <span className="text-red-500">*</span></label>
            <textarea
              className={`${fieldCls} resize-none min-h-18`}
              maxLength={500}
              placeholder="Ej: Esguince grado II tobillo izquierdo + lumbalgia mecánica..."
              value={form.impresionDiagnostica}
              onChange={e => patch({ impresionDiagnostica: e.target.value })}
            />
          </div>

          {/* Plan inicial */}
          <div>
            <label className={labelCls}>Plan inicial <span className="text-red-500">*</span></label>
            <textarea
              className={`${fieldCls} resize-none min-h-20`}
              maxLength={1000}
              placeholder="Ej: Crioterapia 15min, AINES, reposo relativo 48h. Reevaluación en 3 días..."
              value={form.planInicial}
              onChange={e => patch({ planInicial: e.target.value })}
            />
          </div>
        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-end w-full gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className={`min-w-44 text-white font-bold transition ${
                isValid ? 'bg-[#1A5276] hover:bg-[#154360]' : 'bg-slate-300 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={loading || !isValid}
            >
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} />Guardando...</>
                : 'Registrar Evaluación'
              }
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
