import { refreshAuthToken } from './authService'

type PendingRequest = {
  resolve: (token: string) => void
  reject: (reason: unknown) => void
}

let isRefreshing = false
let pendingQueue: PendingRequest[] = []

function drainQueueWithToken(token: string) {
  const queue = pendingQueue
  pendingQueue = []
  queue.forEach(({ resolve }) => resolve(token))
}

function drainQueueWithError(reason: unknown) {
  const queue = pendingQueue
  pendingQueue = []
  queue.forEach(({ reject }) => reject(reason))
}

function waitForRefreshedToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ resolve, reject })
  })
}

function buildRequestInit(options: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return { ...options, headers }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken')
  const response = await fetch(url, buildRequestInit(options, token))

  if (response.status !== 401) {
    return response
  }

  // Si ya hay un refresh en curso, esperamos el nuevo token y reintentamos.
  if (isRefreshing) {
    try {
      const refreshedToken = await waitForRefreshedToken()
      return await fetch(url, buildRequestInit(options, refreshedToken))
    } catch (error) {
      throw error
    }
  }

  isRefreshing = true
  try {
    const newToken = await refreshAuthToken()
    isRefreshing = false
    drainQueueWithToken(newToken)
    return await fetch(url, buildRequestInit(options, newToken))
  } catch (error) {
    isRefreshing = false
    drainQueueWithError(error)
    window.dispatchEvent(new Event('auth:logout'))
    throw error
  }
}
