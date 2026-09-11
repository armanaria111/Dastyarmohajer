import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Layout from "./components/Layout";
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">درحال بارگذاری...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAdmin ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAdmin ? <Layout toggleTheme={toggleTheme} theme={theme} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
