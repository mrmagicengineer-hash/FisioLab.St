import { fetchWithAuth } from '../../../auth/data/services/apiClient'
import { invalidatePatientsCache } from './patientsCache'

export type PatientFileStatus = 'ACTIVO' | 'PASIVO'

export type PatientListItemDto = {
  id: number
  hcl: string
  cedula: string
  nombresCompletos: string
  estadoArchivo: PatientFileStatus
  ultimaAtencion: string
  fechaRegistro: string
  episodios?: any[]
}

export type CreatePatientRequest = {
  cedula: string
  email: string
  nombresCompletos: string
  fechaNacimiento: string
  genero: string
  grupoCultural: string
  estadoCivil: string
  ocupacion: string
  regimenSeguridadSocial: string
  tipoSangre: string
  telefonoPrincipal: string
  telefonoSecundario: string
  direccion: string
}

export type CreatedPatientDto = {
  id: number
  hcl: string
}

export type UpdatePatientRequest = {
  cedula: string
  email: string
  nombresCompletos: string
  fechaNacimiento: string
  genero: string
  grupoCultural: string
  estadoCivil: string
  ocupacion: string
  regimenSeguridadSocial: string
  tipoSangre: string
  telefonoPrincipal: string
  telefonoSecundario: string
  direccion: string
}

export type PatientDetailDto = {
  id: number
  hcl: string
  cedula: string
  email: string
  nombresCompletos: string
  fechaNacimiento: string
  genero: string
  grupoCultural: string
  estadoCivil: string
  ocupacion: string
  regimenSeguridadSocial: string
  tipoSangre: string
  telefonoPrincipal: string
  telefonoSecundario: string
  direccion: string
  estadoArchivo: PatientFileStatus
  fechaRegistro: string
  fechaUltimaAtencion: string
}

export type FamilyRecordDto = {
  jefeHogar: string
  numeroMiembros: string
  tipoVivienda: string
  condicionesSanitarias: string
}

export type UpsertFamilyRecordRequest = {
  jefeHogar: string
  numeroMiembros: string
  tipoVivienda: string
  condicionesSanitarias: string
}

type ApiPatientItem = {
  id?: number | string
  hcl?: string
  historiaClinica?: string
  numeroHcl?: string
  cedula?: string
  nombreCompleto?: string
  nombresCompletos?: string
  nombres?: string
  apellidos?: string
  estadoArchivo?: string
  estado?: string
  ultimaAtencion?: string
  fechaUltimaAtencion?: string
  fechaRegistro?: string
  createdAt?: string
}

type ApiCreatePatientResponse = {
  id?: number | string
  hcl?: string
  historiaClinica?: string
  numeroHcl?: string
}

type ApiPatientDetailPayload = {
  id?: number | string
  hcl?: string
  historiaClinica?: string
  numeroHcl?: string
  cedula?: string
  email?: string
  correo?: string
  nombreCompleto?: string
  nombresCompletos?: string
  nombres?: string
  apellidos?: string
  fechaNacimiento?: string
  genero?: string
  grupoCultural?: string
  estadoCivil?: string
  ocupacion?: string
  regimenSeguridadSocial?: string
  tipoSangre?: string
  telefonoPrincipal?: string
  telefonoSecundario?: string
  direccion?: string
  estadoArchivo?: string
  estado?: string
  fechaRegistro?: string
  createdAt?: string
  fechaUltimaAtencion?: string
  ultimaAtencion?: string
}

type ApiFamilyRecordPayload = {
  jefeHogar?: string
  nombreJefeHogar?: string
  numeroMiembros?: number | string
  miembrosHogar?: number | string
  tipoVivienda?: string
  condicionesSanitarias?: string
}

type ApiPatientListPayload =
  | ApiPatientItem[]
  | {
      content?: ApiPatientItem[]
      data?: ApiPatientItem[]
      items?: ApiPatientItem[]
    }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string; detail?: string }
    return payload.message ?? payload.error ?? payload.detail ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function extractItems(payload: ApiPatientListPayload): ApiPatientItem[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.content)) {
    return payload.content
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  return []
}

