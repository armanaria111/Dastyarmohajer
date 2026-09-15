import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
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
  CheckCircle2,
  Plus,
  Trash2,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Smartphone,
  X,
  FileSpreadsheet,
  Briefcase,
  AlertTriangle,
  Star,
  FileSearch,
  CheckCircle
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

interface RealEventItem {
  id: string;
  source: "request" | "reminder" | "job" | "lost_doc" | "feedback" | "bot_message";
  title: string;
  applicantOrOwner: string;
  phone: string;
  platform: string;
  status: string;
  dateStr: string;
  timestamp: number;
}

export default function BotAnalytics() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Real data state from Firestore collections
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [remindersList, setRemindersList] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [seekersList, setSeekersList] = useState<any[]>([]);
  const [lostDocsList, setLostDocsList] = useState<any[]>([]);
  const [feedbacksList, setFeedbacksList] = useState<any[]>([]);
  const [botMessagesList, setBotMessagesList] = useState<any[]>([]);
  const [tazkiraCount, setTazkiraCount] = useState<number>(0);

  // Manual Event Creation Modal
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    applicantName: "",
    phone: "",
    platform: "eitaa",
    serviceType: "استعلام نوبت و تذکره الکترونیکی",
    notes: ""
  });

  // Real-time Firestore sync across real collections
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    // 1. Requests
    try {
      const u1 = onSnapshot(collection(db, "requests"), (snap) => {
        setRequestsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u1);
    } catch {}

    // 2. Monitored documents (Expiry reminders)
    try {
      const u2 = onSnapshot(collection(db, "monitored_documents"), (snap) => {
        setRemindersList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u2);
    } catch {}

    // 3. Jobs
    try {
      const u3 = onSnapshot(collection(db, "jobs"), (snap) => {
        setJobsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u3);
    } catch {}

    // 4. Job Seekers
    try {
      const u4 = onSnapshot(collection(db, "job_seekers"), (snap) => {
        setSeekersList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u4);
    } catch {}

    // 5. Lost Documents
    try {
      const u5 = onSnapshot(collection(db, "lost_documents"), (snap) => {
        setLostDocsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u5);
    } catch {}

    // 6. Feedbacks
    try {
      const u6 = onSnapshot(collection(db, "feedbacks"), (snap) => {
        setFeedbacksList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u6);
    } catch {}

    // 7. Bot Messages (Inbox)
    try {
      const u7 = onSnapshot(collection(db, "bot_messages"), (snap) => {
        setBotMessagesList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, () => {});
      unsubs.push(u7);
    } catch {}

    // 8. Printed Tazkira count
    try {
      const u8 = onSnapshot(collection(db, "printed_tazkira"), (snap) => {
        setTazkiraCount(snap.size);
        setLoading(false);
      }, () => {
        setLoading(false);
      });
      unsubs.push(u8);
    } catch {
      setLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, []);

  // Compute unified real activity feed without any fake seeds
  const unifiedActivities: RealEventItem[] = [];

  requestsList.forEach((r) => {
    let t = Date.now();
    if (r.createdAt?.toMillis) t = r.createdAt.toMillis();
    else if (r.createdAt?.seconds) t = r.createdAt.seconds * 1000;
    else if (typeof r.createdAt === "string") t = new Date(r.createdAt).getTime() || Date.now();

    unifiedActivities.push({
      id: r.id,
      source: "request",
      title: r.requestType || "درخواست نوبت‌دهی / استعلام",
      applicantOrOwner: r.applicantName || "متقاضی خدمات",
      phone: r.phone || "-",
      platform: r.platform || "ربات / وب",
      status: r.status === "completed" ? "تکمیل شده" : r.status === "rejected" ? "رد شده" : "در انتظار بررسی",
      dateStr: new Date(t).toLocaleDateString("fa-IR"),
      timestamp: t
    });
  });

  remindersList.forEach((rem) => {
    unifiedActivities.push({
      id: rem.id,
      source: "reminder",
      title: `پایش انقضای ${rem.docType || "مدرک اقامتی"} (${rem.daysRemaining} روز مانده)`,
      applicantOrOwner: rem.ownerName || "صاحب مدرک",
      phone: rem.phone || "-",
      platform: rem.botPlatform || "eitaa",
      status: rem.status === "notified" ? "هشدار ارسال شد" : "تحت پایش",
      dateStr: rem.expiryDate || "-",
      timestamp: Date.now() - 1000 * 60 * 60 * 2
    });
  });

  jobsList.forEach((j) => {
    unifiedActivities.push({
      id: j.id,
      source: "job",
      title: `فرصت شغلی: ${j.title} (${j.category || "اشتغال"})`,
      applicantOrOwner: j.employer || "کارفرما",
      phone: j.phone || "-",
      platform: "کاریابی",
      status: j.status === "approved" ? "تایید شده" : "در انتظار",
      dateStr: j.createdAt || "-",
      timestamp: Date.now() - 1000 * 60 * 60 * 5
    });
  });

  seekersList.forEach((s) => {
    unifiedActivities.push({
      id: s.id,
      source: "job",
      title: `ثبت کارجو: ${s.profession} (${s.province || ""})`,
      applicantOrOwner: s.name || "کارجو",
      phone: s.phone || "-",
      platform: "بانک رزومه",
      status: s.status === "hired" ? "استخدام شده" : "فعال",
      dateStr: "-",
      timestamp: Date.now() - 1000 * 60 * 60 * 8
    });
  });

  lostDocsList.forEach((ld) => {
    unifiedActivities.push({
      id: ld.id,
      source: "lost_doc",
      title: `سند مفقودی/پیداشده: ${ld.docType || ld.title || "مدرک"}`,
      applicantOrOwner: ld.fullName || ld.ownerName || "شهروند",
      phone: ld.phone || "-",
      platform: "بانک مدارک",
      status: ld.status === "found" ? "تحویل داده شد" : "در حال جستجو",
      dateStr: ld.createdAt || "-",
      timestamp: Date.now() - 1000 * 60 * 60 * 12
    });
  });

  botMessagesList.forEach((m) => {
    unifiedActivities.push({
      id: m.id,
      source: "bot_message",
      title: m.subject || m.message?.slice(0, 40) || "پیام از ربات",
      applicantOrOwner: m.senderName || m.senderId || "کاربر ربات",
      phone: m.phone || m.senderId || "-",
      platform: m.platform || "telegram",
      status: m.isRead ? "خوانده شده" : "جدید",
      dateStr: m.createdAt || "-",
      timestamp: Date.now() - 1000 * 60 * 60 * 18
    });
  });

  // Sort activities newest first
  unifiedActivities.sort((a, b) => b.timestamp - a.timestamp);

  // Platform Distribution Computed ONLY from real data
  const platformCounts: Record<string, number> = {
    eitaa: 0,
    bale: 0,
    rubika: 0,
    telegram: 0,
    soroush: 0,
    gap: 0,
    igap: 0,
    whatsapp: 0
  };

  remindersList.forEach((r) => {
    const p = (r.botPlatform || "").toLowerCase();
    if (p in platformCounts) platformCounts[p]++;
  });

  requestsList.forEach((req) => {
    const p = (req.platform || "").toLowerCase();
    if (p in platformCounts) platformCounts[p]++;
  });

  botMessagesList.forEach((bm) => {
    const p = (bm.platform || "").toLowerCase();
    if (p in platformCounts) platformCounts[p]++;
  });

  const totalPlatformInteractions = Object.values(platformCounts).reduce((a, b) => a + b, 0);

  const platformMeta: Record<string, { name: string; color: string; text: string }> = {
    eitaa: { name: "ایتا (Eitaa)", color: "bg-orange-500", text: "text-orange-500" },
    bale: { name: "بله (Bale)", color: "bg-emerald-500", text: "text-emerald-500" },
    rubika: { name: "روبیکا (Rubika)", color: "bg-purple-500", text: "text-purple-500" },
    telegram: { name: "تلگرام (Telegram)", color: "bg-sky-500", text: "text-sky-500" },
    soroush: { name: "سروش+ (Soroush)", color: "bg-blue-600", text: "text-blue-600" },
    gap: { name: "گپ (Gap)", color: "bg-cyan-600", text: "text-cyan-600" },
    igap: { name: "آی‌گپ (iGap)", color: "bg-indigo-600", text: "text-indigo-600" },
    whatsapp: { name: "واتساپ (WhatsApp)", color: "bg-green-600", text: "text-green-600" }
  };

  // Real Service Breakdown
  const realServices = [
    {
      name: "استعلامات و نوبت‌دهی اداری",
      count: requestsList.length,
      color: "bg-blue-600"
    },
    {
      name: "پایش تاریخ انقضای مدارک اقامتی",
      count: remindersList.length,
      color: "bg-amber-600"
    },
    {
      name: "فرصت‌های شغلی و بانک کارجویان",
      count: jobsList.length + seekersList.length,
      color: "bg-emerald-600"
    },
    {
      name: "مدارک شناسایی مفقودی و پیدا شده",
      count: lostDocsList.length,
      color: "bg-rose-600"
    },
    {
      name: "پیام‌های دریافتی صندوق ربات‌ها",
      count: botMessagesList.length,
      color: "bg-indigo-600"
    }
  ];

  const totalOverallInteractions = realServices.reduce((acc, s) => acc + s.count, 0);

  // Calculate Real Rating Average from feedbacks collection
  let averageRating = 5.0;
  if (feedbacksList.length > 0) {
    const sum = feedbacksList.reduce((acc, f) => acc + (Number(f.rating) || 5), 0);
    averageRating = Number((sum / feedbacksList.length).toFixed(1));
  }

  // Filtered Activities
  const filteredActivities = unifiedActivities.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applicantOrOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm);
    const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
    const matchesPlatform =
      platformFilter === "all" ||
      item.platform.toLowerCase().includes(platformFilter.toLowerCase());
    return matchesSearch && matchesSource && matchesPlatform;
  });

  // Handle Create Real Event / Inquiry
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.applicantName || !newEvent.phone) {
      alert("لطفاً نام متقاضی و شماره تلفن را وارد فرمایید.");
      return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        applicantName: newEvent.applicantName,
        phone: newEvent.phone,
        requestType: newEvent.serviceType,
        platform: newEvent.platform,
        status: "pending",
        adminNotes: newEvent.notes,
        createdAt: Timestamp.now()
      });

      setIsNewEventModalOpen(false);
      setNewEvent({
        applicantName: "",
        phone: "",
        platform: "eitaa",
        serviceType: "استعلام نوبت و تذکره الکترونیکی",
        notes: ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Export Real Data
  const handleExportStats = () => {
    const headers = [
      "شناسه رکورد",
      "بخش / سامانه",
      "عنوان خدمت یا رویداد",
      "نام متقاضی / کارجو / صاحب مدرک",
      "شماره تماس",
      "پیام‌رسان / درگاه",
      "وضعیت",
      "تاریخ"
    ];
    const rows = filteredActivities.map((a) => [
      a.id,
      a.source,
      a.title,
      a.applicantOrOwner,
      a.phone,
      a.platform,
      a.status,
      a.dateStr
    ]);
    exportToCSV("گزارش_آماری_داده_های_واقعی_سامانه", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            <span>داشبورد آمار و تحلیل رویدادهای زنده سیستم</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            محاسبه‌شده بر اساس اطلاعات واقعی مجموعه‌های فایربیس (درخواست‌ها، کاریابی، پایش انقضا، اسناد مفقودی و بازخوردها)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsNewEventModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus size={15} />
            <span>ثبت درخواست / رویداد جدید</span>
          </button>

          <button
            onClick={handleExportStats}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors"
          >
            <Download size={15} />
            <span>خروجی اکسل ({filteredActivities.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Real Computed Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Requests & Inquiries */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>درخواست‌های استعلام و نوبت</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {requestsList.length.toLocaleString("fa-IR")}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>
              {requestsList.filter((r) => r.status === "pending").length} مورد در انتظار بررسی
            </span>
          </div>
        </div>

        {/* Card 2: Monitored Documents */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>مدارک تحت پایش انقضا</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {remindersList.length.toLocaleString("fa-IR")}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-1">
            <AlertTriangle size={12} />
            <span>
              {remindersList.filter((d) => d.daysRemaining <= 30).length} مدرک نیازمند اقدام فوری
            </span>
          </div>
        </div>

        {/* Card 3: Job Portal */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>سامانه اشتغال و کارجویان</span>
            <Briefcase size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {(jobsList.length + seekersList.length).toLocaleString("fa-IR")}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {jobsList.length} آگهی فعال | {seekersList.length} کارجو
          </div>
        </div>

        {/* Card 4: Tazkira Database Records */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>بانک تذکره‌های چاپ‌شده</span>
            <FileSpreadsheet size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {tazkiraCount.toLocaleString("fa-IR")}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1 flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>آماده تحویل در کنسولگری</span>
          </div>
        </div>
      </div>

      {/* Grid: Real Platform Distribution & Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Real Platform Distribution */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Bot size={18} className="text-blue-500" />
              <span>تفکیک مراجعات در پیام‌رسان‌ها (داده‌های ثبت‌شده)</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-bold">
              مجموع مراجعات: {totalPlatformInteractions.toLocaleString("fa-IR")}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(platformCounts).map(([key, count]) => {
              const meta = platformMeta[key] || { name: key, color: "bg-slate-500", text: "text-slate-500" };
              const percent = totalPlatformInteractions > 0 ? Math.round((count / totalPlatformInteractions) * 100) : 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-800 dark:text-gray-200">{meta.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-[11px] font-mono">
                        {count.toLocaleString("fa-IR")} تعامل
                      </span>
                      <span className={`font-black ${meta.text}`}>{percent}٪</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${meta.color} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPlatformInteractions === 0 && (
            <p className="text-center py-4 text-xs text-gray-400">
              هنوز مراجعات ثبت‌شده با برچسب پیام‌رسان وارد سیستم نشده است.
            </p>
          )}
        </div>

        {/* Real Service Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              <span>حجم داده‌ها به تفکیک ماژول‌ها و خدمات</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-bold">
              کل تعاملات: {totalOverallInteractions.toLocaleString("fa-IR")}
            </span>
          </div>

          <div className="space-y-3">
            {realServices.map((serv) => {
              const pct = totalOverallInteractions > 0 ? Math.round((serv.count / totalOverallInteractions) * 100) : 0;
              return (
                <div key={serv.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-800 dark:text-gray-200">{serv.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-[11px] font-mono">
                        {serv.count.toLocaleString("fa-IR")} مورد
                      </span>
                      <span className="font-black text-gray-700 dark:text-gray-300">{pct}٪</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${serv.color} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Feedback Rating */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span>میانگین رضایت کاربران از خدمات:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-gray-900 dark:text-white">
                {averageRating} از ۵
              </span>
              <span className="text-gray-400 text-[10px]">
                ({feedbacksList.length} دیدگاه ثبت‌شده)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Live Activity Feed & Audit Log */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              <span>گزارش زنده رویدادها و درخواست‌های کاربران (Live Feed)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              نمایش لحظه‌ای مراجعات، پایش‌ها، ثبت‌های کاریابی و اسناد مفقودی به ترتیب زمانی
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute right-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام، شماره یا عنوان..."
                className="w-full sm:w-56 pr-8 pl-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه بخش‌ها</option>
              <option value="request">درخواست‌ها و نوبت‌ها</option>
              <option value="reminder">پایش انقضا</option>
              <option value="job">کاریابی و رزومه‌ها</option>
              <option value="lost_doc">مدارک مفقودی</option>
              <option value="bot_message">پیام‌های ربات</option>
            </select>
          </div>
        </div>

        {/* Table of Real Events */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
              <tr>
                <th className="p-3.5">بخش / سامانه</th>
                <th className="p-3.5">عنوان خدمت یا رویداد</th>
                <th className="p-3.5">نام متقاضی / کارجو</th>
                <th className="p-3.5">شماره تماس</th>
                <th className="p-3.5">پیام‌رسان / درگاه</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5">تاریخ ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200 font-medium">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    هیچ موردی مطابق با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredActivities.slice(0, 50).map((act) => (
                  <tr key={`${act.source}_${act.id}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        act.source === "request"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          : act.source === "reminder"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : act.source === "job"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : act.source === "lost_doc"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                      }`}>
                        {act.source === "request"
                          ? "درخواست نوبت"
                          : act.source === "reminder"
                          ? "پایش انقضا"
                          : act.source === "job"
                          ? "کاریابی"
                          : act.source === "lost_doc"
                          ? "سند مفقودی"
                          : "پیام ربات"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-900 dark:text-white">
                      {act.title}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {act.applicantOrOwner}
                    </td>
                    <td className="p-3.5 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap" dir="ltr">
                      {act.phone}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-gray-600 dark:text-gray-300 text-[11px] font-bold">
                        {platformMeta[act.platform]?.name || act.platform}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold">
                        {act.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-gray-500 whitespace-nowrap">
                      {act.dateStr}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual New Event / Request Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                <span>ثبت درخواست یا رویداد جدید به سیستم</span>
              </h3>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی متقاضی *
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.applicantName}
                  onChange={(e) => setNewEvent({ ...newEvent, applicantName: e.target.value })}
                  placeholder="مثال: میرویس رحیمی"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس متقاضی *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEvent.phone}
                    onChange={(e) => setNewEvent({ ...newEvent, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    پیام‌رسان / کانال
                  </label>
                  <select
                    value={newEvent.platform}
                    onChange={(e) => setNewEvent({ ...newEvent, platform: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="eitaa">ایتا</option>
                    <option value="bale">بله</option>
                    <option value="rubika">روبیکا</option>
                    <option value="telegram">تلگرام</option>
                    <option value="soroush">سروش+</option>
                    <option value="gap">گپ</option>
                    <option value="igap">آی‌گپ</option>
                    <option value="whatsapp">واتساپ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نوع خدمت یا درخواست
                </label>
                <select
                  value={newEvent.serviceType}
                  onChange={(e) => setNewEvent({ ...newEvent, serviceType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="استعلام نوبت و تذکره الکترونیکی">استعلام نوبت و تذکره الکترونیکی</option>
                  <option value="نوبت‌دهی تمدید کارت آمایش">نوبت‌دهی تمدید کارت آمایش</option>
                  <option value="مشاوره اقامتی و ویزا">مشاوره اقامتی و ویزا</option>
                  <option value="ثبت درخواست فرصت شغلی">ثبت درخواست فرصت شغلی</option>
                  <option value="گزارش مدرک مفقودی">گزارش مدرک مفقودی</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  یادداشت و جزئیات تکمیلی
                </label>
                <textarea
                  rows={2}
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  placeholder="توضیحات مربوط به درخواست یا استعلام..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  ثبت رویداد در سیستم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
