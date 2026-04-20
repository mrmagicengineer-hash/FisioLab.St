import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  Loader2, FilePlus, Target, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createTreatmentPlan,
  type CreateTreatmentPlanRequest,
} from '../../data/services/clinicalHistoryService'

// ── Tipos locales ─────────────────────────────────────────────────────────────

type LocalForm = {
  objetivos:            string
  sesionesPlanificadas: number
  costoSesion:          string
}

type Tab = 'objetivos' | 'sesiones'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'objetivos', label: 'Objetivos',  icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'sesiones',  label: 'Sesiones',   icon: <Clock className="w-3.5 h-3.5" /> },
]

const EMPTY_FORM = (): LocalForm => ({
  objetivos:            '',
  sesionesPlanificadas: 10,
  costoSesion:          '',
})

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodioId: number
  problemaId: number
  numeroEpisodio: string
  onSuccess?: () => void
}

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 transition'
const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase mb-1.5'

// ── Tab: Objetivos ────────────────────────────────────────────────────────────

function ObjetivosTab({
  form,
  onChange,
}: {
  form: LocalForm
  onChange: (patch: Partial<LocalForm>) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>
          Objetivos del Plan <span className="text-red-500">*</span>
        </label>
        <textarea
          className={`${fieldCls} resize-none min-h-40`}
          placeholder="Ej: Bajar EVA de 8 a 2, recuperar marcha normal, reintegrar al paciente a actividades laborales en 10 sesiones..."
          value={form.objetivos}
          onChange={e => onChange({ objetivos: e.target.value })}
          autoFocus
        />
        <p className="text-[10px] text-slate-400 mt-1.5">
          Describe el objetivo general y los hitos esperados del tratamiento.
        </p>
      </div>
    </div>
  )
}

// ── Tab: Sesiones ─────────────────────────────────────────────────────────────

function SesionesTab({
  form,
  onChange,
}: {
  form: LocalForm
  onChange: (patch: Partial<LocalForm>) => void
}) {
  const updateSesiones = (n: number) =>
    onChange({ sesionesPlanificadas: Math.max(1, n) })

  return (
    <div className="space-y-6">
      {/* Stepper sesiones */}
      <div>
        <label className={labelCls}>
          Total de sesiones planificadas <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => updateSesiones(form.sesionesPlanificadas - 1)}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            −
          </button>
          <div className="text-center">
            <span className="text-4xl font-black text-[#1A5276]">{form.sesionesPlanificadas}</span>
            <p className="text-xs text-slate-400 mt-0.5">sesiones</p>
          </div>
          <button
            type="button"
            onClick={() => updateSesiones(form.sesionesPlanificadas + 1)}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            +
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {[6, 10, 12, 16, 20, 24].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => updateSesiones(n)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                form.sesionesPlanificadas === n
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Costo sesión */}
      <div>
        <label className={labelCls}>Costo por sesión (opcional)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={`${fieldCls} pl-8`}
            placeholder="0.00"
            value={form.costoSesion}
            onChange={e => onChange({ costoSesion: e.target.value })}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">
          Se usará para calcular el costo total del plan y la facturación de sesiones.
        </p>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function CreateTreatmentPlanDrawer({
  open,
  onOpenChange,
  episodioId,
  problemaId,
  numeroEpisodio,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState<LocalForm>(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState<Tab>('objetivos')

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM())
      setActiveTab('objetivos')
    }
  }, [open])

  const patch = (p: Partial<LocalForm>) => setForm(prev => ({ ...prev, ...p }))

  const tabHasData: Record<Tab, boolean> = {
    objetivos: form.objetivos.trim() !== '',
    sesiones:  form.sesionesPlanificadas > 0,
  }

  const isValid =
    form.objetivos.trim() !== '' &&
    form.sesionesPlanificadas >= 1

  const handleSubmit = async () => {
    if (!isValid) { setActiveTab('objetivos'); return }
    setLoading(true)
    try {
      const costoNum = form.costoSesion ? parseFloat(form.costoSesion) : undefined
      const payload: CreateTreatmentPlanRequest = {
        objetivos:            form.objetivos.trim(),
        sesionesPlanificadas: form.sesionesPlanificadas,
        ...(costoNum && costoNum > 0 ? { costoSesion: costoNum } : {}),
      }
      await createTreatmentPlan(episodioId, problemaId, payload)
      toast.success('Plan de tratamiento creado', {
        description: `${form.sesionesPlanificadas} sesiones planificadas · Episodio ${numeroEpisodio}.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Error al crear el plan', {
        description: error instanceof Error ? error.message : 'Intente nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    objetivos: <ObjetivosTab form={form} onChange={patch} />,
    sesiones:  <SesionesTab  form={form} onChange={patch} />,
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        {/* HEADER */}
        <DrawerHeader className="border-b border-slate-100 bg-white shadow-sm pb-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 shrink-0">
              <FilePlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DrawerTitle className="text-lg font-bold text-slate-800">
                Plan de Tratamiento
              </DrawerTitle>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                Episodio: {numeroEpisodio}
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mx-6 px-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-[#1A5276] text-[#1A5276]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tabHasData[tab.id] && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </DrawerHeader>

        {/* BODY */}
        <DrawerBody className="py-5 px-6 overflow-y-auto">
          {TAB_CONTENT[activeTab]}
        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-end w-full gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className={`min-w-36 text-white font-bold transition ${
                isValid ? 'bg-[#1A5276] hover:bg-[#154360]' : 'bg-slate-300 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={loading || !isValid}
            >
              {loading
                ? <><Loader2 className="animate-spin mr-2" size={16} />Creando...</>
                : 'Crear Plan'
              }
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
