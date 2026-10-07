// Client-side types + Bearer fetch wrapper (auth lives in localStorage).

export type Problem = {
  number: number
  question: string
  studentAnswer: string | null
  readConfidence: string
  altReading: string | null
  isCorrect: boolean
  correctAnswer: string | null
  errorType: string | null
}

export type PracticeQ = {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  targets: string
}

export type Misconception = {
  id: string
  name: string
  key: string
  explanationStudent: string
  severity: string
  mastery: number
  occurrences: number
  isNew: boolean
  practice: PracticeQ[]
}

export type AssignmentDetail = {
  id: string
  status: 'extracting' | 'confirm' | 'diagnosing' | 'done' | 'error'
  stage: string
  filename: string
  problems?: Problem[]
  score?: number | null
  total?: number | null
  twinSummary?: string | null
  misconceptions?: Misconception[]
}

export type TwinOverview = {
  twin: {
    misconceptions: Array<{
      id: string; name: string; key: string; mastery: number
      occurrences: number; severity: string; explanationStudent: string
      lastSeenAt: string; firstSeenAt: string
    }>
  }
  history: Array<{
    id: string; filename: string; score: number | null; total: number | null
    createdAt: string; twinSummary: string | null
  }>
}

const TOKEN_KEY = 'learntwin_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function api(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...(options.headers as any) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(path, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    throw new Error('unauthorized')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}
