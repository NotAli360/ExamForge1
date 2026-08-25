const TYPE_LABEL = {
  mcq: "MCQ",
  assertion: "A-R",
  true_false: "T/F",
  case: "CASE",
  fill_blank: "FILL",
  very_short: "VSA",
  short: "SA",
  long: "LA",
};

const HAS_OPTIONS = new Set(["mcq", "assertion", "true_false", "case"]);

export default function QuestionBlock({ question: q, index, selected, onSelect, isSubmitted, showAnswers }) {
  const optionsMode = HAS_OPTIONS.has(q.type) && q.options?.length > 0;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-800/60 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="whitespace-pre-line text-sm font-medium text-slate-100">
          Q{index}. {q.text}
          <span className="ml-2 text-xs font-normal text-slate-400">[{q.marks} mark{q.marks > 1 ? "s" : ""}]</span>
        </p>
        <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
          {TYPE_LABEL[q.type] || q.type}
        </span>
      </div>

      {optionsMode ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = q.correctIndex === i;
            let stateClasses = "border-slate-600 bg-slate-900/40 text-slate-200 hover:border-blue-400";
            if (isSubmitted) {
              if (isCorrect) stateClasses = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
              else if (isSelected && !isCorrect) stateClasses = "border-rose-500 bg-rose-500/10 text-rose-300";
            } else if (isSelected) {
              stateClasses = "border-blue-500 bg-blue-500/10 text-blue-200";
            }
            return (
              <button
                key={i}
                disabled={isSubmitted}
                onClick={() => onSelect(q.localId, i)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${stateClasses}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs text-slate-400">
          Descriptive answer expected{q.type === "fill_blank" ? " (fill in the blank)" : ""}.
        </div>
      )}

      {showAnswers && (
        <div className="mt-3 rounded-lg bg-slate-900/60 p-3 text-xs text-slate-300">
          <p className="mb-1">
            <span className="font-semibold text-emerald-400">Answer: </span>
            {q.answer}
          </p>
          {q.explanation && (
            <p>
              <span className="font-semibold text-blue-300">Explanation: </span>
              {q.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
