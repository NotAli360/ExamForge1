import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { metaApi } from "./api";

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
          <Route path="*" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppShell() {
  const { user } = useAuth();
  const [sidebarTab, setSidebarTab] = useState("generator");
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    metaApi.get().then(setMeta).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} streakDays={user?.streakDays || 0} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar streakDays={user?.streakDays || 0} />
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
