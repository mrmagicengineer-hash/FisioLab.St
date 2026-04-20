import { fetchWithAuth } from '../../../auth/data/services/apiClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export type ClinicalHistorySummaryDto = {
  historiaClinicaId: number
  pacienteId: number
  numeroHcl: string
  paciente: string
  cedula: string
  unidadSalud: string
  estadoHistoriaClinica: string
  estadoArchivoPaciente: string
  fechaApertura: string
}

export type PersonalAntecedentApiType =
  | 'PATOLOGICO'
  | 'QUIRURGICO'
  | 'TRAUMATOLOGICO'
  | 'ALERGICO'
  | 'FARMACOLOGICO'
  | 'GINECO_OBSTETRICO'

export type PersonalAntecedentApiStatus = 'ACTIVO' | 'RESUELTO'

export type PersonalAntecedentDto = {
  id: number
  tipo: PersonalAntecedentApiType
  descripcion: string
  codigoCie10: string
  estado: PersonalAntecedentApiStatus
  fechaRegistro: string
}

export type FamilyAntecedentApiRelationship = 'PADRE' | 'MADRE' | 'HERMANO' | 'ABUELO'

export type FamilyAntecedentDto = {
  id: number
  parentesco: FamilyAntecedentApiRelationship
  condicion: string
  codigoCie10: string
  fechaRegistro: string
}

export type CreatePersonalAntecedentRequest = {
  tipo: PersonalAntecedentApiType
  descripcion: string
  codigoCie10?: string
  estado: PersonalAntecedentApiStatus
}

export type CreateFamilyAntecedentRequest = {
  parentesco: FamilyAntecedentApiRelationship
  condicion: string
  codigoCie10?: string
}

export type ClinicalHistoryCompleteDto = {
  resumen: ClinicalHistorySummaryDto
  antecedentesPersonales: PersonalAntecedentDto[]
  antecedentesFamiliares: FamilyAntecedentDto[]
  problemasActivos: PersonalAntecedentDto[]
  episodiosPrevios: unknown[]
}

export type OpenClinicalEpisodeRequest = {
  pacienteId: string
  motivo: string
}

export type OpenClinicalEpisodeDto = {
  id?: number | string
  secuencial?: number
  numeroSecuencial?: number
  fechaApertura?: string
  estado?: string
  actorApertura?: string
  motivoConsulta?: string
  codigoCie10DiagnosticoPrincipal?: string
  diagnosticoPrincipal?: string
}

export type RegisterEpisodeEgressRequest = {
  fechaHoraEgreso: string
  condicionSalida: string
  causaAlta: string
  destinoPaciente: string
  referidoOtraInstitucion: boolean
}

export type RegisterEpisodeEgressDto = {
  episodioId?: number | string
  fechaHoraEgreso?: string
  condicionSalida?: string
  causaAlta?: string
  destinoPaciente?: string
  referidoOtraInstitucion?: boolean
}

export type ClinicalEpisodeHistoryDto = {
  id: number
  historiaClinicaId: number
  numeroHcl: string
  numeroSecuencial: number
  numeroEpisodio: string
  motivoConsulta: string
  codigoCie10DiagnosticoPrincipal: string
  fechaApertura: string
  fechaCierre: string | null
  estado: string
  estadoCierre: string | null
  observacionCierre: string | null
}

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string; detail?: string }
    return payload.message ?? payload.error ?? payload.detail ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

async function parseJsonOrThrow<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (!response.ok) {
    const message = await extractErrorMessage(response, fallbackMessage)
    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function getClinicalHistoryByPatientId(patientId: number): Promise<ClinicalHistorySummaryDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/historias-clinicas/por-paciente/${patientId}`, {
    method: 'GET'
  })

  return parseJsonOrThrow<ClinicalHistorySummaryDto>(
    response,
    'No se pudo obtener la historia clinica del paciente.'
  )
}

export async function getClinicalHistoryComplete(numeroHcl: string): Promise<ClinicalHistoryCompleteDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/historias-clinicas/${encodeURIComponent(numeroHcl)}/completa`,
    {
      method: 'GET'
    }
  )

  return parseJsonOrThrow<ClinicalHistoryCompleteDto>(
    response,
    'No se pudo cargar la historia clinica completa.'
  )
}

