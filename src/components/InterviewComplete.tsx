import { useState } from 'react'
import type { Message, InterviewSession } from '../lib/types'

interface Props {
  session: InterviewSession
  onRestart: () => void
  onBack: () => void
}

function buildTranscript(messages: Message[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const lines: string[] = [
    '# PI实验室管理访谈记录',
    `日期: ${today}`,
    `消息数: ${messages.length}`,
    '',
    '---',
    '',
  ]

  for (const msg of messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const label = msg.role === 'assistant' ? '访谈员' : '受访者'
    lines.push(`### ${label} (${time})`)
    lines.push(msg.content)
    lines.push('')
  }

  return lines.join('\n')
}

export default function InterviewComplete({ session, onRestart, onBack }: Props) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const userMessages = session.messages.filter((m) => m.role === 'user').length
  const totalRounds = session.messages.filter((m) => m.role === 'assistant').length
  const duration =
    session.completedAt && session.startedAt
      ? Math.round((session.completedAt - session.startedAt) / 60000)
      : null

  const handleCopy = async () => {
    const md = buildTranscript(session.messages)
    try {
      await navigator.clipboard.writeText(md)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2500)
    } catch {
      handleDownload()
    }
  }

  const handleDownload = () => {
    const md = buildTranscript(session.messages)
    const today = new Date().toISOString().slice(0, 10)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PI访谈记录_${today}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 py-16 max-w-xl mx-auto">
      <div className="mb-8 w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-4xl select-none">
        🎉
      </div>

      <h1 className="text-3xl font-bold text-stone-800 text-center mb-3">
        访谈完成！
      </h1>

      <p className="text-stone-500 text-center text-base mb-8 leading-relaxed">
        感谢您的宝贵时间和真实反馈。您的每一句话都将帮助我们设计出更好的产品。
      </p>

      <div className="w-full bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-3xl font-bold text-amber-500">{userMessages}</p>
            <p className="text-stone-400 text-sm mt-1">您的回答</p>
          </div>
          <div className="w-px bg-stone-100" />
          <div>
            <p className="text-3xl font-bold text-stone-400">{totalRounds}</p>
            <p className="text-stone-400 text-sm mt-1">对话轮次</p>
          </div>
          {duration !== null && (
            <>
              <div className="w-px bg-stone-100" />
              <div>
                <p className="text-3xl font-bold text-stone-700">{duration}</p>
                <p className="text-stone-400 text-sm mt-1">分钟</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-full bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-6">
        <p className="text-stone-600 text-sm font-medium mb-1">导出访谈记录</p>
        <p className="text-stone-400 text-xs mb-4 leading-relaxed">
          将完整对话导出为 Markdown 格式，方便保存或分享给调研团队。
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            aria-live="polite"
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white transition-colors shadow-sm"
          >
            {copyState === 'copied' ? '已复制！' : '复制到剪贴板'}
          </button>
          <button
            onClick={handleDownload}
            className="py-3 px-4 rounded-xl font-medium text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 transition-colors"
          >
            下载 .md
          </button>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onBack}
          className="w-full py-3 px-6 rounded-2xl font-medium text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
        >
          返回查看对话
        </button>
        <button
          onClick={onRestart}
          className="w-full text-stone-400 hover:text-stone-600 text-sm transition-colors underline underline-offset-4 py-2"
        >
          开始新的访谈
        </button>
      </div>
    </div>
  )
}
