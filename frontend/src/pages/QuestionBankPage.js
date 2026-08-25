import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { questionApi } from "../api";

export default function QuestionBankPage({ meta }) {
  const [filters, setFilters] = useState({ subject: "", chapter: "", type: "", q: "" });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = () => {
    setLoading(true);
    questionApi
      .searchBank({ ...filters, pageSize: 20 })
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    search(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapters = meta?.chaptersBySubject?.[filters.subject] || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Question Bank</h1>
        <p className="text-sm text-slate-500">{total} verified & AI-contributed questions matching your filters.</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <select
          className="ff-select w-40"
          value={filters.subject}
          onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value, chapter: "" }))}
        >
          <option value="">All Subjects</option>
          {(meta?.subjects || []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="ff-select w-48"
          value={filters.chapter}
          onChange={(e) => setFilters((f) => ({ ...f, chapter: e.target.value }))}
        >
          <option value="">All Chapters</option>
          {chapters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="ff-select w-40"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">All Types</option>
          {(meta?.questionTypesList || []).map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          className="ff-select flex-1"
          placeholder="Search question text..."
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <button onClick={search} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          <Search size={14} /> Search
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-2">
          {items.map((q) => (
            <div key={q._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {q.subject} \u2022 {q.chapter} \u2022 {q.difficulty}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    q.source === "bank" ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {q.source === "bank" ? "VERIFIED" : "AI"}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm text-slate-800">{q.text}</p>
            </div>
          ))}
          {items.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No questions match those filters.</p>}
        </div>
      )}
    </div>
  );
}
