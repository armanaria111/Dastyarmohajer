import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  Code,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Terminal,
  RefreshCw,
  QrCode,
  FileCode2,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function MobileAppDownload() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pwa' | 'twa' | 'bubblewrap' | 'assetlinks'>('pwa');

  const appUrl = window.location.origin;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const bubblewrapCommands = `# ۱. نصب ابزار رسمی گوگل برای خروجی TWA / APK
npm install -g @bubblewrap/cli

# ۲. ایجاد پروژه اندروید بر اساس مانیفست دستیار مهاجر
bubblewrap init --manifest="${appUrl}/manifest.json"

# ۳. کامپایل و تولید خودکار فایل نهایی app-release-signed.apk
bubblewrap build`;

  const assetLinksJson = `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.mohajer.assistant",
      "sha256_cert_fingerprints": [
        "14:6D:E9:7D:0F:52:AB:FC:A7:EC:48:7B:64:CA:0E:CF:06:5D:2D:BE:0C:08:7A:B4:73:27:0D:37:A6:61:94:E9"
      ]
    }
  }
]`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <ArrowRight size={14} />
            <span>بازگشت به صفحه اصلی سامانه</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              آماده نصب مستقیم (WebAPK / PWA / TWA)
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white backdrop-blur-md text-xs font-black border border-white/20">
              <Smartphone size={14} />
              <span>نسخه رسمی تلفن همراه — دستیار مهاجر</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
              دانلود و نصب اپلیکیشن اندروید (APK / TWA) و آیفون
            </h1>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              شما می‌توانید «دستیار مهاجر» را به صورت مستقیم و بدون نیاز به نصب از گوگل‌پلی یا کافه بازار روی گوشی خود نصب فرمایید.
              سرعت فوق‌العاده بالا، بدون قطعی، بدون تبلیغات و کاملاً مستقل!
            </p>

            {/* Quick Action Button */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {isInstalled ? (
                <div className="px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>اپلیکیشن هم‌اکنون روی دستگاه شما نصب است.</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={() => install()}
                  className="px-6 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
                >
                  <Download size={18} />
                  <span>نصب فوری و خودکار (WebAPK)</span>
                </button>
              ) : isIOS ? (
                <div className="px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20 text-xs font-bold flex items-center gap-2">
                  <Share2 size={16} />
                  <span>در مرورگر Safari دکمه Share و سپس «Add to Home Screen» را بزنید.</span>
                </div>
              ) : (
                <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-blue-100 border border-white/20 text-xs font-bold flex items-center gap-2">
                  <Info size={16} />
                  <span>برای نصب، از طریق مرورگر کروم یا سامسونگ روی گوشی این صفحه را باز فرمایید.</span>
                </div>
              )}

              <a
                href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs transition-all flex items-center gap-2"
              >
                <span>تولید آنلاین APK با PWABuilder</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="absolute -left-12 -bottom-16 opacity-15 pointer-events-none hidden md:block">
            <Smartphone size={320} />
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
              برخلاف برنامه‌های سنگین که فضای زیادی اشغال می‌کنند، این اپلیکیشن سبک‌ترین حافظه را از گوشی مصرف می‌کند.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <h3 className="text-sm font-black">آپدیت خودکار بدون دانلود مجدد</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              هر تغییری در بخشنامه‌ها، سامانه نوبت‌دهی و اخبار فوراً و بدون نیاز به دانلود فایل آپدیت جدید روی گوشی اعمال می‌شود.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-black">سازگار با اندروید و iOS</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              به راحتی روی تمام گوشی‌های سامسونگ، شیائومی، هواوی، نوکیا و تمامی مدل‌های آیفون و آیپد کار می‌کند.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone size={15} />
            <span>نصب مستقیم موبایل (WebAPK / PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('twa')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'twa'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers size={15} />
            <span>خروجی فایل APK با TWA</span>
          </button>
          <button
            onClick={() => setActiveTab('bubblewrap')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bubblewrap'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Terminal size={15} />
            <span>کامندلاین رسمی گوگل (Bubblewrap)</span>
          </button>
          <button
            onClick={() => setActiveTab('assetlinks')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'assetlinks'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCode2 size={15} />
            <span>تنظیمات AssetLinks & Manifest</span>
          </button>
        </div>

        {/* Tab 1: PWA Direct Mobile Install */}
        {activeTab === 'pwa' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                راهنمای نصب سریع دستیار مهاجر بر روی تلفن همراه
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                توسط این روش، مرورگر شما مستقیماً یک فایل WebAPK ساخته و برنامه را همانند برنامه‌های دانلودی با آیکون در صفحه برنامه‌های گوشی قرار می‌دهد.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Android Guide */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  <Smartphone size={18} />
                  <span>مراحل در گوشی‌های اندروید (Chrome یا مرورگر سامسونگ)</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۱</span>
                    <span>همین صفحه را در مرورگر <strong>Google Chrome</strong> در گوشی باز فرمایید.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۲</span>
                    <span>روی دکمه سه‌نقطه <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">⋮</span> در گوشه بالا سمت چپ مرورگر بزنید.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۳</span>
                    <span>گزینه <strong>«افزودن به صفحه اصلی»</strong> یا <strong>«نصب برنامه (Install App)»</strong> را لمس کنید.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۴</span>
                    <span>گزینه «نصب (Install)» را تایید فرمایید. آیکون دستیار مهاجر بلافاصله به منوی اصلی گوشی شما اضافه خواهد شد.</span>
                  </li>
                </ul>

                {isInstallable && (
                  <button
                    onClick={() => install()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <Download size={15} />
                    <span>نصب خودکار برای مرورگر فعلی شما</span>
                  </button>
                )}
              </div>

              {/* iOS Guide */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm">
                  <Smartphone size={18} />
                  <span>مراحل در گوشی‌های آیفون و آیپد (Safari)</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۱</span>
                    <span>آدرس سامانه را در مرورگر پیش‌فرض آیفون یعنی <strong>Safari</strong> باز کنید.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۲</span>
                    <span>در نوار پایین مرورگر روی آیکون <strong>Share</strong> (مربع با فلش رو به بالا) کلیک فرمایید.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۳</span>
                    <span>در لیست گزینه‌ها گزینه <strong>«Add to Home Screen»</strong> را لمس کنید.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">۴</span>
                    <span>در بالای صفحه راست گزینه <strong>Add</strong> را بزنید. دستیار مهاجر تمام‌صفحه و بدون نوار آدرس باز خواهد شد.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: TWA (Trusted Web Activity) APK generation */}
        {activeTab === 'twa' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                تولید فایل رسمی APK با استاندارد Google TWA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                استاندارد TWA (Trusted Web Activity) تکنولوژی رسمی گوگل است که به شما امکان می‌دهد این وب‌اپلیکیشن را تبدیل به یک فایل APK کامل و امضاشده برای انتشار در بازار، مایکت و گوگل‌پلی نمایید.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-black text-xs">
                <CheckCircle2 size={16} />
                <span>کلیه پیش‌نیازهای TWA در این سامانه با موفقیت پیاده‌سازی شده است:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>فایل <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">manifest.json</code> استاندارد و کامل</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>آیکون‌های Maskable و سایزهای ۱۹۲ و ۵۱۲ پیکسلی</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>سرویس‌ورکر (Workbox) فعال برای کش و آفلاین</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>پرونده <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">.well-known/assetlinks.json</code> جهت حذف نوار مرورگر</span>
                </div>
              </div>
            </div>

            {/* Step-by-step PWABuilder generator */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black">روش ۱: تولید آنلاین APK با PWABuilder (پیشنهادی)</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    سرویس رسمی مایکروسافت بدون نیاز به نصب نرم‌افزار، فایل APK نهایی را ظرف ۱ دقیقه آماده دانلود می‌کند.
                  </p>
                </div>
                <a
                  href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-600/30"
                >
                  <span>ورود به سامانه ساخت APK</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-4">
                <p><strong>مراحل دانلود:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>روی دکمه بالا کلیک کنید (آدرس سامانه شما به طور خودکار آنالیز خواهد شد).</li>
                  <li>امتیاز سازگاری PWA نمایش داده می‌شود (امتیاز ۱۰۰٪).</li>
                  <li>روی دکمه <strong>«Package For Stores»</strong> و سپس <strong>«Android (Google Play / APK)»</strong> کلیک کنید.</li>
                  <li>فایل زیپ شامل <code className="text-amber-300 font-mono">app-release-unsigned.apk</code> یا فایل پکیج امضاشده را دانلود فرمایید.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bubblewrap CLI */}
        {activeTab === 'bubblewrap' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                تولید پروژه TWA با ابزار رسمی گوگل (Bubblewrap CLI)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                اگر برنامه‌نویس هستید یا می‌خواهید سورس اندروید را در Android Studio باز کرده و امضای اختصاصی (Keystore) بزنید:
              </p>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed dir-ltr text-left">
                {bubblewrapCommands}
              </pre>
              <button
                onClick={() => copyToClipboard(bubblewrapCommands, 'bubblewrap')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {copiedSection === 'bubblewrap' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedSection === 'bubblewrap' ? 'کپی شد' : 'کپی دستورات'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <h4 className="font-black text-slate-900 dark:text-white">مشخصات پکیج آماده:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                <div>Package Name: <span className="text-blue-600 dark:text-blue-400 font-bold">com.mohajer.assistant</span></div>
                <div>Start URL: <span className="text-blue-600 dark:text-blue-400 font-bold">{appUrl}/</span></div>
                <div>Display Mode: <span className="text-blue-600 dark:text-blue-400 font-bold">standalone (TWA Fullscreen)</span></div>
                <div>Icon: <span className="text-blue-600 dark:text-blue-400 font-bold">{appUrl}/pwa-512x512.png</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AssetLinks.json */}
        {activeTab === 'assetlinks' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                پیکربندی تاییدیه دیجیتالی گوگل (Digital Asset Links)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                برای این‌که مرورگر کروم هنگام باز شدن فایل APK نوار بالای آدرس (URL Bar) را کاملاً محو کرده و اپلیکیشن دقیقاً مثل یک اپ بومی نیتیو باز شود، این فایل در مسیر <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/.well-known/assetlinks.json</code> قرار گرفته است.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <a
                href={`${appUrl}/.well-known/assetlinks.json`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>مشاهده فایل فعال روی سرور</span>
                <ExternalLink size={13} />
              </a>

              <a
                href={`${appUrl}/manifest.json`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>مشاهده manifest.json</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-950 text-blue-300 font-mono text-xs overflow-x-auto leading-relaxed dir-ltr text-left">
                {assetLinksJson}
              </pre>
              <button
                onClick={() => copyToClipboard(assetLinksJson, 'assetlinks')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {copiedSection === 'assetlinks' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedSection === 'assetlinks' ? 'کپی شد' : 'کپی JSON'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
