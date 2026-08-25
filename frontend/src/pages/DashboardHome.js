import { useEffect, useState } from "react";
import { BookOpen, FileCheck, Flame, TrendingUp } from "lucide-react";
import { analyticsApi, examApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function DashboardHome({ setSidebarTab }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentExams, setRecentExams] = useState([]);

  useEffect(() => {
    analyticsApi.summary().then(setSummary).catch(() => {});
    examApi.list().then((d) => setRecentExams(d.exams.slice(0, 5))).catch(() => {});
  }, []);

  const cards = [
    { label: "Papers Generated", value: recentExams.length, icon: FileCheck, color: "text-blue-600 bg-blue-50" },
    { label: "Avg Accuracy", value: summary?.avgAccuracy || "0.0%", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Day Streak", value: `${summary?.streakDays ?? user?.streakDays ?? 0}`, icon: Flame, color: "text-amber-600 bg-amber-50" },
    { label: "Total Attempts", value: summary?.totalAttempts ?? 0, icon: BookOpen, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name?.split(" ")[0] || "Student"} \ud83d\udc4b</h1>
        <p className="text-sm text-slate-500">Here's a snapshot of your CBSE prep progress.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon size={18} />
            </div>
            <p className="text-xl font-bold text-slate-800">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Recently Generated Papers</h2>
          <button onClick={() => setSidebarTab("generator")} className="text-xs font-semibold text-blue-600">
            Generate New \u2192
          </button>
        </div>
        {recentExams.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No papers yet — generate your first one!</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExams.map((e) => (
              <div key={e._id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    {e.subject} — {e.chapter}
                  </p>
                  <p className="text-xs text-slate-400">
                    Class {e.class} \u2022 {e.difficulty} \u2022 {e.maxMarks} marks
                  </p>
                </div>
                <span className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
