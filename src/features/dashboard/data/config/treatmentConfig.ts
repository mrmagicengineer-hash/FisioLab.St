// ── CIF (ICF) — Clasificación Internacional del Funcionamiento ────────────────

export type CifCategory = {
  code: string
  domain: 'b' | 'd' | 'e'  // b=funciones corporales, d=actividades/participación, e=factores ambientales
  label: string
  group: string
}

export const CIF_CATALOG: CifCategory[] = [
  // ── Funciones corporales (b) ─────────────────────────────────────────────
  { code: 'b710', domain: 'b', label: 'Movilidad articular',            group: 'Funciones musculoesqueléticas' },
  { code: 'b715', domain: 'b', label: 'Estabilidad articular',          group: 'Funciones musculoesqueléticas' },
  { code: 'b730', domain: 'b', label: 'Fuerza muscular',                group: 'Funciones musculoesqueléticas' },
  { code: 'b735', domain: 'b', label: 'Tono muscular',                  group: 'Funciones musculoesqueléticas' },
  { code: 'b740', domain: 'b', label: 'Resistencia muscular',           group: 'Funciones musculoesqueléticas' },
  { code: 'b745', domain: 'b', label: 'Funciones motrices reflexas',    group: 'Funciones musculoesqueléticas' },
  { code: 'b750', domain: 'b', label: 'Funciones motrices involuntarias', group: 'Funciones musculoesqueléticas' },
  { code: 'b755', domain: 'b', label: 'Control del movimiento voluntario', group: 'Funciones musculoesqueléticas' },
  { code: 'b760', domain: 'b', label: 'Control de movimientos voluntarios', group: 'Funciones musculoesqueléticas' },
  { code: 'b770', domain: 'b', label: 'Patrón de la marcha',            group: 'Funciones musculoesqueléticas' },
  { code: 'b280', domain: 'b', label: 'Sensación de dolor',             group: 'Funciones sensoriales' },
  { code: 'b265', domain: 'b', label: 'Función táctil',                 group: 'Funciones sensoriales' },
  { code: 'b260', domain: 'b', label: 'Función propioceptiva',          group: 'Funciones sensoriales' },
  { code: 'b152', domain: 'b', label: 'Funciones emocionales',          group: 'Funciones mentales' },
  { code: 'b130', domain: 'b', label: 'Funciones de energía y drive',   group: 'Funciones mentales' },
  { code: 'b620', domain: 'b', label: 'Funciones urinarias',            group: 'Funciones genitourinarias' },
  { code: 'b525', domain: 'b', label: 'Funciones de defecación',        group: 'Funciones digestivas' },
  { code: 'b440', domain: 'b', label: 'Funciones respiratorias',        group: 'Funciones respiratorias' },
  { code: 'b455', domain: 'b', label: 'Funciones de tolerancia al ejercicio', group: 'Funciones respiratorias' },
  { code: 'b410', domain: 'b', label: 'Funciones cardíacas',            group: 'Funciones cardiovasculares' },

  // ── Actividades y Participación (d) ──────────────────────────────────────
  { code: 'd410', domain: 'd', label: 'Cambiar posición corporal',      group: 'Movilidad' },
  { code: 'd415', domain: 'd', label: 'Mantener una posición corporal', group: 'Movilidad' },
  { code: 'd420', domain: 'd', label: 'Transferirse a sí mismo',        group: 'Movilidad' },
  { code: 'd430', domain: 'd', label: 'Levantar y llevar objetos',      group: 'Movilidad' },
  { code: 'd445', domain: 'd', label: 'Uso de la mano y el brazo',      group: 'Movilidad' },
  { code: 'd450', domain: 'd', label: 'Caminar',                        group: 'Movilidad' },
  { code: 'd455', domain: 'd', label: 'Desplazarse por el entorno',     group: 'Movilidad' },
  { code: 'd460', domain: 'd', label: 'Desplazarse por distintos lugares', group: 'Movilidad' },
  { code: 'd510', domain: 'd', label: 'Lavarse',                        group: 'Autocuidado' },
  { code: 'd520', domain: 'd', label: 'Cuidado de partes del cuerpo',   group: 'Autocuidado' },
  { code: 'd530', domain: 'd', label: 'Higiene personal',               group: 'Autocuidado' },
  { code: 'd540', domain: 'd', label: 'Vestirse',                       group: 'Autocuidado' },
  { code: 'd550', domain: 'd', label: 'Comer',                          group: 'Autocuidado' },
  { code: 'd640', domain: 'd', label: 'Realizar las tareas del hogar',  group: 'Vida doméstica' },
  { code: 'd850', domain: 'd', label: 'Trabajo remunerado',             group: 'Vida laboral' },
  { code: 'd920', domain: 'd', label: 'Recreación y ocio',              group: 'Participación social' },
  { code: 'd950', domain: 'd', label: 'Vida política y ciudadanía',     group: 'Participación social' },
]

