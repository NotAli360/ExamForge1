import {
  LayoutDashboard,
  Sparkles,
  FileCheck,
  BookMarked,
  FolderKanban,
  BarChart3,
  Settings,
  Flame,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "generator", label: "Generate Questions", icon: Sparkles },
  { key: "mock-tests", label: "Mock Tests", icon: FileCheck },
  { key: "question-bank", label: "Question Bank", icon: BookMarked },
  { key: "worksheets", label: "My Worksheets", icon: FolderKanban },
  { key: "progress", label: "Progress & Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings & Profile", icon: Settings },
];

export default function Sidebar({ sidebarTab, setSidebarTab, streakDays }) {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5">
      <p className="mb-3 px-2 text-xs font-semibold tracking-wider text-slate-400">MAIN MENU</p>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = sidebarTab === key;
          return (
            <button
              key={key}
              onClick={() => setSidebarTab(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl bg-amber-50 p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <Flame size={12} /> DAILY STREAK
          </span>
          <span className="text-xs font-semibold text-amber-700">{streakDays} Days</span>
        </div>
        <p className="text-xs text-amber-800">Solve 15 questions today to keep your streak burning bright!</p>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
          {initials(user?.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{user?.name || "Student"}</p>
          <p className="truncate text-xs text-slate-500">
            Class {user?.class || "-"} {user?.roll ? `\u2022 Roll #${user.roll}` : ""}
          </p>
        </div>
        <Settings size={16} className="ml-auto text-slate-400" />
      </div>
    </aside>
  );
}

function initials(name) {
  if (!name) return "S";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
