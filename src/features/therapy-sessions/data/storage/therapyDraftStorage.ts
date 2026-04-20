import type { TherapySessionDraft } from '../types'

const DRAFT_KEY = 'fisiolab_therapy_draft'

export const therapyDraftStorage = {
  save(draft: Omit<TherapySessionDraft, 'savedAt'>): void {
    const entry: TherapySessionDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(entry))
  },

  load(): TherapySessionDraft | null {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as TherapySessionDraft
    } catch {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
  },

  clear(): void {
    localStorage.removeItem(DRAFT_KEY)
  },

  exists(): boolean {
    return localStorage.getItem(DRAFT_KEY) !== null
  },
}