export async function getPersonalAntecedents(numeroHcl: string): Promise<PersonalAntecedentDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/historias-clinicas/${encodeURIComponent(numeroHcl)}/antecedentes/personales`,
    {
      method: 'GET'
    }
  )

  return parseJsonOrThrow<PersonalAntecedentDto[]>(
    response,
    'No se pudieron cargar los antecedentes personales.'
  )
}

export async function getFamilyAntecedents(numeroHcl: string): Promise<FamilyAntecedentDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/historias-clinicas/${encodeURIComponent(numeroHcl)}/antecedentes/familiares`,
    {
      method: 'GET'
    }
  )

  return parseJsonOrThrow<FamilyAntecedentDto[]>(
    response,
    'No se pudieron cargar los antecedentes familiares.'
  )
}

export async function createPersonalAntecedent(
  numeroHcl: string,
  payload: CreatePersonalAntecedentRequest
): Promise<PersonalAntecedentDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/historias-clinicas/${encodeURIComponent(numeroHcl)}/antecedentes/personales`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: payload.tipo,
        descripcion: payload.descripcion.trim(),
        codigoCie10: payload.codigoCie10?.trim() || undefined,
        estado: payload.estado
      })
    }
  )

  return parseJsonOrThrow<PersonalAntecedentDto>(
    response,
    'No se pudo registrar el antecedente personal.'
  )
}

export async function createFamilyAntecedent(
  numeroHcl: string,
  payload: CreateFamilyAntecedentRequest
): Promise<FamilyAntecedentDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/historias-clinicas/${encodeURIComponent(numeroHcl)}/antecedentes/familiares`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parentesco: payload.parentesco,
        condicion: payload.condicion.trim(),
        codigoCie10: payload.codigoCie10?.trim() || undefined
      })
    }
  )

  return parseJsonOrThrow<FamilyAntecedentDto>(
    response,
    'No se pudo registrar el antecedente familiar.'
  )
}

export async function openClinicalEpisode(
  payload: OpenClinicalEpisodeRequest
): Promise<OpenClinicalEpisodeDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/episodios-clinicos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pacienteId: payload.pacienteId.trim(),
      motivo: payload.motivo.trim(),
    })
  })

  return parseJsonOrThrow<OpenClinicalEpisodeDto>(
    response,
    'No se pudo abrir el episodio clinico.'
  )
}

export async function registerEpisodeEgress(
  episodioId: number,
  payload: RegisterEpisodeEgressRequest
): Promise<RegisterEpisodeEgressDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/episodios-clinicos/${episodioId}/egreso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fechaHoraEgreso: payload.fechaHoraEgreso,
      condicionSalida: payload.condicionSalida.trim(),
      causaAlta: payload.causaAlta.trim(),
      destinoPaciente: payload.destinoPaciente.trim(),
      referidoOtraInstitucion: payload.referidoOtraInstitucion
    })
  })

  return parseJsonOrThrow<RegisterEpisodeEgressDto>(
    response,
    'No se pudo registrar el egreso del episodio clinico.'
  )
}

