import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings & Profile</h1>
        <p className="text-sm text-slate-500">Your account details.</p>
      </div>

      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <Row label="Board" value={user?.board} />
          <Row label="Class" value={user?.class} />
          <Row label="Roll No." value={user?.roll || "-"} />
          <Row label="Day Streak" value={user?.streakDays} />
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-xl border border-rose-200 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
