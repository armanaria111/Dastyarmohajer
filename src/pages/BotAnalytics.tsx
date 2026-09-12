import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Bot,
  MessageSquare,
  Activity,
  Download,
  Calendar,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

export default function BotAnalytics() {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("month");

  // Platform Distribution Stats
  const platforms = [
    { name: "ایتا (Eitaa)", users: 4820, percent: 41, color: "bg-orange-500", text: "text-orange-500" },
    { name: "روبیکا (Rubika)", users: 3290, percent: 28, color: "bg-purple-500", text: "text-purple-500" },
    { name: "بله (Bale)", users: 2110, percent: 18, color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "تلگرام (Telegram)", users: 1050, percent: 9, color: "bg-sky-500", text: "text-sky-500" },
    { name: "سروش+ (Soroush)", users: 470, percent: 4, color: "bg-blue-600", text: "text-blue-600" }
  ];

  // Most Requested Services
  const topServices = [
    { name: "استعلام تذکره‌های چاپ شده سفارت", count: 7420, percent: 36, color: "bg-blue-600" },
    { name: "نوبت‌دهی و آدرس دفاتر کفالت استان‌ها", count: 4930, percent: 24, color: "bg-emerald-600" },
    { name: "سامانه کاریابی و استخدام اتباع", count: 3280, percent: 16, color: "bg-amber-600" },
    { name: "یادآور انقضای کارت آمایش و پاسپورت", count: 2260, percent: 11, color: "bg-rose-600" },
    { name: "بانک مدارک مفقودی و پیدا شده", count: 1440, percent: 7, color: "bg-purple-600" },
    { name: "شبیه‌ساز آزمون آیین‌نامه رانندگی اتباع", count: 820, percent: 4, color: "bg-indigo-600" },
    { name: "پیوند به سایت‌های خدمات دولتی", count: 410, percent: 2, color: "bg-slate-600" }
  ];

  // Daily activity mock days
  const dailyActivity = [
    { day: "شنبه", messages: 1420, visitors: 980 },
    { day: "یکشنبه", messages: 1680, visitors: 1120 },
    { day: "دوشنبه", messages: 1890, visitors: 1290 },
    { day: "سه‌شنبه", messages: 1750, visitors: 1190 },
    { day: "چهارشنبه", messages: 2100, visitors: 1450 },
    { day: "پنجشنبه", messages: 1320, visitors: 890 },
    { day: "جمعه", messages: 950, visitors: 640 }
  ];

  const handleExportStats = () => {
    const headers = ["عنوان شاخص", "تعداد یا مقدار", "درصد سهم"];
    const rows: (string | number)[][] = [
      ["کل کاربران تعامل‌داشته", 11740, "100%"],
      ...platforms.map((p) => [`کاربران پیام‌رسان ${p.name}`, p.users, `${p.percent}%`]),
      ...topServices.map((s) => [`خدمت: ${s.name}`, s.count, `${s.percent}%`])
    ];
    exportToCSV("گزارش_تحلیلی_ربات_های_دستیار_مهاجر", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            <span>آمار و تحلیل رفتار کاربران ربات‌ها (Bot Analytics)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            بررسی نرخ استفاده از خدمات، توزیع کاربران در پیام‌رسان‌های ایرانی و میزان تعاملات لحظه‌ای
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTimeRange("today")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === "today" ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xs" : "text-gray-500"
              }`}
            >
              امروز
            </button>
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === "week" ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xs" : "text-gray-500"
              }`}
            >
              هفته گذشته
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === "month" ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xs" : "text-gray-500"
              }`}
            >
              یک ماه اخیر
            </button>
          </div>

          <button
            onClick={handleExportStats}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی گزارش</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>کل کاربران یکتای ربات‌ها</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">۱۱,۷۴۰</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>۱۲٪ رشد نسبت به ماه قبل</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>تعداد تعاملات و پیام‌ها</span>
            <MessageSquare size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">۸۴,۲۵۰</div>
          <div className="text-[11px] text-gray-400 mt-1">میانگین ۷.۱ پیام به ازای هر کاربر</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>میانگین سرعت پاسخگویی</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">۰.۴ ثانیه</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">پایداری سرور: ۹۹.۹٪</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>ساعت اوج مراجعه مراجعین</span>
            <Clock size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">۱۰ تا ۱۴</div>
          <div className="text-[11px] text-gray-400 mt-1">همزمان با ساعات کاری دفاتر کفالت</div>
        </div>
      </div>

      {/* Grid: Platforms & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Platform Share */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Bot size={18} className="text-blue-500" />
              <span>سهم پلتفرم‌های پیام‌رسان از ترافیک</span>
            </h3>
            <span className="text-[11px] text-gray-400">مجموع: ۱۱,۷۴۰ کاربر</span>
          </div>

          <div className="space-y-3">
            {platforms.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-800 dark:text-gray-200">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-[11px] font-mono">{p.users.toLocaleString("fa-IR")} کاربر</span>
                    <span className={`font-black ${p.text}`}>{p.percent}٪</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${p.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-gray-500 leading-relaxed">
            * پیام‌رسان‌های ایرانی (ایتا، روبیکا و بله) در مجموع **۸۷٪** از مخاطبان افغانستانی را به دلیل دسترسی آسان‌تر پوشش می‌دهند.
          </div>
        </div>

        {/* Top Requested Services */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              <span>محبوب‌ترین خدمات استعلام‌شده توسط کاربران</span>
            </h3>
            <span className="text-[11px] text-gray-400">به تفکیک موضوع</span>
          </div>

          <div className="space-y-3">
            {topServices.map((s) => (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-[11px] font-mono">{s.count.toLocaleString("fa-IR")} بار</span>
                    <span className="font-black text-gray-700 dark:text-gray-300">{s.percent}٪</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${s.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Traffic Rhythm */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            <span>روند هفتگی تبادل پیام و مراجعین روزانه</span>
          </h3>
          <span className="text-xs text-emerald-600 font-bold">بیشترین مراجعه: روزهای چهارشنبه و دوشنبه</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {dailyActivity.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{d.day}</span>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-lg h-24 flex items-end justify-center p-1">
                <div
                  className="w-full bg-blue-600 hover:bg-blue-500 rounded-md transition-all duration-300"
                  style={{ height: `${(d.messages / 2200) * 100}%` }}
                  title={`${d.messages} پیام`}
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500">{d.messages} پیام</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
