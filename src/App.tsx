import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { safeStorage } from "./utils/safeStorage";
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
import EducationPortal from "./pages/EducationPortal";
import SmartInquiries from "./pages/SmartInquiries";
import MobileAppDownload from "./pages/MobileAppDownload";
import { OfflineIndicator } from "./components/OfflineIndicator";

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return safeStorage.getItem("admin_authenticated") === "true";
  });
  const [authChecking, setAuthChecking] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let active = true;

    // Fast fallback so auth check never hangs
    const timer = setTimeout(() => {
      if (active) setAuthChecking(false);
    }, 1200);

    try {
      const unsub = onAuthStateChanged(
        auth,
        (u) => {
          if (!active) return;
          if (u) {
            setIsAdmin(true);
            safeStorage.setItem("admin_authenticated", "true");
          }
          setAuthChecking(false);
          clearTimeout(timer);
        },
        () => {
          if (active) setAuthChecking(false);
        }
      );

      // Check saved theme
      const savedTheme = safeStorage.getItem("theme");
      if (savedTheme === "dark") {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }

      return () => {
        active = false;
        clearTimeout(timer);
        unsub();
      };
    } catch {
      setAuthChecking(false);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    safeStorage.setItem("admin_authenticated", "true");
  };

  const handleLogout = async () => {
    setIsAdmin(false);
    safeStorage.removeItem("admin_authenticated");
    try {
      await auth.signOut();
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    safeStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <BrowserRouter>
      <OfflineIndicator />
      <Routes>
        {/* 1. Public Landing Page for all visitors (Always accessible immediately) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/inquiries" element={<SmartInquiries />} />
        <Route path="/education" element={<EducationPortal />} />
        <Route path="/download-app" element={<MobileAppDownload />} />
        <Route path="/mobile-app" element={<MobileAppDownload />} />

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
            authChecking ? (
              <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400">در حال بررسی دسترسی پنل مدیریت...</span>
                </div>
              </div>
            ) : isAdmin ? (
              <Layout toggleTheme={toggleTheme} theme={theme} onLogout={handleLogout} />
            ) : (
              <Navigate to="/Arman" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<JobPortalManagement />} />
          <Route path="inquiries" element={<SmartInquiries />} />
          <Route path="education" element={<EducationPortal />} />
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
          <Route path="mobile-app" element={<MobileAppDownload />} />
          <Route path="staff" element={<StaffManagement />} />
        </Route>

        {/* Fallback unknown routes to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

