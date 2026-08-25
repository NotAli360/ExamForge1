import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { examApi } from "../api";
import { exportPdf } from "../utils/export";

export default function WorksheetsPage() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    examApi.list().then((d) => setExams(d.exams));
  }, []);

  const downloadFull = async (id) => {
    const { exam } = await examApi.get(id);
    exportPdf(exam);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Worksheets</h1>
        <p className="text-sm text-slate-500">Download any generated paper as a printable worksheet.</p>
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {exams.map((e) => (
          <div key={e._id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium text-slate-800">
                {e.subject} \u2014 {e.chapter}
              </p>
              <p className="text-xs text-slate-400">
                Class {e.class} \u2022 {e.maxMarks} marks \u2022 {new Date(e.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => downloadFull(e._id)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={14} /> PDF
            </button>
          </div>
        ))}
        {exams.length === 0 && <p className="p-10 text-center text-sm text-slate-400">No worksheets yet.</p>}
      </div>
    </div>
  );
}
