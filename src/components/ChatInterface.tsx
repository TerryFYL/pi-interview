import { useState, useEffect, useRef, useCallback } from 'react'
import type { Message, InterviewSession } from '../lib/types'
import { sendMessage } from '../lib/api'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'

interface Props {
  session: InterviewSession
  onUpdateSession: (session: InterviewSession) => void
  onComplete: () => void
}

export default function ChatInterface({ session, onUpdateSession, onComplete }: Props) {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Stable ref for latest session to avoid stale closures
  const sessionRef = useRef(session)
  sessionRef.current = session

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session.messages.length, streamingContent, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [input])

  // Focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isThinking) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    const currentSession = sessionRef.current
    const updatedMessages = [...currentSession.messages, userMessage]
    const updatedSession = { ...currentSession, messages: updatedMessages }
    onUpdateSession(updatedSession)
    setInput('')
    setError(null)
    setIsThinking(true)
    setStreamingContent('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      let fullResponse = ''
      await sendMessage(
        apiMessages,
        (chunk) => {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        },
        controller.signal,
      )

      if (fullResponse) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullResponse,
          timestamp: Date.now(),
        }
        onUpdateSession({
          ...sessionRef.current,
          messages: [...updatedMessages, assistantMessage],
        })
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : '网络错误，请重试'
      setError(message)
    } finally {
      setIsThinking(false)
      setStreamingContent('')
      abortRef.current = null
      textareaRef.current?.focus()
    }
  }, [input, isThinking, onUpdateSession])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleRetry = useCallback(() => {
    setError(null)
    handleSend()
  }, [handleSend])

  const userRounds = session.messages.filter((m) => m.role === 'user').length

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-stone-100 shrink-0 z-10">
        <div>
          <h1 className="text-base font-semibold text-stone-800">实验室管理访谈</h1>
          <p className="text-xs text-stone-400">
            {userRounds > 0 ? `已交流 ${userRounds} 轮` : '准备开始'}
          </p>
        </div>
        <button
          onClick={onComplete}
          className="text-sm text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
        >
          结束访谈
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {session.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Streaming message */}
          {isThinking && streamingContent && (
            <ChatMessage
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                timestamp: Date.now(),
              }}
              isStreaming
            />
          )}

          {/* Typing indicator */}
          {isThinking && !streamingContent && <TypingIndicator />}

          {/* Error */}
          {error && (
            <div className="flex justify-center mb-4">
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-100">
                {error}
                <button onClick={handleRetry} className="ml-2 underline">
                  重试
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-stone-100 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isThinking ? 'AI 正在思考...' : '输入您的回答...'}
            disabled={isThinking}
            rows={1}
            className="flex-1 resize-none overflow-hidden bg-stone-50 border border-stone-200 focus:border-amber-400 focus:outline-none rounded-2xl px-4 py-3 text-[15px] text-stone-700 placeholder-stone-300 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            aria-label="发送"
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-stone-300 text-center mt-2 hidden sm:block">
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  )
}
