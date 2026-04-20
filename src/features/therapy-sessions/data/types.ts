// Tipos del módulo Sesiones de Terapia y Notas de Evolución
// Alineados con la API: /api/v1/sesiones-terapia

// ─── Enums ────────────────────────────────────────────────────────────────────

export type SessionStatus = 'draft' | 'signed' | 'locked'

// ─── SOAP ─────────────────────────────────────────────────────────────────────

export type SoapNote = {
  subjetivo: string
  objetivo:  string
  analisis:  string
  plan:      string
}

export const EMPTY_SOAP: SoapNote = {
  subjetivo: '',
  objetivo:  '',
  analisis:  '',
  plan:      '',
}

// ─── Plantillas de Sesión ─────────────────────────────────────────────────────

export type SessionTemplate = {
  id:                  string
  nombre:              string
  descripcion:         string
  modalidadesDefault:  string[]
  costoSugerido:       number
}

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'electroterapia',
    nombre: 'Electroterapia',
    descripcion: 'TENS, ultrasonido, iontoforesis',
    modalidadesDefault: ['TENS', 'Ultrasonido'],
    costoSugerido: 25,
  },
  {
    id: 'kinesioterapia',
    nombre: 'Kinesioterapia',
    descripcion: 'Ejercicios activos, pasivos, resistidos',
    modalidadesDefault: ['Ejercicios Activos'],
    costoSugerido: 20,
  },
  {
    id: 'hidroterapia',
    nombre: 'Hidroterapia',
    descripcion: 'Hidromasaje, baño de contraste',
    modalidadesDefault: ['Hidromasaje'],
    costoSugerido: 30,
  },
  {
    id: 'termoterapia',
    nombre: 'Termoterapia',
    descripcion: 'Calor superficial y profundo',
    modalidadesDefault: ['Compresa caliente', 'Parafina'],
    costoSugerido: 18,
  },
  {
    id: 'manual',
    nombre: 'Terapia Manual',
    descripcion: 'Masoterapia, movilizaciones articulares',
    modalidadesDefault: ['Masoterapia'],
    costoSugerido: 22,
  },
]

// ─── Modalidades Físicas ──────────────────────────────────────────────────────

export type ModalidadParam = {
  key:   string
  label: string
  unit?: string
}

export type ModalidadConfig = {
  nombre:  string
  params:  ModalidadParam[]
}

export const MODALIDADES_CATALOG: ModalidadConfig[] = [
  {
    nombre: 'TENS',
    params: [
      { key: 'frecuencia', label: 'Frecuencia', unit: 'Hz' },
      { key: 'intensidad', label: 'Intensidad', unit: 'mA' },
      { key: 'tiempo',     label: 'Tiempo',     unit: 'min' },
    ],
  },
  {
    nombre: 'Ultrasonido',
    params: [
      { key: 'frecuencia', label: 'Frecuencia', unit: 'MHz' },
      { key: 'intensidad', label: 'Intensidad', unit: 'W/cm²' },
      { key: 'tiempo',     label: 'Tiempo',     unit: 'min' },
      { key: 'modo',       label: 'Modo (continuo/pulsado)' },
    ],
  },
  {
    nombre: 'Compresa caliente',
    params: [
      { key: 'zona',   label: 'Zona de aplicación' },
      { key: 'tiempo', label: 'Tiempo', unit: 'min' },
    ],
  },
  {
    nombre: 'Parafina',
    params: [
      { key: 'zona',   label: 'Zona' },
      { key: 'tiempo', label: 'Tiempo', unit: 'min' },
    ],
  },
  {
    nombre: 'Hidromasaje',
    params: [
      { key: 'temperatura', label: 'Temperatura', unit: '°C' },
      { key: 'tiempo',      label: 'Tiempo',      unit: 'min' },
    ],
  },
  {
    nombre: 'Masoterapia',
    params: [
      { key: 'tecnica', label: 'Técnica (effleurage, fricción, etc.)' },
      { key: 'zona',    label: 'Zona' },
      { key: 'tiempo',  label: 'Tiempo', unit: 'min' },
    ],
  },
  {
    nombre: 'Ejercicios Activos',
    params: [
      { key: 'zona',      label: 'Segmento corporal' },
      { key: 'series',    label: 'Series' },
      { key: 'repeticiones', label: 'Repeticiones' },
    ],
  },
]

