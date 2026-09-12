import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Bot,
  ExternalLink,
  MessageSquare,
  Building2,
  Landmark,
  FileCheck2,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileSpreadsheet,
  Layers,
  Send,
  Radio,
  ArrowDownCircle,
  Calculator,
  FileText,
  GraduationCap,
  Navigation,
  Scale,
  X,
  Calendar,
  Camera,
  Car,
  Bell,
  Briefcase,
  FileSearch,
  CreditCard,
  Home,
  BookOpen,
  Smartphone,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { PWAInstallButton } from "../components/PWAInstallButton";
import {
  getLandingConfig,
  syncLandingConfigFromCloud,
  LandingConfig,
  BotLinkItem,
  NewsChannelItem
} from "../data/landingSettings";
import { SocialIconDisplay } from "../components/SocialIconDisplay";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { isSupabaseConfigured, fetchTazkirasFromSupabase } from "../supabase";
import { TazkiraRecord, INITIAL_TAZKIRAS } from "../data/initialTazkiras";
import FeeCalculatorModal from "../components/FeeCalculatorModal";
import ConsularFormsModal from "../components/ConsularFormsModal";
import EducationGuideModal from "../components/EducationGuideModal";
import GpsFinderModal from "../components/GpsFinderModal";
import AiLegalAdvisorModal from "../components/AiLegalAdvisorModal";
import LostDocsPublicModal from "../components/LostDocsPublicModal";
import ExpiryReminderModal from "../components/ExpiryReminderModal";
import DateConverterModal from "../components/DateConverterModal";
import PhotoStandardizerModal from "../components/PhotoStandardizerModal";
import DrivingQuizModal from "../components/DrivingQuizModal";
import JobPortalModal from "../components/JobPortalModal";

