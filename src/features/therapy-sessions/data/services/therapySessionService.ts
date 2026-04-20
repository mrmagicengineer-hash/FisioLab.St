import { fetchWithAuth } from '../../../auth/data/services/apiClient'
import type { TherapySession, EvolutionNote, SesionTerapiaResponse, ResumenProgresoResponse, UpdateNotaSOAPRequest, NotaSOAPResponse, AdjuntoSesionResponse } from '../types'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export class TherapySessionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'TherapySessionApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = `Error ${res.status}`
    try {
      const json = JSON.parse(text)
      message = json.message ?? json.error ?? message
    } catch { /* noop */ }
    throw new TherapySessionApiError(message, res.status)
  }
  return res.json() as Promise<T>
}

export async function createTherapySession(
  session: Omit<TherapySession, 'id' | 'status' | 'creadoEn' | 'firmadoEn'>
): Promise<TherapySession> {
  const res = await fetchWithAuth(`${API}/sesiones-terapia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
  return handleResponse<TherapySession>(res)
}

export async function signTherapySession(sessionId: number): Promise<TherapySession> {
  const res = await fetchWithAuth(`${API}/sesiones-terapia/${sessionId}/firmar`, {
    method: 'POST',
  })
  return handleResponse<TherapySession>(res)
}

export async function getSessionsByEpisode(episodioId: number): Promise<EvolutionNote[]> {
  const res = await fetchWithAuth(`${API}/sesiones-terapia?episodioId=${episodioId}`)
  return handleResponse<EvolutionNote[]>(res)
}

// TODO: confirmar endpoint correcto — /sesiones-terapia?pacienteId= devuelve 404
export async function getSessionsByPatient(pacienteId: number): Promise<EvolutionNote[]> {
  const res = await fetchWithAuth(`${API}/sesiones-terapia?pacienteId=${pacienteId}`)
  if (res.status === 404) return []
  return handleResponse<EvolutionNote[]>(res)
}

export async function sendBillingHandoff(payload: {
  citaId:     number
  pacienteId: number
  costo:      number
  sessionId:  number
}): Promise<void> {
  const res = await fetchWithAuth(`${API}/facturacion/sesion-costo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    console.warn('[billing] handoff failed — session signed but billing not sent', payload)
  }
}

// ─── Nuevos Endpoints (v1 API) ───────────────────────────────────────────────

export async function atenderCita(citaId: number): Promise<SesionTerapiaResponse> {
  const res = await fetchWithAuth(`${API}/citas/${citaId}/atender`, {
    method: 'PATCH'
  })
  return handleResponse<SesionTerapiaResponse>(res)
}

export async function getSesion(sesionId: number): Promise<SesionTerapiaResponse> {
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}`)
  return handleResponse<SesionTerapiaResponse>(res)
}

export async function getResumenProgreso(sesionId: number): Promise<ResumenProgresoResponse> {
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}/resumen-progreso`)
  return handleResponse<ResumenProgresoResponse>(res)
}

export async function updateNotaSOAP(sesionId: number, data: UpdateNotaSOAPRequest): Promise<NotaSOAPResponse> {
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}/nota-soap`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return handleResponse<NotaSOAPResponse>(res)
}

export async function uploadAdjunto(sesionId: number, file: File): Promise<AdjuntoSesionResponse> {
  const formData = new FormData()
  formData.append('archivo', file)
  
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}/adjuntos`, {
    method: 'POST',
    // IMPORTANTE: NO enviar 'Content-Type': 'multipart/form-data',
    // el navegador lo hace automáticamente e incluye el boundary
    body: formData,
  })
  return handleResponse<AdjuntoSesionResponse>(res)
}

export async function getAdjuntos(sesionId: number): Promise<AdjuntoSesionResponse[]> {
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}/adjuntos`)
  return handleResponse<AdjuntoSesionResponse[]>(res)
}

export async function deleteAdjunto(sesionId: number, adjuntoId: number): Promise<void> {
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}/adjuntos/${adjuntoId}`, {
    method: 'DELETE'
  })
  
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = `Error ${res.status}`
    try {
      const json = JSON.parse(text)
      message = json.message ?? json.error ?? message
    } catch { /* noop */ }
    throw new TherapySessionApiError(message, res.status)
  }
}

export async function firmarSesion(sesionId: number): Promise<SesionTerapiaResponse> {
  const res = await fetchWithAuth(`${API}/sesiones/${sesionId}/firmar`, {
    method: 'PATCH'
  })
  return handleResponse<SesionTerapiaResponse>(res)
}

export async function getHistorialSesiones(episodioId: number): Promise<SesionTerapiaResponse[]> {
  const res = await fetchWithAuth(`${API}/episodios/${episodioId}/historial`)
  return handleResponse<SesionTerapiaResponse[]>(res)
}

export function getDescargarAdjuntoUrl(sesionId: number, adjuntoId: number): string {
  return `${API}/sesiones/${sesionId}/adjuntos/${adjuntoId}/descargar`
}

export function getDescargarPdfUrl(sesionId: number): string {
  return `${API}/sesiones/${sesionId}/pdf`
}