export async function getClinicalEpisodeHistory(
  numeroHcl: string
): Promise<ClinicalEpisodeHistoryDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/historial/${encodeURIComponent(numeroHcl)}`,
    {
      method: 'GET'
    }
  )

  return parseJsonOrThrow<ClinicalEpisodeHistoryDto[]>(
    response,
    'No se pudo cargar el historial de episodios clinicos.'
  )
}

// ── Evaluación Física Completa (RF-23 a RF-27) ──────────────────────────────

export type TipoEvaluacion = 'INICIAL' | 'REEVALUACION' | 'ALTA'

export type TipoDolor = 'AGUDO' | 'CRONICO' | 'NEUROPATICO' | 'MIXTO'

export type SignosVitales = {
  peso?: number               // kg
  talla?: number              // cm (IMC calculado en frontend)
  presionArterial?: string    // "120/80"
  frecuenciaCardiaca?: number
  frecuenciaRespiratoria?: number
  temperatura?: number
  saturacionOxigeno?: number
}

export type EvaluacionDolor = {
  escalaDolor: number          // 0-10 (EVA)
  localizacionDolor: string
  tipoDolor: TipoDolor
  descripcionDolor?: string
}

export type ExamenSegmento = {
  segmento: string
  hallazgos: string
}

export type MedicionGoniometrica = {
  articulacion: string
  movimiento: string
  valorDerecho?: number
  valorIzquierdo?: number
  valorNormal: number
}

export type MedicionFuerza = {
  grupoMuscular: string
  lado: 'DERECHO' | 'IZQUIERDO' | 'BILATERAL'
  valor: 0 | 1 | 2 | 3 | 4 | 5
}

export type TipoEscala = 'OSWESTRY' | 'DASH' | 'CONSTANT_MURLEY' | 'KOOS'

export type EscalaFuncional = {
  tipo: TipoEscala
  respuestas: Record<string, number>
  puntajeTotal: number
  interpretacion: string
}

export type ResultadoPrueba = 'POSITIVO' | 'NEGATIVO' | 'DUDOSO'

export type PruebaEspecial = {
  nombre: string
  resultado: ResultadoPrueba
  observacion?: string
}

export type CreateEvaluacionRequest = {
  tipoEvaluacion: TipoEvaluacion
  signosVitales?: SignosVitales
  dolor: EvaluacionDolor
  examenFisicoSegmentos?: ExamenSegmento[]
  diagnosticoPresuntivo?: string
  goniometria?: MedicionGoniometrica[]
  fuerzaMuscular?: MedicionFuerza[]
  escalasFuncionales?: EscalaFuncional[]
  pruebasEspeciales?: PruebaEspecial[]
  observaciones?: string
}

export type EvaluacionDto = {
  id: number
  episodioId: number
  tipoEvaluacion: TipoEvaluacion
  signosVitales?: SignosVitales
  dolor: EvaluacionDolor
  examenFisicoSegmentos?: ExamenSegmento[]
  diagnosticoPresuntivo?: string
  goniometria?: MedicionGoniometrica[]
  fuerzaMuscular?: MedicionFuerza[]
  escalasFuncionales?: EscalaFuncional[]
  pruebasEspeciales?: PruebaEspecial[]
  observaciones?: string
  fechaRegistro: string
}

export async function getEvaluaciones(episodioId: number): Promise<EvaluacionDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<EvaluacionDto[]>(response, 'No se pudieron cargar las evaluaciones.')
}

export async function registerEvaluation(
  episodioId: number,
  payload: CreateEvaluacionRequest
): Promise<EvaluacionDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )

  return parseJsonOrThrow<EvaluacionDto>(
    response,
    'No se pudo registrar la evaluacion fisica.'
  )
}

// ── Registro de Problemas (RF-29) ────────────────────────────────────────────

export type ProblemStatus = 'ACTIVO' | 'CRONICO' | 'RESUELTO' | 'DESCARTADO'

export type RegisterProblemRequest = {
  descripcion: string
  codigoCie10: string
  estado: ProblemStatus
}

export type ProblemDto = {
  id: number
  episodioId: number
  numeroSecuencial: number
  descripcion: string
  codigoCie10: string
  estado: ProblemStatus
  fechaRegistro: string
}

export async function registerProblem(
  episodioId: number,
  payload: RegisterProblemRequest
): Promise<ProblemDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/problemas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return parseJsonOrThrow<ProblemDto>(response, 'No se pudo registrar el problema.')
}

// ── Plan de Tratamiento (RF-31) ──────────────────────────────────────────────

export type CodigoAlarma = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO'

export type CreateTreatmentPlanRequest = {
  objetivos: string
  sesionesPlanificadas: number
  costoSesion?: number
}

export type TreatmentPlanDto = {
  id: number
  episodioId: number
  problemaId: number
  objetivoGeneral: string
  objetivosEspecificos: string[]
  fechaInicio: string
  fechaFinEstimada: string
  sesionesPlanificadas: number
  costoSesion?: number
  indicacionesEducativas?: string
  codigoAlarma: string
  estado: string
  fechaRegistro: string
}

export async function createTreatmentPlan(
  episodioId: number,
  problemaId: number,
  payload: CreateTreatmentPlanRequest
): Promise<TreatmentPlanDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/problemas/${problemaId}/plan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objetivos: payload.objetivos,
        sesionesPlanificadas: payload.sesionesPlanificadas,
        ...(payload.costoSesion !== undefined ? { costoSesion: payload.costoSesion } : {}),
      })
    }
  )

  return parseJsonOrThrow<TreatmentPlanDto>(
    response,
    'No se pudo crear el plan de tratamiento.'
  )
}

// ── Seguimientos del Plan (RF-32) ────────────────────────────────────────────

export type ResultadoGeneral = 'MEJORA' | 'ESTABLE' | 'DETERIORO' | 'ALTA' | 'ABANDONO'

export type CreatePlanFollowUpRequest = {
  fechaSeguimiento: string
  porcentajeAvance: number
  resultadosObtenidos: string
  ajustes?: string
  resultadoGeneral: ResultadoGeneral
}

export type PlanFollowUpDto = {
  id: number
  planTratamientoId: number
  numeroSesion: number
  fechaSeguimiento: string
  porcentajeAvance: number
  resultadosObtenidos: string
  ajustes?: string
  resultadoGeneral: ResultadoGeneral
  fechaRegistro: string
}

export async function registerPlanFollowUp(
  episodioId: number,
  problemaId: number,
  payload: CreatePlanFollowUpRequest
): Promise<PlanFollowUpDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/problemas/${problemaId}/plan/seguimientos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )

  return parseJsonOrThrow<PlanFollowUpDto>(
    response,
    'No se pudo registrar el seguimiento del plan.'
  )
}

export async function getPlanFollowUps(
  episodioId: number,
  problemaId: number
): Promise<PlanFollowUpDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/problemas/${problemaId}/plan/seguimientos`,
    { method: 'GET' }
  )

  return parseJsonOrThrow<PlanFollowUpDto[]>(
    response,
    'No se pudo cargar el historial de seguimientos.'
  )
}

