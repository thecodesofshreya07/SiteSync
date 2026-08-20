export default function SuggestedQuestions({ questions, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 font-public">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="rounded-full border border-surface-border bg-white px-3 sm:px-3.5 py-1 sm:py-1.5 text-2xs sm:text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 shadow-sm transition-colors font-public text-left max-w-full truncate"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
