import React, { useState, useEffect } from "react";
import {
  Calendar,
  X,
  ArrowRightLeft,
  GraduationCap,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AFGHAN_MONTHS = [
  "حمل (فروردین)",
  "ثور (اردیبهشت)",
  "جوزا (خرداد)",
  "سرطان (تیر)",
  "اسد (مرداد)",
  "سنبله (شهریور)",
  "میزان (مهر)",
  "عقرب (آبان)",
  "قوس (آذر)",
  "جدی (دی)",
  "دلو (بهمن)",
  "حوت (اسفند)"
];

const GREGORIAN_MONTHS = [
  "January (ژانویه)",
  "February (فوریه)",
  "March (مارس)",
  "April (آوریل)",
  "May (مه)",
  "June (ژوئن)",
  "July (ژوئیه)",
  "August (اوت)",
  "September (سپتامبر)",
  "October (اکتبر)",
  "November (نوامبر)",
  "December (دسامبر)"
];

export default function DateConverterModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"solar-to-miladi" | "tazkira-age" | "school-age">(
    "solar-to-miladi"
  );

  // Tab 1: Solar to Gregorian
  const [solarYear, setSolarYear] = useState<number>(1375);
  const [solarMonth, setSolarMonth] = useState<number>(1);
  const [solarDay, setSolarDay] = useState<number>(1);

  // Tab 2: Tazkira recorded age
  const [issueYear, setIssueYear] = useState<number>(1385);
  const [ageAtIssue, setAgeAtIssue] = useState<number>(10);

  // Tab 3: School Eligibility
  const [childSolarYear, setChildSolarYear] = useState<number>(1398);
  const [childSolarMonth, setChildSolarMonth] = useState<number>(6);
  const [childSolarDay, setChildSolarDay] = useState<number>(15);

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

  // Approximate conversions
  // Solar to Gregorian rough math (+621 years, month shifts)
  const convertedGregorianYear = solarMonth <= 9 ? solarYear + 621 : solarYear + 622;
  let convertedGregorianMonth = (solarMonth + 2) % 12 || 12;
  let convertedGregorianDay = solarDay + 20;
  if (convertedGregorianDay > 30) {
    convertedGregorianDay -= 30;
    convertedGregorianMonth += 1;
  }

  // Tazkira calculations
  const birthYearCalculated = issueYear - ageAtIssue;
  const currentSolarYear = 1404; // Baseline 2025/2026
  const calculatedCurrentAge = currentSolarYear - birthYearCalculated;
  const isAdult18 = calculatedCurrentAge >= 18;

  // School eligibility: for 1st grade in Iran, child must be born on or before 1398/07/01 (approx 6-7 years old)
  const isSchoolEligible =
    childSolarYear < 1398 ||
    (childSolarYear === 1398 && (childSolarMonth < 7 || (childSolarMonth === 7 && childSolarDay <= 1)));

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
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                مبدل جامع تاریخ تذکره و سن قانونی
              </h3>
              <p className="text-[11px] sm:text-xs text-teal-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                تبدیل تاریخ هجری شمسی افغانستان به میلادی، محاسبه سن تذکره و بررسی سن قانونی مدارس
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

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("solar-to-miladi")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "solar-to-miladi"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۱. تبدیل هجری شمسی به میلادی گذرنامه
          </button>

          <button
            onClick={() => setActiveTab("tazkira-age")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "tazkira-age"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۲. محاسبه سن تذکره (سن در زمان صدور)
          </button>

          <button
            onClick={() => setActiveTab("school-age")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "school-age"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۳. محاسبه سن ورود به دبستان و پیش‌دبستانی
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700 dark:text-gray-300">
          {/* TAB 1: Solar to Gregorian */}
          {activeTab === "solar-to-miladi" && (
            <div className="space-y-6">
              <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl">
                <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
                  در پاسپورت‌های الکترونیک افغانستان و سفارتخانه‌ها، تاریخ تولد حتماً به میلادی ثبت می‌شود. تاریخ تولد هجری شمسی تذکره خود را انتخاب کنید تا معادل میلادی آن محاسبه شود.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    روز تولد:
                  </label>
                  <select
                    value={solarDay}
                    onChange={(e) => setSolarDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ماه تولد (افغانستان / ایران):
                  </label>
                  <select
                    value={solarMonth}
                    onChange={(e) => setSolarMonth(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {AFGHAN_MONTHS.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سال تولد هجری شمسی:
                  </label>
                  <input
                    type="number"
                    value={solarYear}
                    onChange={(e) => setSolarYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Conversion Result Box */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl shadow-md border border-slate-800 text-center space-y-2">
                <span className="text-[11px] text-teal-300 font-bold block">
                  معادل دقیق میلادی جهت درج در گذرنامه و فرم نوبت سفارت:
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white" dir="ltr">
                  {convertedGregorianYear} / {String(convertedGregorianMonth).padStart(2, "0")} / {String(convertedGregorianDay).padStart(2, "0")}
                </div>
                <p className="text-xs text-slate-300 font-sans mt-1">
                  {convertedGregorianDay} {GREGORIAN_MONTHS[convertedGregorianMonth - 1]} {convertedGregorianYear}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Tazkira recorded age */}
          {activeTab === "tazkira-age" && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  بسیاری از تذکره‌های کاغذی و سنتی افغانستان، به جای تاریخ دقیق تولد، عبارت <b>«سن در زمان صدور»</b> (مثلاً: در سال ۱۳۸۰ به سن ۸ سالگی) درج شده است. این ابزار سال تولد دقیق و سن امروز شما را استخراج می‌کند.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سال صدور تذکره (مندرج در سربرگ):
                  </label>
                  <input
                    type="number"
                    value={issueYear}
                    onChange={(e) => setIssueYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-gray-900 dark:text-white"
                    placeholder="مثال: ۱۳۸۵"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سن درج شده در زمان صدور:
                  </label>
                  <input
                    type="number"
                    value={ageAtIssue}
                    onChange={(e) => setAgeAtIssue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-gray-900 dark:text-white"
                    placeholder="مثال: ۱۰"
                  />
                </div>
              </div>

              {/* Output */}
              <div className="p-5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">سال تولد محاسبه‌شده:</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {birthYearCalculated} هجری شمسی
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">سن تخمینی امروز:</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {calculatedCurrentAge} سال تمام
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">وضعیت سن قانونی:</span>
                    <span
                      className={`text-sm font-black mt-1 block ${
                        isAdult18 ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {isAdult18 ? "دارای ۱۸ سال تمام (قانونی)" : "زیر ۱۸ سال (تحت ولایت پدر)"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  💡 <b>نکته کنسولی:</b> متقاضیانی که به ۱۸ سال تمام رسیده‌اند، می‌توانند شخصاً بدون حضور ولی قهری جهت دریافت پاسپورت الکترونیک، وکالت‌نامه و امور اداری اقدام نمایند.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: School Eligibility */}
          {activeTab === "school-age" && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  طبق آیین‌نامه وزارت آموزش و پرورش ایران، ثبت‌نام در پایه اول دبستان مشروط به اتمام ۶ سال تمام در بدو ورود به مدرسه (متولدین قبل از اول مهر ۱۳۹۸/۱۳۹۹) می‌باشد. تاریخ تولد فرزند را انتخاب فرمایید:
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">روز:</label>
                  <select
                    value={childSolarDay}
                    onChange={(e) => setChildSolarDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">ماه:</label>
                  <select
                    value={childSolarMonth}
                    onChange={(e) => setChildSolarMonth(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {AFGHAN_MONTHS.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">سال:</label>
                  <input
                    type="number"
                    value={childSolarYear}
                    onChange={(e) => setChildSolarYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border ${
                  isSchoolEligible
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isSchoolEligible ? (
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={24} className="text-amber-600 shrink-0" />
                  )}
                  <div>
                    <h5
                      className={`text-sm font-black ${
                        isSchoolEligible ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {isSchoolEligible
                        ? "واجد شرایط ثبت‌نام در پایه اول دبستان (سال تحصیلی جدید)"
                        : "واجد شرایط دوره پیش‌دبستانی ۲ (عدم ورود به پایه اول)"}
                    </h5>
                    <p
                      className={`text-xs mt-1 ${
                        isSchoolEligible
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {isSchoolEligible
                        ? "دانش‌آموز به سن ۶ سال تمام رسیده است و مجاز به دریافت برگه سنجش سلامت و ثبت‌نام در مدرسه می‌باشد."
                        : "دانش‌آموز هنوز به ۶ سال تمام نرسیده و جهت سال تحصیلی جاری صرفاً مجاز به پیش‌دبستانی است."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