// ── Resumen global de planes (vista Consultas) ───────────────────────────────

export type PlanResumenDto = {
  id: string | number
  hcl: string
  paciente: string
  episodioId: number
  problemaId: number
  problemaDescripcion: string
  codigoCie10: string
  objetivoGeneral: string
  sesionesPlanificadas: number
  sesionesRealizadas: number
  porcentajeAvance: number
  codigoAlarma: string
  estado: string
  ultimoResultado?: string
  fechaInicio: string
  fechaFinEstimada: string
}

export type PlanResumenPage = {
  data: PlanResumenDto[]
  meta: { totalItems: number; totalPages: number; currentPage: number }
}

export async function getPlanesTratamientoResumen(
  page: number = 1,
  limit: number = 10
): Promise<PlanResumenPage> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/planes/resumen?page=${page}&limit=${limit}`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<PlanResumenPage>(response, 'No se pudo cargar el resumen de planes.')
}

export async function getPlan(
  episodioId: number,
  problemaId: number
): Promise<TreatmentPlanDto | null> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/problemas/${problemaId}/plan`,
    { method: 'GET' }
  )
  if (response.status === 404) return null
  return parseJsonOrThrow<TreatmentPlanDto>(response, 'No se pudo cargar el plan de tratamiento.')
}

export type PlanEstado = 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO' | 'DERIVADO'

