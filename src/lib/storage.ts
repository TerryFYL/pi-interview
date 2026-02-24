import type { InterviewSession } from './types'

const SESSION_KEY = 'pi-interview-session'

export function saveSession(session: InterviewSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): InterviewSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as InterviewSession) : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
