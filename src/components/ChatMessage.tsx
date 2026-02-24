import type { Message } from '../lib/types'

interface Props {
  message: Message
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm mr-2 mt-1 select-none">
          🔬
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser
            ? 'bg-amber-400 text-white rounded-2xl rounded-br-md'
            : 'bg-white border border-stone-100 text-stone-700 rounded-2xl rounded-bl-md shadow-sm'
        } px-4 py-3`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-stone-400 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      </div>
    </div>
  )
}
