import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import GeneratorPanel from "../components/GeneratorPanel";
import PreviewPanel from "../components/PreviewPanel";
import { examApi } from "../api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_TYPES = {
  mcq: true,
  short: true,
  long: true,
  assertion: true,
  case: true,
  very_short: false,
  fill_blank: false,
  true_false: false,
};

export default function GeneratorPage({ meta }) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    board: "CBSE",
    class: user?.class || "9",
    subject: "Science",
    chapter: "",
    difficulty: "Medium",
    bloomLevel: "Analyzing (Level 4)",
    questionTypes: DEFAULT_TYPES,
    questionCount: 20,
    includeAnswers: true,
  });

  useEffect(() => {
    if (!meta) return;
    setForm((f) => {
      if (f.chapter) return f;
      const chapters = meta.chaptersBySubject?.[f.subject] || [];
      return { ...f, chapter: chapters[0] || "" };
    });
  }, [meta]);

  const [exam, setExam] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewTab, setPreviewTab] = useState("paper");
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setUserAnswers({});
    setIsSubmitted(false);
    setPerformanceStats(null);
    const toastId = toast.loading("AI is crafting your CBSE-aligned question paper...");
    try {
      const { exam: newExam, warnings } = await examApi.generate(form);
      setExam(newExam);
      setPreviewTab("paper");
      toast.success(
        `Generated ${newExam.sections.reduce((s, sec) => s + sec.questions.length, 0)} questions for Class ${form.class} ${form.subject} (${form.chapter})!`,
        { id: toastId }
      );
      if (warnings?.length) {
        console.warn("[exam generation warnings]", warnings);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to generate exam paper", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = useCallback(
    (localId, optIdx) => {
      if (isSubmitted) return;
      setUserAnswers((prev) => ({ ...prev, [localId]: optIdx }));
    },
    [isSubmitted]
  );

  const handleSubmitQuiz = async () => {
    if (!exam) return;
    try {
      const { attempt } = await examApi.submit(exam._id, userAnswers);
      setPerformanceStats(attempt);
      setIsSubmitted(true);
      setPreviewTab("performance");
      toast.success(`Scored ${attempt.score} \u2022 ${attempt.accuracy} accuracy`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not submit for scoring");
    }
  };

  const handleRegenerateQuestion = async (localId) => {
    if (!exam) return;
    setRegeneratingId(localId);
    try {
      const { exam: updated, source } = await examApi.regenerateQuestion(exam._id, localId);
      setExam(updated);
      toast.success(`Question ${localId} regenerated from ${source === "bank" ? "the question bank" : "AI"}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not regenerate that question");
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="gradient-hero relative overflow-hidden rounded-2xl p-6 text-white sm:p-8">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
          <Sparkles size={13} /> Generate a New Question Paper
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">CBSE 2026-27 Board Exam Simulator</h1>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Configure parameters below to generate customized practice tests with step-by-step solutions and instant
          PDF export.
        </p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !form.chapter}
          className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm disabled:opacity-70 sm:absolute sm:right-8 sm:top-8 sm:mt-0"
        >
          {isGenerating ? "Launching..." : "Launch Generator \u2192"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GeneratorPanel meta={meta} form={form} setForm={setForm} onGenerate={handleGenerate} isGenerating={isGenerating} />
        <PreviewPanel
          exam={exam}
          previewTab={previewTab}
          setPreviewTab={setPreviewTab}
          userAnswers={userAnswers}
          onSelectOption={handleSelectOption}
          isSubmitted={isSubmitted}
          performanceStats={performanceStats}
          onSubmitQuiz={handleSubmitQuiz}
          onRegenerateQuestion={handleRegenerateQuestion}
          regeneratingId={regeneratingId}
          user={user}
        />
      </div>
    </div>
  );
}
