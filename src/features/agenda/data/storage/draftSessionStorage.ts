import type { SessionDraft } from '../types'

const DRAFT_KEY = 'fisiolab_session_draft'

/**
 * Persiste borrador de sesión en sessionStorage.
 * Protege contra pérdida de datos si la conexión falla al iniciar atención.
 * El módulo de Sesiones lo lee al montar para pre-llenar el formulario.
 */
export const draftSessionStorage = {
  save(draft: Omit<SessionDraft, 'savedAt'>): void {
    const entry: SessionDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(entry))
  },

  load(): SessionDraft | null {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as SessionDraft
    } catch {
      sessionStorage.removeItem(DRAFT_KEY)
      return null
    }
  },

  clear(): void {
    sessionStorage.removeItem(DRAFT_KEY)
  },

  exists(): boolean {
    return sessionStorage.getItem(DRAFT_KEY) !== null
  },
}
