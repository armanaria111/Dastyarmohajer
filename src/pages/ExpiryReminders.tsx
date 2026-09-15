import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  Send,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Bot,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Phone,
  Sparkles,
  RefreshCw,
  Info,
  Plus,
  X,
  Save
} from "lucide-react";
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { exportToCSV } from "../utils/exportUtils";

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // fallback
  }
};

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

  // New Document Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newDocItem, setNewDocItem] = useState<Partial<MonitoredDocument>>({
    ownerName: "",
    docType: "کارت آمایش (مرحله ۱۸)",
    docNumber: "",
    phone: "",
    botPlatform: "eitaa",
    botChatId: "",
    expiryDate: "۱۴۰۴/۰۸/۰۱",
    daysRemaining: 30,
    status: "active"
  });

  // Edit Document Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocItem, setEditingDocItem] = useState<MonitoredDocument | null>(null);

  // Sync with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "monitored_documents"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MonitoredDocument));
        setDocs(list);
      } else {
        INITIAL_DOCS.forEach((item) => {
          setDoc(doc(db, "monitored_documents", item.id), item).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  const getPlatformName = (platform: MonitoredDocument["botPlatform"]) => {
    switch (platform) {
      case "eitaa": return "ایتا";
      case "bale": return "بله";
      case "rubika": return "روبیکا";
      case "telegram": return "تلگرام";
      case "soroush": return "سروش‌پلاس";
      default: return platform;
    }
  };

  // Filter documents
  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      (d.ownerName || "").includes(searchTerm) ||
      (d.docNumber || "").includes(searchTerm) ||
      (d.phone || "").includes(searchTerm) ||
      (d.docType || "").includes(searchTerm);

    const matchesPlatform = platformFilter === "all" || d.botPlatform === platformFilter;

    let matchesUrgency = true;
    if (urgencyFilter === "critical") matchesUrgency = d.daysRemaining > 0 && d.daysRemaining <= 30;
    if (urgencyFilter === "warning") matchesUrgency = d.daysRemaining > 30 && d.daysRemaining <= 60;
    if (urgencyFilter === "expired") matchesUrgency = d.daysRemaining <= 0;

    return matchesSearch && matchesPlatform && matchesUrgency;
  });

  // Send bot notification
  const handleSendBotNotification = async (docItem: MonitoredDocument) => {
    setSendingId(docItem.id);
    const lastNotifiedAt = `امروز در پیام‌رسان ${getPlatformName(docItem.botPlatform)}`;
    setTimeout(async () => {
      setDocs((prev) =>
        prev.map((item) =>
          item.id === docItem.id
            ? { ...item, status: "notified", lastNotifiedAt }
            : item
        )
      );
      try {
        await updateDoc(doc(db, "monitored_documents", docItem.id), {
          status: "notified",
          lastNotifiedAt
        });
      } catch {
        // fallback
      }
      setSendingId(null);
      setAlertMessage(`هشدار تمدید با موفقیت به شناسه ${docItem.botChatId} در پیام‌رسان ${getPlatformName(docItem.botPlatform)} مخابره شد.`);
      setTimeout(() => setAlertMessage(null), 4000);
    }, 700);
  };

  // Batch send
  const handleBatchSend = () => {
    const urgentItems = docs.filter((d) => d.daysRemaining <= 30 && d.status !== "notified");
    if (urgentItems.length === 0) {
      alert("هیچ مدرک اضطراری بدون هشداری برای ارسال گروهی وجود ندارد.");
      return;
    }

    setBatchSending(true);
    setTimeout(async () => {
      setDocs((prev) =>
        prev.map((item) =>
          item.daysRemaining <= 30
            ? { ...item, status: "notified", lastNotifiedAt: "امروز (ارسال هوشمند گروهی)" }
            : item
        )
      );
      for (const item of urgentItems) {
        try {
          await updateDoc(doc(db, "monitored_documents", item.id), {
            status: "notified",
            lastNotifiedAt: "امروز (ارسال هوشمند گروهی)"
          });
        } catch {
          // continue
        }
      }
      setBatchSending(false);
      setAlertMessage(`عملیات ارسال گروهی پایان یافت: برای ${urgentItems.length} متقاضی هشدار تمدید رایگان در ربات‌ها ارسال شد.`);
      setTimeout(() => setAlertMessage(null), 5000);
    }, 1200);
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این پرونده پایش مدرک اطمینان دارید؟")) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      try {
        await deleteDoc(doc(db, "monitored_documents", id));
      } catch {
        // fallback
      }
    }
  };

  // Add Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocItem.ownerName || !newDocItem.docNumber || !newDocItem.phone) {
      alert("لطفاً نام صاحب مدرک، شماره مدرک و شماره تلفن را وارد فرمایید.");
      return;
    }
    const id = `EXP-${Date.now().toString().slice(-4)}`;
    const created: MonitoredDocument = {
      id,
      ownerName: newDocItem.ownerName || "",
      docType: newDocItem.docType || "کارت آمایش",
      docNumber: newDocItem.docNumber || "",
      phone: newDocItem.phone || "",
      botPlatform: (newDocItem.botPlatform as any) || "eitaa",
      botChatId: newDocItem.botChatId || newDocItem.phone || "",
      expiryDate: newDocItem.expiryDate || "۱۴۰۴/۰۸/۰۱",
      status: "active",
      daysRemaining: Number(newDocItem.daysRemaining) || 30
    };

    setDocs([created, ...docs]);
    setIsNewModalOpen(false);
    setNewDocItem({
      ownerName: "",
      docType: "کارت آمایش (مرحله ۱۸)",
      docNumber: "",
      phone: "",
      botPlatform: "eitaa",
      botChatId: "",
      expiryDate: "۱۴۰۴/۰۸/۰۱",
      daysRemaining: 30,
      status: "active"
    });

    try {
      await setDoc(doc(db, "monitored_documents", id), created);
    } catch {
      // fallback
    }
  };

  // Edit Document
  const handleOpenEdit = (item: MonitoredDocument) => {
    setEditingDocItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocItem) return;

    const updated = docs.map((d) => (d.id === editingDocItem.id ? editingDocItem : d));
    setDocs(updated);
    safeSetItem("admin_monitored_documents", JSON.stringify(updated));
    setIsEditModalOpen(false);

    try {
      await setDoc(doc(db, "monitored_documents", editingDocItem.id), editingDocItem, { merge: true });
    } catch {
      // fallback
    }
    setEditingDocItem(null);
  };

  // Export
  const handleExportCSV = () => {
    const headers = [
      "کد پایش",
      "نام صاحب مدرک",
      "نوع مدرک",
      "شماره مدرک",
      "شماره تماس",
      "پیام‌رسان متصل",
      "شناسه چت در ربات",
      "تاریخ انقضا",
      "روزهای باقی‌مانده",
      "وضعیت اطلاع‌رسانی",
      "آخرین نوتیفیکیشن"
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
      d.daysRemaining,
      d.status === "notified" ? "هشدار ارسال شد" : "در انتظار",
      d.lastNotifiedAt || "-"
    ]);
    exportToCSV("پایش_تاریخ_انقضا_مدارک_اقامتی", headers, rows);
  };

  const criticalCount = docs.filter((d) => d.daysRemaining > 0 && d.daysRemaining <= 30).length;
  const expiredCount = docs.filter((d) => d.daysRemaining <= 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alert toast */}
      {alertMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            <span>پایش انقضای مدارک اقامتی و هشدار خودکار در پیام‌رسان‌ها</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ارسال رایگان پیامک یا نوتیفیکیشن رباتی برای کارت‌های آمایش، تمدید گذرنامه و پروانه کار قبل از اتمام اعتبار
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus size={16} />
            <span>ثبت مدرک و یادآور جدید</span>
          </button>

          <button
            onClick={handleBatchSend}
            disabled={batchSending || criticalCount === 0}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {batchSending ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span>ارسال گروهی هشدارهای فوری ({criticalCount})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs text-gray-400 font-bold">کل مدارک تحت پایش</div>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">{docs.length} پرونده</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 shadow-xs">
          <div className="text-xs text-rose-500 font-bold flex items-center gap-1">
            <ShieldAlert size={14} />
            <span>منقضی شده (نیازمند اقدام فوری)</span>
          </div>
          <div className="text-xl font-black text-rose-600 mt-1">{expiredCount} مدرک</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 shadow-xs">
          <div className="text-xs text-amber-600 font-bold flex items-center gap-1">
            <AlertTriangle size={14} />
            <span>کمتر از ۳۰ روز مانده</span>
          </div>
          <div className="text-xl font-black text-amber-600 mt-1">{criticalCount} پرونده</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 size={14} />
            <span>هشدارهای ارسال‌شده</span>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {docs.filter((d) => d.status === "notified").length} نفر
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، شماره مدرک یا شماره تماس..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">وضعیت انقضا: همه موارد</option>
            <option value="critical">بحرانی (کمتر از ۳۰ روز)</option>
            <option value="warning">هشدار (۳۰ تا ۶۰ روز)</option>
            <option value="expired">منقضی شده</option>
          </select>
        </div>

        <div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">پیام‌رسان: همه پلتفرم‌ها</option>
            <option value="eitaa">ایتا</option>
            <option value="bale">بله</option>
            <option value="rubika">روبیکا</option>
            <option value="telegram">تلگرام</option>
            <option value="soroush">سروش‌پلاس</option>
          </select>
        </div>
      </div>

      {/* Mobile & Tablet Card Layout (Visible on small/medium screens) */}
      <div className="block lg:hidden space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            موردی مطابق با فیلترها یافت نشد.
          </div>
        ) : (
          filteredDocs.map((docItem) => {
            const isCritical = docItem.daysRemaining > 0 && docItem.daysRemaining <= 30;
            const isExpired = docItem.daysRemaining <= 0;

            return (
              <div
                key={`card_${docItem.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-blue-600" />
                      <span>{docItem.ownerName}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {docItem.docType} • <span className="font-mono">{docItem.docNumber}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-black inline-flex items-center gap-1">
                    <Bot size={13} />
                    <span>{getPlatformName(docItem.botPlatform)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="text-gray-400 block text-[10px]">شماره تماس:</span>
                    <span className="font-mono font-bold" dir="ltr">{docItem.phone}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="text-gray-400 block text-[10px]">تاریخ انقضا:</span>
                    <span className="font-mono font-bold">{docItem.expiryDate}</span>
                  </div>
                </div>

                <div>
                  {isExpired ? (
                    <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[11px] font-black flex items-center gap-1 w-fit">
                      <ShieldAlert size={12} />
                      <span>منقضی شده ({Math.abs(docItem.daysRemaining)} روز گذشته)</span>
                    </span>
                  ) : isCritical ? (
                    <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-black flex items-center gap-1 w-fit">
                      <AlertTriangle size={12} />
                      <span>هشدار: فقط {docItem.daysRemaining} روز تا انقضا باقیست</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center gap-1 w-fit">
                      <span>{docItem.daysRemaining} روز معتبر است</span>
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(docItem)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Edit2 size={13} />
                    <span>ویرایش پرونده مدرک</span>
                  </button>

                  <button
                    onClick={() => handleSendBotNotification(docItem)}
                    disabled={sendingId === docItem.id}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Send size={13} />
                    <span>ارسال هشدار</span>
                  </button>

                  <button
                    onClick={() => handleDelete(docItem.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                    title="حذف رکورد"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Table (Visible on Desktop) */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
              <tr>
                <th className="p-3.5">صاحب مدرک و تماس</th>
                <th className="p-3.5">نوع و شماره مدرک</th>
                <th className="p-3.5">پیام‌رسان اطلاع‌رسانی</th>
                <th className="p-3.5">تاریخ انقضا و باقیمانده</th>
                <th className="p-3.5">وضعیت اخطار</th>
                <th className="p-3.5 text-center">ارسال در ربات</th>
                <th className="p-3.5 text-center">عملیات مدیریت</th>
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
                    <tr
                      key={docItem.id}
                      onDoubleClick={() => handleOpenEdit(docItem)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                      title="برای ویرایش سریع دوبار کلیک کنید"
                    >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendBotNotification(docItem);
                          }}
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(docItem);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-black text-xs inline-flex items-center gap-1.5 transition-all border border-blue-200 dark:border-blue-700 shadow-xs"
                            title="ویرایش اطلاعات مدرک"
                          >
                            <Edit2 size={13} />
                            <span>ویرایش مدرک</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(docItem.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="حذف رکورد"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Document Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                <span>ثبت مدرک و یادآور انقضای جدید</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی صاحب مدرک *
                </label>
                <input
                  type="text"
                  required
                  value={newDocItem.ownerName}
                  onChange={(e) => setNewDocItem({ ...newDocItem, ownerName: e.target.value })}
                  placeholder="مثال: غلام‌رسول احمدی"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نوع مدرک</label>
                  <select
                    value={newDocItem.docType}
                    onChange={(e) => setNewDocItem({ ...newDocItem, docType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="کارت آمایش (مرحله ۱۸)">کارت آمایش (مرحله ۱۸)</option>
                    <option value="گذرنامه الکترونیک / ویزا">گذرنامه الکترونیک / ویزا</option>
                    <option value="پروانه کار و اشتغال">پروانه کار و اشتغال</option>
                    <option value="برگه حمایت تحصیلی و سرشماری">برگه حمایت تحصیلی و سرشماری</option>
                    <option value="برگه سرشماری معتبر">برگه سرشماری معتبر</option>
                    <option value="دفترچه اقامت">دفترچه اقامت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره مدرک / پرونده *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocItem.docNumber}
                    onChange={(e) => setNewDocItem({ ...newDocItem, docNumber: e.target.value })}
                    placeholder="AM-12345678"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس همراه *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocItem.phone}
                    onChange={(e) => setNewDocItem({ ...newDocItem, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">پیام‌رسان متصل</label>
                  <select
                    value={newDocItem.botPlatform}
                    onChange={(e) => setNewDocItem({ ...newDocItem, botPlatform: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="eitaa">ایتا</option>
                    <option value="bale">بله</option>
                    <option value="rubika">روبیکا</option>
                    <option value="telegram">تلگرام</option>
                    <option value="soroush">سروش‌پلاس</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شناسه ربات / آیدی چت
                  </label>
                  <input
                    type="text"
                    value={newDocItem.botChatId}
                    onChange={(e) => setNewDocItem({ ...newDocItem, botChatId: e.target.value })}
                    placeholder="@user یا شماره"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">تاریخ انقضا</label>
                  <input
                    type="text"
                    value={newDocItem.expiryDate}
                    onChange={(e) => setNewDocItem({ ...newDocItem, expiryDate: e.target.value })}
                    placeholder="۱۴۰۴/۰۸/۰۱"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  روزهای باقیمانده تا انقضا
                </label>
                <input
                  type="number"
                  value={newDocItem.daysRemaining}
                  onChange={(e) => setNewDocItem({ ...newDocItem, daysRemaining: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  ثبت پرونده پایش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {isEditModalOpen && editingDocItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                <span>ویرایش پرونده پایش مدرک ({editingDocItem.id})</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی صاحب مدرک *
                </label>
                <input
                  type="text"
                  required
                  value={editingDocItem.ownerName}
                  onChange={(e) => setEditingDocItem({ ...editingDocItem, ownerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نوع مدرک</label>
                  <select
                    value={editingDocItem.docType}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, docType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="کارت آمایش (مرحله ۱۸)">کارت آمایش (مرحله ۱۸)</option>
                    <option value="گذرنامه الکترونیک / ویزا">گذرنامه الکترونیک / ویزا</option>
                    <option value="پروانه کار و اشتغال">پروانه کار و اشتغال</option>
                    <option value="برگه حمایت تحصیلی و سرشماری">برگه حمایت تحصیلی و سرشماری</option>
                    <option value="برگه سرشماری معتبر">برگه سرشماری معتبر</option>
                    <option value="دفترچه اقامت">دفترچه اقامت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره مدرک / پرونده *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDocItem.docNumber}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, docNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس همراه *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDocItem.phone}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">پیام‌رسان متصل</label>
                  <select
                    value={editingDocItem.botPlatform}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, botPlatform: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="eitaa">ایتا</option>
                    <option value="bale">بله</option>
                    <option value="rubika">روبیکا</option>
                    <option value="telegram">تلگرام</option>
                    <option value="soroush">سروش‌پلاس</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شناسه ربات / آیدی چت
                  </label>
                  <input
                    type="text"
                    value={editingDocItem.botChatId}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, botChatId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">تاریخ انقضا</label>
                  <input
                    type="text"
                    value={editingDocItem.expiryDate}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    روزهای باقیمانده تا انقضا
                  </label>
                  <input
                    type="number"
                    value={editingDocItem.daysRemaining}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, daysRemaining: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وضعیت اخطار</label>
                  <select
                    value={editingDocItem.status}
                    onChange={(e) => setEditingDocItem({ ...editingDocItem, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">در صف ارسال (فعال)</option>
                    <option value="notified">هشدار ارسال شد</option>
                    <option value="renewed">تمدید شده</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
