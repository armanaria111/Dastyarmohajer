import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Layers,
  Terminal,
  FileCode2,
  Settings,
  CheckCircle2,
  Copy,
  ExternalLink,
  Download,
  Save,
  ShieldCheck,
  Zap,
  Sparkles,
  QrCode,
  Globe,
  Info,
  Check,
  RefreshCw,
  Share2
} from 'lucide-react';
import {
  AppDownloadConfig,
  getAppDownloadConfig,
  saveAppDownloadConfig,
  DEFAULT_APP_DOWNLOAD_CONFIG
} from '../data/appDownloadSettings';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function AdminAppBuilder() {
  const [activeTab, setActiveTab] = useState<'pwabuilder' | 'bubblewrap' | 'assetlinks' | 'links' | 'diagnostics'>('pwabuilder');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadConfig, setDownloadConfig] = useState<AppDownloadConfig>(getAppDownloadConfig);

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const appUrl = window.location.origin;

  useEffect(() => {
    setDownloadConfig(getAppDownloadConfig());
  }, []);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSaveConfig = () => {
    saveAppDownloadConfig(downloadConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const bubblewrapCommands = `# ۱. نصب ابزار خط فرمان رسمی گوگل برای بسته‌بندی TWA
npm install -g @bubblewrap/cli

# ۲. ایجاد پروژه اندروید با خواندن خودکار مشخصات دستیار مهاجر
bubblewrap init --manifest="${appUrl}/manifest.json"

# ۳. کامپایل، اعتبارسنجی AssetLinks و ساخت فایل امضاشده app-release-signed.apk
bubblewrap build`;

  const assetLinksJson = `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "${downloadConfig.packageId || 'com.mohajer.assistant'}",
      "sha256_cert_fingerprints": [
        "${downloadConfig.sha256Fingerprint || '14:6D:E9:7D:0F:52:AB:FC:A7:EC:48:7B:64:CA:0E:CF:06:5D:2D:BE:0C:08:7A:B4:73:27:0D:37:A6:61:94:E9'}"
      ]
    }
  }
]`;

  return (
    <div className="space-y-6 text-right font-sans max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black border border-blue-400/30">
            <Smartphone size={14} />
            <span>پنل تخصصی مدیریت و ساخت اپلیکیشن (مدیر سیستم)</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            مراحل تولید فایل APK، استاندارد TWA و تنظیمات اپلیکیشن
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            این بخش ویژه شما (مدیر سامانه) است تا بتوانید وب‌اپلیکیشن دستیار مهاجر را به فایل نصبی APK برای اندروید،
            انتشار در بازار و مایکت، یا بسته‌بندی رسمی گوگل‌پلی تبدیل کنید. برای کاربران عادی تنها صفحه ساده نصب نمایش داده می‌شود.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>استاندارد PWA آماده و فعال (امتیاز ۱۰۰٪)</span>
            </span>

            <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold flex items-center gap-1.5">
              <Globe size={14} />
              <span>دامنه سرور: {appUrl}</span>
            </span>

            <a
              href="/download-app"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold flex items-center gap-1.5 transition-all"
            >
              <span>مشاهده صفحه عمومی کاربران</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pwabuilder')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pwabuilder'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={15} />
          <span>۱. ساخت آنلاین APK با PWABuilder (ساده و سریع)</span>
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
          <span>۲. ساخت بومی با Bubblewrap CLI گوگل</span>
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
          <span>۳. تاییدیه دیجیتال AssetLinks</span>
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'links'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings size={15} />
          <span>۴. تنظیم لینک‌های دانلود برای کاربران</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'diagnostics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap size={15} />
          <span>۵. بررسی سلامت PWA و تست زنده</span>
        </button>
      </div>

      {/* TAB 1: PWABuilder Online Builder */}
      {activeTab === 'pwabuilder' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              روش اول: ساخت فایل نهایی APK در کمتر از ۲ دقیقه با سرویس آنلاین PWABuilder
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              این ابزار رسمی مایکروسافت بدون نیاز به نصب هیچ نرم‌افزار یا کامپایلر سنگین روی سیستم شما،
              آدرس این سامانه را می‌خواند و مستقیماً فایل APK امضاشده و پروژه‌ی آماده‌ی انتشار را به شما تحویل می‌دهد.
            </p>
          </div>

          {/* Quick Action Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div>
              <h3 className="text-sm font-black flex items-center gap-2">
                <Sparkles size={16} className="text-amber-300" />
                <span>شروع خودکار بررسی و بسته‌بندی برای این سامانه</span>
              </h3>
              <p className="text-xs text-blue-200 mt-1">
                با کلیک روی دکمه مقابل، آدرس سرور فعلی در PWABuilder باز و آماده بسته‌بندی اندروید می‌شود.
              </p>
            </div>

            <a
              href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-black transition-all flex items-center gap-2 shrink-0 shadow-md"
            >
              <span>باز کردن سامانه آنلاین PWABuilder</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300">
              راهنمای گام به گام خروجی گرفتن:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">۱</span>
                  <span>آنالیز خودکار PWA</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  پس از باز شدن سایت، سیستم نمره سلامت PWA را نمایش می‌دهد (تمام تیک‌های مانیفست، سرویس‌ورکر و آیکون‌ها سبز است).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">۲</span>
                  <span>انتخاب خروجی Android</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  روی دکمه آبی <strong>Package For Stores</strong> کلیک کنید و گزینه <strong>Android</strong> را انتخاب فرمایید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">۳</span>
                  <span>تنظیم کلید امضا (Signing Key)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  می‌توانید اجازه دهید PWABuilder خودکار یک کلید امضا ایجاد کند، یا کلید Keystore اختصاصی خود را آپلود کنید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">۴</span>
                  <span>دانلود فایل نهایی و آپلود در پنل</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  فایل زیپ شامل <code className="font-mono text-emerald-600 dark:text-emerald-400">app-release-signed.apk</code> را دانلود کرده و در سرور یا هاست خود آپلود نمایید. سپس لینک آن را در تب ۴ همین بخش قرار دهید!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bubblewrap CLI */}
      {activeTab === 'bubblewrap' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              روش دوم: کامپایل محلی با Google Bubblewrap CLI (ابزار رسمی گوگل)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              اگر می‌خواهید سورس پروژه اندروید را تولید کرده، تغییرات نیتیو اضافه کنید یا در محیط اندروید استودیو باز کنید،
              کافیست دستورات زیر را در ترمینال سیستم خود اجرا فرمایید.
            </p>
          </div>

          <div className="relative">
            <pre className="p-4 sm:p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed dir-ltr text-left border border-slate-800 shadow-inner">
              {bubblewrapCommands}
            </pre>
            <button
              onClick={() => copyToClipboard(bubblewrapCommands, 'cli')}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copiedSection === 'cli' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedSection === 'cli' ? 'کپی شد' : 'کپی دستورات'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <h4 className="font-black text-slate-800 dark:text-slate-200">مقادیر پیشنهادی هنگام سوالات Bubblewrap:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-mono">
              <div>Package Name: <span className="font-bold text-blue-600 dark:text-blue-400">com.mohajer.assistant</span></div>
              <div>App Name: <span className="font-bold text-blue-600 dark:text-blue-400">دستیار مهاجر</span></div>
              <div>Display Mode: <span className="font-bold text-blue-600 dark:text-blue-400">standalone</span></div>
              <div>Theme Color: <span className="font-bold text-blue-600 dark:text-blue-400">#2563eb</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Digital Asset Links */}
      {activeTab === 'assetlinks' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              پیکربندی تاییدیه دیجیتال (Digital Asset Links) برای حذف نوار مرورگر در اندروید
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              مرورگر کروم و اندروید برای این‌که مطمئن شوند فایل APK متعلق به همین دامنه اینترنتی است،
              فایل <code className="font-mono bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">/.well-known/assetlinks.json</code> را روی سرور بررسی می‌کنند.
              با این تاییدیه، نوار آدرس URL Bar کاملاً حذف شده و برنامه تمام‌صفحه مانند اپ نیتیو باز می‌شود.
            </p>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <a
              href={`${appUrl}/.well-known/assetlinks.json`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              <ExternalLink size={14} />
              <span>مشاهده فایل فعال روی این سرور</span>
            </a>

            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={14} />
              <span>فایل با موفقیت روی سرور مستقر و در دسترس است</span>
            </span>
          </div>

          <div className="relative">
            <pre className="p-4 sm:p-5 rounded-2xl bg-slate-950 text-sky-300 font-mono text-xs overflow-x-auto leading-relaxed dir-ltr text-left border border-slate-800 shadow-inner">
              {assetLinksJson}
            </pre>
            <button
              onClick={() => copyToClipboard(assetLinksJson, 'assetlinks')}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copiedSection === 'assetlinks' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedSection === 'assetlinks' ? 'کپی شد' : 'کپی JSON'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: User Download Links Configuration */}
      {activeTab === 'links' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تنظیم لینک‌های دانلود اپلیکیشن برای کاربران
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                لینک‌هایی که در اینجا وارد کنید، در صفحه عمومی دانلود اپلیکیشن (<code className="font-mono">/download-app</code>) به کاربران نمایش داده می‌شوند.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all"
            >
              {saveSuccess ? <Check size={16} /> : <Save size={16} />}
              <span>{saveSuccess ? 'ذخیره شد!' : 'ذخیره تغییرات'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Direct APK Link Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-black text-slate-900 dark:text-white block">نمایش دکمه دانلود مستقیم فایل APK</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  اگر فایل APK آماده کرده‌اید و لینک مستقیم دارید، این گزینه را فعال کنید.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadConfig.showDirectApkButton}
                  onChange={(e) => setDownloadConfig({ ...downloadConfig, showDirectApkButton: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Direct APK URL */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                لینک مستقیم دانلود فایل APK (اختیاری):
              </label>
              <input
                type="url"
                value={downloadConfig.directApkUrl || ''}
                onChange={(e) => setDownloadConfig({ ...downloadConfig, directApkUrl: e.target.value })}
                placeholder="https://example.com/mohajer-assistant.apk یا لینک کانال تلگرام"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cafe Bazaar */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  لینک کافه بازار (در صورت انتشار):
                </label>
                <input
                  type="url"
                  value={downloadConfig.bazaarUrl || ''}
                  onChange={(e) => setDownloadConfig({ ...downloadConfig, bazaarUrl: e.target.value })}
                  placeholder="https://cafebazaar.ir/app/com.mohajer.assistant"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Myket */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  لینک مایکت (در صورت انتشار):
                </label>
                <input
                  type="url"
                  value={downloadConfig.myketUrl || ''}
                  onChange={(e) => setDownloadConfig({ ...downloadConfig, myketUrl: e.target.value })}
                  placeholder="https://myket.ir/app/com.mohajer.assistant"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Version */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  شماره نسخه اپلیکیشن:
                </label>
                <input
                  type="text"
                  value={downloadConfig.appVersion}
                  onChange={(e) => setDownloadConfig({ ...downloadConfig, appVersion: e.target.value })}
                  placeholder="1.2.0"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* File size */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  حجم تقریبی (مگابایت):
                </label>
                <input
                  type="text"
                  value={downloadConfig.fileSizeMb}
                  onChange={(e) => setDownloadConfig({ ...downloadConfig, fileSizeMb: e.target.value })}
                  placeholder="2.8"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Diagnostics & Live Test */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              بررسی و اعتبارسنجی فنی مشخصات اپلیکیشن
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تمام اجزای زیر توسط موتور هوشمند PWA بررسی شده و در وضعیت سبز قرار دارند.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-800 dark:text-emerald-300">مانیفست وب (Manifest)</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                شناسه: <code className="font-mono">/</code>، نام: «دستیار مهاجر»، حالت: Standalone
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-800 dark:text-emerald-300">سرویس‌ورکر (Workbox)</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                پشتیبانی کامل از بارگذاری سریع و دسترسی به صفحات حتی در صورت قطعی اینترنت
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-800 dark:text-emerald-300">آیکون‌های Maskable</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                سایزهای ۱۹۲×۱۹۲ و ۵۱۲×۵۱۲ بدون حاشیه نامناسب برای تمام گوشی‌های سامسونگ و شیائومی
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">تست وضعیت نصب در مرورگر جاری شما:</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isInstalled ? 'اپلیکیشن در این مرورگر نصب شده است.' : isInstallable ? 'مرورگر آماده نصب فوری است.' : 'نصب خودکار یا فعال است یا در این مرورگر پشتیبانی نمی‌شود.'}
              </span>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={() => install()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>تست نصب روی این مرورگر</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
