import { useState, useCallback } from 'react'
import './App.css'
import type { InterviewSession, Message } from './lib/types'
import { saveSession, loadSession, clearSession } from './lib/storage'
import WelcomeScreen from './components/WelcomeScreen'
import ChatInterface from './components/ChatInterface'
import InterviewComplete from './components/InterviewComplete'

type Screen = 'welcome' | 'chat' | 'complete'

const OPENING_MESSAGE_CONTENT = `您好！感谢您抽出时间参与我们的调研。我是一名关注医学实验室管理的研究员，今天主要想听听您在实验室管理方面的真实体验和感受。

没有标准答案，也没有对错之分——您的每一句真实感受对我们都非常有价值。整个对话大约需要 15–20 分钟。

我们先聊点轻松的吧——能简单介绍一下您的实验室吗？大概有多少学生，主要做什么方向的研究？`

function createOpeningMessage(): Message {
  return {
    id: 'opening',
    role: 'assistant',
    content: OPENING_MESSAGE_CONTENT,
    timestamp: Date.now(),
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [session, setSession] = useState<InterviewSession | null>(null)

  const saved = loadSession()
  const hasPrevious = saved !== null && saved.messages.length > 1

  const handleStart = useCallback(() => {
    clearSession()
    const newSession: InterviewSession = {
      id: crypto.randomUUID(),
      messages: [createOpeningMessage()],
      startedAt: Date.now(),
    }
    setSession(newSession)
    saveSession(newSession)
    setScreen('chat')
  }, [])

  const handleContinue = useCallback(() => {
    const restored = loadSession()
    if (restored) {
      setSession(restored)
      setScreen('chat')
    }
  }, [])

  const handleUpdateSession = useCallback((updated: InterviewSession) => {
    setSession(updated)
    saveSession(updated)
  }, [])

  const handleComplete = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev
      const completed = { ...prev, completedAt: Date.now() }
      saveSession(completed)
      return completed
    })
    setScreen('complete')
  }, [])

  const handleBackToChat = useCallback(() => {
    setScreen('chat')
  }, [])

  const handleRestart = useCallback(() => {
    clearSession()
    setSession(null)
    setScreen('welcome')
  }, [])

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen
          onStart={handleStart}
          hasPrevious={hasPrevious}
          onContinue={handleContinue}
        />
      )}

      {screen === 'chat' && session && (
        <ChatInterface
          session={session}
          onUpdateSession={handleUpdateSession}
          onComplete={handleComplete}
        />
      )}

      {screen === 'complete' && session && (
        <InterviewComplete
          session={session}
          onRestart={handleRestart}
          onBack={handleBackToChat}
        />
      )}
    </>
  )
}
