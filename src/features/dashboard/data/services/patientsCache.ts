import type { PatientListItemDto } from './patientsService'

const TTL_MS = 5 * 60 * 1000
const STORAGE_KEY = 'fisiolab:patients-cache:v1'

type CacheEntry = {
  data: PatientListItemDto[]
  timestamp: number
}

type CacheMap = Record<string, CacheEntry>

let memoryCache: CacheMap | null = null

function loadFromStorage(): CacheMap {
  if (memoryCache) {
    return memoryCache
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    memoryCache = raw ? (JSON.parse(raw) as CacheMap) : {}
  } catch {
    memoryCache = {}
  }

  return memoryCache
}

function persistToStorage(): void {
  if (!memoryCache) {
    return
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache))
  } catch {
    // storage puede estar lleno o no disponible; ignoramos
  }
}

function normalizeKey(query: string): string {
  return query.trim().toLowerCase()
}

export function readPatientsCache(query: string): PatientListItemDto[] | null {
  const entry = loadFromStorage()[normalizeKey(query)]
  return entry ? entry.data : null
}

export function isPatientsCacheFresh(query: string): boolean {
  const entry = loadFromStorage()[normalizeKey(query)]
  return !!entry && Date.now() - entry.timestamp < TTL_MS
}

export function writePatientsCache(query: string, data: PatientListItemDto[]): void {
  const cache = loadFromStorage()
  cache[normalizeKey(query)] = { data, timestamp: Date.now() }
  persistToStorage()
}

export function invalidatePatientsCache(): void {
  memoryCache = {}
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignoramos errores de storage
  }
}
