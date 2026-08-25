import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { metaApi } from "./api";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardHome from "./pages/DashboardHome";
import GeneratorPage from "./pages/GeneratorPage";
import MockTestsPage from "./pages/MockTestsPage";
import QuestionBankPage from "./pages/QuestionBankPage";
import WorksheetsPage from "./pages/WorksheetsPage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ChatAssistant from "./components/ChatAssistant";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<ProtectedShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function ProtectedShell() {
  const { user, loading } = useAuth();
  const [sidebarTab, setSidebarTab] = useState("generator");
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!user) return;
    metaApi.get().then(setMeta).catch(() => {});
  }, [user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} streakDays={user.streakDays} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar streakDays={user.streakDays} />
        <main className="flex-1 overflow-y-auto p-6">
          {sidebarTab === "dashboard" && <DashboardHome setSidebarTab={setSidebarTab} />}
          {sidebarTab === "generator" && <GeneratorPage meta={meta} />}
          {sidebarTab === "mock-tests" && <MockTestsPage />}
          {sidebarTab === "question-bank" && <QuestionBankPage meta={meta} />}
          {sidebarTab === "worksheets" && <WorksheetsPage />}
          {sidebarTab === "progress" && <ProgressPage />}
          {sidebarTab === "settings" && <SettingsPage />}
        </main>
      </div>
      <ChatAssistant />
    </div>
  );
}
