import React, { useState } from "react";
import {
  Clock,
  AlertTriangle,
  Send,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  Bot,
  ShieldAlert,
  Calendar,
  Phone,
  Sparkles,
  RefreshCw,
  Info
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

interface MonitoredDocument {
  id: string;
  ownerName: string;
  docType: string;
  docNumber: string;
  phone: string;
  botPlatform: "eitaa" | "bale" | "rubika" | "telegram" | "soroush";
  botChatId: string;
  expiryDate: string; // Solar YYYY/MM/DD
  status: "active" | "notified" | "renewed";
  lastNotifiedAt?: string;
  daysRemaining: number;
}

const INITIAL_DOCS: MonitoredDocument[] = [
  {
    id: "EXP-101",
    ownerName: "غلام‌رسول احمدی",
    docType: "کارت آمایش (مرحله ۱۸)",
    docNumber: "AM-98765432",
    phone: "09123456789",
    botPlatform: "eitaa",
    botChatId: "eitaa_user_8821",
    expiryDate: "۱۴۰۴/۰۷/۱۰",
    status: "active",
    daysRemaining: 14
  },
  {
    id: "EXP-102",
    ownerName: "فاطمه رضایی",
    docType: "گذرنامه الکترونیک / ویزا",
    docNumber: "P-45678901",
    phone: "09351234567",
    botPlatform: "rubika",
    botChatId: "rubika_user_9912",
    expiryDate: "۱۴۰۴/۰۶/۲۸",
    status: "notified",
    lastNotifiedAt: "۱۴۰۴/۰۶/۱۵ (در ربات روبیکا)",
    daysRemaining: 2
  },
  {
    id: "EXP-103",
    ownerName: "عبدالواحد حسینی",
    docType: "پروانه کار و اشتغال",
    docNumber: "WK-11223344",
    phone: "09197778899",
    botPlatform: "bale",
    botChatId: "bale_chat_3311",
    expiryDate: "۱۴۰۴/۰۶/۱۵",
    status: "active",
    daysRemaining: -1
  },
  {
    id: "EXP-104",
    ownerName: "میرویس صادقی",
    docType: "برگه حمایت تحصیلی و سرشماری",
    docNumber: "EDU-556677",
    phone: "09159988776",
    botPlatform: "telegram",
    botChatId: "@mirwais_sd",
    expiryDate: "۱۴۰۴/۰۷/۲۵",
    status: "active",
    daysRemaining: 29
  },
  {
    id: "EXP-105",
    ownerName: "سید محمد هاشمی",
    docType: "کارت آمایش (مرحله ۱۸)",
    docNumber: "AM-77665544",
    phone: "09901122334",
    botPlatform: "eitaa",
    botChatId: "eitaa_user_1104",
    expiryDate: "۱۴۰۴/۰۹/۳۰",
    status: "active",
    daysRemaining: 95
  }
];

export default function ExpiryReminders() {
  const [docs, setDocs] = useState<MonitoredDocument[]>(INITIAL_DOCS);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "critical" | "warning" | "expired">("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Filter documents
  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.ownerName.includes(searchTerm) ||
      d.docNumber.includes(searchTerm) ||
      d.phone.includes(searchTerm) ||
      d.docType.includes(searchTerm);

    const matchesPlatform = platformFilter === "all" || d.botPlatform === platformFilter;

    let matchesUrgency = true;
    if (urgencyFilter === "critical") matchesUrgency = d.daysRemaining > 0 && d.daysRemaining <= 30;
    if (urgencyFilter === "warning") matchesUrgency = d.daysRemaining > 30 && d.daysRemaining <= 60;
    if (urgencyFilter === "expired") matchesUrgency = d.daysRemaining <= 0;

    return matchesSearch && matchesPlatform && matchesUrgency;
  });

  // Send FREE bot notification to single user
  const handleSendBotNotification = (docItem: MonitoredDocument) => {
    setSendingId(docItem.id);
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((item) =>
          item.id === docItem.id
            ? {
                ...item,
                status: "notified",
                lastNotifiedAt: `امروز در پیام‌رسان ${getPlatformName(item.botPlatform)}`
              }
            : item
        )
      );
      setSendingId(null);
      setAlertMessage(`پیام یادآوری با موفقیت و کاملاً رایگان در ربات ${getPlatformName(docItem.botPlatform)} به ${docItem.ownerName} ارسال شد.`);
      setTimeout(() => setAlertMessage(null), 4000);
    }, 800);
  };

  // Batch send to all critical documents (< 30 days) via BOT (Free!)
  const handleBatchSendCritical = () => {
    const criticalList = docs.filter((d) => d.daysRemaining <= 30);
    if (criticalList.length === 0) {
      alert("هیچ مدرکی در آستانه انقضا (زیر ۳۰ روز) جهت ارسال پیام وجود ندارد.");
      return;
    }

    if (
      !confirm(
        `آیا مایلید برای ${criticalList.length} نفر از کاربرانی که کمتر از ۳۰ روز تا اتمام مدرکشان مانده، پیام هشدار رایگان در ربات ارسال فرمایید؟\n(توجه: این ارسال از طریق وب‌هوک ربات‌ها انجام شده و هیچ هزینه‌ای برای پیامک ندارد)`
      )
    ) {
      return;
    }

    setBatchSending(true);
    setTimeout(() => {
      setDocs((prev) =>
        prev.map((item) =>
          item.daysRemaining <= 30
            ? {
                ...item,
                status: "notified",
                lastNotifiedAt: `امروز به صورت گروهی در ربات ${getPlatformName(item.botPlatform)}`
              }
            : item
        )
      );
      setBatchSending(false);
      setAlertMessage(`هشدار گروهی برای ${criticalList.length} نفر در بستر ربات‌های پیام‌رسان ارسال شد (هزینه پیامک: صفر ریال).`);
      setTimeout(() => setAlertMessage(null), 5000);
    }, 1500);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این پرونده یادآور اطمینان دارید؟")) {
      setDocs(docs.filter((d) => d.id !== id));
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "eitaa":
        return "ایتا";
      case "bale":
        return "بله";
      case "rubika":
        return "روبیکا";
      case "telegram":
        return "تلگرام";
      case "soroush":
        return "سروش+";
      default:
        return platform;
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "کد پرونده",
      "نام و نام خانوادگی",
      "نوع مدرک",
      "شماره مدرک",
      "شماره تماس",
      "پیام‌رسان ربات",
      "شناسه ربات",
      "تاریخ انقضا",
      "روزهای باقیمانده",
      "وضعیت اطلاع‌رسانی",
      "آخرین ارسال"
    ];
    const rows = filteredDocs.map((d) => [
      d.id,
      d.ownerName,
      d.docType,
      d.docNumber,
      d.phone,
      getPlatformName(d.botPlatform),
      d.botChatId,
      d.expiryDate,
      d.daysRemaining > 0 ? `${d.daysRemaining} روز` : "منقضی شده",
      d.status === "notified" ? "پیام ارسال شد" : "در انتظار ارسال",
      d.lastNotifiedAt || "تاکنون ارسال نشده"
    ]);
    exportToCSV("لیست_مدارک_در_آستانه_انقضا_اتباع", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Clock className="text-amber-500" size={24} />
            <span>میز کار یادآورهای انقضای مدارک (ارسال رایگان در ربات)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            پایش سررسید کارت آمایش، گذرنامه و پروانه کار با امکان ارسال مستقیم پیام هشدار به پی‌وی ربات کاربران بدون هزینه پیامک
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی اکسل (CSV)</span>
          </button>

          <button
            onClick={handleBatchSendCritical}
            disabled={batchSending}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {batchSending ? <RefreshCw className="animate-spin" size={16} /> : <Bot size={16} />}
            <span>ارسال پیام گروهی در ربات (زیر ۳۰ روز)</span>
          </button>
        </div>
      </div>

      {/* Free Notice Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-start gap-3">
        <Info className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
          <p className="font-bold">
            صرفه‌جویی ۱۰۰٪ در هزینه‌ها: ارسال از طریق پیام‌رسان‌های داخلی و تلگرام
          </p>
          <p className="text-emerald-800 dark:text-emerald-300/80 leading-relaxed text-[11px]">
            با توجه به اینکه مراجعین هزینه‌ای برای خدمات پرداخت نمی‌کنند، تمام هشدارهای انقضا به صورت رایگان از طریق ربات‌های ایتا، بله، روبیکا یا تلگرام به پی‌وی کاربر ارسال می‌شوند و هیچ شارژ یا تعرفه پیامکی مصرف نخواهد شد.
          </p>
        </div>
      </div>

      {/* Alert toast */}
      {alertMessage && (
        <div className="p-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-gray-400 text-xs font-bold">کل مدارک پایش شده</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{docs.length}</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs">
          <div className="text-rose-600 dark:text-rose-400 text-xs font-bold">منقضی شده</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {docs.filter((d) => d.daysRemaining <= 0).length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <div className="text-amber-600 dark:text-amber-400 text-xs font-bold">بحرانی (زیر ۳۰ روز)</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {docs.filter((d) => d.daysRemaining > 0 && d.daysRemaining <= 30).length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">هشدار ارسال شده در ربات</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {docs.filter((d) => d.status === "notified").length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، شماره مدرک یا موبایل..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">تمام وضعیت‌های مهلت</option>
            <option value="expired">فقط منقضی شده‌ها</option>
            <option value="critical">بحرانی (زیر ۳۰ روز)</option>
            <option value="warning">هشدار (۳۰ تا ۶۰ روز)</option>
          </select>
        </div>

        <div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه پیام‌رسان‌ها</option>
            <option value="eitaa">ایتا</option>
            <option value="bale">بله</option>
            <option value="rubika">روبیکا</option>
            <option value="telegram">تلگرام</option>
            <option value="soroush">سروش+</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
              <tr>
                <th className="p-3.5">مشخصات صاحب مدرک</th>
                <th className="p-3.5">نوع و شماره مدرک</th>
                <th className="p-3.5">ربات دریافت‌کننده</th>
                <th className="p-3.5">تاریخ انقضا و مهلت</th>
                <th className="p-3.5">وضعیت ارسال هشدار</th>
                <th className="p-3.5 text-center">ارسال رایگان در ربات</th>
                <th className="p-3.5 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200 font-medium">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    موردی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((docItem) => {
                  const isCritical = docItem.daysRemaining > 0 && docItem.daysRemaining <= 30;
                  const isExpired = docItem.daysRemaining <= 0;

                  return (
                    <tr key={docItem.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-black text-sm text-gray-900 dark:text-white">{docItem.ownerName}</div>
                        <div className="text-gray-400 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                          <Phone size={11} className="text-blue-500" />
                          <span>{docItem.phone}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold">{docItem.docType}</div>
                        <div className="text-gray-400 font-mono text-[11px] mt-0.5">{docItem.docNumber}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-black inline-flex items-center gap-1">
                          <Bot size={13} />
                          <span>{getPlatformName(docItem.botPlatform)}</span>
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{docItem.botChatId}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-800 dark:text-gray-200">{docItem.expiryDate}</div>
                        <div className="mt-1">
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-black flex items-center gap-1 w-fit">
                              <ShieldAlert size={11} />
                              <span>منقضی شده ({Math.abs(docItem.daysRemaining)} روز گذشته)</span>
                            </span>
                          ) : isCritical ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-black flex items-center gap-1 w-fit">
                              <AlertTriangle size={11} />
                              <span>فقط {docItem.daysRemaining} روز مانده</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1 w-fit">
                              <span>{docItem.daysRemaining} روز مانده</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {docItem.status === "notified" ? (
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 size={13} />
                              <span>پیام ارسال شد</span>
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5">{docItem.lastNotifiedAt}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">در صف ارسال</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleSendBotNotification(docItem)}
                          disabled={sendingId === docItem.id}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 font-black text-xs inline-flex items-center gap-1.5 transition-all border border-blue-200 dark:border-blue-700 disabled:opacity-50"
                        >
                          {sendingId === docItem.id ? (
                            <RefreshCw className="animate-spin" size={13} />
                          ) : (
                            <Send size={13} />
                          )}
                          <span>ارسال هشدار</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(docItem.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="حذف رکورد"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
