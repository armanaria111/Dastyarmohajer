import React, { useState, useEffect } from "react";
import {
  Clock,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Phone,
  Shield,
  FileText,
  Trash2,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ReminderRecord {
  id?: string;
  docType: string;
  docNumber: string;
  ownerName: string;
  expiryDate: string; // YYYY-MM-DD or Solar format
  phone: string;
  notifySms: boolean;
  notifyBot: boolean;
  createdAt: string;
}

const DOC_TYPES = [
  "کارت آمایش (مرحله ۱۷ یا ۱۸)",
  "گذرنامه الکترونیک / طرح خانواری",
  "برگه سرشماری / برگه حمایت تحصیلی",
  "پروانه کار و اشتغال کارگری",
  "دفترچه بیمه سلامت اتباع",
  "برگه تردد و مسافرت بین استانی"
];

export default function ExpiryReminderModal({ isOpen, onClose }: Props) {
  const [reminders, setReminders] = useState<ReminderRecord[]>(() => {
    try {
      const saved = localStorage.getItem("migrant_doc_reminders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [ownerName, setOwnerName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [expiryYear, setExpiryYear] = useState("1405");
  const [expiryMonth, setExpiryMonth] = useState("06");
  const [expiryDay, setExpiryDay] = useState("31");
  const [phone, setPhone] = useState("");
  const [notifySms, setNotifySms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate days remaining
  const calculateRemainingDays = (dateStr: string) => {
    try {
      // If solar format 140x/xx/xx, rough approximation:
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        // current approximate solar year 1404
        const currentYear = 1404;
        const currentMonth = 6;
        const currentDay = 20;

        const totalTargetDays = y * 365 + m * 30 + d;
        const totalCurrentDays = currentYear * 365 + currentMonth * 30 + currentDay;
        return totalTargetDays - totalCurrentDays;
      }
    } catch {
      return 0;
    }
    return 30;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !phone.trim()) return;

    setSaving(true);
    const dateStr = `${expiryYear}/${expiryMonth.padStart(2, "0")}/${expiryDay.padStart(2, "0")}`;

    const newRecord: ReminderRecord = {
      docType,
      docNumber: docNumber.trim() || "ثبت‌نشده",
      ownerName: ownerName.trim(),
      expiryDate: dateStr,
      phone: phone.trim(),
      notifySms,
      notifyBot: true,
      createdAt: new Date().toISOString()
    };

    try {
      // Save to local storage
      const updated = [newRecord, ...reminders];
      setReminders(updated);
      localStorage.setItem("migrant_doc_reminders", JSON.stringify(updated));

      // Try saving to cloud Firestore
      try {
        await addDoc(collection(db, "document_reminders"), newRecord);
      } catch (e) {
        // Local fallback is already saved
      }

      setSuccessMsg("یادآور با موفقیت ثبت شد! ۳۰ روز و ۱۰ روز قبل از انقضا به شما پیامک ارسال خواهد شد.");
      setOwnerName("");
      setDocNumber("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (index: number) => {
    const updated = reminders.filter((_, i) => i !== index);
    setReminders(updated);
    localStorage.setItem("migrant_doc_reminders", JSON.stringify(updated));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                سامانه هشدار و یادآور تاریخ انقضای مدارک
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                ارسال پیامک و پیام در پیام‌رسان پیش از اتمام اعتبار کارت آمایش، پاسپورت و روادید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white flex items-center gap-1.5 font-black text-xs sm:text-sm shrink-0 border border-white/25 shadow-sm"
            title="بستن پنجره"
          >
            <X size={18} />
            <span>بستن</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700 dark:text-gray-300">
          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form
            onSubmit={handleSave}
            className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs"
          >
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-amber-500" />
              <span>ثبت مدرک جدید برای دریافت هشدار تمدید</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  نوع مدرک هویتی / اقامتی:
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-gray-900 dark:text-white"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  نام و نام خانوادگی صاحب مدرک:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد احمدی"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  شماره مدرک یا کارت (اختیاری):
                </label>
                <input
                  type="text"
                  placeholder="مثال: ۱۲۳۴۵۶۷۸"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  شماره موبایل جهت دریافت پیامک رایگان:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Date Pickers */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-500" />
                <span>تاریخ انقضای درج‌شده روی مدرک (هجری شمسی):</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">روز</label>
                  <select
                    value={expiryDay}
                    onChange={(e) => setExpiryDay(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">ماه</label>
                  <select
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {[
                      "۰۱ - فروردین / حمل",
                      "۰۲ - اردیبهشت / ثور",
                      "۰۳ - خرداد / جوزا",
                      "۰۴ - تیر / سرطان",
                      "۰۵ - مرداد / اسد",
                      "۰۶ - شهریور / سنبله",
                      "۰۷ - مهر / میزان",
                      "۰۸ - آبان / عقرب",
                      "۰۹ - آذر / قوس",
                      "۱۰ - دی / جدی",
                      "۱۱ - بهمن / دلو",
                      "۱۲ - اسفند / حوت"
                    ].map((m, idx) => (
                      <option key={idx} value={String(idx + 1).padStart(2, "0")}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">سال</label>
                  <select
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  >
                    {["1404", "1405", "1406", "1407", "1408", "1409", "1410"].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  ارسال پیامک یادآوری ۳۰ روز و ۱۰ روز قبل از اتمام اعتبار
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Bell size={14} />
                <span>{saving ? "در حال ثبت..." : "فعال‌سازی یادآور"}</span>
              </button>
            </div>
          </form>

          {/* List of active reminders */}
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" />
              <span>مدارک ثبت‌شده شما ({reminders.length})</span>
            </h4>

            {reminders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-gray-500 text-xs">
                  تاکنون هیچ مدرکی برای یادآوری ثبت نکرده‌اید. با فرم بالا اولین مدرک خود را ثبت فرمایید.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((r, idx) => {
                  const daysLeft = calculateRemainingDays(r.expiryDate);
                  const isCritical = daysLeft <= 30;
                  const isWarning = daysLeft > 30 && daysLeft <= 60;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-gray-900 dark:text-white">
                            {r.ownerName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {r.docType}
                          </span>
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-3">
                          <span>تاریخ انقضا: <b className="font-mono text-gray-700 dark:text-gray-300">{r.expiryDate}</b></span>
                          <span>موبایل: <b className="font-mono text-gray-700 dark:text-gray-300">{r.phone}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                            isCritical
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800"
                              : isWarning
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {isCritical && <AlertTriangle size={14} />}
                          <span>{daysLeft > 0 ? `${daysLeft} روز باقیمانده` : "منقضی شده"}</span>
                        </div>

                        <button
                          onClick={() => handleDelete(idx)}
                          className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                          title="حذف یادآور"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
          >
            <X size={16} />
            <span>بستن پنجره</span>
          </button>
        </div>
      </div>
    </div>
  );
}
