import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  ArrowRight,
  Zap,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getAppDownloadConfig, AppDownloadConfig } from '../data/appDownloadSettings';

export default function MobileAppDownload() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [downloadConfig, setDownloadConfig] = useState<AppDownloadConfig>(getAppDownloadConfig);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setDownloadConfig(getAppDownloadConfig());
  }, []);

  const faqs = [
    {
      q: 'آیا نصب اپلیکیشن هزینه دارد؟',
      a: 'خیر، استفاده و نصب اپلیکیشن دستیار مهاجر کاملاً رایگان است و هیچ هزینه‌ای برای شما ندارد.',
    },
    {
      q: 'آیا برای باز شدن اپلیکیشن به فیلترشکن نیاز است؟',
      a: 'خیر، کلیه سرورهای سامانه با بالاترین سرعت و بدون نیاز به هیچ‌گونه ابزار فیلترشکن در دسترس شما قرار دارد.',
    },
    {
      q: 'آیا اپلیکیشن حافظه گوشی را پر می‌کند؟',
      a: 'خیر، به لطف تکنولوژی وب‌اپلیکیشن هوشمند (PWA / WebAPK)، حجم این برنامه کمتر از ۳ مگابایت است و کمترین مصرف باتری و رم را دارد.',
    },
    {
      q: 'چگونه اپلیکیشن به‌روزرسانی (آپدیت) می‌شود؟',
      a: 'تمام به‌روزرسانی‌ها، بخشنامه‌های جدید، اخبار و تغییرات به صورت کاملاً خودکار اعمال می‌شوند و نیازی به دانلود مجدد فایل ندارید.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-right">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <ArrowRight size={14} />
            <span>بازگشت به صفحه اصلی</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              نسخه رسمی تلفن همراه
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white backdrop-blur-md text-xs font-black border border-white/20">
              <Smartphone size={14} />
              <span>نصب مستقیم اپلیکیشن — بدون نیاز به بازار یا فیلترشکن</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              دانلود و نصب اپلیکیشن دستیار مهاجر (اندروید و آیفون)
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              شما می‌توانید سامانه جامع دستیار مهاجر را با یک کلیک و بدون نیاز به دانلود بسته‌های سنگین، مستقیماً روی صفحه گوشی خود نصب کنید.
              پرسرعت، بدون تبلیغات و همیشه در دسترس شما!
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {isInstalled ? (
                <div className="px-5 py-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>اپلیکیشن هم‌اکنون روی دستگاه شما نصب و فعال است.</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={() => install()}
                  className="px-6 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
                >
                  <Download size={18} />
                  <span>نصب فوری و خودکار روی گوشی</span>
                </button>
              ) : isIOS ? (
                <div className="px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20 text-xs font-bold flex items-center gap-2">
                  <Share2 size={16} />
                  <span>در مرورگر Safari دکمه اشتراک‌گذاری و سپس «Add to Home Screen» را لمس فرمایید.</span>
                </div>
              ) : (
                <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-blue-100 border border-white/20 text-xs font-bold flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>از طریق مرورگر کروم یا سامسونگ روی گوشی وارد شوید تا دکمه نصب خودکار فعال گردد.</span>
                </div>
              )}

              {/* Direct APK Link if configured by Admin */}
              {downloadConfig.showDirectApkButton && downloadConfig.directApkUrl && (
                <a
                  href={downloadConfig.directApkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg"
                >
                  <Download size={16} />
                  <span>دانلود مستقیم فایل APK ({downloadConfig.fileSizeMb}MB)</span>
                </a>
              )}

              {/* Cafe Bazaar Link if configured */}
              {downloadConfig.bazaarUrl && (
                <a
                  href={downloadConfig.bazaarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <span>کافه بازار</span>
                  <ExternalLink size={13} />
                </a>
              )}

              {/* Myket Link if configured */}
              {downloadConfig.myketUrl && (
                <a
                  href={downloadConfig.myketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <span>مایکت</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          <div className="absolute -left-12 -bottom-16 opacity-15 pointer-events-none hidden md:block">
            <Smartphone size={300} />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-sm font-black">حجم بسیار کم (کمتر از ۳ مگابایت)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              حافظه گوشی شما را اشغال نمی‌کند و روی هر مدل گوشی قدیمی یا جدید با سرعت بالا باز می‌شود.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <h3 className="text-sm font-black">آپدیت خودکار بدون دانلود فایل جدید</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              هر تغییری در سامانه‌ها، نوبت‌دهی و اخبار فوراً و خودکار روی گوشی شما به‌روز می‌شود.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <WifiOff size={20} />
            </div>
            <h3 className="text-sm font-black">دسترسی آفلاین به اطلاعات</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              آدرس شعب، شماره تماس سفارت‌ها و راهنماها حتی در صورت قطعی اینترنت در دسترستان خواهد بود.
            </p>
          </div>
        </div>

        {/* Step-by-Step Installation Guides */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              راهنمای گام‌به‌گام نصب در تلفن همراه
            </h2>
            <span className="text-xs text-slate-400 font-bold">بسیار ساده در ۴ مرحله</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Android Guide */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <Smartphone size={18} />
                <span>روش نصب در گوشی‌های اندروید (Chrome یا Samsung)</span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۱</span>
                  <span className="leading-relaxed">آدرس سامانه را در مرورگر <strong>Google Chrome</strong> باز فرمایید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۲</span>
                  <span className="leading-relaxed">روی علامت سه‌نقطه <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">⋮</span> در بالای صفحه مرورگر بزنید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۳</span>
                  <span className="leading-relaxed">گزینه <strong>«افزودن به صفحه اصلی»</strong> یا <strong>«Install App / نصب برنامه»</strong> را لمس کنید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۴</span>
                  <span className="leading-relaxed">تایید فرمایید؛ آیکون برنامه سریعاً به صفحه اصلی برنامه‌های گوشی شما افزوده می‌شود.</span>
                </li>
              </ul>

              {isInstallable && (
                <button
                  onClick={() => install()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Download size={15} />
                  <span>کلیک کنید تا خودکار نصب شود</span>
                </button>
              )}
            </div>

            {/* iOS Guide */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <Smartphone size={18} />
                <span>روش نصب در گوشی‌های آیفون و آیپد (Safari)</span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۱</span>
                  <span className="leading-relaxed">سامانه را حتماً در مرورگر پیش‌فرض آیفون یعنی <strong>Safari</strong> باز کنید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۲</span>
                  <span className="leading-relaxed">در نوار پایین صفحه روی آیکون <strong>اشتراک‌گذاری (Share)</strong> کلیک کنید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۳</span>
                  <span className="leading-relaxed">در منوی بازشده، به پایین اسکرول کرده و گزینه <strong>«Add to Home Screen»</strong> را لمس کنید.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">۴</span>
                  <span className="leading-relaxed">در گوشه بالای راست دکمه <strong>Add</strong> را بزنید. دستیار مهاجر مثل یک اپ بومی باز خواهد شد.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-600 dark:text-blue-400" />
            <span>سوالات متداول کاربران درباره نصب اپلیکیشن</span>
          </h2>

          <div className="space-y-3 pt-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-right flex items-center justify-between gap-3 text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