export type Modalidad = {
  id:       string        // uuid local
  nombre:   string
  params:   Record<string, string>
}

// ─── Ejercicios ───────────────────────────────────────────────────────────────

export type Ejercicio = {
  id:             string
  nombre:         string
  series:         number
  repeticiones:   number
  instrucciones:  string
  paraDomicilio:  boolean
}

// ─── Sesión de Terapia ────────────────────────────────────────────────────────

export type TherapySession = {
  id?:          number
  citaId:       number
  episodioId?:  number
  pacienteId:   number
  profesionalId: number
  soap:          SoapNote
  costo:         number
  templateId:    string | null
  modalidades:   Modalidad[]
  ejercicios:    Ejercicio[]
  status:        SessionStatus
  creadoEn?:     string
  firmadoEn?:    string
}

// ─── Nota de Evolución (histórico) ───────────────────────────────────────────

export type EvolutionNote = {
  id:               number
  sessionId:        number
  fecha:            string
  sesionNumero:     number
  profesionalNombre: string
  soap:             SoapNote
  status:           SessionStatus
}

// ─── Draft (localStorage) ────────────────────────────────────────────────────

export type TherapySessionDraft = {
  citaId:      number
  patientId:   number
  soap:        SoapNote
  costo:       number
  templateId:  string | null
  modalidades: Modalidad[]
  ejercicios:  Ejercicio[]
  savedAt:     string
}

// ─── Progreso (Sesión X de N) ─────────────────────────────────────────────────

export type SessionProgress = {
  current: number
  total:   number
}

// ─── Nuevos tipos de la API (v1) ─────────────────────────────────────────────

export interface SesionTerapiaResponse {
  id: number;
  citaId: number;
  planTratamientoId: number;
  pacienteId: number;
  pacienteNombre: string;
  episodioClinicoId: number;
  profesionalId: number;
  profesionalNombre: string;
  costoSesion: number;
  numeroSesionEnPlan: number;
  fechaHoraInicio: string;
  estado: 'EN_PROGRESO' | 'FIRMADA';
  firmadoPorId: number | null;
  firmadoEn: string | null;
  hashIntegridad: string | null;
  fechaCreacion: string;
  notaSOAP: NotaSOAPResponse;
  planResumen: PlanResumenResponse;
}

export interface NotaSOAPResponse {
  id: number;
  sesionTerapiaId: number;
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  plan: string | null;
  modoBorrador: boolean;
  firmadoPorId: number | null;
  firmadoPorNombre: string | null;
  firmadoEn: string | null;
  hashIntegridad: string | null;
}

export interface PlanResumenResponse {
  id: number;
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  indicacionesEducativas: string;
  sesionesPlanificadas: number;
  sesionesRealizadas: number;
  costoSesion: number;
  estado: 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO';
}

export interface ResumenProgresoResponse {
  sesionId: number;
  numeroSesionActual: number;
  totalSesionesPlan: number;
  sesionesRealizadas: number;
  sesionesRestantes: number;
  evaluacionInicial: EvaluacionResumen | null;
  evaluacionReciente: EvaluacionResumen | null;
  deltaEva: number | null;
  historialSesiones: HistorialSesionMin[];
}

export interface EvaluacionResumen {
  evaluacionId: number;
  fecha: string;
  eva: number;
  puntajeFuncionalPromedio: number;
  interpretacionFuncional: string;
  tipo: 'INICIAL' | 'INTERMEDIA' | 'ALTA';
}

export interface HistorialSesionMin {
  sesionId: number;
  numeroSesion: number;
  fecha: string;
  estado: 'EN_PROGRESO' | 'FIRMADA';
}

export interface UpdateNotaSOAPRequest {
  subjetivo?: string;
  objetivo?: string;
  analisis?: string;
  plan?: string;
}

export interface AdjuntoSesionResponse {
  id: number;
  sesionTerapiaId: number;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  subidoPorId: number;
  subidoPorNombre: string;
  fechaSubida: string;
  urlDescarga: string;
}
