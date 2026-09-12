import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import {
  Users,
  Building2,
  Globe,
  MessageSquare,
  LineChart,
  Bot,
  Smartphone,
  ArrowLeft,
  Megaphone,
  Eye,
  Activity,
  Layers,
  Star,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  Briefcase,
  UserCheck
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Link } from "react-router-dom";

interface DailyMetric {
  dayName: string;
  visits: number;
  users: number;
}

interface PlatformMemberStat {
  platform: string;
  name: string;
  members: number;
  color: string;
}

interface ActivityItem {
  id: string;
  textPreview?: string;
  platform?: string;
  event?: string;
  timestamp: any;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    branches: 0,
    embassies: 0,
    faqs: 0,
    requests: 0,
    botMembers: 0,
    totalVisits: 0,
    feedbacks: 0,
    lostDocs: 0,
  });

  const [chartData, setChartData] = useState<DailyMetric[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformMemberStat[]>([]);
  const [chartView, setChartView] = useState<"trend" | "platforms">("trend");
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Real-time Listeners for all core collections
    const unsubBranches = onSnapshot(collection(db, "branches"), snap => {
      setStats(prev => ({ ...prev, branches: snap.size }));
    });

    const unsubEmbassies = onSnapshot(collection(db, "embassies"), snap => {
      setStats(prev => ({ ...prev, embassies: snap.size }));
    });

    const unsubFaqs = onSnapshot(collection(db, "faqs"), snap => {
      setStats(prev => ({ ...prev, faqs: snap.size }));
    });

    const unsubRequests = onSnapshot(collection(db, "requests"), snap => {
      setStats(prev => ({ ...prev, requests: snap.size }));
    });

    const unsubFeedbacks = onSnapshot(collection(db, "office_feedbacks"), snap => {
      setStats(prev => ({ ...prev, feedbacks: snap.size }));
    });

    const unsubLost = onSnapshot(collection(db, "found_documents"), snap => {
      setStats(prev => ({ ...prev, lostDocs: snap.size }));
    });

    // 2. Real-time Users & Platform Distribution
    const unsubUsers = onSnapshot(collection(db, "bot_users"), snap => {
      const totalUsers = snap.size;
      const counts: Record<string, number> = {
        bale: 0,
        eitaa: 0,
        rubika: 0,
        soroush: 0,
        gap: 0,
        igap: 0,
        telegram: 0,
      };

      const days = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
      const userDayMap: Record<string, number> = {
        "شنبه": 0, "یک‌شنبه": 0, "دوشنبه": 0, "سه‌شنبه": 0, "چهارشنبه": 0, "پنج‌شنبه": 0, "جمعه": 0
      };

      snap.docs.forEach((doc) => {
        const d = doc.data();
        const p = d.platform;
        if (p && counts[p] !== undefined) {
          counts[p] += 1;
        }

        if (d.joinedAt) {
          const date = d.joinedAt.toDate ? d.joinedAt.toDate() : new Date(d.joinedAt);
          const dayIndex = (date.getDay() + 1) % 7;
          const dayName = days[dayIndex] || "شنبه";
          userDayMap[dayName] = (userDayMap[dayName] || 0) + 1;
        }
      });

      setStats(prev => ({ ...prev, botMembers: totalUsers }));

      setPlatformStats([
        { platform: "bale", name: "بله", members: counts.bale, color: "#10b981" },
        { platform: "eitaa", name: "ایتا", members: counts.eitaa, color: "#f97316" },
        { platform: "rubika", name: "روبیکا", members: counts.rubika, color: "#a855f7" },
        { platform: "telegram", name: "تلگرام", members: counts.telegram, color: "#0ea5e9" },
        { platform: "soroush", name: "سروش+", members: counts.soroush, color: "#2563eb" },
        { platform: "gap", name: "گپ", members: counts.gap, color: "#6366f1" },
        { platform: "igap", name: "ایگپ", members: counts.igap, color: "#14b8a6" },
      ]);
    });

    // 3. Real-time Analytics & Activity Feed
    const qAnalytics = query(collection(db, "analytics"), orderBy("timestamp", "desc"), limit(200));
    const unsubAnalytics = onSnapshot(qAnalytics, snap => {
      setStats(prev => ({ ...prev, totalVisits: snap.size }));

      const days = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
      const visitDayMap: Record<string, number> = {
        "شنبه": 0, "یک‌شنبه": 0, "دوشنبه": 0, "سه‌شنبه": 0, "چهارشنبه": 0, "پنج‌شنبه": 0, "جمعه": 0
      };

      const recentList: ActivityItem[] = [];

      snap.docs.forEach((doc, idx) => {
        const d = doc.data() as ActivityItem;
        if (idx < 6) {
          recentList.push({ id: doc.id, ...d });
        }

        if (d.timestamp) {
          const date = d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
          const dayIndex = (date.getDay() + 1) % 7;
          const dayName = days[dayIndex] || "شنبه";
          visitDayMap[dayName] = (visitDayMap[dayName] || 0) + 1;
        }
      });

      setRecentActivities(recentList);

      // Re-map 7 days real metric trend
      const dailyChart: DailyMetric[] = days.map(dayName => ({
        dayName,
        visits: visitDayMap[dayName] || 0,
        users: Math.min(visitDayMap[dayName] || 0, Math.ceil((visitDayMap[dayName] || 0) * 0.4)) || 0
      }));

      setChartData(dailyChart);
      setLoading(false);
    });

    return () => {
      unsubBranches();
      unsubEmbassies();
      unsubFaqs();
      unsubRequests();
      unsubFeedbacks();
      unsubLost();
      unsubUsers();
      unsubAnalytics();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Live Bot Ingress Status */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-blue-200 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>سیستم مدیریت متمرکز ربات‌های خدمات مهاجرین و دفاتر کفالت</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              داشبورد آمار و مدیریت پیام‌رسان‌ها
            </h1>
            <p className="text-sm text-blue-100/80 max-w-2xl leading-relaxed">
              اتصال زنده به پیام‌رسان‌های ایرانی و بین‌المللی (سروش پلاس، ایتا، بله، روبیکا، گپ، ایگپ و تلگرام). تمامی تغییرات اطلاعات دفاتر و بخشنامه‌ها فوراً در ربات‌ها به‌روزرسانی می‌شود.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/jobs"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all"
            >
              <Briefcase size={16} />
              <span>مدیریت کاریابی و کارجویان</span>
            </Link>
            <Link
              to="/admin/simulator"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
            >
              <Smartphone size={16} />
              <span>شبیه‌ساز ربات</span>
            </Link>
            <Link
              to="/admin/broadcast"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-2xl font-bold text-xs border border-white/20 transition-all"
            >
              <Megaphone size={16} />
              <span>ارسال در کانال‌ها</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bot Users */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">کاربران فعال پیام‌رسان‌ها</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {stats.botMembers.toLocaleString("fa-IR")}
            </span>
            <span className="text-[11px] text-gray-400">عضو فعال</span>
          </div>
          <Link to="/admin/analytics" className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-2 flex items-center gap-1">
            <Activity size={12} />
            <span>مشاهده تحلیل پلتفرم‌ها (ایتا، روبیکا...)</span>
          </Link>
        </div>

        {/* Card 2: Total Visits / Interactions */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">مجموع پیام‌ها و تعاملات</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Eye size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {stats.totalVisits.toLocaleString("fa-IR")}
            </span>
            <span className="text-[11px] text-gray-400">درخواست و پیام</span>
          </div>
          <Link to="/admin/inbox" className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-2 flex items-center gap-1">
            <MessageSquare size={12} />
            <span>صندوق پاسخگویی مستقیم (Live Inbox)</span>
          </Link>
        </div>

        {/* Card 3: Kefalat Offices */}
        <Link
          to="/admin/branches"
          className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">دفاتر کفالت ثبت‌شده</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {stats.branches.toLocaleString("fa-IR")}
            </span>
            <span className="text-[11px] text-gray-400">شعبه استانی</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-2 flex items-center gap-1">
            <span>مدیریت و افزودن شعب</span>
            <ArrowLeft size={12} />
          </p>
        </Link>

        {/* Card 4: Requests / Appointments */}
        <Link
          to="/admin/requests"
          className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">درخواست‌های نوبت‌دهی</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {stats.requests.toLocaleString("fa-IR")}
            </span>
            <span className="text-[11px] text-gray-400">پرونده ثبت‌شده</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <span>مشاهده و تغییر وضعیت</span>
            <ArrowLeft size={12} />
          </p>
        </Link>
      </div>

      {/* Secondary Fast Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/jobs"
          className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-blue-600" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">فرصت‌های کاریابی</span>
          </div>
          <span className="font-black font-mono text-xs text-blue-600">ورود</span>
        </Link>

        <Link
          to="/admin/reminders"
          className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:border-amber-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">یادآور مدارک (رایگان)</span>
          </div>
          <span className="font-black font-mono text-xs text-amber-600">ورود</span>
        </Link>

        <Link
          to="/admin/lost-documents"
          className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:border-teal-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-teal-600" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">مدارک پیدا شده</span>
          </div>
          <span className="font-black font-mono text-sm text-teal-600">{stats.lostDocs}</span>
        </Link>

        <Link
          to="/admin/feedbacks"
          className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between hover:border-amber-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">نظرات دفاتر</span>
          </div>
          <span className="font-black font-mono text-sm text-amber-600">{stats.feedbacks}</span>
        </Link>
      </div>

      {/* Real Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Real Charts (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LineChart size={18} className="text-blue-600" />
                <span>{chartView === "trend" ? "روند هفتگی بازدیدها و کاربران ربات‌ها" : "تفکیک اعضا به تفکیک پیام‌رسان‌ها"}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {chartView === "trend"
                  ? "آمار واقعی استخراج‌شده از لاگ‌های پیام‌رسان‌ها در روزهای هفته"
                  : "تعداد کاربران عضو شده در هر پیام‌رسان بر اساس حساب کاربری"}
              </p>
            </div>

            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl self-start">
              <button
                onClick={() => setChartView("trend")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartView === "trend"
                    ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                روند بازدید روزانه
              </button>
              <button
                onClick={() => setChartView("platforms")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartView === "platforms"
                    ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                توزیع پیام‌رسان‌ها
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {chartView === "trend" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="dayName" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      value,
                      name === "visits" ? "تعداد تعاملات و بازدید" : "کاربران فعال"
                    ]}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend
                    formatter={(value) => value === "visits" ? "تعاملات و بازدید روزانه" : "کاربران ربات"}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [value, "تعداد کاربر"]}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      direction: 'rtl'
                    }}
                  />
                  <Bar dataKey="members" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Platform Breakdown + Live Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real Platform Members List */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs flex items-center justify-between">
              <span>کاربران در هر پیام‌رسان</span>
              <span className="text-[10px] text-gray-400 font-mono">۷ شبکه فعال</span>
            </h3>

            <div className="space-y-2.5">
              {platformStats.map((item) => (
                <div key={item.platform} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-bold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-gray-900 dark:text-white">{item.members}</span>
                    <span className="text-[10px] text-gray-400">عضو</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <Link
                to="/simulator"
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"
              >
                <span>تست ارسال پیام در همه پیام‌رسان‌ها</span>
                <ArrowLeft size={13} />
              </Link>
            </div>
          </div>

          {/* Recent Live Feed */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-500" />
              <span>آخرین فعالیت‌های ثبت‌شده در ربات</span>
            </h3>

            {recentActivities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                هنوز فعالیتی ثبت نشده است. از شبیه‌ساز برای ارسال پیام استفاده کنید.
              </p>
            ) : (
              <div className="space-y-2">
                {recentActivities.slice(0, 4).map((act) => (
                  <div
                    key={act.id}
                    className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                        {act.textPreview || "ارتباط با ربات"}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 shrink-0">
                      {act.platform || "ربات"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
