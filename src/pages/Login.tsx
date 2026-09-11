import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Lock, User, ShieldCheck, Sparkles } from "lucide-react";

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check test admin credentials (admin / admin or admin@... / admin)
    if (
      (cleanUsername === "admin" || cleanUsername === "admin@example.com" || cleanUsername === "admin@admin.com") &&
      (cleanPassword === "admin" || cleanPassword === "admin123" || cleanPassword === "password123")
    ) {
      setTimeout(() => {
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 300);
      return;
    }

    // Otherwise attempt Firebase Auth
    try {
      const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@example.com`;
      await signInWithEmailAndPassword(auth, email, cleanPassword);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch {
      setError("نام کاربری یا رمز عبور اشتباه است. (برای تست می‌توانید از admin و admin استفاده کنید)");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTestLogin = () => {
    setUsername("admin");
    setPassword("admin");
    setError("");
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors p-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-3">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">دستیار مهاجر</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">پنل مدیریت محتوا و اتصال به ربات‌ها</p>
        </div>

        {/* Quick Test Info Box for Mobile */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-right">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm mb-1">
            <Sparkles size={16} />
            <span>ورود آزمایشی سریع (موبایل / دسکتاپ)</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-300/80 mb-3">
            نام کاربری: <span className="font-mono font-bold bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">admin</span> | 
            رمز عبور: <span className="font-mono font-bold bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">admin</span>
          </p>
          <button
            type="button"
            onClick={handleQuickTestLogin}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>ورود با یک کلیک (تست مدیر)</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 dark:border-red-800 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام کاربری یا ایمیل مدیر</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full pl-3 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="admin"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رمز عبور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-3 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="admin"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "درحال بررسی..." : "ورود به سیستم"}
          </button>
        </form>
      </div>
    </div>
  );
}
