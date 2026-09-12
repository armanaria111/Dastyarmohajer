import React, { useState } from 'react';
import { Download, Smartphone, X, ExternalLink, Share2, PlusSquare, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Link } from 'react-router-dom';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' | 'banner' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA/TWA app, hide or show badge
  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20">
        <ShieldCheck size={14} />
        <span>اپلیکیشن نصب‌شده</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Smartphone size={22} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black">نسخه موبایل و اپلیکیشن (APK / TWA / PWA)</h4>
            <p className="text-xs text-blue-100 mt-0.5">
              نصب مستقیم روی گوشی اندروید و آیفون بدون نیاز به بازار و گوگل‌پلی، بدون فیلتر و سریع‌تر
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <Download size={15} />
              <span>نصب فوری روی گوشی</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <Share2 size={15} />
              <span>نصب روی آیفون (iOS)</span>
            </button>
          ) : null}
          <Link
            to="/download-app"
            className="flex-1 sm:flex-none px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <span>راهنمای نسخه APK و TWA</span>
            <ExternalLink size={13} />
          </Link>
        </div>

        {/* iOS Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">نصب روی آیفون و آیپد (iOS)</h3>
                <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                برای داشتن آیکون دستیار مهاجر در صفحه اصلی آیفون و اجرای تمام‌صفحه بدون مرورگر:
              </p>
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">۱</span>
                  <span>در نوار پایین مرورگر Safari دکمه <strong>Share (اشتراک‌گذاری)</strong> <Share2 size={13} className="inline mx-1 text-blue-600" /> را لمس کنید.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">۲</span>
                  <span>کمی به پایین بروید و گزینه <strong>Add to Home Screen</strong> <PlusSquare size={13} className="inline mx-1 text-blue-600" /> را انتخاب فرمایید.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">۳</span>
                  <span>در بالای صفحه دکمه <strong>Add</strong> را بزنید. اپلیکیشن با آیکون اختصاصی نصب خواهد شد.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isInstallable && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
            title="نصب مستقیم برنامه روی دستگاه"
          >
            <Download size={14} />
            <span>نصب اپلیکیشن</span>
          </button>
        )}

        {isIOS && (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Smartphone size={14} />
            <span>نصب روی iOS</span>
          </button>
        )}

        <Link
          to="/download-app"
          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-blue-200 dark:border-blue-900"
        >
          <Smartphone size={14} />
          <span>اپ موبایل (APK / TWA)</span>
        </Link>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">نصب روی آیفون و آیپد (iOS)</h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              برای داشتن آیکون دستیار مهاجر در صفحه اصلی آیفون و اجرای تمام‌صفحه بدون مرورگر:
            </p>
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">۱</span>
                <span>در نوار پایین مرورگر Safari دکمه <strong>Share (اشتراک‌گذاری)</strong> <Share2 size={13} className="inline mx-1 text-blue-600" /> را لمس کنید.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">۲</span>
                <span>کمی به پایین بروید و گزینه <strong>Add to Home Screen</strong> <PlusSquare size={13} className="inline mx-1 text-blue-600" /> را انتخاب فرمایید.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">۳</span>
                <span>در بالای صفحه دکمه <strong>Add</strong> را بزنید. اپلیکیشن با آیکون اختصاصی نصب خواهد شد.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
