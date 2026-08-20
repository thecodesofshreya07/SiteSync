export default function SuggestedQuestions({ questions, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:border-teal-300 hover:text-teal-700"
        >
          {q}
        </button>
      ))}
    </div>
  )
}