export const CIF_DOMAIN_LABEL: Record<CifCategory['domain'], string> = {
  b: 'Funciones corporales (b)',
  d: 'Actividades y participación (d)',
  e: 'Factores ambientales (e)',
}

export const CIF_GROUPS = [...new Set(CIF_CATALOG.map(c => c.group))]

// ── Técnicas y Procedimientos fisioterapéuticos ───────────────────────────────

export type TechniqueCategory = {
  id: string
  label: string
  techniques: string[]
}

export const TECHNIQUE_CATEGORIES: TechniqueCategory[] = [
  {
    id: 'manual',
    label: 'Terapia Manual',
    techniques: [
      'Masoterapia (masaje terapéutico)',
      'Movilización articular grado I-II',
      'Movilización articular grado III-IV',
      'Manipulación articular (thrust)',
      'Tracción cervical manual',
      'Tracción lumbar manual',
      'Técnica de energía muscular (MET)',
      'Liberación miofascial',
      'Punción seca',
      'Trigger points',
      'Técnicas de tejido blando (STM)',
      'Método McKenzie',
      'Concepto Maitland',
    ],
  },
  {
    id: 'electro',
    label: 'Electroterapia',
    techniques: [
      'TENS (analgesia)',
      'Corrientes interferenciales',
      'Corriente diadinámica',
      'Ultrasonido terapéutico',
      'Láser terapéutico (LLLT)',
      'Magnetoterapia',
      'Electro-estimulación muscular (EMS)',
      'Iones galvánicos / iontoforesis',
      'Diatermia (onda corta)',
      'Radiofrecuencia',
      'EPTE (electrolisis percutánea)',
      'Tecarterapia',
    ],
  },
  {
    id: 'termo',
    label: 'Termoterapia / Crioterapia',
    techniques: [
      'Calor superficial (hot-pack)',
      'Parafina',
      'Infrarrojos',
      'Criogel (cold-pack)',
      'Criosaurio / criomasa',
      'Baño de contraste',
      'Hidroterapia (piscina terapéutica)',
      'Tanque de Hubbard',
    ],
  },
  {
    id: 'neuro',
    label: 'Neurorrehabilitación',
    techniques: [
      'Concepto Bobath',
      'Facilitación Neuromuscular Propioceptiva (FNP)',
      'Concepto Vojta',
      'Terapia de movimiento inducido por restricción (CIMT)',
      'Control motor y secuencia de maduración',
      'Reeducación del equilibrio',
      'Entrenamiento marcha asistida',
      'Realidad virtual rehabilitadora',
      'Biofeedback electromiográfico',
      'Estimulación eléctrica funcional (FES)',
    ],
  },
  {
    id: 'ejercicio',
    label: 'Ejercicio Terapéutico',
    techniques: [
      'Stretching activo y pasivo',
      'Fortalecimiento progresivo (resistencia)',
      'Estabilización lumbar (core)',
      'Estabilización cervical profunda',
      'Ejercicios propioceptivos',
      'Entrenamiento de equilibrio y coordinación',
      'Ejercicios de cadena cinética cerrada',
      'Ejercicios de cadena cinética abierta',
      'Entrenamiento aeróbico (cicloergómetro/caminadora)',
      'Pilates terapéutico',
      'Yoga terapéutico',
      'Ejercicios de control motor',
      'Programa de retorno al deporte',
    ],
  },
  {
    id: 'respiratorio',
    label: 'Fisioterapia Respiratoria',
    techniques: [
      'Higiene bronquial / drenaje postural',
      'Técnicas de espiración lenta prolongada',
      'Presión espiratoria positiva (PEP)',
      'Entrenamiento muscular inspiratorio (IMT)',
      'Ventilación dirigida',
      'Espirometría incentivada',
      'Drenaje autógeno',
    ],
  },
  {
    id: 'educacion',
    label: 'Educación y Ergonomía',
    techniques: [
      'Escuela de espalda',
      'Higiene postural',
      'Ergonomía laboral',
      'Educación en dolor (Explain Pain)',
      'Técnicas de relajación y mindfulness',
      'Asesoramiento en actividad física',
      'Vendaje funcional / kinesiotaping',
      'Órtesis y adaptaciones',
    ],
  },
]

