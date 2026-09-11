import React, { useState, useEffect } from "react";
import {
  FileText,
  X,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  User,
  Sparkles
} from "lucide-react";

type FormType = "identity" | "power-of-attorney" | "affidavit" | "travel-permit";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsularFormsModal({ isOpen, onClose }: Props) {
  const [activeForm, setActiveForm] = useState<FormType>("identity");

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [surname, setSurname] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [grandFatherName, setGrandFatherName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [province, setProvince] = useState("هرات");
  const [district, setDistrict] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [iranAddress, setIranAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Extra fields for Power of attorney
  const [attorneyName, setAttorneyName] = useState("");
  const [attorneyFather, setAttorneyFather] = useState("");
  const [attorneyTazkira, setAttorneyTazkira] = useState("");
  const [attorneySubject, setAttorneySubject] = useState(
    "فروش و انتقال ملکیت، پیگیری پرونده‌های اداری، اخذ اسناد تحصیلی و تثبیت تذکره در ادارات افغانستان"
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

  const handlePrint = () => {
    window.print();
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
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                فرم‌ساز خودکار اسناد کنسولی و دفاتر کفالت
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                تکمیل سریع مشخصات و صدور فرم‌های رسمی استاندارد با قالب و سربرگ معتبر
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

        {/* Form Selector Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveForm("identity")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeForm === "identity"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۱. فرم درخواست تثبیت هویت و تذکره سفارت
          </button>
          <button
            onClick={() => setActiveForm("power-of-attorney")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeForm === "power-of-attorney"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۲. فرم وکالت‌نامه کاری و اداری
          </button>
          <button
            onClick={() => setActiveForm("affidavit")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeForm === "affidavit"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۳. فرم استشهاد محلی و تایید هویت
          </button>
          <button
            onClick={() => setActiveForm("travel-permit")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeForm === "travel-permit"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            ۴. فرم رضایت‌نامه ولی جهت خروج و سفر
          </button>
        </div>

        {/* Content Layout: Form Inputs on Left / Live Paper Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Inputs Column */}
          <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 space-y-4 max-h-[560px] overflow-y-auto text-xs">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <span>مشخصات متقاضی (شخص اول):</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">نام:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">تخلص (فامیلی):</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="حسینی"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">نام پدر (ولد):</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="غلام‌علی"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">نام پدربزرگ (ولدیت):</label>
                <input
                  type="text"
                  value={grandFatherName}
                  onChange={(e) => setGrandFatherName(e.target.value)}
                  placeholder="محمدحسین"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">ولایت در افغانستان:</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="هرات / کابل / بلخ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">ولسوالی / ناحیه:</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="مرکز / گذره / انجیل"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">شماره مدرک (آمایش/سرشماری/پاسپورت):</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="0123456789"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">شماره تماس در ایران:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09121234567"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            {/* Extra Attorney Fields */}
            {activeForm === "power-of-attorney" && (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2.5">
                <span className="font-bold text-blue-900 dark:text-blue-300 block">مشخصات وکیل:</span>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">نام و تخلص وکیل:</label>
                  <input
                    type="text"
                    value={attorneyName}
                    onChange={(e) => setAttorneyName(e.target.value)}
                    placeholder="نصیر احمد عزیزی"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">نام پدر وکیل:</label>
                    <input
                      type="text"
                      value={attorneyFather}
                      onChange={(e) => setAttorneyFather(e.target.value)}
                      placeholder="عبدالله"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">شماره تذکره وکیل:</label>
                    <input
                      type="text"
                      value={attorneyTazkira}
                      onChange={(e) => setAttorneyTazkira(e.target.value)}
                      placeholder="1402-99882"
                      dir="ltr"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">حدود و موضوع وکالت:</label>
                  <textarea
                    rows={2}
                    value={attorneySubject}
                    onChange={(e) => setAttorneySubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1">نشانی سکونت در ایران:</label>
              <textarea
                rows={2}
                value={iranAddress}
                onChange={(e) => setIranAddress(e.target.value)}
                placeholder="استان، شهرستان، خیابان..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          {/* Live Printable Sheet Column */}
          <div className="lg:col-span-7 p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start overflow-y-auto max-h-[560px]">
            {/* The Printable A4 Sheet */}
            <div
              id="printable-consular-form"
              className="w-full max-w-lg bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border-4 border-double border-slate-800 text-xs space-y-4 font-serif"
            >
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                <div className="flex justify-center mb-1">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    🇦🇫
                  </div>
                </div>
                <h2 className="font-black text-sm tracking-tight text-slate-900">
                  سفارت کبرا جمهوری اسلامی افغانستان در تهران
                </h2>
                <h3 className="text-xs font-bold text-slate-700">بخش امور قنسولی و حقوقی اتباع</h3>
                <div className="inline-block px-3 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold text-[11px] mt-1">
                  {activeForm === "identity" && "فورم درخواستی تثبیت هویت و صدور تذکره"}
                  {activeForm === "power-of-attorney" && "وکالت‌نامه رسمی کاری و حقوقی"}
                  {activeForm === "affidavit" && "فورم استشهاد محلی و تایید هویت شرعی"}
                  {activeForm === "travel-permit" && "رضایت‌نامه سرپرست جهت خروج و مسافرت"}
                </div>
              </div>

              {/* Form Content Body */}
              {activeForm === "identity" && (
                <div className="space-y-3 leading-relaxed text-[11px]">
                  <p>
                    اینجانب <b>{fullName || "............."} {surname || "............."}</b> فرزند{" "}
                    <b>{fatherName || "............."}</b> ولدیت <b>{grandFatherName || "............."}</b>،
                    اصلی ولایت <b>{province || "............."}</b> ولسوالی{" "}
                    <b>{district || "............."}</b>، دارای شماره شناسایی / پاسپورت{" "}
                    <b dir="ltr">{docNumber || "............."}</b>، رسماً تقاضا دارم تا نسبت به تثبیت هویت
                    اینجانب و بستگان وابسته جهت صدور اسناد هویتی و تذکره الکترونیک اقدام مقتضی صورت پذیرد.
                  </p>
                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-300 rounded text-[10px]">
                    <div>تلفن تماس: {phone || "—"}</div>
                    <div>ولایت متبوع: {province || "—"}</div>
                    <div className="col-span-2">آدرس محل اقامت: {iranAddress || "—"}</div>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    صحت کلیه مندرجات فوق را تایید نموده و در صورت هرگونه مغایرت شرعاً و قانوناً پاسخگو
                    خواهم بود.
                  </p>
                </div>
              )}

              {activeForm === "power-of-attorney" && (
                <div className="space-y-3 leading-relaxed text-[11px]">
                  <p>
                    <b>موکل:</b> اینجانب {fullName || "........"} {surname || "........"} ولد{" "}
                    {fatherName || "........"} اصلی ولایت {province || "........"}.
                  </p>
                  <p>
                    <b>وکیل:</b> محترم {attorneyName || "......................."} ولد{" "}
                    {attorneyFather || "........"} دارای تذکره شماره{" "}
                    <span dir="ltr">{attorneyTazkira || "........"}</span>.
                  </p>
                  <div className="p-2 bg-slate-50 border border-slate-300 rounded text-[10px]">
                    <b>حدود و موضوع وکالت:</b> {attorneySubject}
                  </div>
                  <p className="text-[10px] text-slate-600">
                    وکیل موصوف حق امضا، ارائه مدارک و پیگیری اداری را دارا می‌باشد و عزل یا استعفا مطابق
                    قوانین صورت خواهد گرفت.
                  </p>
                </div>
              )}

              {activeForm === "affidavit" && (
                <div className="space-y-3 leading-relaxed text-[11px]">
                  <p>
                    ما امضاکنندگان ذیل شهادت شرعی می‌دهیم که محترم <b>{fullName || "........"} {surname || "........"}</b>{" "}
                    ولد <b>{fatherName || "........"}</b>، را کاملاً شناخته و نامبرده تبعه کشور افغانستان و اهل ولایت{" "}
                    <b>{province || "........"}</b> می‌باشد.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2 text-[10px]">
                    <div className="border border-slate-300 p-2 rounded text-center">
                      <p className="font-bold mb-6">شاهد اول (نام، ولد و امضا):</p>
                      <p className="text-[9px] text-slate-400">امضا و اثر انگشت</p>
                    </div>
                    <div className="border border-slate-300 p-2 rounded text-center">
                      <p className="font-bold mb-6">شاهد دوم (نام، ولد و امضا):</p>
                      <p className="text-[9px] text-slate-400">امضا و اثر انگشت</p>
                    </div>
                  </div>
                </div>
              )}

              {activeForm === "travel-permit" && (
                <div className="space-y-3 leading-relaxed text-[11px]">
                  <p>
                    اینجانب <b>{fatherName || fullName || "........"}</b> به عنوان سرپرست قانونی و ولی،
                    رضایت کامل خود را جهت سفر و تردد اعضای تحت تکفل به کشور افغانستان یا استان‌های مجاز
                    اعلام می‌دارم.
                  </p>
                  <div className="p-2 bg-slate-50 border border-slate-300 rounded text-[10px]">
                    شماره مدرک سرپرست: {docNumber || "—"} | شماره تماس: {phone || "—"}
                  </div>
                </div>
              )}

              {/* Signatures & Fingerprint Boxes */}
              <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px]">
                <div className="p-2 border border-slate-300 rounded flex flex-col items-center justify-between h-20">
                  <span className="font-bold">محل امضای متقاضی</span>
                  <span className="text-[9px] text-slate-400">تاریخ: {new Date().toLocaleDateString("fa-IR")}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded flex flex-col items-center justify-between h-20">
                  <span className="font-bold">محل اثر انگشت سبابه</span>
                  <span className="text-[9px] text-slate-400">بخش کنسولی</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Printer size={16} />
                <span>چاپ و ذخیره PDF</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <X size={16} />
                <span>بستن پنجره</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
