import React, { useState, useEffect } from "react";
import { Lock, User, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { getStoredAdminCredentials, syncAdminCredsFromCloud } from "../data/landingSettings";

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt background sync of updated admin credentials from cloud if available
    syncAdminCredsFromCloud();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("لطفاً نام کاربری و رمز عبور را وارد نمایید.");
      setLoading(false);
      return;
    }

    const currentCreds = getStoredAdminCredentials();

    // 1. Check against custom admin credentials (default: admin / admin, editable from admin panel)
    if (
      cleanUsername.toLowerCase() === currentCreds.username.toLowerCase() &&
      cleanPassword === currentCreds.password
    ) {
      setTimeout(() => {
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 250);
      return;
    }

    // 2. Also check Firebase Auth as fallback if configured
    try {
      const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@dastyar.internal`;
      await signInWithEmailAndPassword(auth, email, cleanPassword);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch {
      setError("نام کاربری یا کلمه عبور وارد شده نادرست است.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 transition-colors p-4">
      <div className="bg-slate-800/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700 space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-3xl bg-black p-1 border border-slate-700 shadow-2xl shadow-teal-500/10 overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                alt="لوگوی دستیار مهاجر"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-1.5">
            ورود به پنل مدیریت
          </h1>
          <p className="text-slate-400 text-xs font-medium">
            دستیار مهاجر — سامانه خدمات کنسولی و دفاتر کفالت
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-300 p-3.5 rounded-2xl text-xs text-center border border-red-500/30 leading-relaxed font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              نام کاربری مدیر (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="block w-full pl-3 pr-11 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-900/80 text-white placeholder:text-slate-500 text-xs font-mono transition-all"
                placeholder="نام کاربری..."
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              کلمه عبور (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-3 pr-11 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-900/80 text-white placeholder:text-slate-500 text-xs font-mono transition-all"
                placeholder="کلمه عبور..."
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "در حال بررسی اعتبار..." : "ورود به کنترل‌پنل"}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowRight size={14} />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
