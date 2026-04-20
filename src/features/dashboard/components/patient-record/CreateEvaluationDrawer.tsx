import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  Loader2, ClipboardPlus, Activity, Ruler, Zap, BarChart2, Search,
  ChevronDown, ChevronUp, TrendingDown, TrendingUp, Minus,
  FileText, Target, ChevronLeft, ChevronRight, Plus, X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  registerEvaluation,
  type CreateEvaluacionRequest,
  type TipoEvaluacion,
  type SignosVitales,
  type EvaluacionDolor,
  type ExamenSegmento,
  type MedicionGoniometrica,
  type MedicionFuerza,
  type EscalaFuncional,
  type PruebaEspecial,
  type ResultadoPrueba,
  type TipoEscala,
  type EvaluacionDto,
} from '../../data/services/clinicalHistoryService'
import {
  SEGMENTOS_CORPORALES,
  DEFAULT_GONIOMETRIA,
  GRUPOS_MUSCULARES,
  PRUEBAS_ESPECIALES_CATALOGO,
  ESCALAS_CONFIG,
} from '../../data/config/evaluationConfig'

// ── Tipos internos ────────────────────────────────────────────────────────────

type Tab = 'anamnesis' | 'biometria' | 'examen' | 'goniometria' | 'fuerza' | 'escalas' | 'pruebas' | 'riesgo'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'anamnesis',   label: 'Anamnesis',      icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'biometria',   label: 'Biometría',       icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'examen',      label: 'Examen Físico',   icon: <ClipboardPlus className="w-3.5 h-3.5" /> },
  { id: 'goniometria', label: 'Goniometría',     icon: <Ruler className="w-3.5 h-3.5" /> },
  { id: 'fuerza',      label: 'Fuerza',          icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'escalas',     label: 'Escalas',         icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: 'pruebas',     label: 'Pruebas',         icon: <Search className="w-3.5 h-3.5" /> },
  { id: 'riesgo',      label: 'Plan y Riesgo',   icon: <Target className="w-3.5 h-3.5" /> },
]

const TAB_IDS = TABS.map(t => t.id)

type AnamnesisForm = {
  tiempoEvolucion:       string
  unidadTiempo:          'dias' | 'semanas' | 'meses'
  mecanismoLesion:       string
  antecedentesEpisodio:  string
  factoresAgravantes:    string
  factoresAliviantes:    string
  impactoAVD:            'ninguno' | 'leve' | 'moderado' | 'severo'
}

type NivelRiesgo = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO'

type RiesgoForm = {
  nivelRiesgo:             NivelRiesgo
  factoresRiesgo:          string[]
  objetivoGeneral:         string
  objetivosEspecificos:    string[]
  sesionesPlanificadas:    number
  fechaFinEstimada:        string
  indicacionesEducativas:  string
}

const EMPTY_ANAMNESIS: AnamnesisForm = {
  tiempoEvolucion:      '',
  unidadTiempo:         'semanas',
  mecanismoLesion:      '',
  antecedentesEpisodio: '',
  factoresAgravantes:   '',
  factoresAliviantes:   '',
  impactoAVD:           'moderado',
}

const EMPTY_RIESGO: RiesgoForm = {
  nivelRiesgo:            'AMARILLO',
  factoresRiesgo:         [],
  objetivoGeneral:        '',
  objetivosEspecificos:   [''],
  sesionesPlanificadas:   10,
  fechaFinEstimada:       '',
  indicacionesEducativas: '',
}

const FACTORES_RIESGO_CATALOGO = [
  'Edad > 65 años',
  'Obesidad (IMC > 30)',
  'Diabetes',
  'Hipertensión arterial',
  'Osteoporosis',
  'Lesión recurrente',
  'Trabajo de alta demanda física',
  'Sedentarismo',
  'Antecedente quirúrgico',
  'Dolor crónico (> 3 meses)',
]

