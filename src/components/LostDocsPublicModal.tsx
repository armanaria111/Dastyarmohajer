import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  X,
  MapPin,
  Phone,
  Building2,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { collection, onSnapshot, addDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { PROVINCES_LIST } from "../pages/Broadcast";

interface FoundDoc {
  id: string;
  docType: string;
  ownerName: string;
  docNumber: string;
  province: string;
  city?: string;
  holdingLocation: string;
  contactPhone: string;
  notes?: string;
  status: "available" | "returned";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LostDocsPublicModal({ isOpen, onClose }: Props) {
  const [docs, setDocs] = useState<FoundDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);

  // Report found doc tab/form
  const [showReportForm, setShowReportForm] = useState(false);
  const [repDocType, setRepDocType] = useState("کارت آمایش");
  const [repOwnerName, setRepOwnerName] = useState("");
  const [repDocNumber, setRepDocNumber] = useState("");
  const [repProvince, setRepProvince] = useState("تهران");
  const [repHoldingLocation, setRepHoldingLocation] = useState("");
  const [repContactPhone, setRepContactPhone] = useState("");
  const [repNotes, setRepNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const q = query(collection(db, "found_documents"), limit(80));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as FoundDoc[];
        setDocs(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Error fetching found docs:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDocs = docs.filter((d) => {
    const matchProv = selectedProvince === "all" || d.province === selectedProvince;
    const matchType = selectedType === "all" || d.docType === selectedType;
    const matchQuery =
      !searchQuery.trim() ||
      d.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docNumber?.includes(searchQuery.trim()) ||
      d.holdingLocation?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchProv && matchType && matchQuery;
  });

  const handleReportFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repOwnerName.trim() || !repContactPhone.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "found_documents"), {
        docType: repDocType,
        ownerName: repOwnerName.trim(),
        docNumber: repDocNumber.trim() || "نامشخص",
        province: repProvince,
        holdingLocation: repHoldingLocation.trim() || "تحویل به دفتر/شخصی",
        contactPhone: repContactPhone.trim(),
        notes: repNotes.trim(),
        status: "available",
        createdAt: new Date()
      });
      setSubmitSuccess(true);
      setShowReportForm(false);
      setRepOwnerName("");
      setRepDocNumber("");
      setRepContactPhone("");
      setRepNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                سامانه استعلام و ثبت اسناد و مدارک مفقودی
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                جستجوی کارت‌های آمایش، برگه‌های سرشماری، گذرنامه و مدارک هویتی پیدا شده در دفاتر کفالت
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

        {/* Action button bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام صاحب سند، شماره مدرک یا کد یکتا..."
                className="w-full px-3 py-2 pr-8 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200"
              />
              <Search size={14} className="absolute right-2.5 top-2.5 text-gray-400" />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs text-gray-800 dark:text-gray-200"
            >
              <option value="all">همه انواع مدارک</option>
              <option value="کارت آمایش">کارت آمایش</option>
              <option value="برگه سرشماری">برگه سرشماری</option>
              <option value="گذرنامه">گذرنامه / پاسپورت</option>
              <option value="تذکره">تذکره</option>
              <option value="گواهینامه">گواهینامه</option>
              <option value="کارت بانکی">کارت بانکی</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowReportForm(!showReportForm)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>{showReportForm ? "مشاهده لیست مدارک" : "ثبت مدرک پیدا شده"}</span>
          </button>
        </div>

        {submitSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-300">
            <CheckCircle2 size={16} />
            <span>اطلاعات مدرک پیدا شده با موفقیت ثبت گردید و در سامانه قرار گرفت. با تشکر از امانت‌داری شما.</span>
          </div>
        )}

        {/* Form to Report a Found Document */}
        {showReportForm ? (
          <form onSubmit={handleReportFound} className="p-6 space-y-4 text-xs">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-1">گزارش مدرک پیدا شده:</span>
              <span>
                اگر مدرک هویتی هم‌وطنی را پیدا کرده‌اید، لطفاً مشخصات آن را وارد کنید تا صاحب سند بتواند آن را از شما یا دفتر مربوطه تحویل بگیرد.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">نوع مدرک:</label>
                <select
                  value={repDocType}
                  onChange={(e) => setRepDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="کارت آمایش">کارت آمایش</option>
                  <option value="برگه سرشماری">برگه سرشماری</option>
                  <option value="گذرنامه">گذرنامه / پاسپورت</option>
                  <option value="تذکره">تذکره</option>
                  <option value="گواهینامه">گواهینامه</option>
                  <option value="کارت بانکی">کارت بانکی</option>
                  <option value="سایر">سایر اسناد</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">نام صاحب مدرک:</label>
                <input
                  type="text"
                  required
                  value={repOwnerName}
                  onChange={(e) => setRepOwnerName(e.target.value)}
                  placeholder="نام و نام خانوادگی درج شده"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">شماره مدرک یا کد یکتا:</label>
                <input
                  type="text"
                  value={repDocNumber}
                  onChange={(e) => setRepDocNumber(e.target.value)}
                  placeholder="شماره روی کارت یا برگه"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">استان:</label>
                <select
                  value={repProvince}
                  onChange={(e) => setRepProvince(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {PROVINCES_LIST.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">محل نگهداری فعلی:</label>
                <input
                  type="text"
                  value={repHoldingLocation}
                  onChange={(e) => setRepHoldingLocation(e.target.value)}
                  placeholder="مثال: دفتر کفالت شماره ۱۰۴ یا نزد یابنده"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">شماره تماس جهت تحویل:</label>
                <input
                  type="text"
                  required
                  value={repContactPhone}
                  onChange={(e) => setRepContactPhone(e.target.value)}
                  placeholder="09121234567"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">توضیحات تکمیلی:</label>
              <textarea
                rows={2}
                value={repNotes}
                onChange={(e) => setRepNotes(e.target.value)}
                placeholder="توضیحات درباره محل پیدا شدن و شرایط تحویل..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-300"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-500/20"
              >
                {submitting ? "در حال ثبت..." : "ثبت مدرک در سامانه"}
              </button>
            </div>
          </form>
        ) : (
          /* List of Found Documents */
          <div className="p-6 max-h-[480px] overflow-y-auto space-y-3">
            {loading ? (
              <div className="text-center py-10 text-xs text-gray-400">درحال بارگذاری مدارک پیدا شده...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                مدرکی با این مشخصات یافت نشد. می‌توانید با دکمه بالا آن را ثبت فرمایید.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 transition-all text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                        {doc.docType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                        استان {doc.province}
                      </span>
                      {doc.status === "returned" && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          تحویل داده شده
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      صاحب سند: {doc.ownerName}
                    </h4>

                    {doc.docNumber && doc.docNumber !== "نامشخص" && (
                      <p className="text-gray-500 font-mono text-[11px]" dir="ltr">
                        شماره: {doc.docNumber}
                      </p>
                    )}

                    <p className="text-gray-600 dark:text-gray-400 text-[11px] flex items-center gap-1">
                      <Building2 size={12} className="text-amber-600" />
                      <span>محل تحویل: {doc.holdingLocation}</span>
                    </p>
                  </div>

                  <div className="sm:text-left shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                    <a
                      href={`tel:${doc.contactPhone}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Phone size={13} />
                      <span dir="ltr">{doc.contactPhone}</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
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
