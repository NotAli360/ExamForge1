import { SlidersHorizontal } from "lucide-react";

export default function GeneratorPanel({
  meta,
  form,
  setForm,
  onGenerate,
  isGenerating,
}) {
  const chapters = meta?.chaptersBySubject?.[form.subject] || [];

  const toggleType = (key) => {
    setForm((f) => ({ ...f, questionTypes: { ...f.questionTypes, [key]: !f.questionTypes[key] } }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <SlidersHorizontal size={18} className="text-blue-600" />
          Question Generation Panel
        </h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {form.board} Standard
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Board">
          <select className="ff-select" value={form.board} onChange={(e) => setForm((f) => ({ ...f, board: e.target.value }))}>
            <option value="CBSE">CBSE (Central Board)</option>
          </select>
        </Field>
        <Field label="Class">
          <select
            className="ff-select"
            value={form.class}
            onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
          >
            {(meta?.classes || ["9"]).map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Subject">
          <select
            className="ff-select"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value, chapter: "" }))}
          >
            {(meta?.subjects || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Chapter">
          <select
            className="ff-select"
            value={form.chapter}
            onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
          >
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Difficulty">
          <select
            className="ff-select"
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
          >
            {(meta?.difficulties || ["Easy", "Medium", "Hard"]).map((d) => (
              <option key={d} value={d}>
                {d === "Medium" ? "Medium (Standard)" : d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bloom's Level">
          <select
            className="ff-select"
            value={form.bloomLevel}
            onChange={(e) => setForm((f) => ({ ...f, bloomLevel: e.target.value }))}
          >
            {(meta?.bloomsLevels || []).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400">QUESTION TYPES INCLUDED</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {(meta?.questionTypesList || []).map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                checked={!!form.questionTypes[key]}
                onChange={() => toggleType(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-slate-400">NUMBER OF QUESTIONS (10-100)</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {form.questionCount} Questions
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={form.questionCount}
          onChange={(e) => setForm((f) => ({ ...f, questionCount: Number(e.target.value) }))}
          className="w-full accent-blue-600"
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Include Detailed Answers & Explanations</p>
          <p className="text-xs text-slate-500">Provide step-by-step reasoning for each question</p>
        </div>
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-blue-600"
          checked={form.includeAnswers}
          onChange={(e) => setForm((f) => ({ ...f, includeAnswers: e.target.checked }))}
        />
      </label>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !form.chapter}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
      >
        {isGenerating ? "Generating..." : "Generate Exam Paper"}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold tracking-wide text-slate-400">{label.toUpperCase()}</p>
      {children}
    </div>
  );
}
