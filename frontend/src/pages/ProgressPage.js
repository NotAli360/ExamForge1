import { useEffect, useState } from "react";
import { analyticsApi } from "../api";

export default function ProgressPage() {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    analyticsApi.history().then((d) => setHistory(d.history));
    analyticsApi.summary().then(setSummary);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Progress & Analytics</h1>
        <p className="text-sm text-slate-500">Track your accuracy across subjects over time.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total Attempts" value={summary.totalAttempts} />
          <Stat label="Avg Accuracy" value={summary.avgAccuracy} />
          <Stat label="Streak" value={`${summary.streakDays} days`} />
          <Stat label="Subjects Covered" value={Object.keys(summary.bySubject || {}).length} />
        </div>
      )}

      {summary?.bySubject && Object.keys(summary.bySubject).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">By Subject</h2>
          <div className="space-y-2">
            {Object.entries(summary.bySubject).map(([subject, s]) => {
              const acc = s.attempted > 0 ? ((s.correct / s.attempted) * 100).toFixed(1) : "0.0";
              return (
                <div key={subject} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{subject}</span>
                  <div className="flex flex-1 items-center gap-2 px-4">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${acc}%` }} />
                    </div>
                  </div>
                  <span className="w-14 text-right text-xs font-semibold text-slate-500">{acc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Recent Attempts</h2>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No attempts submitted yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h._id}>
                  <td className="py-2 text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 text-slate-800">
                    {h.subject} \u2014 {h.chapter}
                  </td>
                  <td className="py-2 font-semibold text-slate-800">{h.score}</td>
                  <td className="py-2 text-emerald-600">{h.accuracy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
