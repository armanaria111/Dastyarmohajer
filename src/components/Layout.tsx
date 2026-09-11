import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  Globe,
  HelpCircle,
  ClipboardList,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Bot,
  Smartphone,
  Megaphone,
  Star,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { clsx } from "clsx";

export default function Layout({ toggleTheme, theme, onLogout }: { toggleTheme: () => void, theme: string, onLogout?: () => void }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await signOut(auth);
    }
  };

  const navItems = [
    { name: "داشبورد و آمار", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "تنظیمات لندینگ و پیوندها", path: "/admin/landing-settings", icon: <Globe size={20} /> },
    { name: "دفاتر کفالت", path: "/admin/branches", icon: <Building2 size={20} /> },
    { name: "سفارت‌ها و کنسولگری", path: "/admin/embassies", icon: <Landmark size={20} /> },
    { name: "نظرات و رضایت دفاتر", path: "/admin/feedbacks", icon: <Star size={20} /> },
    { name: "اسناد و مدارک مفقودی", path: "/admin/lost-documents", icon: <ShieldCheck size={20} /> },
    { name: "استعلام تذکره‌های چاپ‌شده", path: "/admin/printed-tazkiras", icon: <FileSpreadsheet size={20} /> },
    { name: "درخواست‌ها و نوبت‌دهی", path: "/admin/requests", icon: <ClipboardList size={20} /> },
    { name: "انتشار اخبار در کانال‌ها", path: "/admin/broadcast", icon: <Megaphone size={20} /> },
    { name: "سایت‌های خدماتی", path: "/admin/websites", icon: <Globe size={20} /> },
    { name: "سوالات متداول (FAQ)", path: "/admin/faqs", icon: <HelpCircle size={20} /> },
    { name: "مدیریت و اتصال ربات‌ها", path: "/admin/bots", icon: <Bot size={20} /> },
    { name: "شبیه‌ساز پیام‌رسان‌ها", path: "/admin/simulator", icon: <Smartphone size={20} /> },
  ];

  const isNavActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black p-0.5 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="دستیار مهاجر" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-base font-black text-blue-600 dark:text-blue-400">دستیار مهاجر</h1>
              <p className="text-[10px] text-gray-400">پنل مدیریت دفاتر و ربات‌ها</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors text-xs font-bold",
                isNavActive(item.path)
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2 w-full rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-600"
          >
            <span>مشاهده سایت عمومی (لندینگ)</span>
            <ExternalLink size={14} />
          </a>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3.5 py-2 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors text-xs font-bold"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === "light" ? "حالت تاریک" : "حالت روشن"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2 w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors text-xs font-bold"
          >
            <LogOut size={18} />
            <span>خروج از پنل</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black p-0.5 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="دستیار مهاجر" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-base font-black text-blue-600 dark:text-blue-400">دستیار مهاجر</h1>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-bold">پنل ادمین</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white dark:bg-gray-800 w-64 h-full p-4 flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="pb-4 mb-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                 <h2 className="font-bold text-blue-600">منوی پنل مدیریت</h2>
                 <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
               </div>
               <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-xs font-bold",
                      isNavActive(item.path)
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-4 py-2 w-full rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <span>سایت عمومی</span>
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 px-4 py-2 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                  <span>{theme === "light" ? "حالت تاریک" : "حالت روشن"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 w-full rounded-xl hover:bg-red-50 text-red-600 text-xs font-bold"
                >
                  <LogOut size={18} />
                  <span>خروج</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
