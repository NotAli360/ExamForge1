import { useEffect, useState } from "react";
import { FileCheck } from "lucide-react";
import { examApi } from "../api";

export default function MockTestsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examApi
      .list()
      .then((d) => setExams(d.exams))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mock Tests</h1>
        <p className="text-sm text-slate-500">Every paper you've generated, ready to retake.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          No mock tests yet. Head to "Generate Questions" to create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => (
            <div key={e._id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileCheck size={18} />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {e.subject} \u2022 {e.chapter}
              </p>
              <p className="text-xs text-slate-500">
                Class {e.class} \u2022 {e.difficulty} \u2022 {e.maxMarks} marks \u2022 {e.timeAllowed}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {e.generationStats?.fromBank ?? 0} bank + {e.generationStats?.fromAI ?? 0} AI questions
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
