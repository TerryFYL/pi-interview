const API_URL = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function sendMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new ApiError(response.status, text || `请求失败 (${response.status})`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6)
        if (data === '[DONE]') return fullText
        try {
          const parsed = JSON.parse(data)
          if (parsed.t) {
            fullText += parsed.t
            onChunk(parsed.t)
          }
        } catch {
          /* skip malformed lines */
        }
      }
    }
  }

  return fullText
}

export async function submitInterview(session: {
  id: string
  messages: Array<{ role: string; content: string; timestamp: number }>
  startedAt: number
  completedAt: number
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
    return response.ok
  } catch {
    return false
  }
}
