import { fetchWithAuth } from '../../../auth/data/services/apiClient'
import type { Patient, PatientSearchResult } from '../types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

type ApiPatientItem = {
  id?: number | string
  cedula?: string
  numeroHcl?: string
  nombresCompletos?: string
  nombreCompleto?: string
  nombres?: string
  apellidos?: string
  telefonoPrincipal?: string
  email?: string
  correo?: string
  estadoArchivo?: string
}

function mapToPatient(item: ApiPatientItem, index: number): Patient {
  const nombres = item.nombres ?? ''
  const apellidos = item.apellidos ?? ''
  const fullName =
    item.nombresCompletos ?? item.nombreCompleto ?? `${nombres} ${apellidos}`.trim()

  return {
    id:             Number(item.id ?? index + 1),
    fullName,
    documentNumber: item.cedula ?? '',
    documentType:   'CI',
    phone:          item.telefonoPrincipal,
    email:          item.email ?? item.correo,
    numeroHcl:      item.numeroHcl,
    estadoArchivo:  item.estadoArchivo,
  }
}

export async function searchPatients(
  query: string,
  _limit = 10
): Promise<PatientSearchResult> {
  if (query.trim().length < 3) {
    return { items: [], total: 0 }
  }

  const params = new URLSearchParams({ q: query.trim() })

  const response = await fetchWithAuth(
    `${API_BASE_URL}/pacientes/busqueda?${params.toString()}`
  )

  if (!response.ok) {
    return { items: [], total: 0 }
  }

  const payload = await response.json() as ApiPatientItem[] | { content?: ApiPatientItem[]; items?: ApiPatientItem[] }
  const raw: ApiPatientItem[] = Array.isArray(payload)
    ? payload
    : (payload.content ?? payload.items ?? [])

  const items = raw.map(mapToPatient)
  return { items, total: items.length }
}

export async function getPatientById(patientId: number): Promise<Patient | null> {
  const response = await fetchWithAuth(`${API_BASE_URL}/pacientes/${patientId}`)
  if (!response.ok) return null

  const item = (await response.json()) as ApiPatientItem
  return mapToPatient(item, 0)
}