function normalizeStatus(value: string | undefined): PatientFileStatus {
  const normalized = (value ?? '').toUpperCase()
  return normalized.includes('PASIV') ? 'PASIVO' : 'ACTIVO'
}

function normalizeDate(value: string | undefined): string {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed)
}

function mapPatient(item: ApiPatientItem, index: number): PatientListItemDto {
  const nombres = item.nombres ?? ''
  const apellidos = item.apellidos ?? ''
  const fallbackFullName = `${nombres} ${apellidos}`.trim()

  return {
    id: Number(item.id ?? index + 1),
    hcl: item.numeroHcl ?? item.hcl ?? item.historiaClinica ?? '-',
    cedula: item.cedula ?? '-',
    nombresCompletos: item.nombresCompletos ?? item.nombreCompleto ?? (fallbackFullName || '-'),
    estadoArchivo: normalizeStatus(item.estadoArchivo ?? item.estado),
    ultimaAtencion: normalizeDate(item.ultimaAtencion ?? item.fechaUltimaAtencion),
    fechaRegistro: normalizeDate(item.fechaRegistro ?? item.createdAt)
  }
}

async function requestPatients(url: string, fallbackMessage: string): Promise<PatientListItemDto[]> {
  const response = await fetchWithAuth(url, {
    method: 'GET'
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response, fallbackMessage)
    throw new Error(message)
  }

  const payload = (await response.json()) as ApiPatientListPayload
  return extractItems(payload).map(mapPatient)
}

function normalizeCreatePayload(payload: CreatePatientRequest): CreatePatientRequest {
  return {
    cedula: payload.cedula.trim(),
    email: payload.email.trim(),
    nombresCompletos: payload.nombresCompletos.trim(),
    fechaNacimiento: payload.fechaNacimiento.trim(),
    genero: payload.genero.trim(),
    grupoCultural: payload.grupoCultural.trim(),
    estadoCivil: payload.estadoCivil.trim(),
    ocupacion: payload.ocupacion.trim(),
    regimenSeguridadSocial: payload.regimenSeguridadSocial.trim(),
    tipoSangre: payload.tipoSangre.trim(),
    telefonoPrincipal: payload.telefonoPrincipal.trim(),
    telefonoSecundario: payload.telefonoSecundario.trim(),
    direccion: payload.direccion.trim()
  }
}

function mapCreatedPatient(payload: ApiCreatePatientResponse): CreatedPatientDto {
  return {
    id: Number(payload.id ?? 0),
    hcl: payload.hcl ?? payload.historiaClinica ?? payload.numeroHcl ?? '-'
  }
}

function normalizeUpdatePayload(payload: UpdatePatientRequest): UpdatePatientRequest {
  return {
    cedula: payload.cedula.trim(),
    email: payload.email.trim(),
    nombresCompletos: payload.nombresCompletos.trim(),
    fechaNacimiento: payload.fechaNacimiento.trim(),
    genero: payload.genero.trim(),
    grupoCultural: payload.grupoCultural.trim(),
    estadoCivil: payload.estadoCivil.trim(),
    ocupacion: payload.ocupacion.trim(),
    regimenSeguridadSocial: payload.regimenSeguridadSocial.trim(),
    tipoSangre: payload.tipoSangre.trim(),
    telefonoPrincipal: payload.telefonoPrincipal.trim(),
    telefonoSecundario: payload.telefonoSecundario.trim(),
    direccion: payload.direccion.trim()
  }
}

