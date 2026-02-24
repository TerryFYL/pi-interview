interface Props {
  onStart: () => void
  hasPrevious: boolean
  onContinue: () => void
}

export default function WelcomeScreen({ onStart, hasPrevious, onContinue }: Props) {
  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 py-16 max-w-xl mx-auto">
      <div className="mb-8 w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl select-none">
        🔬
      </div>

      <h1 className="text-3xl font-bold text-stone-800 text-center leading-snug mb-3">
        实验室管理访谈
      </h1>

      <p className="text-stone-500 text-center text-base mb-8 leading-relaxed">
        通过一场轻松的对话，帮助我们了解您在实验室管理中的真实体验
      </p>

      <div className="w-full bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-xl mt-0.5">💬</span>
          <div>
            <p className="text-stone-700 font-medium text-sm">AI 访谈员</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              由 AI 引导对话，像朋友聊天一样自然。会根据您的回答动态调整话题，深入了解您的真实体验。
            </p>
          </div>
        </div>
        <div className="h-px bg-stone-50" />
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-xl mt-0.5">⏱</span>
          <div>
            <p className="text-stone-700 font-medium text-sm">预计 15–20 分钟</p>
            <p className="text-stone-500 text-sm">您可以随时暂停或结束，对话会自动保存。</p>
          </div>
        </div>
        <div className="h-px bg-stone-50" />
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-xl mt-0.5">🔒</span>
          <div>
            <p className="text-stone-700 font-medium text-sm">隐私保护</p>
            <p className="text-stone-500 text-sm">
              对话内容仅用于产品调研，不会公开分享。
            </p>
          </div>
        </div>
      </div>

      {hasPrevious ? (
        <div className="w-full space-y-3">
          <button
            onClick={onContinue}
            className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white font-semibold text-lg py-4 px-8 rounded-2xl transition-colors duration-150 shadow-sm"
          >
            继续上次对话
          </button>
          <button
            onClick={onStart}
            className="w-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-600 font-medium text-base py-3 px-8 rounded-2xl transition-colors duration-150"
          >
            开始新对话
          </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white font-semibold text-lg py-4 px-8 rounded-2xl transition-colors duration-150 shadow-sm"
        >
          开始访谈
        </button>
      )}
    </div>
  )
}
