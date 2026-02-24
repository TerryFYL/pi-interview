export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm mr-2 mt-1 select-none">
        🔬
      </div>
      <div className="bg-white border border-stone-100 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
        <div className="flex items-center gap-1.5 h-5">
          <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
