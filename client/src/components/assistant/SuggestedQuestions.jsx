export default function SuggestedQuestions({ questions, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 font-public">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="rounded-full border border-surface-border bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 shadow-sm transition-colors font-public"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