export async function updatePlanEstado(
  episodioId: number,
  problemaId: number,
  estado: PlanEstado
): Promise<void> {
  await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/problemas/${problemaId}/plan/estado`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    }
  )
}

// ── Módulo 6 — Evaluación Clínica Rápida ────────────────────────────────────

export type SignosVitalesClinicaDto = {
  pa: string
  fc: number
}

export type CreateEvaluacionClinicaRequest = {
  fechaEvaluacion: string
  fisioterapeutaId?: string
  signosVitales: SignosVitalesClinicaDto
  motivoConsulta: string
  observacionGeneral?: string
  hallazgosPrincipales: string[]
  escalaEva: number
  impresionDiagnostica: string
  planInicial: string
}

export type UpdateEvaluacionClinicaRequest = Partial<CreateEvaluacionClinicaRequest>

export type EvaluacionClinicaResponse = {
  id: number
  episodioClinicoId: number
  fechaEvaluacion: string
  fisioterapeutaId?: string
  signosVitales: SignosVitalesClinicaDto
  motivoConsulta: string
  observacionGeneral?: string
  hallazgosPrincipales: string[]
  escalaEva: number
  impresionDiagnostica: string
  planInicial: string
  creadoEn: string
}

export async function createEvaluacionClinica(
  episodioId: number,
  payload: CreateEvaluacionClinicaRequest
): Promise<EvaluacionClinicaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones-clinicas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  return parseJsonOrThrow<EvaluacionClinicaResponse>(response, 'No se pudo crear la evaluación clínica.')
}

export async function listEvaluacionesClinicals(
  episodioId: number
): Promise<EvaluacionClinicaResponse[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones-clinicas`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<EvaluacionClinicaResponse[]>(response, 'No se pudieron cargar las evaluaciones clínicas.')
}

export async function getEvaluacionClinica(
  episodioId: number,
  evaluacionId: number
): Promise<EvaluacionClinicaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones-clinicas/${evaluacionId}`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<EvaluacionClinicaResponse>(response, 'No se pudo cargar la evaluación clínica.')
}

export async function updateEvaluacionClinica(
  episodioId: number,
  evaluacionId: number,
  payload: UpdateEvaluacionClinicaRequest
): Promise<EvaluacionClinicaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones-clinicas/${evaluacionId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  return parseJsonOrThrow<EvaluacionClinicaResponse>(response, 'No se pudo actualizar la evaluación clínica.')
}

export async function deleteEvaluacionClinica(
  episodioId: number,
  evaluacionId: number
): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios-clinicos/${episodioId}/evaluaciones-clinicas/${evaluacionId}`,
    { method: 'DELETE' }
  )
  if (!response.ok) {
    const msg = await extractErrorMessage(response, 'No se pudo eliminar la evaluación clínica.')
    throw new Error(msg)
  }
}

// ── Módulo 7 — Sesiones de Terapia y Notas SOAP ──────────────────────────────

export type EstadoSesionTerapia = 'EN_PROGRESO' | 'FINALIZADA' | 'FIRMADA'

export type NotaSOAPResponse = {
  id: number
  sesionTerapiaId: number
  subjetivo?: string
  objetivo?: string
  analisis?: string
  plan?: string
  modoBorrador: boolean
  firmadoPorId?: number
  firmadoEn?: string
  hashIntegridad?: string
  fechaCreacion: string
  fechaModificacion: string
}

export type SesionTerapiaResponse = {
  id: number
  citaId: number
  planTratamientoId?: number
  pacienteId: number
  episodioClinicoId?: number
  profesionalId: number
  costoSesion?: number
  numeroSesionEnPlan?: number
  fechaHoraInicio: string
  estado: EstadoSesionTerapia
  firmadoPorId?: number
  firmadoEn?: string
  hashIntegridad?: string
  fechaCreacion: string
  notaSOAP?: NotaSOAPResponse
}

export type ActualizarNotaSOAPRequest = {
  subjetivo?: string
  objetivo?: string
  analisis?: string
  plan?: string
}