// ── Frecuencias de sesión ─────────────────────────────────────────────────────

export type SessionFrequency = {
  value: string
  label: string
  sessionsPerWeek: number
}

export const SESSION_FREQUENCIES: SessionFrequency[] = [
  { value: '1x',    label: '1 vez / semana',    sessionsPerWeek: 1 },
  { value: '2x',    label: '2 veces / semana',  sessionsPerWeek: 2 },
  { value: '3x',    label: '3 veces / semana',  sessionsPerWeek: 3 },
  { value: '5x',    label: 'Diario (L-V)',       sessionsPerWeek: 5 },
  { value: 'custom',label: 'Personalizado',      sessionsPerWeek: 0 },
]

/** Calcula la fecha fin estimada dado inicio, sesiones y frecuencia semanal */
export function calcFechaFin(
  fechaInicio: string,
  sesiones: number,
  sessionsPerWeek: number
): string {
  if (!fechaInicio || sessionsPerWeek <= 0 || sesiones <= 0) return ''
  const semanas = Math.ceil(sesiones / sessionsPerWeek)
  const d = new Date(fechaInicio)
  d.setDate(d.getDate() + semanas * 7)
  return d.toISOString().slice(0, 10)
}

// ── Prefijos de plazo para objetivos específicos ──────────────────────────────

export type ObjectiveTimeframe = 'CP' | 'MP' | 'LP'

export const TIMEFRAME_CONFIG: Record<ObjectiveTimeframe, {
  label: string
  desc: string
  color: string
  bg: string
  border: string
}> = {
  CP: {
    label: 'Corto Plazo',
    desc: '≤ 4 semanas',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  MP: {
    label: 'Mediano Plazo',
    desc: '4 – 12 semanas',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  LP: {
    label: 'Largo Plazo',
    desc: '> 12 semanas',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
}

export function parseObjectiveTimeframe(text: string): {
  timeframe: ObjectiveTimeframe | null
  body: string
} {
  const match = text.match(/^(CP|MP|LP):\s*(.*)/)
  if (match) return { timeframe: match[1] as ObjectiveTimeframe, body: match[2] }
  return { timeframe: null, body: text }
}

export function formatObjective(timeframe: ObjectiveTimeframe, body: string): string {
  return `${timeframe}: ${body}`
}

/** Serializa técnicas seleccionadas en texto para indicacionesEducativas */
export function serializeTechniques(techniques: string[]): string {
  if (techniques.length === 0) return ''
  return `[TÉCNICAS]${techniques.join('|')}[/TÉCNICAS]`
}

/** Parsea técnicas del campo indicacionesEducativas */
export function parseTechniques(text: string): string[] {
  const match = text.match(/\[TÉCNICAS\](.*?)\[\/TÉCNICAS\]/s)
  if (!match) return []
  return match[1].split('|').filter(Boolean)
}

/** Extrae indicaciones educativas sin el bloque de técnicas */
export function parseEducationalNotes(text: string): string {
  return text.replace(/\[TÉCNICAS\].*?\[\/TÉCNICAS\]/s, '').trim()
}

/** Construye el campo indicacionesEducativas combinando notas + técnicas */
export function buildIndicaciones(notes: string, techniques: string[]): string {
  const techText = serializeTechniques(techniques)
  return [notes.trim(), techText].filter(Boolean).join('\n')
}
