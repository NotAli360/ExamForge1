import { useState } from "react";
import { Download, FileText as FileTextIcon, RefreshCcw } from "lucide-react";
import QuestionBlock from "./QuestionBlock";
import { exportPdf, exportWord } from "../utils/export";

const TABS = [
  { key: "paper", label: "Question Paper" },
  { key: "answers", label: "Answer Key" },
  { key: "explanations", label: "Explanations" },
  { key: "performance", label: "Performance Dashboard" },
  { key: "profile", label: "Student Profile" },
];

export default function PreviewPanel({
  exam,
  previewTab,
  setPreviewTab,
  userAnswers,
  onSelectOption,
  isSubmitted,
  performanceStats,
  onSubmitQuiz,
  onRegenerateQuestion,
  regeneratingId,
  user,
}) {
  const [exporting, setExporting] = useState(false);

  if (!exam) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
        Configure the panel on the left and click "Generate Exam Paper" to see a live preview here.
      </div>
    );
  }

  const showAnswers = previewTab === "answers" || previewTab === "explanations";

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (type === "pdf") exportPdf(exam);
      else exportWord(exam);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            Live Exam Preview
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Ready
            </span>
          </h2>
          <p className="text-xs text-slate-500">Professional CBSE formatting with answer keys & explanations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Download size={14} /> PDF Export
          </button>
          <button
            onClick={() => handleExport("word")}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileTextIcon size={14} /> Word Export
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPreviewTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              previewTab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {previewTab === "performance" ? (
        <PerformancePanel stats={performanceStats} onSubmitQuiz={onSubmitQuiz} isSubmitted={isSubmitted} />
      ) : previewTab === "profile" ? (
        <ProfilePanel user={user} />
      ) : (
        <div className="rounded-xl bg-slate-900 p-5">
          <div className="mb-4 text-center">
            <h3 className="text-base font-bold tracking-wide text-blue-300">{exam.title}</h3>
            <p className="mt-1 text-xs text-slate-400">
              Subject: {exam.subject} &nbsp;•&nbsp; Class: {exam.class} &nbsp;•&nbsp; Max Marks: {exam.maxMarks}
            </p>
            <p className="text-xs font-medium text-amber-400">Time Allowed: {exam.timeAllowed}</p>
          </div>

          <div className="mb-5 rounded-lg bg-slate-800/60 p-3">
            <p className="mb-1 text-xs font-semibold text-slate-300">General Instructions:</p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-400">
              {(exam.instructions || []).map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            {(exam.sections || []).map((sec) => (
              <div key={sec.name}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-300">{sec.name}</p>
                <div className="space-y-3">
                  {sec.questions.map((q) => (
                    <div key={q.localId} className="relative">
                      <QuestionBlock
                        question={q}
                        index={q.localId}
                        selected={userAnswers[q.localId]}
                        onSelect={onSelectOption}
                        isSubmitted={isSubmitted}
                        showAnswers={showAnswers}
                      />
                      {previewTab === "paper" && (
                        <button
                          onClick={() => onRegenerateQuestion(q.localId)}
                          disabled={regeneratingId === q.localId}
                          title="Regenerate this question"
                          className="absolute right-2 top-2 rounded-full bg-slate-700/80 p-1.5 text-slate-300 hover:bg-slate-600"
                        >
                          <RefreshCcw size={12} className={regeneratingId === q.localId ? "animate-spin" : ""} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {previewTab === "paper" && !isSubmitted && (
            <button
              onClick={onSubmitQuiz}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white"
            >
              Submit for Scoring
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PerformancePanel({ stats, onSubmitQuiz, isSubmitted }) {
  if (!isSubmitted || !stats) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
        Submit the paper from the "Question Paper" tab to see your performance breakdown here.
      </div>
    );
  }
  const cells = [
    { label: "Score", value: stats.score, color: "text-blue-600" },
    { label: "Accuracy", value: stats.accuracy, color: "text-emerald-600" },
    { label: "Attempted", value: `${stats.attempted}/${stats.total}`, color: "text-slate-800" },
    { label: "Correct", value: stats.correct, color: "text-emerald-600" },
    { label: "Incorrect", value: stats.incorrect, color: "text-rose-600" },
    { label: "Unattempted", value: stats.unattempted, color: "text-slate-500" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 p-4 text-center">
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function ProfilePanel({ user }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
      <p className="text-xs text-slate-500">{user?.email}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <InfoRow label="Board" value={user?.board} />
        <InfoRow label="Class" value={user?.class} />
        <InfoRow label="Roll" value={user?.roll || "-"} />
        <InfoRow label="Streak" value={`${user?.streakDays || 0} days`} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