export async function getSesionTerapia(sesionId: number): Promise<SesionTerapiaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/sesiones/${sesionId}`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<SesionTerapiaResponse>(response, 'No se pudo cargar la sesión de terapia.')
}

export async function getHistorialSesionesPorEpisodio(
  episodioId: number
): Promise<SesionTerapiaResponse[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/episodios/${episodioId}/historial`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<SesionTerapiaResponse[]>(response, 'No se pudo cargar el historial de sesiones.')
}

export async function actualizarNotaSOAP(
  sesionId: number,
  payload: ActualizarNotaSOAPRequest
): Promise<SesionTerapiaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/sesiones/${sesionId}/nota-soap`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  return parseJsonOrThrow<SesionTerapiaResponse>(response, 'No se pudo actualizar la nota SOAP.')
}

export async function firmarSesion(sesionId: number): Promise<SesionTerapiaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/sesiones/${sesionId}/firmar`,
    { method: 'PATCH' }
  )
  return parseJsonOrThrow<SesionTerapiaResponse>(response, 'No se pudo firmar la sesión.')
}

// ── Módulo 8 — Dashboard de Planes de Tratamiento ────────────────────────────

export type PacienteResumenDto = {
  pacienteId: number
  pacienteNombre: string
  hcl: string
  peorAlarma: CodigoAlarma
  conteoPlanesActivos: number
}

export type EstadisticasDashboardDto = {
  total: number
  enRiesgo: number
  finalizando: number
}

export type PlanContextoDto = {
  planId: number
  problemaId: number
  problemaDescripcion: string
  codigoCie10: string
  objetivoGeneral: string
  sesionesPlanificadas: number
  sesionesRealizadas: number
  porcentajeAvance: number
  codigoAlarma: CodigoAlarma
  estado: string
  fechaInicio: string
  fechaFinEstimada: string
}

export type EpisodioContextoDto = {
  episodioId: number
  numeroEpisodio: string
  motivoConsulta: string
  estado: string
  fechaApertura: string
  planes: PlanContextoDto[]
}

export type ContextoPlanesDto = {
  pacienteId: number
  pacienteNombre: string
  hcl: string
  episodios: EpisodioContextoDto[]
}

export type TimelineEventTipo = 'SESION_SOAP' | 'SEGUIMIENTO_PLAN'

export type TimelineEventDto = {
  tipo: TimelineEventTipo
  itemId: number
  fecha: string
  numeroSesion: number
  resumen: string
  estadoSesion: EstadoSesionTerapia | null
  notaFirmada: boolean | null
  resultadoGeneral: ResultadoGeneral | null
  porcentajeAvance: number | null
}

export async function getResumenPacientes(): Promise<PacienteResumenDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/planes-tratamiento/resumen-pacientes`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<PacienteResumenDto[]>(response, 'No se pudo cargar el resumen de pacientes.')
}

export async function getEstadisticasDashboard(): Promise<EstadisticasDashboardDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/planes-tratamiento/estadisticas-dashboard`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<EstadisticasDashboardDto>(response, 'No se pudieron cargar las estadísticas.')
}

export async function getContextoPlanes(pacienteId: number): Promise<ContextoPlanesDto> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/pacientes/${pacienteId}/contexto-planes`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<ContextoPlanesDto>(response, 'No se pudo cargar el contexto de planes.')
}

export async function getPlanTimeline(planId: number): Promise<TimelineEventDto[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/planes-tratamiento/${planId}/timeline`,
    { method: 'GET' }
  )
  return parseJsonOrThrow<TimelineEventDto[]>(response, 'No se pudo cargar el timeline del plan.')
}

export async function iniciarSesionDirecta(planId: number): Promise<SesionTerapiaResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/planes-tratamiento/${planId}/iniciar-sesion-directa`,
    { method: 'POST' }
  )
  return parseJsonOrThrow<SesionTerapiaResponse>(response, 'No se pudo iniciar la sesión directa.')
}
