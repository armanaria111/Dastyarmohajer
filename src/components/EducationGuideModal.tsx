import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ChevronDown,
  FileCheck,
  Building
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EducationGuideModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"schools" | "support-paper" | "universities" | "faq">(
    "schools"
  );

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
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                راهنمای جامع ثبت‌نام مدارس و تحصیل اتباع و مهاجرین
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                مراحل دریافت برگه حمایت تحصیلی، کد هدایت تحصیلی، سامانه سهما و ثبت‌نام مدارس
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

        {/* Navigation Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("schools")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "schools"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۱. ثبت‌نام در مدارس دولتی (دارندگان آمایش و پاسپورت)
          </button>
          <button
            onClick={() => setActiveTab("support-paper")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "support-paper"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۲. برگه حمایت تحصیلی (سرشماری‌شدگان و فاقدین مدرک)
          </button>
          <button
            onClick={() => setActiveTab("universities")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "universities"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۳. ادامه تحصیل در دانشگاه‌های ایران
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === "faq"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۴. سوالات متداول و شهریه
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto text-xs space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
          {/* TAB 1 */}
          {activeTab === "schools" && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    حق تحصیل کلیه کودکان در مدارس ایران
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-1">
                    بر اساس فرمان مقام معظم رهبری، هیچ کودک افغانستانی، حتی مهاجرین فاقد مدارک هویتی،
                    نباید از تحصیل بازبماند. ثبت‌نام در مدارس دولتی انجام می‌پذیرد.
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white pt-2">
                مراحل گام‌به‌گام ثبت‌نام در مدارس:
              </h4>

              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ۱
                  </span>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">دریافت کد شناسه ۱۰ رقمی یکتا:</h5>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      دانش‌آموز باید دارای کد یکتا از سازمان ملی مهاجرت باشد (درج شده بر روی کارت آمایش، برگه سرشماری یا کارت هوشمند).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ۲
                  </span>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">نوبت‌گیری و سنجش سلامت نوآموزان:</h5>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      برای ورود به پایه اول ابتدایی، مراجعه به پایگاه‌های سنجش سلامت آموزش و پرورش الزامی است. ثبت‌نام سنجش از طریق سامانه <b>my.medu.ir</b> صورت می‌گیرد.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ۳
                  </span>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">مراجعه به مدرسه با مدارک لازم:</h5>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      مراجعه به مدرسه واقع در محدوده سکونت به همراه: اصل مدارک شناسایی معتبر، پرونده تحصیلی و کارنامه‌های سال قبل، کارت واکسیناسیون و عکس پرسنلی.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 */}
          {activeTab === "support-paper" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <FileCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">
                    برگه حمایت تحصیلی چیست؟
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                    سندی رسمی است که از طرف اداره کل امور اتباع و دفاتر کفالت برای دانش‌آموزانی صادر می‌شود
                    که کارت آمایش یا پاسپورت ندارند تا بتوانند مانند سایر دانش‌آموزان در مدارس ثبت‌نام کنند.
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white pt-2">
                شرایط و مراحل اخذ برگه حمایت تحصیلی:
              </h4>

              <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300">
                <li>ثبت‌نام اولیه در سامانه یکپارچه امور اتباع (سهما) در بازه زمانی اعلامی وزارت کشور.</li>
                <li>مراجعه حضوری به دفتر کفالت مربوطه به همراه دانش‌آموز و سرپرست قانونی.</li>
                <li>ارائه برگه‌های سرشماری قبلی، گواهی تولد نوزاد در ایران یا استشهادیه محلی.</li>
                <li>انجام انگشت‌نگاری و صدور برگه دارای بارکد امنیتی و کد پیگیری.</li>
                <li>تحویل برگه معتبر به مدیر مدرسه جهت درج در سامانه سیدا (SIDA).</li>
              </ul>
            </div>
          )}

          {/* TAB 3 */}
          {activeTab === "universities" && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-start gap-3">
                <Building className="text-purple-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-300">
                    ادامه تحصیل دانشجویان اتباع در دانشگاه‌ها
                  </h4>
                  <p className="text-xs text-purple-800 dark:text-purple-400 mt-1">
                    داوطلبان می‌توانند از طریق کنکور سراسری، پذیرش بر اساس سوابق تحصیلی (بدون کنکور)، یا پردیس‌های بین‌الملل ثبت‌نام نمایند.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    دانشگاه‌های دولتی (روزانه و شبانه)
                  </h5>
                  <p className="text-[11px] text-gray-500">
                    پذیرفته‌شدگان کنکور سراسری در دوره‌های روزانه تا سقف معین از معافیت یا تخفیف شهریه برخوردار هستند. نیازمند تبدیل وضعیت کارت به گذرنامه دانشجویی با روادید تحصیلی.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    دانشگاه آزاد اسلامی و پیام‌نور
                  </h5>
                  <p className="text-[11px] text-gray-500">
                    امکان ثبت‌نام بدون کنکور در رشته‌های مصوب. شهریه معمولاً به صورت ریالی و بر اساس مصوبه هیئت امنای دانشگاه اخذ می‌شود.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4 */}
          {activeTab === "faq" && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                  آیا مدارس دولتی حق دریافت شهریه اجباری دارند؟
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  خیر، تحصیل اتباع در مدارس دولتی همانند دانش‌آموزان ایرانی رایگان است. مبالغی که دریافت می‌شود مربوط به بیمه حوادث دانش‌آموزی، کتاب‌های درسی و مشارکت‌های داوطلبانه انجمن اولیا و مربیان می‌باشد.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                  اگر مدرسه‌ای به دلیل ظرفیت ثبت‌نام نکرد چه باید کرد؟
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  می‌توانید به ستاد ثبت‌نام واقع در اداره آموزش و پرورش منطقه/ناحیه سکونت خود مراجعه فرمایید تا مدرسه جایگزین در همان محدوده مشخص گردد.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                  آیا دانش‌آموز پسر مشمول نظام‌وظیفه می‌شود؟
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  اتباع خارجی مشمول قانون نظام‌وظیفه جمهوری اسلامی ایران نمی‌باشند و پس از اتمام ۱۸ سالگی با گواهی اشتغال به تحصیل یا پاسپورت تمدید اقامت می‌کنند.
                </p>
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
