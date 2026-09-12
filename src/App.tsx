import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";
import Embassies from "./pages/Embassies";
import Websites from "./pages/Websites";
import Faqs from "./pages/Faqs";
import Requests from "./pages/Requests";
import BotsManagement from "./pages/BotsManagement";
import BotSimulator from "./pages/BotSimulator";
import Broadcast from "./pages/Broadcast";
import Feedbacks from "./pages/Feedbacks";
import LostDocuments from "./pages/LostDocuments";
import PrintedTazkira from "./pages/PrintedTazkira";
import LandingSettings from "./pages/LandingSettings";
import JobPortalManagement from "./pages/JobPortalManagement";
import ExpiryReminders from "./pages/ExpiryReminders";
import BotInbox from "./pages/BotInbox";
import BotAnalytics from "./pages/BotAnalytics";
import StaffManagement from "./pages/StaffManagement";

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("admin_authenticated") === "true";
  });
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setIsAdmin(true);
        localStorage.setItem("admin_authenticated", "true");
      }
      setLoading(false);
    });

    // Check saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    return () => unsub();
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem("admin_authenticated", "true");
  };

  const handleLogout = async () => {
    setIsAdmin(false);
    localStorage.removeItem("admin_authenticated");
    try {
      await auth.signOut();
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">در حال راه‌اندازی سامانه دستیار مهاجر...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Landing Page for all visitors */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Secret Admin Entry Paths (/Arman and /arman) */}
        <Route
          path="/Arman"
          element={isAdmin ? <Navigate to="/admin" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/arman"
          element={isAdmin ? <Navigate to="/admin" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />

        {/* Hide default /login path - redirects quietly to home */}
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* 3. Protected Admin Panel Routes under /admin */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <Layout toggleTheme={toggleTheme} theme={theme} onLogout={handleLogout} />
            ) : (
              <Navigate to="/Arman" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<JobPortalManagement />} />
          <Route path="reminders" element={<ExpiryReminders />} />
          <Route path="inbox" element={<BotInbox />} />
          <Route path="analytics" element={<BotAnalytics />} />
          <Route path="landing-settings" element={<LandingSettings />} />
          <Route path="branches" element={<Branches />} />
          <Route path="embassies" element={<Embassies />} />
          <Route path="feedbacks" element={<Feedbacks />} />
          <Route path="lost-documents" element={<LostDocuments />} />
          <Route path="printed-tazkiras" element={<PrintedTazkira />} />
          <Route path="websites" element={<Websites />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="requests" element={<Requests />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="bots" element={<BotsManagement />} />
          <Route path="simulator" element={<BotSimulator />} />
          <Route path="staff" element={<StaffManagement />} />
        </Route>

        {/* Fallback unknown routes to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