function mapPatientDetail(payload: ApiPatientDetailPayload): PatientDetailDto {
  const nombres = payload.nombres ?? ''
  const apellidos = payload.apellidos ?? ''
  const fullName = payload.nombresCompletos ?? payload.nombreCompleto ?? `${nombres} ${apellidos}`.trim()

  return {
    id: Number(payload.id ?? 0),
    hcl: payload.numeroHcl ?? payload.hcl ?? payload.historiaClinica ?? '-',
    cedula: payload.cedula ?? '',
    email: payload.email ?? payload.correo ?? '',
    nombresCompletos: fullName,
    fechaNacimiento: payload.fechaNacimiento ?? '',
    genero: payload.genero ?? '',
    grupoCultural: payload.grupoCultural ?? '',
    estadoCivil: payload.estadoCivil ?? '',
    ocupacion: payload.ocupacion ?? '',
    regimenSeguridadSocial: payload.regimenSeguridadSocial ?? '',
    tipoSangre: payload.tipoSangre ?? '',
    telefonoPrincipal: payload.telefonoPrincipal ?? '',
    telefonoSecundario: payload.telefonoSecundario ?? '',
    direccion: payload.direccion ?? '',
    estadoArchivo: normalizeStatus(payload.estadoArchivo ?? payload.estado),
    fechaRegistro: normalizeDate(payload.fechaRegistro ?? payload.createdAt),
    fechaUltimaAtencion: normalizeDate(payload.fechaUltimaAtencion ?? payload.ultimaAtencion)
  }
}

function mapFamilyRecord(payload: ApiFamilyRecordPayload): FamilyRecordDto {
  return {
    jefeHogar: payload.jefeHogar ?? payload.nombreJefeHogar ?? '',
    numeroMiembros: String(payload.numeroMiembros ?? payload.miembrosHogar ?? ''),
    tipoVivienda: payload.tipoVivienda ?? '',
    condicionesSanitarias: payload.condicionesSanitarias ?? ''
  }
}

function normalizeFamilyPayload(payload: UpsertFamilyRecordRequest): UpsertFamilyRecordRequest {
  return {
    jefeHogar: payload.jefeHogar.trim(),
    numeroMiembros: payload.numeroMiembros.trim(),
    tipoVivienda: payload.tipoVivienda.trim(),
    condicionesSanitarias: payload.condicionesSanitarias.trim()
  }
}

export async function getPatients(): Promise<PatientListItemDto[]> {
  return requestPatients(
    `${API_BASE_URL}/pacientes`,
    'No se pudieron cargar los pacientes. Revisa tu conexion o intenta nuevamente.'
  )
}

export async function searchPatients(query: string): Promise<PatientListItemDto[]> {
  const params = new URLSearchParams({ q: query })

  return requestPatients(
    `${API_BASE_URL}/pacientes/busqueda?${params.toString()}`,
    'No se pudo buscar pacientes. Revisa tu conexion o intenta nuevamente.'
  )
}

export async function createPatient(payload: CreatePatientRequest): Promise<CreatedPatientDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/pacientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizeCreatePayload(payload))
  })

  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      'No se pudo registrar el paciente. Revisa cédula o conexión.'
    )
    throw new Error(message)
  }

  const created = (await response.json()) as ApiCreatePatientResponse
  invalidatePatientsCache()
  return mapCreatedPatient(created)
}

export async function getPatientById(patientId: number): Promise<PatientDetailDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/pacientes/${patientId}`, {
    method: 'GET'
  })

  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      'No se pudo cargar la informacion del paciente.'
    )
    throw new Error(message)
  }

  const payload = (await response.json()) as ApiPatientDetailPayload
  return mapPatientDetail(payload)
}

export async function updatePatient(patientId: number, payload: UpdatePatientRequest): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/pacientes/${patientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizeUpdatePayload(payload))
  })

  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      'No se pudo actualizar la ficha del paciente.'
    )
    throw new Error(message)
  }

  invalidatePatientsCache()
}

export async function getPatientFamilyRecord(patientId: number): Promise<FamilyRecordDto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/pacientes/${patientId}/ficha-familiar`, {
    method: 'GET'
  })

  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      'No se pudo cargar la ficha familiar.'
    )
    throw new Error(message)
  }

  const payload = (await response.json()) as ApiFamilyRecordPayload
  return mapFamilyRecord(payload)
}

export async function upsertPatientFamilyRecord(
  patientId: number,
  payload: UpsertFamilyRecordRequest
): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/pacientes/${patientId}/ficha-familiar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizeFamilyPayload(payload))
  })

  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      'No se pudo guardar la ficha familiar.'
    )
    throw new Error(message)
  }
}
