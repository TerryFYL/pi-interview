export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface InterviewSession {
  id: string
  messages: Message[]
  startedAt: number
  completedAt?: number
}