export default function LandingPage() {
  const [config, setConfig] = useState<LandingConfig>(() => getLandingConfig());
  const [tazkiras, setTazkiras] = useState<TazkiraRecord[]>(INITIAL_TAZKIRAS);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TazkiraRecord[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Modals state
  const [isFeeCalcOpen, setIsFeeCalcOpen] = useState(false);
  const [isConsularFormsOpen, setIsConsularFormsOpen] = useState(false);
  const [isEducationGuideOpen, setIsEducationGuideOpen] = useState(false);
  const [isGpsFinderOpen, setIsGpsFinderOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isLostDocsOpen, setIsLostDocsOpen] = useState(false);
  const [isExpiryReminderOpen, setIsExpiryReminderOpen] = useState(false);
  const [isDateConverterOpen, setIsDateConverterOpen] = useState(false);
  const [isPhotoCropperOpen, setIsPhotoCropperOpen] = useState(false);
  const [isDrivingQuizOpen, setIsDrivingQuizOpen] = useState(false);
  const [isJobPortalOpen, setIsJobPortalOpen] = useState(false);

  // Load fresh landing config and public tazkira data
  useEffect(() => {
    syncLandingConfigFromCloud().then((fresh) => {
      setConfig(fresh);
    });

    // Fetch tazkira list for public lookup
    const loadPublicTazkiras = async () => {
      if (isSupabaseConfigured()) {
        try {
          const list = await fetchTazkirasFromSupabase();
          if (list && list.length > 0) {
            setTazkiras(list);
            return;
          }
        } catch {
          // Fallback to Firestore
        }
      }

      try {
        const q = query(collection(db, "printed_tazkiras"), limit(3000));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: TazkiraRecord[] = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as any)
          }));
          setTazkiras(list);
        }
      } catch {
        // Keep initial sample data
      }
    };

    loadPublicTazkiras();
  }, []);

  // Normalize Persian / Dari text for matching
  const normalizePersian = (str: string) => {
    if (!str) return "";
    return str
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ة/g, "ه")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizePersian(searchQuery.toLowerCase().trim());
    if (!clean) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    setTimeout(() => {
      const results = tazkiras.filter((t) => {
        const full = normalizePersian(t.fullName || "").toLowerCase();
        const sur = normalizePersian(t.surname || "").toLowerCase();
        const father = normalizePersian(t.fatherName || "").toLowerCase();
        const rowStr = String(t.rowNumber || "");
        const combined = `${full} ${sur}`.trim();

        return (
          full.includes(clean) ||
          sur.includes(clean) ||
          combined.includes(clean) ||
          father.includes(clean) ||
          rowStr === clean
        );
      });

      setSearchResults(results.slice(0, 50));
      setSearching(false);
    }, 200);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setHasSearched(false);
  };

  const faqs = [
    {
      q: "چگونه وضعیت چاپ تذکره الکترونیکی خود را استعلام کنم؟",
      a: "کافیست نام کامل یا نام پدر خود را در کادر استعلام آنلاین در بالای همین صفحه جستجو کنید، یا از طریق ربات تلگرام و بله با ارسال نام و تخلص، قطعه (Box) و ردیف تذکره آماده تحویل خود را دریافت نمایید."
    },
    {
      q: "برای تحویل تذکره در کنسولگری چه مدارکی الزامی است؟",
      a: "اصل برگه ثبت‌نام اولیه، رسید نوبت تذکره و یک مدرک شناسایی عکس‌دار معتبر سرپرست یا متقاضی. هنگام مراجعه باید شماره باکس (Box) و ردیف استخراج‌شده را به باجه اعلام فرمایید."
    },
    {
      q: "آیا برای استفاده از ربات‌ها نیاز به فیلترشکن است؟",
      a: "خیر، ربات‌های پیام‌رسان بله، ایتا و روبیکا بدون نیاز به هرگونه ابزار تغییر IP و با اینترنت ملی در داخل ایران به صورت پرسرعت و رایگان پاسخگوی شما هستند."
    },
    {
      q: "آدرس و ساعات کاری دفاتر کفالت را چگونه پیدا کنم؟",
      a: "در ربات هوشمند دستیار مهاجر، با انتخاب گزینه «دفاتر کفالت» و ارسال موقعیت یا نام شهر خود، آدرس دقیق، نقشه، شماره تماس و لیست هزینه‌های مصوب برای شما ارسال خواهد شد."
    }
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors selection:bg-blue-600 selection:text-white">
      {/* ========================================================= */}
      {/* Top Notification Announcement Bar */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2 shadow-sm">
        <Sparkles size={14} className="text-amber-300 shrink-0" />
        <span className="font-semibold text-amber-200">اطلاعیه رسمی:</span>
        <span className="truncate max-w-2xl">{config.announcementText}</span>
      </div>

      {/* ========================================================= */}
      {/* Public Navigation Header (Strictly NO Admin Links) */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black p-0.5 border border-slate-700 shadow-md shadow-blue-500/10 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="لوگوی رسمی دستیار مهاجر"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  دستیار مهاجر
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  سامانه هوشمند
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                راهنمای خدمات کنسولی، دفاتر کفالت و استعلام تذکره
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#services" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              خدمات سامانه
            </a>
            <Link to="/inquiries" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-black">
              <FileSearch size={14} />
              <span>استعلامات هوشمند</span>
            </Link>
            <Link to="/education" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-black">
              <GraduationCap size={14} />
              <span>مدارس و دانشگاه‌ها</span>
            </Link>
            <a href="#search-tazkira" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              استعلام تذکره
            </a>
            <a href="#bots" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              ربات‌ها
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              سوالات متداول
            </a>
          </nav>

          {/* System Online Status Badge & PWA Install */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ربات‌ها فعال</span>
            </div>
            <a
              href="#bots"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Bot size={15} />
              <span className="hidden sm:inline">شروع گفتگو در ربات</span>
              <span className="sm:hidden">ربات‌ها</span>
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* Hero Section */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* In-app Mobile Install Banner */}
          <PWAInstallButton variant="banner" />
          {/* Official Logo Display */}
          <div className="flex justify-center mb-6">
            <div className="p-2 sm:p-3 bg-black rounded-3xl border border-slate-800 shadow-2xl shadow-teal-500/10 hover:border-slate-700 transition-all">
              <img
                src="/logo.png"
                alt="لوگوی رسمی دستیار مهاجر"
                className="h-20 sm:h-24 md:h-28 w-auto object-contain rounded-2xl"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold mb-6">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span>سامانه یکپارچه اطلاع‌رسانی و خدمات مهاجرین محترم</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-snug mb-5">
            دسترسی سریع، موثق و آسان به <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
              خدمات کنسولی و اقامتی
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
            سامانه خودکار <strong>دستیار مهاجر</strong> با هدف تسهیل امور اداری اتباع و مهاجرین طراحی شده است.
            استعلام آنلاین تذکره‌های چاپ‌شده، دریافت نشانی دقیق دفاتر کفالت، راهنمای اخذ پاسپورت، پیگیری مدارک مفقودی
            و جدیدترین بخشنامه‌ها را بدون نیاز به حضور در صف‌ها دریافت کنید.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <a
              href="#search-tazkira"
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Search size={18} />
              <span>استعلام رایگان تذکره‌های چاپ‌شده</span>
            </a>

            <a
              href="#bots"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Bot size={18} />
              <span>اتصال به ربات‌های پیام‌رسان</span>
            </a>

            <a
              href="#news"
              className="px-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <Megaphone size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>کانال‌های رسمی اخبار</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">۵,۰۰۰+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">تذکره آماده تحویل</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">۲۴ / ۷</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">پاسخگویی خودکار</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">۵ پلتفرم</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">تلگرام، بله، ایتا، روبیکا</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">۱۰۰٪ رایگان</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">خدمات عمومی مهاجرین</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Section: Online Tazkira Search Widget (Public Lookup) */}
      {/* ========================================================= */}
      <section id="search-tazkira" className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  استعلام آنلاین تذکره‌های الکترونیکی چاپ‌شده
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  بررسی وضعیت صدور تذکره، شماره باکس (قطعه تحویل) و ردیف کنسولگری بدون مراجعه حضوری
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>بانک اطلاعاتی شامل {tazkiras.length.toLocaleString("fa-IR")} رکورد بروزرسانی‌شده</span>
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="نام متقاضی، تخلص یا نام پدر را وارد کنید (مثال: محمد، حسینی، احمد)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-28 pr-12 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <div className="absolute inset-y-2 left-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {searching ? "در حال جستجو..." : "استعلام"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 راهنما: می‌توانید تنها بخشی از نام یا نام خانوادگی را تایپ کرده و دکمه استعلام را بزنید.
            </p>
          </form>

          {/* Search Results Display */}
          {hasSearched && searchResults && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>نتایج استعلام ({searchResults.length} مورد یافت شد):</span>
                </h4>
                <button
                  onClick={clearSearch}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  پاک کردن نتایج
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 space-y-2">
                  <p className="font-bold text-sm">موردی با مشخصات وارد شده در لیست چاپ‌شده‌های اخیر یافت نشد.</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
                    اگر به تازگی درخواست داده‌اید، ممکن است تذکره شما هنوز از کابل ارسال نشده باشد. می‌توانید از طریق ربات‌های پیام‌رسان در نوبت‌های بعدی نیز مجدداً استعلام بگیرید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {searchResults.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {item.fullName} {item.surname}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "delivered"
                              ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {item.status === "delivered" ? "تحویل داده شده" : "آماده تحویل در کنسولگری"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400">نام پدر: </span>
                          <span className="font-bold">{item.fatherName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ولایت: </span>
                          <span className="font-bold">{item.province || "هرات"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">شماره قطعه (باکس): </span>
                          <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                            {item.boxNumber || "B"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">ردیف لیست: </span>
                          <span className="font-mono font-bold">{item.rowNumber}</span>
                        </div>
                      </div>

                      {item.remarks && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5 flex items-center gap-1">
                          <Clock size={12} />
                          <span>تاریخ و کد درج‌شده: {item.remarks}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* Section: Direct Bot Access (Telegram, Bale, Eitaa, etc.) */}
      {/* ========================================================= */}
      <section id="bots" className="py-16 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Bot size={14} />
              <span>پاسخگویی هوشمند ۲۴ ساعته</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              اتصال به ربات‌های رسمی در پیام‌رسان‌ها
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              پیام‌رسان مورد علاقه خود را انتخاب کنید و خدمات کنسولی، آدرس دفاتر کفالت و استعلام را بدون معطلی تجربه نمایید.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(config?.botLinks || []).map((bot) => (
              <div
                key={bot.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SocialIconDisplay
                      customIconUrl={bot.customIconUrl}
                      iconType={bot.iconType}
                      platform={bot.name}
                      fallbackGradient={bot.color}
                      className="w-12 h-12 rounded-2xl shadow-md"
                      iconSize={24}
                      alt={bot.persianName}
                    />
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>فعال و آنلاین</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {bot.persianName}
                    </h4>
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5" dir="ltr">
                      {bot.username}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px]">
                    {bot.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700/60 mt-4">
                  <a
                    href={bot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-blue-600 text-white dark:bg-slate-700 dark:hover:bg-blue-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md"
                  >
                    <span>ورود به ربات {bot.name}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Section: News Channels and Information Channels */}
      {/* ========================================================= */}
      <section id="news" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Megaphone size={14} />
            <span>اطلاع‌رسانی موثق و رسمی</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            کانال‌های خبری و مراجع اطلاع‌رسانی
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            جهت اطلاع از آخرین ابلاغیه‌های سازمان ملی مهاجرت، طرح‌های ثبت‌نامی و لیست روزانه تذکره‌ها، در کانال‌های رسمی عضو شوید.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(config?.newsChannels || []).map((channel) => (
            <div
              key={channel.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <SocialIconDisplay
                      customIconUrl={channel.customIconUrl}
                      iconType={channel.iconType || channel.platform}
                      platform={channel.platform}
                      className="w-11 h-11 rounded-2xl shadow-sm"
                      iconSize={22}
                      alt={channel.title}
                    />
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-block">
                        {channel.badge}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{channel.platform}</span>
                </div>

                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {channel.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[44px]">
                  {channel.description}
                </p>

                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold" dir="ltr">
                  {channel.handle}
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-700 mt-4">
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-slate-700/60 dark:hover:bg-blue-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>عضویت در کانال</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* Section: Interactive Services and Tools */}
      {/* ========================================================= */}
      <section id="services" className="py-16 bg-slate-100/50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Sparkles size={14} />
              <span>میز خدمات و ابزارهای آنلاین مهاجرین</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              خدمات تخصصی و ابزارهای فوری سامانه
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              ابزارهای هوشمند زیر به صورت کاملاً رایگان و برخط جهت تسهیل امور اداری، کنسولی و آموزشی مهاجرین محترم طراحی شده‌اند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Tazkira Search */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <FileCheck2 size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  استعلام تذکره‌های چاپ‌شده
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  جستجوی آنی در میان هزاران تذکره ارسال‌شده به سفارت و کنسولگری‌ها، مشخص بودن شماره قطعه و ردیف تحویل.
                </p>
              </div>
              <a
                href="#search-tazkira"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-slate-700 dark:hover:bg-emerald-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Search size={14} />
                <span>ورود به بخش استعلام</span>
              </a>
            </div>

            {/* 2. GPS Kafalat Finder */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Navigation size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  مسیریابی هوشمند دفاتر کفالت
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  یافتن نزدیک‌ترین دفتر کفالت با GPS و مسیریابی مستقیم با برنامه‌های نشان، بلد و Google Maps به همراه تلفن تماس.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGpsFinderOpen(true)}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Navigation size={14} />
                <span>مسیریابی دفاتر (نشان و بلد)</span>
              </button>
            </div>

            {/* 3. Fee Calculator */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Calculator size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  محاسبه‌گر هزینه‌ها و تعرفه‌ها
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  برآورد دقیق هزینه‌های دلاری و تومانی تمدید پاسپورت ۵ ساله، تثبیت هویت، نوبت کفالت و مدارک برای کل خانوار.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFeeCalcOpen(true)}
                className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-slate-700 dark:hover:bg-indigo-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Calculator size={14} />
                <span>محاسبه آنلاین هزینه‌ها</span>
              </button>
            </div>

            {/* 4. Consular Form Generator */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  فرم‌ساز اسناد کنسولی و PDF
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  تکمیل و چاپ خودکار فرم‌های رسمی تثبیت هویت سفارت، وکالت‌نامه کاری، استشهاد محلی و رضایت‌نامه سفر با سربرگ استاندارد.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConsularFormsOpen(true)}
                className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white dark:bg-slate-700 dark:hover:bg-teal-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <FileText size={14} />
                <span>ساخت و چاپ فرم رسمی</span>
              </button>
            </div>

            {/* 5. AI Legal Advisor */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  مشاور هوش مصنوعی اقامتی و حقوقی
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  پاسخگویی آنی و شبانه‌روزی به پرسش‌های کارت آمایش، گواهینامه رانندگی، افتتاح حساب بانکی و بخشنامه‌های سازمان مهاجرت.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiAdvisorOpen(true)}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-slate-700 dark:hover:bg-purple-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Bot size={14} />
                <span>گفتگو با مشاور هوشمند</span>
              </button>
            </div>

            {/* 6. Lost & Found Documents */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  مدارک و اسناد مفقودی
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  جستجو در بانک مدارک پیدا شده (کارت آمایش، سرشماری، پاسپورت، کارت عابر) یا گزارش مدرک پیدا شده توسط شهروندان.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLostDocsOpen(true)}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white dark:bg-slate-700 dark:hover:bg-amber-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>استعلام مدارک گمشده</span>
              </button>
            </div>

            {/* 7. Expiry Reminder */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Bell size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  یادآور تاریخ انقضای مدارک
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ثبت تاریخ انقضای کارت آمایش، پاسپورت و روادید برای دریافت هشدار پیامکی ۳۰ روز و ۱۰ روز پیش از اتمام اعتبار.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpiryReminderOpen(true)}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white dark:bg-slate-700 dark:hover:bg-amber-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Bell size={14} />
                <span>ثبت هشدار انقضا</span>
              </button>
            </div>

            {/* 8. Date & Age Converter */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  مبدل تاریخ تذکره و سن قانونی
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  تبدیل سال خورشیدی افغانستان به میلادی، محاسبه سن تذکره کاغذی و بررسی سن قانونی ۱۸ سال و دبستان.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDateConverterOpen(true)}
                className="w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white dark:bg-slate-700 dark:hover:bg-teal-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar size={14} />
                <span>تبدیل تاریخ و سن</span>
              </button>
            </div>

            {/* 9. Biometric Photo Standardizer */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Camera size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  برش‌گر عکس پرسنلی ۴×۳
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  برش استاندارد عکس، اعمال زمینه سفید یکدست و انطباق با خطوط بیومتریک چشم و چانه کنسولگری.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoCropperOpen(true)}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Camera size={14} />
                <span>تنظیم عکس ۴×۳</span>
              </button>
            </div>

            {/* 10. Driving Quiz Simulator */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Car size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  آزمون آیین‌نامه رانندگی
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  شبیه‌ساز رسمی تست آیین‌نامه رانندگی اتباع، تابلوها، حق تقدم و سوالات فنی همراه با کارنامه قبولی.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrivingQuizOpen(true)}
                className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-slate-700 dark:hover:bg-indigo-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Car size={14} />
                <span>شروع آزمون آنلاین</span>
              </button>
            </div>

            {/* 11. Job Portal */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Briefcase size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  کاریابی و استخدام مجاز اتباع
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  بانک فرصت‌های شغلی مجاز با جای خواب و پروانه کار، ثبت آگهی استخدام کارفرما و ثبت رزومه کارجویان مهاجر.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJobPortalOpen(true)}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-slate-700 dark:hover:bg-emerald-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Briefcase size={14} />
                <span>ورود به سامانه کاریابی</span>
              </button>
            </div>

            {/* 12. Embassy Passport Lookup */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Landmark size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  استعلام پاسپورت سفارت تهران
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  رهگیری صدور گذرنامه با شماره فیش و تذکره، استعلام شماره کارتن و باجه تحویل مدارک در سفارت افغانستان در تهران.
                </p>
              </div>
              <Link
                to="/inquiries"
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Search size={14} />
                <span>پیگیری پاسپورت سفارت</span>
              </Link>
            </div>

            {/* 13. Khodnevis Real Estate Lookup */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Home size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  استعلام سامانه خودنویس املاک
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  استعلام کد رهگیری قرارداد اجاره مسکونی وزارت راه و شهرسازی جهت تاییدیه احراز سکونت در دفاتر کفالت اتباع.
                </p>
              </div>
              <Link
                to="/inquiries"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-slate-700 dark:hover:bg-emerald-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Search size={14} />
                <span>استعلام قرارداد خودنویس</span>
              </Link>
            </div>

            {/* 14. FIDA Code Lookup */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  استعلام کد فراگیر فیدا (FIDA)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  راستی‌آزمایی شناسه ۱۲ رقمی فیدا جهت رفع مسدودی حساب بانکی، کارت شتاب، ثبت شرکت و اسناد رسمی.
                </p>
              </div>
              <Link
                to="/inquiries"
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-slate-700 dark:hover:bg-purple-600 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Search size={14} />
                <span>استعلام شناسه فیدا</span>
              </Link>
            </div>

            {/* 15. Education, Scholarships & School Admissions */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      سامانه جامع آموزش، سنجش سلامت مدارس و دانشگاه‌های اتباع
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                      کد سازمان سنجش کنکور، سامانه سجاد (Saorg)، ثبت‌نام مای مدیو (my.medu.ir)، نوبت‌دهی پایگاه سنجش سلامت نوآموزان (سیرت) و بورسیه‌های فعال دانشگاه‌های ایران.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsEducationGuideOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen size={14} />
                    <span>راهنمای سریع</span>
                  </button>
                  <Link
                    to="/education"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <GraduationCap size={15} />
                    <span>پورتال تخصصی دانشگاه و مدارس</span>
                  </Link>
                </div>
              </div>

              {/* Service Card 10: Official Mobile App (APK / TWA / PWA) */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900/60 border-2 border-blue-500/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 transition-all hover:border-blue-500/60">
                <div className="flex items-center gap-4 text-right">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                    <Smartphone size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        نسخه رسمی تلفن همراه
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        بدون فیلتر و بدون نیاز به استور
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                      اپلیکیشن موبایل دستیار مهاجر (نسخه مستقیم APK و TWA)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                      نصب مستقیم روی گوشی اندروید و iOS، آیکون مستقل روی صفحه گوشی، حجم کمتر از ۳ مگابایت، دسترسی آفلاین و اعلان‌های هوشمند.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Link
                    to="/download-app"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Download size={15} />
                    <span>دانلود و راهنمای نصب APK</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Section: Frequently Asked Questions */}
      {/* ========================================================= */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            سوالات متداول مراجعین
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            پاسخ سریع به پرتکرارترین پرسش‌های مهاجرین محترم
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-5 text-right flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white"
              >
                <span>{f.q}</span>
                {openFaq === i ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* Footer (Strictly NO Admin Links or Hints) */}
      {/* ========================================================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-black p-0.5 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="لوگوی رسمی دستیار مهاجر"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div>
                <h4 className="text-base font-black text-white">دستیار مهاجر</h4>
                <p className="text-xs text-slate-400">سامانه خدمات کنسولی، دفاتر کفالت و اطلاع‌رسانی مهاجرین</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-300">
              <a href="#services" className="hover:text-white transition-colors">خدمات</a>
              <a href="#search-tazkira" className="hover:text-white transition-colors">استعلام تذکره</a>
              <a href="#bots" className="hover:text-white transition-colors">ربات‌ها</a>
              <a href="#news" className="hover:text-white transition-colors">کانال‌های خبری</a>
              <a href="#faq" className="hover:text-white transition-colors">سوالات متداول</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} سامانه دستیار مهاجر. کلیه حقوق و خدمات عام‌المنفعه برای مهاجرین محترم محفوظ است.</p>
            <p>ارائه‌شده به منظور تکریم مهاجرین و تسهیل امور اداری و کنسولی</p>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* Interactive Service Modals */}
      {/* ========================================================= */}
      <FeeCalculatorModal
        isOpen={isFeeCalcOpen}
        onClose={() => setIsFeeCalcOpen(false)}
      />

      <ConsularFormsModal
        isOpen={isConsularFormsOpen}
        onClose={() => setIsConsularFormsOpen(false)}
      />

      <EducationGuideModal
        isOpen={isEducationGuideOpen}
        onClose={() => setIsEducationGuideOpen(false)}
      />

      <GpsFinderModal
        isOpen={isGpsFinderOpen}
        onClose={() => setIsGpsFinderOpen(false)}
      />

      <AiLegalAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
      />

      <LostDocsPublicModal
        isOpen={isLostDocsOpen}
        onClose={() => setIsLostDocsOpen(false)}
      />

      <ExpiryReminderModal
        isOpen={isExpiryReminderOpen}
        onClose={() => setIsExpiryReminderOpen(false)}
      />

      <DateConverterModal
        isOpen={isDateConverterOpen}
        onClose={() => setIsDateConverterOpen(false)}
      />

      <PhotoStandardizerModal
        isOpen={isPhotoCropperOpen}
        onClose={() => setIsPhotoCropperOpen(false)}
      />

      <DrivingQuizModal
        isOpen={isDrivingQuizOpen}
        onClose={() => setIsDrivingQuizOpen(false)}
      />

      <JobPortalModal
        isOpen={isJobPortalOpen}
        onClose={() => setIsJobPortalOpen(false)}
      />
    </div>
  );
}
