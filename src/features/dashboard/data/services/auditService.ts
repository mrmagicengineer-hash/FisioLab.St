export type AuditModule = 'Usuarios' | 'Seguridad' | 'Roles' | 'Sistema'
export type AuditSeverity = 'ALTA' | 'MEDIA' | 'BAJA'

export type AuditEventDto = {
  id: string
  fecha: string
  usuario: string
  modulo: AuditModule
  accion: string
  detalle: string
  severidad: AuditSeverity
}

type ApiAuditEvent = {
  id?: string | number
  fecha?: string | number
  fechaHora?: string | number
  createdAt?: string | number
  updatedAt?: string | number
  timestamp?: string | number
  date?: string | number
  eventDate?: string | number
  usuario?: string
  user?: string
  email?: string
  modulo?: string
  module?: string
  accion?: string
  action?: string
  tipoEvento?: string
  detalle?: string
  detail?: string
  descripcion?: string
  severidad?: string
  severity?: string
}

type ApiAuditListPayload =
  | ApiAuditEvent[]
  | {
      content?: ApiAuditEvent[]
      data?: ApiAuditEvent[]
      items?: ApiAuditEvent[]
    }

import { fetchWithAuth } from '../../../auth/data/services/apiClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string; detail?: string }
    return payload.message ?? payload.error ?? payload.detail ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function normalizeModule(value: string | undefined): AuditModule {
  const normalized = (value ?? '').toLowerCase()

  if (normalized.includes('segurid')) {
    return 'Seguridad'
  }

  if (normalized.includes('rol')) {
    return 'Roles'
  }

  if (normalized.includes('sistem')) {
    return 'Sistema'
  }

  return 'Usuarios'
}

function normalizeSeverity(value: string | undefined): AuditSeverity {
  const normalized = (value ?? '').toLowerCase()

  if (normalized.includes('alt') || normalized.includes('high')) {
    return 'ALTA'
  }

  if (normalized.includes('baj') || normalized.includes('low')) {
    return 'BAJA'
  }

  return 'MEDIA'
}

function formatAuditDate(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

function extractDate(item: ApiAuditEvent): string {
  const candidate =
    item.fecha ??
    item.fechaHora ??
    item.eventDate ??
    item.createdAt ??
    item.updatedAt ??
    item.timestamp ??
    item.date

  return formatAuditDate(candidate)
}

function extractEvents(payload: ApiAuditListPayload): ApiAuditEvent[] {
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

function mapApiAuditEvent(item: ApiAuditEvent, index: number): AuditEventDto {
  return {
    id: String(item.id ?? `AUD-${index + 1}`),
    fecha: extractDate(item),
    usuario: item.usuario ?? item.user ?? item.email ?? 'sistema',
    modulo: normalizeModule(item.modulo ?? item.module),
    accion: item.accion ?? item.action ?? item.tipoEvento ?? 'Evento',
    detalle: item.detalle ?? item.detail ?? item.descripcion ?? '-',
    severidad: normalizeSeverity(item.severidad ?? item.severity)
  }
}

export async function getAuditEvents(): Promise<AuditEventDto[]> {
  const configuredEndpoint = import.meta.env.VITE_AUDIT_EVENTS_ENDPOINT as string | undefined
  const fallbackEndpoints = [
    configuredEndpoint,
    `${API_BASE_URL}/admin/auditoria/eventos`,
    `${API_BASE_URL}/admin/auditoria`,
    `${API_BASE_URL}/auditoria/eventos`
  ].filter(Boolean) as string[]

  let lastMessage = 'No fue posible cargar los eventos de auditoria.'

  for (const endpoint of fallbackEndpoints) {
    const response = await fetchWithAuth(endpoint, {
      method: 'GET',
    })

    if (response.ok) {
      const payload = (await response.json()) as ApiAuditListPayload
      return extractEvents(payload).map(mapApiAuditEvent)
    }

    if (response.status === 404) {
      continue
    }

    lastMessage = await extractErrorMessage(response, lastMessage)
    throw new Error(lastMessage)
  }

  throw new Error(lastMessage)
}
