import type {
  MedicionGoniometrica,
  MedicionFuerza,
  TipoEscala,
} from '../services/clinicalHistoryService'

// ── Segmentos corporales (RF-23) ─────────────────────────────────────────────
export const SEGMENTOS_CORPORALES = [
  'Cabeza / Cuello',
  'Hombro derecho',
  'Hombro izquierdo',
  'Codo derecho',
  'Codo izquierdo',
  'Muñeca / Mano derecha',
  'Muñeca / Mano izquierda',
  'Tórax / Columna dorsal',
  'Columna lumbar',
  'Cadera derecha',
  'Cadera izquierda',
  'Rodilla derecha',
  'Rodilla izquierda',
  'Tobillo / Pie derecho',
  'Tobillo / Pie izquierdo',
]

// ── Goniometría predeterminada (RF-24) ───────────────────────────────────────
export const DEFAULT_GONIOMETRIA: Omit<MedicionGoniometrica, 'valorDerecho' | 'valorIzquierdo'>[] = [
  // Hombro
  { articulacion: 'Hombro', movimiento: 'Flexión', valorNormal: 180 },
  { articulacion: 'Hombro', movimiento: 'Extensión', valorNormal: 60 },
  { articulacion: 'Hombro', movimiento: 'Abducción', valorNormal: 180 },
  { articulacion: 'Hombro', movimiento: 'Rot. Externa', valorNormal: 90 },
  { articulacion: 'Hombro', movimiento: 'Rot. Interna', valorNormal: 70 },
  // Codo
  { articulacion: 'Codo', movimiento: 'Flexión', valorNormal: 150 },
  { articulacion: 'Codo', movimiento: 'Extensión', valorNormal: 0 },
  { articulacion: 'Codo', movimiento: 'Supinación', valorNormal: 80 },
  { articulacion: 'Codo', movimiento: 'Pronación', valorNormal: 80 },
  // Muñeca
  { articulacion: 'Muñeca', movimiento: 'Flexión', valorNormal: 80 },
  { articulacion: 'Muñeca', movimiento: 'Extensión', valorNormal: 70 },
  { articulacion: 'Muñeca', movimiento: 'Desv. Radial', valorNormal: 20 },
  { articulacion: 'Muñeca', movimiento: 'Desv. Cubital', valorNormal: 30 },
  // Columna cervical
  { articulacion: 'C. Cervical', movimiento: 'Flexión', valorNormal: 45 },
  { articulacion: 'C. Cervical', movimiento: 'Extensión', valorNormal: 45 },
  { articulacion: 'C. Cervical', movimiento: 'Inclinación', valorNormal: 45 },
  { articulacion: 'C. Cervical', movimiento: 'Rotación', valorNormal: 60 },
  // Columna lumbar
  { articulacion: 'C. Lumbar', movimiento: 'Flexión', valorNormal: 60 },
  { articulacion: 'C. Lumbar', movimiento: 'Extensión', valorNormal: 25 },
  { articulacion: 'C. Lumbar', movimiento: 'Inclinación', valorNormal: 25 },
  // Cadera
  { articulacion: 'Cadera', movimiento: 'Flexión', valorNormal: 120 },
  { articulacion: 'Cadera', movimiento: 'Extensión', valorNormal: 30 },
  { articulacion: 'Cadera', movimiento: 'Abducción', valorNormal: 45 },
  { articulacion: 'Cadera', movimiento: 'Aducción', valorNormal: 30 },
  { articulacion: 'Cadera', movimiento: 'Rot. Externa', valorNormal: 45 },
  { articulacion: 'Cadera', movimiento: 'Rot. Interna', valorNormal: 45 },
  // Rodilla
  { articulacion: 'Rodilla', movimiento: 'Flexión', valorNormal: 135 },
  { articulacion: 'Rodilla', movimiento: 'Extensión', valorNormal: 0 },
  // Tobillo
  { articulacion: 'Tobillo', movimiento: 'Flexión dorsal', valorNormal: 20 },
  { articulacion: 'Tobillo', movimiento: 'Flexión plantar', valorNormal: 50 },
  { articulacion: 'Tobillo', movimiento: 'Inversión', valorNormal: 35 },
  { articulacion: 'Tobillo', movimiento: 'Eversión', valorNormal: 15 },
]

