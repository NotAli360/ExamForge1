import { BrainCircuit, Flame, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TopBar({ streakDays }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <BrainCircuit size={18} />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold leading-tight text-slate-800">
            Exam Forge
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">AI</span>
          </p>
          <p className="text-[10px] font-medium tracking-wide text-slate-400">CBSE EXAM PREPARATION SUITE</p>
        </div>
      </div>

      <nav className="hidden gap-8 text-sm font-medium text-slate-500 lg:flex">
        <span className="cursor-default text-slate-800">Home</span>
        <span className="cursor-default hover:text-slate-800">Subjects & CBSE</span>
        <span className="cursor-default hover:text-slate-800">Mock Tests</span>
        <span className="cursor-default hover:text-slate-800">Analytics</span>
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:flex">
          <Flame size={14} /> {streakDays} Day Streak
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
          {initials(user?.name)}
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function initials(name) {
  if (!name) return "S";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