const NIVEL_RIESGO_CONFIG: Record<NivelRiesgo, { label: string; color: string; bg: string }> = {
  VERDE:    { label: 'Bajo riesgo',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
  AMARILLO: { label: 'Riesgo moderado', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-300'   },
  NARANJA:  { label: 'Riesgo alto',     color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-300'  },
  ROJO:     { label: 'Riesgo crítico',  color: 'text-red-700',     bg: 'bg-red-50 border-red-300'        },
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodioId: number
  numeroEpisodio: string
  evaluaciones: EvaluacionDto[]
  onSuccess?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const calcIMC = (peso?: number, talla?: number): string => {
  if (!peso || !talla || talla === 0) return '—'
  return (peso / Math.pow(talla / 100, 2)).toFixed(1)
}

const imcLabel = (imc: string): string => {
  const v = parseFloat(imc)
  if (isNaN(v)) return ''
  if (v < 18.5) return 'Bajo peso'
  if (v < 25)   return 'Normal'
  if (v < 30)   return 'Sobrepeso'
  return 'Obesidad'
}


const evaTextColor = (v: number): string => {
  if (v <= 3) return 'text-emerald-700 bg-emerald-50'
  if (v <= 5) return 'text-yellow-700 bg-yellow-50'
  if (v <= 7) return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

const evaLabel = (v: number): string => {
  if (v === 0)  return 'Sin dolor'
  if (v <= 2)   return 'Dolor leve'
  if (v <= 4)   return 'Dolor moderado'
  if (v <= 6)   return 'Dolor intenso'
  if (v <= 8)   return 'Dolor severo'
  if (v <= 9)   return 'Dolor muy severo'
  return 'Dolor insoportable'
}

const buildGoniometria = (): MedicionGoniometrica[] =>
  DEFAULT_GONIOMETRIA.map(g => ({ ...g, valorDerecho: undefined, valorIzquierdo: undefined }))

const buildFuerza = (): MedicionFuerza[] =>
  GRUPOS_MUSCULARES.map(g => ({ ...g, valor: 5 as const }))

type DeltaItem = { label: string; before: number; after: number; delta: number }

function buildDelta(prev: EvaluacionDto, form: {
  dolor: EvaluacionDolor; escalasFuncionales: EscalaFuncional[]
}): DeltaItem[] {
  const items: DeltaItem[] = [{
    label: 'EVA Dolor',
    before: prev.dolor.escalaDolor,
    after: form.dolor.escalaDolor,
    delta: form.dolor.escalaDolor - prev.dolor.escalaDolor,
  }]
  ;(prev.escalasFuncionales ?? []).forEach(pe => {
    const curr = form.escalasFuncionales.find(e => e.tipo === pe.tipo)
    if (curr) items.push({
      label: ESCALAS_CONFIG[pe.tipo].nombre,
      before: pe.puntajeTotal,
      after: curr.puntajeTotal,
      delta: curr.puntajeTotal - pe.puntajeTotal,
    })
  })
  return items
}

function anamnesisToText(a: AnamnesisForm): string {
  const parts: string[] = []
  if (a.tiempoEvolucion) parts.push(`Tiempo de evolución: ${a.tiempoEvolucion} ${a.unidadTiempo}`)
  if (a.mecanismoLesion) parts.push(`Mecanismo de lesión: ${a.mecanismoLesion}`)
  if (a.antecedentesEpisodio) parts.push(`Antecedentes del episodio: ${a.antecedentesEpisodio}`)
  if (a.factoresAgravantes) parts.push(`Factores agravantes: ${a.factoresAgravantes}`)
  if (a.factoresAliviantes) parts.push(`Factores aliviantes: ${a.factoresAliviantes}`)
  if (a.impactoAVD !== 'ninguno') parts.push(`Impacto en AVD: ${a.impactoAVD}`)
  return parts.join('\n')
}

function riesgoToText(r: RiesgoForm): string {
  const parts: string[] = []
  parts.push(`Nivel de riesgo: ${NIVEL_RIESGO_CONFIG[r.nivelRiesgo].label}`)
  if (r.factoresRiesgo.length > 0) parts.push(`Factores de riesgo: ${r.factoresRiesgo.join(', ')}`)
  if (r.objetivoGeneral) parts.push(`Objetivo general: ${r.objetivoGeneral}`)
  const objs = r.objetivosEspecificos.filter(o => o.trim())
  if (objs.length > 0) parts.push(`Objetivos específicos:\n${objs.map((o, i) => `  ${i+1}. ${o}`).join('\n')}`)
  if (r.sesionesPlanificadas) parts.push(`Sesiones planificadas: ${r.sesionesPlanificadas}`)
  if (r.fechaFinEstimada) parts.push(`Fecha fin estimada: ${r.fechaFinEstimada}`)
  if (r.indicacionesEducativas) parts.push(`Indicaciones educativas: ${r.indicacionesEducativas}`)
  return parts.join('\n')
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CreateEvaluationDrawer({
  open, onOpenChange, episodioId, numeroEpisodio, evaluaciones, onSuccess,
}: Props) {
  const [loading, setLoading]       = useState(false)
  const [activeTab, setActiveTab]   = useState<Tab>('anamnesis')

  // ── Form state ────────────────────────────────────────────────────────────
  const [tipoEvaluacion, setTipoEvaluacion] = useState<TipoEvaluacion>('INICIAL')
  const [anamnesis, setAnamnesis]   = useState<AnamnesisForm>(EMPTY_ANAMNESIS)
  const [riesgo, setRiesgo]         = useState<RiesgoForm>(EMPTY_RIESGO)
  const [signos, setSignos]         = useState<SignosVitales>({
    peso: undefined, talla: undefined, presionArterial: '',
    frecuenciaCardiaca: undefined, frecuenciaRespiratoria: undefined,
    temperatura: undefined, saturacionOxigeno: undefined,
  })
  const [dolor, setDolor]           = useState<EvaluacionDolor>({
    escalaDolor: 0, localizacionDolor: '', tipoDolor: 'AGUDO', descripcionDolor: '',
  })
  const [segmentos, setSegmentos]   = useState<ExamenSegmento[]>(
    SEGMENTOS_CORPORALES.map(s => ({ segmento: s, hallazgos: '' }))
  )
  const [diagnostico, setDiagnostico]   = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [goniometria, setGoniometria]   = useState<MedicionGoniometrica[]>(buildGoniometria())
  const [fuerza, setFuerza]             = useState<MedicionFuerza[]>(buildFuerza())
  const [escalaActiva, setEscalaActiva] = useState<TipoEscala>('OSWESTRY')
  const [escalasResp, setEscalasResp]   = useState<Record<TipoEscala, Record<string, number>>>({
    OSWESTRY: {}, DASH: {}, CONSTANT_MURLEY: {}, KOOS: {},
  })
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<PruebaEspecial[]>([])
  const [openPruebaGroups, setOpenPruebaGroups]         = useState<Record<string, boolean>>({})

  const evaluacionInicial = useMemo(
    () => evaluaciones.find(e => e.tipoEvaluacion === 'INICIAL'),
    [evaluaciones]
  )

  useEffect(() => {
    if (!open) {
      setActiveTab('anamnesis')
      setTipoEvaluacion(evaluaciones.length === 0 ? 'INICIAL' : 'REEVALUACION')
      setAnamnesis(EMPTY_ANAMNESIS)
      setRiesgo(EMPTY_RIESGO)
      setSignos({ peso: undefined, talla: undefined, presionArterial: '', frecuenciaCardiaca: undefined, frecuenciaRespiratoria: undefined, temperatura: undefined, saturacionOxigeno: undefined })
      setDolor({ escalaDolor: 0, localizacionDolor: '', tipoDolor: 'AGUDO', descripcionDolor: '' })
      setSegmentos(SEGMENTOS_CORPORALES.map(s => ({ segmento: s, hallazgos: '' })))
      setDiagnostico('')
      setObservaciones('')
      setGoniometria(buildGoniometria())
      setFuerza(buildFuerza())
      setEscalaActiva('OSWESTRY')
      setEscalasResp({ OSWESTRY: {}, DASH: {}, CONSTANT_MURLEY: {}, KOOS: {} })
      setPruebasSeleccionadas([])
    } else {
      setTipoEvaluacion(evaluaciones.length === 0 ? 'INICIAL' : 'REEVALUACION')
    }
  }, [open, evaluaciones])

  // ── Escalas computadas ────────────────────────────────────────────────────
  const escalaConfig        = ESCALAS_CONFIG[escalaActiva]
  const escalaResp          = escalasResp[escalaActiva]
  const escalaPuntaje       = escalaConfig.calcularPuntaje(escalaResp)
  const escalaInterpretacion = escalaConfig.interpretar(escalaPuntaje)

  const escalasFuncionalesPayload: EscalaFuncional[] = (
    Object.entries(escalasResp) as [TipoEscala, Record<string, number>][]
  )
    .filter(([, r]) => Object.keys(r).length > 0)
    .map(([tipo, r]) => ({
      tipo,
      respuestas: r,
      puntajeTotal: ESCALAS_CONFIG[tipo].calcularPuntaje(r),
      interpretacion: ESCALAS_CONFIG[tipo].interpretar(ESCALAS_CONFIG[tipo].calcularPuntaje(r)),
    }))

  const deltaItems = useMemo(() => {
    if (tipoEvaluacion === 'INICIAL' || !evaluacionInicial) return []
    return buildDelta(evaluacionInicial, { dolor, escalasFuncionales: escalasFuncionalesPayload })
  }, [tipoEvaluacion, evaluacionInicial, dolor, escalasFuncionalesPayload])

  const imc = calcIMC(signos.peso, signos.talla)

  // ── Tab completion ────────────────────────────────────────────────────────
  const tabHasData: Record<Tab, boolean> = {
    anamnesis:   anamnesis.mecanismoLesion.trim() !== '',
    biometria:   dolor.localizacionDolor.trim() !== '',
    examen:      segmentos.some(s => s.hallazgos.trim() !== '') || diagnostico.trim() !== '',
    goniometria: goniometria.some(g => g.valorDerecho !== undefined || g.valorIzquierdo !== undefined),
    fuerza:      fuerza.some(f => f.valor !== 5),
    escalas:     escalasFuncionalesPayload.length > 0,
    pruebas:     pruebasSeleccionadas.length > 0,
    riesgo:      riesgo.objetivoGeneral.trim() !== '',
  }

  const completedCount = Object.values(tabHasData).filter(Boolean).length
  const tabIdx         = TAB_IDS.indexOf(activeTab)

  const goNext = () => {
    if (tabIdx < TAB_IDS.length - 1) setActiveTab(TAB_IDS[tabIdx + 1])
  }
  const goPrev = () => {
    if (tabIdx > 0) setActiveTab(TAB_IDS[tabIdx - 1])
  }

  // ── Field helpers ─────────────────────────────────────────────────────────
  const setSigno    = <K extends keyof SignosVitales>(k: K, v: SignosVitales[K]) => setSignos(p => ({ ...p, [k]: v }))
  const setDolorField = <K extends keyof EvaluacionDolor>(k: K, v: EvaluacionDolor[K]) => setDolor(p => ({ ...p, [k]: v }))
  const setAnamnesisField = <K extends keyof AnamnesisForm>(k: K, v: AnamnesisForm[K]) => setAnamnesis(p => ({ ...p, [k]: v }))
  const setRiesgoField    = <K extends keyof RiesgoForm>(k: K, v: RiesgoForm[K])       => setRiesgo(p => ({ ...p, [k]: v }))

  const updateSegmento     = (i: number, h: string) => setSegmentos(p => p.map((s, idx) => idx === i ? { ...s, hallazgos: h } : s))
  const updateGoniometria  = (i: number, side: 'valorDerecho' | 'valorIzquierdo', v: number | undefined) =>
    setGoniometria(p => p.map((m, idx) => idx === i ? { ...m, [side]: v } : m))
  const updateFuerza       = (i: number, valor: 0|1|2|3|4|5) => setFuerza(p => p.map((f, idx) => idx === i ? { ...f, valor } : f))
  const setEscalaRespItem  = (preguntaId: string, valor: number) =>
    setEscalasResp(p => ({ ...p, [escalaActiva]: { ...p[escalaActiva], [preguntaId]: valor } }))

  const togglePrueba    = (nombre: string) => setPruebasSeleccionadas(p => p.find(t => t.nombre === nombre) ? p.filter(t => t.nombre !== nombre) : [...p, { nombre, resultado: 'NEGATIVO', observacion: '' }])
  const setPruebaResult = (nombre: string, resultado: ResultadoPrueba) => setPruebasSeleccionadas(p => p.map(t => t.nombre === nombre ? { ...t, resultado } : t))
  const setPruebaObs    = (nombre: string, observacion: string)        => setPruebasSeleccionadas(p => p.map(t => t.nombre === nombre ? { ...t, observacion } : t))

  const toggleFactorRiesgo = (f: string) =>
    setRiesgoField('factoresRiesgo', riesgo.factoresRiesgo.includes(f) ? riesgo.factoresRiesgo.filter(r => r !== f) : [...riesgo.factoresRiesgo, f])

  const addObjetivo = () => setRiesgoField('objetivosEspecificos', [...riesgo.objetivosEspecificos, ''])
  const updateObjetivo = (i: number, v: string) => setRiesgoField('objetivosEspecificos', riesgo.objetivosEspecificos.map((o, idx) => idx === i ? v : o))
  const removeObjetivo = (i: number) => setRiesgoField('objetivosEspecificos', riesgo.objetivosEspecificos.filter((_, idx) => idx !== i))

  const isValid = dolor.localizacionDolor.trim() !== ''

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isValid) { setActiveTab('biometria'); return }
    setLoading(true)
    try {
      const anamnesisText  = anamnesisToText(anamnesis)
      const riesgoText     = riesgoToText(riesgo)
      const extraObs       = [anamnesisText, riesgoText, observaciones.trim()].filter(Boolean).join('\n\n---\n\n')

      const payload: CreateEvaluacionRequest = {
        tipoEvaluacion,
        signosVitales: Object.values(signos).some(v => v !== undefined && v !== '') ? signos : undefined,
        dolor,
        examenFisicoSegmentos: segmentos.filter(s => s.hallazgos.trim() !== ''),
        diagnosticoPresuntivo: diagnostico.trim() || undefined,
        goniometria: goniometria.filter(g => g.valorDerecho !== undefined || g.valorIzquierdo !== undefined),
        fuerzaMuscular: fuerza,
        escalasFuncionales: escalasFuncionalesPayload.length > 0 ? escalasFuncionalesPayload : undefined,
        pruebasEspeciales: pruebasSeleccionadas.length > 0 ? pruebasSeleccionadas : undefined,
        observaciones: extraObs || undefined,
      }
      await registerEvaluation(episodioId, payload)
      toast.success(tipoEvaluacion === 'INICIAL' ? 'Evaluación inicial registrada' : 'Reevaluación registrada', {
        description: `Episodio ${numeroEpisodio}.`,
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

  // ── UI helpers ────────────────────────────────────────────────────────────
  const fieldCls    = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 transition'
  const labelCls    = 'block text-[10px] font-bold text-slate-400 uppercase mb-1.5'
  const sectionTitle = (t: string) => (
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">{t}</p>
  )

  // ── EVA visual slider ─────────────────────────────────────────────────────
  const renderEvaSlider = () => (
    <div className="space-y-3">
      <label className={labelCls}>Escala EVA 0-10 <span className="text-red-500">*</span></label>

      {/* Botones de selección rápida táctil */}
      <div className="flex gap-1">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDolorField('escalaDolor', n)}
            className={`flex-1 h-10 rounded-lg text-xs font-bold border-2 transition-all ${
              dolor.escalaDolor === n
                ? n <= 3 ? 'bg-emerald-500 text-white border-emerald-500 scale-110 shadow-md'
                  : n <= 5 ? 'bg-yellow-400 text-white border-yellow-400 scale-110 shadow-md'
                  : n <= 7 ? 'bg-orange-500 text-white border-orange-500 scale-110 shadow-md'
                  : 'bg-red-600 text-white border-red-600 scale-110 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Barra de color gradiente */}
      <div className="h-2 rounded-full overflow-hidden flex">
        {Array.from({ length: 11 }, (_, n) => (
          <div
            key={n}
            className={`flex-1 transition-opacity ${
              n <= 3 ? 'bg-emerald-400' : n <= 5 ? 'bg-yellow-400' : n <= 7 ? 'bg-orange-500' : 'bg-red-600'
            } ${n > dolor.escalaDolor ? 'opacity-20' : 'opacity-100'}`}
          />
        ))}
      </div>

      {/* Resultado actual */}
      <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ${evaTextColor(dolor.escalaDolor)}`}>
        <span className="text-2xl font-black">{dolor.escalaDolor}</span>
        <span className="text-sm font-semibold">{evaLabel(dolor.escalaDolor)}</span>
      </div>
    </div>
  )

  // ── Render: Anamnesis ─────────────────────────────────────────────────────
  const renderAnamnesis = () => (
    <div className="space-y-5">
      {sectionTitle('Historia del Problema Actual')}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tiempo de evolución</label>
          <input
            type="number" min="1" className={fieldCls} placeholder="Ej: 3"
            value={anamnesis.tiempoEvolucion}
            onChange={e => setAnamnesisField('tiempoEvolucion', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Unidad</label>
          <select
            className={fieldCls}
            value={anamnesis.unidadTiempo}
            onChange={e => setAnamnesisField('unidadTiempo', e.target.value as AnamnesisForm['unidadTiempo'])}
          >
            <option value="dias">Días</option>
            <option value="semanas">Semanas</option>
            <option value="meses">Meses</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Mecanismo de lesión / inicio del problema</label>
        <textarea
          className={`${fieldCls} resize-none min-h-18`}
          placeholder="Describe cómo ocurrió la lesión o cuándo iniciaron los síntomas..."
          value={anamnesis.mecanismoLesion}
          onChange={e => setAnamnesisField('mecanismoLesion', e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Antecedentes relevantes del episodio</label>
        <textarea
          className={`${fieldCls} resize-none min-h-15`}
          placeholder="Tratamientos previos, cirugías, recaídas anteriores..."
          value={anamnesis.antecedentesEpisodio}
          onChange={e => setAnamnesisField('antecedentesEpisodio', e.target.value)}
        />
      </div>

      {sectionTitle('Perfil del Dolor')}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Factores que agravan</label>
          <textarea
            className={`${fieldCls} resize-none min-h-15`}
            placeholder="Movimientos, posturas, actividades..."
            value={anamnesis.factoresAgravantes}
            onChange={e => setAnamnesisField('factoresAgravantes', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Factores que alivian</label>
          <textarea
            className={`${fieldCls} resize-none min-h-15`}
            placeholder="Reposo, frío/calor, analgésicos..."
            value={anamnesis.factoresAliviantes}
            onChange={e => setAnamnesisField('factoresAliviantes', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Impacto en actividades de vida diaria</label>
        <div className="flex gap-2">
          {(['ninguno', 'leve', 'moderado', 'severo'] as AnamnesisForm['impactoAVD'][]).map(nivel => (
            <button
              key={nivel}
              type="button"
              onClick={() => setAnamnesisField('impactoAVD', nivel)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition capitalize ${
                anamnesis.impactoAVD === nivel
                  ? nivel === 'ninguno'  ? 'bg-emerald-500 text-white border-emerald-500'
                    : nivel === 'leve'   ? 'bg-yellow-400 text-white border-yellow-400'
                    : nivel === 'moderado' ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {nivel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Render: Biometría ─────────────────────────────────────────────────────
  const renderBiometria = () => (
    <div className="space-y-5">
      {sectionTitle('Tipo de Evaluación')}
      <div className="flex gap-2">
        {(['INICIAL', 'REEVALUACION', 'ALTA'] as TipoEvaluacion[]).map(t => (
          <button key={t} type="button"
            onClick={() => setTipoEvaluacion(t)}
            disabled={t === 'INICIAL' && evaluaciones.length > 0}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition ${
              tipoEvaluacion === t
                ? 'bg-[#1A5276] text-white border-[#1A5276]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 disabled:opacity-40'
            }`}
          >
            {t === 'INICIAL' ? 'Inicial' : t === 'REEVALUACION' ? 'Reevaluación' : 'Alta'}
          </button>
        ))}
      </div>

      {sectionTitle('Signos Vitales y Biometría')}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Peso (kg)</label>
          <input type="number" min="0" step="0.1" className={fieldCls} placeholder="70.5"
            value={signos.peso ?? ''} onChange={e => setSigno('peso', e.target.value ? +e.target.value : undefined)} />
        </div>
        <div>
          <label className={labelCls}>Talla (cm)</label>
          <input type="number" min="0" className={fieldCls} placeholder="170"
            value={signos.talla ?? ''} onChange={e => setSigno('talla', e.target.value ? +e.target.value : undefined)} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>IMC (automático)</label>
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xl font-bold text-[#1A5276]">{imc}</span>
            {imc !== '—' && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                parseFloat(imc) < 18.5 ? 'bg-blue-100 text-blue-700'
                  : parseFloat(imc) < 25 ? 'bg-green-100 text-green-700'
                  : parseFloat(imc) < 30 ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>{imcLabel(imc)}</span>
            )}
          </div>
        </div>
        <div>
          <label className={labelCls}>Presión arterial</label>
          <input type="text" className={fieldCls} placeholder="120/80"
            value={signos.presionArterial ?? ''} onChange={e => setSigno('presionArterial', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>FC (lpm)</label>
          <input type="number" min="0" className={fieldCls} placeholder="72"
            value={signos.frecuenciaCardiaca ?? ''} onChange={e => setSigno('frecuenciaCardiaca', e.target.value ? +e.target.value : undefined)} />
        </div>
        <div>
          <label className={labelCls}>FR (rpm)</label>
          <input type="number" min="0" className={fieldCls} placeholder="16"
            value={signos.frecuenciaRespiratoria ?? ''} onChange={e => setSigno('frecuenciaRespiratoria', e.target.value ? +e.target.value : undefined)} />
        </div>
        <div>
          <label className={labelCls}>Temperatura (°C)</label>
          <input type="number" min="0" step="0.1" className={fieldCls} placeholder="36.5"
            value={signos.temperatura ?? ''} onChange={e => setSigno('temperatura', e.target.value ? +e.target.value : undefined)} />
        </div>
        <div>
          <label className={labelCls}>SpO₂ (%)</label>
          <input type="number" min="0" max="100" className={fieldCls} placeholder="98"
            value={signos.saturacionOxigeno ?? ''} onChange={e => setSigno('saturacionOxigeno', e.target.value ? +e.target.value : undefined)} />
        </div>
      </div>

      {sectionTitle('Evaluación del Dolor (EVA)')}
      {renderEvaSlider()}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Localización <span className="text-red-500">*</span></label>
          <input className={fieldCls} placeholder="Ej: Rodilla derecha, L4-L5..."
            value={dolor.localizacionDolor} onChange={e => setDolorField('localizacionDolor', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Tipo de dolor</label>
          <select className={fieldCls}
            value={dolor.tipoDolor} onChange={e => setDolorField('tipoDolor', e.target.value as EvaluacionDolor['tipoDolor'])}>
            <option value="AGUDO">Agudo</option>
            <option value="CRONICO">Crónico</option>
            <option value="NEUROPATICO">Neuropático</option>
            <option value="MIXTO">Mixto</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Descripción del dolor</label>
        <textarea className={`${fieldCls} resize-none min-h-15`}
          placeholder="Características, irradiación, factores agravantes / aliviantes..."
          value={dolor.descripcionDolor} onChange={e => setDolorField('descripcionDolor', e.target.value)} />
      </div>

      {tipoEvaluacion !== 'INICIAL' && evaluacionInicial && deltaItems.length > 0 && (
        <>
          {sectionTitle('Comparativa vs. Evaluación Inicial (RF-27)')}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2">Indicador</th>
                  <th className="text-center px-3 py-2">Inicial</th>
                  <th className="text-center px-3 py-2">Actual</th>
                  <th className="text-center px-3 py-2">Delta</th>
                </tr>
              </thead>
              <tbody>
                {deltaItems.map(item => {
                  const isEva = item.label === 'EVA Dolor'
                  const improved = isEva ? item.delta < 0 : item.delta > 0
                  const worsened = isEva ? item.delta > 0 : item.delta < 0
                  return (
                    <tr key={item.label} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-700">{item.label}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{item.before}</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-800">{item.after}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold ${improved ? 'text-green-600' : worsened ? 'text-red-500' : 'text-slate-400'}`}>
                          {improved ? <TrendingDown className="w-3 h-3" /> : worsened ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {item.delta > 0 ? `+${item.delta}` : item.delta}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  // ── Render: Examen ────────────────────────────────────────────────────────
  const renderExamen = () => (
    <div className="space-y-4">
      {sectionTitle('Examen Físico por Segmentos')}
      <p className="text-xs text-slate-400 -mt-2">Describe hallazgos positivos. Deja en blanco si el segmento es normal.</p>
      <div className="space-y-3">
        {segmentos.map((seg, i) => (
          <div key={seg.segmento}>
            <label className={labelCls}>{seg.segmento}</label>
            <textarea className={`${fieldCls} resize-none min-h-14`}
              placeholder="Hallazgos, limitaciones, observaciones..."
              value={seg.hallazgos} onChange={e => updateSegmento(i, e.target.value)} />
          </div>
        ))}
      </div>
      {sectionTitle('Diagnóstico Presuntivo')}
      <textarea className={`${fieldCls} resize-none min-h-20`}
        placeholder="Diagnósticos funcionales basados en el examen clínico..."
        value={diagnostico} onChange={e => setDiagnostico(e.target.value)} />
      {sectionTitle('Observaciones Generales')}
      <textarea className={`${fieldCls} resize-none min-h-20`}
        placeholder="Cualquier hallazgo adicional relevante..."
        value={observaciones} onChange={e => setObservaciones(e.target.value)} />
    </div>
  )

  // ── Render: Goniometría ───────────────────────────────────────────────────
  const gonioByArticulacion = useMemo(() => {
    const groups: Record<string, { idx: number; m: MedicionGoniometrica }[]> = {}
    goniometria.forEach((m, idx) => {
      if (!groups[m.articulacion]) groups[m.articulacion] = []
      groups[m.articulacion].push({ idx, m })
    })
    return groups
  }, [goniometria])

  const renderGoniometria = () => (
    <div className="space-y-4">
      {sectionTitle('Goniometría — Rangos de Movimiento Articular')}
      <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 uppercase px-1 mb-1">
        <span>Movimiento (normal)</span><span className="text-center">Derecho (°)</span><span className="text-center">Izquierdo (°)</span>
      </div>
      {Object.entries(gonioByArticulacion).map(([articulacion, items]) => (
        <div key={articulacion} className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{articulacion}</div>
          <div className="divide-y divide-slate-50">
            {items.map(({ idx, m }) => (
              <div key={m.movimiento} className="grid grid-cols-3 items-center gap-2 px-3 py-2">
                <span className="text-xs text-slate-600">
                  {m.movimiento}<span className="ml-1 text-[10px] text-slate-400">({m.valorNormal}°)</span>
                </span>
                <input type="number" min="0" max="360"
                  className="text-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#1A5276] focus:ring-1 focus:ring-[#1A5276]/20 transition"
                  placeholder="—" value={m.valorDerecho ?? ''}
                  onChange={e => updateGoniometria(idx, 'valorDerecho', e.target.value ? +e.target.value : undefined)} />
                <input type="number" min="0" max="360"
                  className="text-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#1A5276] focus:ring-1 focus:ring-[#1A5276]/20 transition"
                  placeholder="—" value={m.valorIzquierdo ?? ''}
                  onChange={e => updateGoniometria(idx, 'valorIzquierdo', e.target.value ? +e.target.value : undefined)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // ── Render: Fuerza ────────────────────────────────────────────────────────
  const fuerzaRows = useMemo(() => {
    const map: Record<string, { derechoIdx: number | null; izquierdoIdx: number | null; bilateralIdx: number | null }> = {}
    fuerza.forEach((f, idx) => {
      if (!map[f.grupoMuscular]) map[f.grupoMuscular] = { derechoIdx: null, izquierdoIdx: null, bilateralIdx: null }
      if (f.lado === 'DERECHO') map[f.grupoMuscular].derechoIdx = idx
      else if (f.lado === 'IZQUIERDO') map[f.grupoMuscular].izquierdoIdx = idx
      else map[f.grupoMuscular].bilateralIdx = idx
    })
    return map
  }, [fuerza])

  const danielsColor = (v: 0|1|2|3|4|5) =>
    v <= 1 ? 'bg-red-100 text-red-700' : v <= 2 ? 'bg-orange-100 text-orange-700'
    : v <= 3 ? 'bg-yellow-100 text-yellow-700' : v <= 4 ? 'bg-blue-100 text-blue-700'
    : 'bg-green-100 text-green-700'

  const DanielsInput = ({ idx }: { idx: number }) => {
    const v = fuerza[idx].valor
    return (
      <div className="flex gap-1 justify-center">
        {([0,1,2,3,4,5] as (0|1|2|3|4|5)[]).map(n => (
          <button key={n} type="button" onClick={() => updateFuerza(idx, n)}
            className={`w-8 h-8 rounded-lg text-xs font-bold border-2 transition ${
              v === n ? danielsColor(n) + ' border-current' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
            }`}>{n}</button>
        ))}
      </div>
    )
  }

  const renderFuerza = () => (
    <div className="space-y-4">
      {sectionTitle('Fuerza Muscular — Escala Daniels (0-5)')}
      <div className="flex gap-3 text-[10px] text-slate-400 flex-wrap mb-2">
        {([0,1,2,3,4,5] as (0|1|2|3|4|5)[]).map(n => (
          <span key={n} className={`px-2 py-0.5 rounded font-bold ${danielsColor(n)}`}>
            {n} – {n===0?'Sin contracción':n===1?'Contracción visible':n===2?'Gravedad eliminada':n===3?'Contra gravedad':n===4?'Resistencia parcial':'Normal'}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {Object.entries(fuerzaRows).map(([grupo, { derechoIdx, izquierdoIdx, bilateralIdx }]) => (
          <div key={grupo} className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">{grupo}</p>
            {bilateralIdx !== null ? <DanielsInput idx={bilateralIdx} /> : (
              <div className="grid grid-cols-2 gap-3">
                {derechoIdx !== null && <div><p className="text-[10px] text-slate-400 mb-1 text-center">Derecho</p><DanielsInput idx={derechoIdx} /></div>}
                {izquierdoIdx !== null && <div><p className="text-[10px] text-slate-400 mb-1 text-center">Izquierdo</p><DanielsInput idx={izquierdoIdx} /></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // ── Render: Escalas ───────────────────────────────────────────────────────
  const renderEscalas = () => {
    const preguntas  = escalaConfig.preguntas
    const completadas = Object.keys(escalaResp).length
    const total      = preguntas.length
    const progreso   = Math.round((completadas / total) * 100)

    return (
      <div className="space-y-4">
        {sectionTitle('Escalas Funcionales Validadas')}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(ESCALAS_CONFIG) as TipoEscala[]).map(tipo => {
            const cfg     = ESCALAS_CONFIG[tipo]
            const hasDatos = Object.keys(escalasResp[tipo]).length > 0
            return (
              <button key={tipo} type="button" onClick={() => setEscalaActiva(tipo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${
                  escalaActiva === tipo ? 'bg-[#1A5276] text-white border-[#1A5276]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}>
                {cfg.nombre.split('–')[0].trim()}
                {hasDatos && <span className="ml-1 text-[9px]">✓</span>}
              </button>
            )
          })}
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-xs font-bold text-slate-700">{escalaConfig.nombre}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{escalaConfig.descripcion}</p>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>{completadas}/{total} respuestas</span>
            {completadas === total && <span className="font-bold text-[#1A5276]">{escalaPuntaje}{escalaConfig.unidad} — {escalaInterpretacion}</span>}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1A5276] rounded-full transition-all" style={{ width: `${progreso}%` }} />
          </div>
        </div>
        <div className="space-y-4">
          {preguntas.map(p => (
            <div key={p.id}>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">{p.texto}</label>
              <div className="flex flex-col gap-1">
                {p.opciones.map(opt => (
                  <button key={opt.valor} type="button" onClick={() => setEscalaRespItem(p.id, opt.valor)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border-2 transition ${
                      escalaResp[p.id] === opt.valor
                        ? 'bg-[#1A5276] text-white border-[#1A5276] font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className="font-bold mr-2">{opt.valor}.</span>{opt.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {completadas > 0 && (
          <div className={`p-4 rounded-xl border-2 text-center ${completadas === total ? 'border-[#1A5276] bg-[#1A5276]/5' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-2xl font-bold text-[#1A5276]">{escalaPuntaje}<span className="text-sm ml-1">{escalaConfig.unidad}</span></p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{escalaInterpretacion}</p>
            {completadas < total && <p className="text-[11px] text-slate-400 mt-1">Puntaje parcial — {total - completadas} preguntas pendientes</p>}
          </div>
        )}
      </div>
    )
  }

  // ── Render: Pruebas especiales ────────────────────────────────────────────
  const renderPruebas = () => (
    <div className="space-y-4">
      {sectionTitle('Pruebas Especiales Ortopédicas')}
      <p className="text-xs text-slate-400 -mt-2">Selecciona las pruebas realizadas e indica el resultado.</p>
      {Object.entries(PRUEBAS_ESPECIALES_CATALOGO).map(([region, pruebas]) => {
        const isOpen = openPruebaGroups[region] ?? false
        return (
          <div key={region} className="border border-slate-200 rounded-xl overflow-hidden">
            <button type="button"
              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              onClick={() => setOpenPruebaGroups(p => ({ ...p, [region]: !isOpen }))}>
              <span>{region}</span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isOpen && (
              <div className="p-3 space-y-2">
                {pruebas.map(nombre => {
                  const sel = pruebasSeleccionadas.find(p => p.nombre === nombre)
                  return (
                    <div key={nombre} className={`rounded-xl border p-3 transition ${sel ? 'border-[#1A5276] bg-[#1A5276]/3' : 'border-slate-100 bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700">{nombre}</span>
                        <button type="button" onClick={() => togglePrueba(nombre)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${sel ? 'bg-[#1A5276] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          {sel ? 'Seleccionada' : 'Realizar'}
                        </button>
                      </div>
                      {sel && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            {(['NEGATIVO', 'POSITIVO', 'DUDOSO'] as ResultadoPrueba[]).map(r => (
                              <button key={r} type="button" onClick={() => setPruebaResult(nombre, r)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border-2 transition ${
                                  sel.resultado === r
                                    ? r === 'POSITIVO' ? 'bg-red-500 text-white border-red-500'
                                      : r === 'NEGATIVO' ? 'bg-green-500 text-white border-green-500'
                                      : 'bg-yellow-400 text-white border-yellow-400'
                                    : 'bg-white text-slate-500 border-slate-200'
                                }`}>{r}</button>
                            ))}
                          </div>
                          <input className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-[#1A5276]"
                            placeholder="Observación (opcional)..."
                            value={sel.observacion ?? ''} onChange={e => setPruebaObs(nombre, e.target.value)} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      {pruebasSeleccionadas.filter(p => p.resultado === 'POSITIVO').length > 0 && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50">
          <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Pruebas positivas</p>
          <div className="flex flex-wrap gap-1">
            {pruebasSeleccionadas.filter(p => p.resultado === 'POSITIVO').map(p => (
              <span key={p.nombre} className="text-[10px] font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{p.nombre} (+)</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ── Render: Plan y Riesgo ─────────────────────────────────────────────────
  const renderRiesgo = () => (
    <div className="space-y-5">
      {sectionTitle('Estratificación del Riesgo')}

      {/* Nivel de riesgo — 4 botones visuales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(NIVEL_RIESGO_CONFIG) as NivelRiesgo[]).map(nivel => {
          const cfg    = NIVEL_RIESGO_CONFIG[nivel]
          const active = riesgo.nivelRiesgo === nivel
          return (
            <button key={nivel} type="button"
              onClick={() => setRiesgoField('nivelRiesgo', nivel)}
              className={`rounded-xl border-2 py-3 px-2 text-center transition ${active ? cfg.bg + ' ' + cfg.color + ' border-current' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full mx-auto mb-1.5 ${
                nivel === 'VERDE' ? 'bg-emerald-500' : nivel === 'AMARILLO' ? 'bg-amber-400' : nivel === 'NARANJA' ? 'bg-orange-500' : 'bg-red-600'
              }`} />
              <p className="text-xs font-bold">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Factores de riesgo */}
      <div>
        <label className={labelCls}>Factores de riesgo presentes</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {FACTORES_RIESGO_CATALOGO.map(f => {
            const active = riesgo.factoresRiesgo.includes(f)
            return (
              <button key={f} type="button" onClick={() => toggleFactorRiesgo(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                  active ? 'bg-[#1A5276]/10 text-[#1A5276] border-[#1A5276]/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>{f}</button>
            )
          })}
        </div>
      </div>

      {sectionTitle('Objetivos Terapéuticos')}

      <div>
        <label className={labelCls}>Objetivo general del tratamiento</label>
        <textarea className={`${fieldCls} resize-none min-h-18`}
          placeholder="Ej: Recuperar la funcionalidad del miembro inferior y reintegrar al paciente a sus AVD..."
          value={riesgo.objetivoGeneral} onChange={e => setRiesgoField('objetivoGeneral', e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Objetivos específicos</label>
        <div className="space-y-2 mt-1">
          {riesgo.objetivosEspecificos.map((obj, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}.</span>
              <input className={`${fieldCls} flex-1`}
                placeholder={`Objetivo específico ${i + 1}...`}
                value={obj} onChange={e => updateObjetivo(i, e.target.value)} />
              {riesgo.objetivosEspecificos.length > 1 && (
                <button type="button" onClick={() => removeObjetivo(i)}
                  className="text-slate-400 hover:text-red-500 transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addObjetivo}
            className="flex items-center gap-1.5 text-xs text-[#1A5276] font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" />Agregar objetivo
          </button>
        </div>
      </div>

      {sectionTitle('Planificación')}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Sesiones planificadas</label>
          <input type="number" min="1" className={fieldCls} placeholder="10"
            value={riesgo.sesionesPlanificadas}
            onChange={e => setRiesgoField('sesionesPlanificadas', +e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Fecha fin estimada</label>
          <input type="date" className={fieldCls}
            value={riesgo.fechaFinEstimada}
            onChange={e => setRiesgoField('fechaFinEstimada', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Indicaciones educativas al paciente</label>
        <textarea className={`${fieldCls} resize-none min-h-15`}
          placeholder="Posturas, hábitos, señales de alarma, cuidados en casa..."
          value={riesgo.indicacionesEducativas}
          onChange={e => setRiesgoField('indicacionesEducativas', e.target.value)} />
      </div>
    </div>
  )

  // ── Mapa de tabs ──────────────────────────────────────────────────────────
  const TAB_CONTENT: Record<Tab, () => React.ReactNode> = {
    anamnesis:   renderAnamnesis,
    biometria:   renderBiometria,
    examen:      renderExamen,
    goniometria: renderGoniometria,
    fuerza:      renderFuerza,
    escalas:     renderEscalas,
    pruebas:     renderPruebas,
    riesgo:      renderRiesgo,
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="xl">
        {/* HEADER */}
        <DrawerHeader className="border-b border-slate-100 bg-white shadow-sm pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
                <ClipboardPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex flex-col gap-0.5">
                <DrawerTitle className="text-lg font-bold text-slate-800">
                  Evaluación Física {tipoEvaluacion === 'INICIAL' ? 'Inicial' : tipoEvaluacion === 'REEVALUACION' ? '— Reevaluación' : '— Alta'}
                </DrawerTitle>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Episodio: {numeroEpisodio}
                </span>
              </div>
            </div>

            {/* Progreso global */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {completedCount}/{TABS.length} secciones
              </span>
              <div className="flex gap-1">
                {TABS.map(tab => (
                  <div key={tab.id}
                    className={`h-1.5 w-5 rounded-full transition-colors ${tabHasData[tab.id] ? 'bg-[#1A5276]' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tabs con indicadores de completitud */}
          <div className="flex gap-0 overflow-x-auto -mx-6 px-6">
            {TABS.map(tab => (
              <button key={tab.id} type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-[#1A5276] text-[#1A5276]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {tab.icon}
                {tab.label}
                {tabHasData[tab.id] && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="rounded-full bg-emerald-500 h-2 w-2" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </DrawerHeader>

        {/* BODY */}
        <DrawerBody className="py-5 px-6 overflow-y-auto">
          {TAB_CONTENT[activeTab]()}
        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between w-full gap-3">
            {/* Prev/Next */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={tabIdx === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={tabIdx === TAB_IDS.length - 1}>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                className={`min-w-40 text-white font-bold transition ${isValid ? 'bg-[#1A5276] hover:bg-[#154360]' : 'bg-slate-300 cursor-not-allowed'}`}
                onClick={handleSubmit}
                disabled={loading || !isValid}
              >
                {loading
                  ? <><Loader2 className="animate-spin mr-2" size={16} />Guardando...</>
                  : `Guardar Evaluación (${completedCount}/${TABS.length})`
                }
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