// ── Grupos musculares Daniels (RF-24) ────────────────────────────────────────
export const GRUPOS_MUSCULARES: Omit<MedicionFuerza, 'valor'>[] = [
  { grupoMuscular: 'Flexores hombro', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores hombro', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Abductores hombro', lado: 'DERECHO' },
  { grupoMuscular: 'Abductores hombro', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Flexores codo', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores codo', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Extensores codo', lado: 'DERECHO' },
  { grupoMuscular: 'Extensores codo', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Flexores muñeca', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores muñeca', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Flexores tronco', lado: 'BILATERAL' },
  { grupoMuscular: 'Extensores tronco', lado: 'BILATERAL' },
  { grupoMuscular: 'Flexores cadera', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores cadera', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Extensores cadera', lado: 'DERECHO' },
  { grupoMuscular: 'Extensores cadera', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Abductores cadera', lado: 'DERECHO' },
  { grupoMuscular: 'Abductores cadera', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Extensores rodilla', lado: 'DERECHO' },
  { grupoMuscular: 'Extensores rodilla', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Flexores rodilla', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores rodilla', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Flexores plantares', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores plantares', lado: 'IZQUIERDO' },
  { grupoMuscular: 'Flexores dorsales', lado: 'DERECHO' },
  { grupoMuscular: 'Flexores dorsales', lado: 'IZQUIERDO' },
]

// ── Pruebas especiales ortopédicas (RF-26) ───────────────────────────────────
export const PRUEBAS_ESPECIALES_CATALOGO: Record<string, string[]> = {
  'Columna lumbar': ['Lasègue', 'Bragard', 'Patrick (FABER)', 'Gaenslen', 'Thomas', 'Ely', 'Slump'],
  'Columna cervical': ['Spurling', 'Distracción cervical', 'Jackson', 'Adson'],
  'Hombro': ['Neer', 'Hawkins-Kennedy', 'Speed', 'Yergason', 'Apprehension', 'Jobe (empty can)'],
  'Codo': ['Cozen', 'Mill', 'Golfer\'s elbow'],
  'Rodilla': ['Cajón anterior', 'Cajón posterior', 'Lachman', 'McMurray', 'Apley', 'Varo', 'Valgo'],
  'Tobillo / Pie': ['Thompson', 'Cajón anterior tobillo', 'Squeeze test'],
}

// ── Escalas funcionales (RF-25) ──────────────────────────────────────────────

export type PreguntaEscala = {
  id: string
  texto: string
  opciones: { valor: number; etiqueta: string }[]
}

export type ConfigEscala = {
  tipo: TipoEscala
  nombre: string
  descripcion: string
  preguntas: PreguntaEscala[]
  calcularPuntaje: (respuestas: Record<string, number>) => number
  interpretar: (puntaje: number) => string
  unidad: string
  rango: [number, number]
}

// ── Oswestry Disability Index ─────────────────────────────────────────────────
const oswestryOpciones = (labels: string[]) =>
  labels.map((etiqueta, i) => ({ valor: i, etiqueta }))

const OSWESTRY: ConfigEscala = {
  tipo: 'OSWESTRY',
  nombre: 'Oswestry Disability Index',
  descripcion: 'Columna — Discapacidad por dolor lumbar',
  preguntas: [
    {
      id: 'dolor', texto: '1. Intensidad del dolor',
      opciones: oswestryOpciones(['Puedo soportarlo sin analgésicos', 'Analgésicos dan alivio total', 'Analgésicos dan alivio moderado', 'Analgésicos dan poco alivio', 'Analgésicos no alivian el dolor', 'No tomo analgésicos'])
    },
    {
      id: 'cuidado_personal', texto: '2. Cuidado personal',
      opciones: oswestryOpciones(['Me cuido solo normalmente', 'Me cuido solo pero con dolor', 'Necesito ayuda pero me cuido', 'Necesito ayuda diariamente', 'No puedo vestirme solo', 'Permanezco en cama'])
    },
    {
      id: 'levantar', texto: '3. Levantar objetos',
      opciones: oswestryOpciones(['Sin dolor con pesos grandes', 'Con dolor con pesos grandes', 'Sin dolor con pesos medianos', 'Con dolor con pesos medianos', 'Solo pesos pequeños', 'No puedo levantar nada'])
    },
    {
      id: 'caminar', texto: '4. Caminar',
      opciones: oswestryOpciones(['No limita el dolor', 'Camino más de 1 km', 'Camino 500 m', 'Camino 100 m', 'Con bastón o muletas', 'Permanezco en cama'])
    },
    {
      id: 'sentarse', texto: '5. Sentarse',
      opciones: oswestryOpciones(['Sin límite en cualquier silla', 'Solo en sillas especiales', 'Puedo sentarme 1 hora', 'Puedo sentarme 30 min', 'Puedo sentarme 10 min', 'No puedo sentarme'])
    },
    {
      id: 'estar_de_pie', texto: '6. Estar de pie',
      opciones: oswestryOpciones(['Sin límite de tiempo', 'Puedo estar 1 hora', 'Puedo estar 30 min', 'Puedo estar 10 min', 'No puedo estar de pie', 'Permanezco en cama'])
    },
    {
      id: 'dormir', texto: '7. Dormir',
      opciones: oswestryOpciones(['Sin dolor', 'Con analgésico puedo dormir', 'Duermo menos de 6 horas', 'Duermo menos de 4 horas', 'Duermo menos de 2 horas', 'No puedo dormir por dolor'])
    },
    {
      id: 'vida_social', texto: '8. Vida social',
      opciones: oswestryOpciones(['Normal sin dolor', 'Normal con aumento de dolor', 'Limita actividades enérgicas', 'Limita salidas frecuentes', 'Solo en casa', 'No tengo vida social por dolor'])
    },
    {
      id: 'viajar', texto: '9. Viajar',
      opciones: oswestryOpciones(['Sin dolor', 'Con dolor moderado', 'Sin más de 2 horas', 'Sin más de 30 min', 'Solo trayectos necesarios', 'No puedo viajar'])
    },
    {
      id: 'trabajo', texto: '10. Trabajo / Actividad diaria',
      opciones: oswestryOpciones(['Trabajo normal', 'Solo trabajo habitual ligero', 'Trabajo la mayoría del tiempo', 'No puedo trabajar fuera de casa', 'Solo trabajo ligero en casa', 'No puedo trabajar'])
    },
  ],
  calcularPuntaje: (r) => {
    const total = Object.values(r).reduce((a, b) => a + b, 0)
    const n = Object.keys(r).length
    return n > 0 ? Math.round((total / (n * 5)) * 100) : 0
  },
  interpretar: (p) => {
    if (p <= 20) return 'Discapacidad mínima'
    if (p <= 40) return 'Discapacidad moderada'
    if (p <= 60) return 'Discapacidad severa'
    if (p <= 80) return 'Discapacidad grave'
    return 'Máxima discapacidad / Encamado'
  },
  unidad: '%',
  rango: [0, 100],
}

// ── DASH (11 ítems versión abreviada) ────────────────────────────────────────
const dashOpciones = oswestryOpciones([
  'Sin dificultad', 'Con poca dificultad', 'Con dificultad moderada', 'Con mucha dificultad', 'No podría'
])

const DASH: ConfigEscala = {
  tipo: 'DASH',
  nombre: 'DASH – Miembro Superior',
  descripcion: 'Discapacidad del brazo, hombro y mano',
  preguntas: [
    { id: 'abrir_tarro', texto: 'Abrir un tarro nuevo', opciones: dashOpciones },
    { id: 'escribir', texto: 'Escribir', opciones: dashOpciones },
    { id: 'girar_llave', texto: 'Girar una llave', opciones: dashOpciones },
    { id: 'preparar_comida', texto: 'Preparar una comida', opciones: dashOpciones },
    { id: 'empujar_puerta', texto: 'Empujar o abrir una puerta pesada', opciones: dashOpciones },
    { id: 'poner_en_estante', texto: 'Poner algo en una estantería', opciones: dashOpciones },
    { id: 'tareas_pesadas', texto: 'Hacer tareas pesadas del hogar', opciones: dashOpciones },
    { id: 'jardineria', texto: 'Jardinería o patio', opciones: dashOpciones },
    { id: 'hacer_cama', texto: 'Hacer la cama', opciones: dashOpciones },
    { id: 'llevar_bolsa', texto: 'Llevar una bolsa o maletín', opciones: dashOpciones },
    { id: 'lavar_espalda', texto: 'Lavarse la espalda', opciones: dashOpciones },
  ],
  calcularPuntaje: (r) => {
    const n = Object.keys(r).length
    if (n === 0) return 0
    const sum = Object.values(r).reduce((a, b) => a + b, 0)
    return Math.round(((sum / n) - 1) * 25)
  },
  interpretar: (p) => {
    if (p <= 20) return 'Discapacidad leve'
    if (p <= 40) return 'Discapacidad moderada'
    if (p <= 60) return 'Discapacidad severa'
    return 'Discapacidad muy severa'
  },
  unidad: 'puntos',
  rango: [0, 100],
}

// ── Constant-Murley (Hombro) ─────────────────────────────────────────────────
const CONSTANT_MURLEY: ConfigEscala = {
  tipo: 'CONSTANT_MURLEY',
  nombre: 'Constant-Murley – Hombro',
  descripcion: 'Función del hombro (dolor + AVD + movilidad + fuerza)',
  preguntas: [
    {
      id: 'dolor',
      texto: 'Dolor (15 = sin dolor)',
      opciones: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(v => ({ valor: v, etiqueta: String(v) }))
    },
    {
      id: 'avd_trabajo', texto: 'AVD: nivel de trabajo posible (0-4)',
      opciones: [{ valor:0, etiqueta:'0 – Ninguno' },{ valor:1, etiqueta:'1 – Solo trabajo ligero' },{ valor:2, etiqueta:'2 – Trabajo moderado' },{ valor:3, etiqueta:'3 – Trabajo completo' },{ valor:4, etiqueta:'4 – Trabajo a plena capacidad' }]
    },
    {
      id: 'avd_recreacion', texto: 'AVD: actividad recreativa (0-4)',
      opciones: [{ valor:0, etiqueta:'0 – Ninguna' },{ valor:1, etiqueta:'1 – Muy limitada' },{ valor:2, etiqueta:'2 – Parcialmente' },{ valor:3, etiqueta:'3 – Casi normal' },{ valor:4, etiqueta:'4 – Normal' }]
    },
    {
      id: 'avd_sueno', texto: 'AVD: sueño sin dolor (0-2)',
      opciones: [{ valor:0, etiqueta:'0 – No' },{ valor:1, etiqueta:'1 – Algunos problemas' },{ valor:2, etiqueta:'2 – Sin problemas' }]
    },
    {
      id: 'avd_posicion', texto: 'AVD: posición de la mano (0-10)',
      opciones: [0,2,4,6,8,10].map(v=>({ valor:v, etiqueta:`${v} – ${v<=2?'Cintura':v<=4?'Xifoides':v<=6?'Cuello':v<=8?'Cabeza':'Por encima de la cabeza'}` }))
    },
    {
      id: 'rom_elevacion', texto: 'ROM: elevación anterior 0-10',
      opciones: [0,2,4,6,8,10].map(v=>({ valor:v, etiqueta:`${v} – ${v===0?'<30°':v===2?'31-60°':v===4?'61-90°':v===6?'91-120°':v===8?'121-150°':'>150°'}` }))
    },
    {
      id: 'rom_lateral', texto: 'ROM: elevación lateral 0-10',
      opciones: [0,2,4,6,8,10].map(v=>({ valor:v, etiqueta:`${v} – ${v===0?'<30°':v===2?'31-60°':v===4?'61-90°':v===6?'91-120°':v===8?'121-150°':'>150°'}` }))
    },
    {
      id: 'rom_re', texto: 'ROM: rotación externa 0-10',
      opciones: [{ valor:0,etiqueta:'0 – Sin rotación externa' },{ valor:2,etiqueta:'2 – Mano detrás cabeza, codo adelante' },{ valor:4,etiqueta:'4 – Mano detrás cabeza, codo atrás' },{ valor:6,etiqueta:'6 – Mano sobre cabeza, codo adelante' },{ valor:8,etiqueta:'8 – Mano sobre cabeza, codo atrás' },{ valor:10,etiqueta:'10 – Elevación completa' }]
    },
    {
      id: 'rom_ri', texto: 'ROM: rotación interna 0-10',
      opciones: [{ valor:0,etiqueta:'0 – Dorso de la mano en muslo' },{ valor:2,etiqueta:'2 – Hasta glúteo' },{ valor:4,etiqueta:'4 – Hasta sacro' },{ valor:6,etiqueta:'6 – Hasta L3' },{ valor:8,etiqueta:'8 – Hasta T12' },{ valor:10,etiqueta:'10 – Hasta T7 o superior' }]
    },
    {
      id: 'fuerza', texto: 'Fuerza (libras, máx 25)',
      opciones: Array.from({ length: 26 }, (_, i) => ({ valor: i, etiqueta: `${i} lb` }))
    },
  ],
  calcularPuntaje: (r) => Object.values(r).reduce((a, b) => a + b, 0),
  interpretar: (p) => {
    if (p >= 81) return 'Excelente'
    if (p >= 61) return 'Bueno'
    if (p >= 41) return 'Moderado'
    return 'Pobre'
  },
  unidad: 'puntos',
  rango: [0, 100],
}

// ── KOOS (simplificado – 5 subescalas, 2 ítems c/u) ─────────────────────────
const koosOpciones = oswestryOpciones(['Ninguno', 'Leve', 'Moderado', 'Severo', 'Extremo'])

const KOOS: ConfigEscala = {
  tipo: 'KOOS',
  nombre: 'KOOS – Rodilla',
  descripcion: 'Lesión y artrosis de rodilla (síntomas, dolor, AVD, deporte, calidad de vida)',
  preguntas: [
    { id: 'sintoma_rigidez', texto: '[Síntomas] Rigidez matutina al despertar', opciones: koosOpciones },
    { id: 'sintoma_hinchazón', texto: '[Síntomas] Hinchazón de rodilla', opciones: koosOpciones },
    { id: 'dolor_bajar_escaleras', texto: '[Dolor] Al bajar escaleras', opciones: koosOpciones },
    { id: 'dolor_extension', texto: '[Dolor] Al extender completamente la rodilla', opciones: koosOpciones },
    { id: 'avd_subir_escaleras', texto: '[AVD] Subir escaleras', opciones: koosOpciones },
    { id: 'avd_levantarse', texto: '[AVD] Levantarse de una silla', opciones: koosOpciones },
    { id: 'deporte_correr', texto: '[Deporte] Correr', opciones: koosOpciones },
    { id: 'deporte_agacharse', texto: '[Deporte] Agacharse / arrodillarse', opciones: koosOpciones },
    { id: 'cdv_conciencia', texto: '[Calidad de vida] Conciencia de la rodilla (¿la nota?)', opciones: koosOpciones },
    { id: 'cdv_limitacion', texto: '[Calidad de vida] ¿Cuánto limita tu vida?', opciones: koosOpciones },
  ],
  calcularPuntaje: (r) => {
    const n = Object.keys(r).length
    if (n === 0) return 0
    const sum = Object.values(r).reduce((a, b) => a + b, 0)
    return Math.round(100 - (sum / (n * 4)) * 100)
  },
  interpretar: (p) => {
    if (p >= 85) return 'Función excelente'
    if (p >= 70) return 'Función buena'
    if (p >= 50) return 'Función moderada'
    return 'Función pobre / Severa limitación'
  },
  unidad: 'puntos',
  rango: [0, 100],
}

export const ESCALAS_CONFIG: Record<TipoEscala, ConfigEscala> = {
  OSWESTRY: OSWESTRY,
  DASH: DASH,
  CONSTANT_MURLEY: CONSTANT_MURLEY,
  KOOS: KOOS,
}
