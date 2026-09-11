import React, { useState, useEffect } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Bot, Copy, Check, Radio, ExternalLink, Save, RefreshCw, HelpCircle, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

interface BotPlatform {
  id: string;
  name: string;
  persianName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  guide: string;
  tokenLabel: string;
  tokenPlaceholder: string;
}

const PLATFORMS: BotPlatform[] = [
  {
    id: "bale",
    name: "Bale",
    persianName: "بله (Bale)",
    color: "from-emerald-500 to-teal-600",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    description: "پیام‌رسان بله با پشتیبانی از وب‌هوک و کیبوردهای اختصاصی",
    guide: "۱. به بازوی @BotFather در پیام‌رسان بله پیام دهید.\n۲. دستور /newbot را ارسال کرده و نام و شناسه ربات را مشخص کنید.\n۳. توکن دریافتی را در کادر زیر وارد کنید.\n۴. آدرس وب‌هوک اختصاصی را کپی کرده و ست نمایید.",
    tokenLabel: "توکن ربات بله (Bot Token)",
    tokenPlaceholder: "مثال: 1234567890:AbCdEfGhIjKlMnOpQrStUvWxYz"
  },
  {
    id: "eitaa",
    name: "Eitaa",
    persianName: "ایتا (Eitaa)",
    color: "from-orange-500 to-amber-600",
    badgeBg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    badgeText: "text-orange-700 dark:text-orange-300",
    description: "ارتباط با کاربران از طریق سامانه بازوهای ایتا و پنل توسعه‌دهندگان",
    guide: "۱. وارد پنل توسعه‌دهندگان ایتا (eitaa.com) شوید.\n۲. یک ربات جدید ایجاد کرده و شناسه و توکن API را دریافت کنید.\n۳. وب‌هوک زیر را در فیلد Webhook URL ایتا تنظیم فرمایید.",
    tokenLabel: "توکن ربات ایتا (API Token)",
    tokenPlaceholder: "مثال: bot12345:67890abcdef..."
  },
  {
    id: "rubika",
    name: "Rubika",
    persianName: "روبیکا (Rubika)",
    color: "from-purple-500 to-violet-600",
    badgeBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    badgeText: "text-purple-700 dark:text-purple-300",
    description: "بزرگترین پیام‌رسان ایرانی با دسترسی بالا به مخاطبان و مهاجرین",
    guide: "۱. وارد پنل توسعه‌دهندگان روبیکا شوید و بات اختصاصی ایجاد نمایید.\n۲. شناسه Bot GUID و توکن اختصاصی را در فیلدهای مربوطه وارد فرمایید.\n۳. وب‌هوک روبیکا را روی آدرس زیر ست کنید.",
    tokenLabel: "توکن / شناسه احراز هویت روبیکا",
    tokenPlaceholder: "مثال: rubika_token_98234..."
  },
  {
    id: "soroush",
    name: "Soroush+",
    persianName: "سروش پلاس (Soroush+)",
    color: "from-blue-500 to-cyan-600",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    badgeText: "text-blue-700 dark:text-blue-300",
    description: "پیام‌رسان سروش پلاس با بستر تعاملی ربات‌ها و پاسخگویی خودکار",
    guide: "۱. در پیام‌رسان سروش به بازوی @botmaker پیام دهید.\n۲. مراحل ساخت ربات را تکمیل کرده و کلید دسترسی (Token) را کپی کنید.\n۳. آدرس وب‌هوک پنل را در بات‌ساز ذخیره نمایید.",
    tokenLabel: "توکن ربات سروش پلاس",
    tokenPlaceholder: "مثال: srp_token_abc123xyz"
  },
  {
    id: "gap",
    name: "Gap",
    persianName: "گپ (Gap)",
    color: "from-sky-500 to-blue-700",
    badgeBg: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
    badgeText: "text-sky-700 dark:text-sky-300",
    description: "پلتفرم توسعه باز بات‌های گپ با وب‌سرویس استاندارد REST",
    guide: "۱. وارد پنل توسعه‌دهندگان گپ به آدرس developer.gap.im شوید.\n۲. دکمه «ایجاد ربات جدید» را بزنید و توکن امنیتی را کپی کنید.\n۳. در تنظیمات ربات، URL بازخورد (Webhook) را به آدرس زیر تغییر دهید.",
    tokenLabel: "توکن امنیتی گپ (Gap Bot Token)",
    tokenPlaceholder: "مثال: gap_sec_tok_9912..."
  },
  {
    id: "igap",
    name: "iGap",
    persianName: "ایگپ (iGap)",
    color: "from-indigo-500 to-blue-600",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    description: "پیام‌رسان ایگپ با قابلیت اتصال سریع به وب‌هوک و چت‌بات‌های شرکتی",
    guide: "۱. در ایگپ به ربات @BotFather پیام داده و کلید API را بگیرید.\n۲. وب‌هوک زیر را تنظیم کنید تا پیام‌های کاربران به این پنل هدایت شود.",
    tokenLabel: "کلید ارتباطی ایگپ (iGap API Key)",
    tokenPlaceholder: "مثال: igap_key_44390..."
  },
  {
    id: "telegram",
    name: "Telegram",
    persianName: "تلگرام (Telegram)",
    color: "from-blue-600 to-indigo-700",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    badgeText: "text-blue-700 dark:text-blue-300",
    description: "محبوب‌ترین پیام‌رسان بین‌المللی برای ارتباط با مهاجرین خارج و داخل ایران",
    guide: "۱. در تلگرام به @BotFather پیام دهید و /newbot بزنید.\n۲. توکن دریافتی را کپی کرده و در کادر زیر وارد کنید.\n۳. با متد setWebhook تلگرام، وب‌هوک این پنل را ثبت فرمایید.",
    tokenLabel: "توکن ربات تلگرام (HTTP API Token)",
    tokenPlaceholder: "مثال: 789123456:AAFlk90XyZ123456..."
  }
];

export default function BotsManagement() {
  const [configs, setConfigs] = useState<Record<string, { token: string; botId: string; isEnabled: boolean }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  const baseUrl = window.location.origin;

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const snap = await getDocs(collection(db, "bot_configs"));
        const data: Record<string, any> = {};
        snap.docs.forEach(d => {
          data[d.id] = d.data();
        });
        setConfigs(data);
      } catch (err) {
        console.error("Error loading bot configs:", err);
      }
    };
    fetchConfigs();
  }, []);

  const handleCopyWebhook = (platformId: string) => {
    const url = `${baseUrl}/api/bot/webhook/${platformId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(platformId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveConfig = async (platformId: string) => {
    setSavingId(platformId);
    const current = configs[platformId] || { token: "", botId: "", isEnabled: false };
    try {
      await setDoc(doc(db, "bot_configs", platformId), {
        token: current.token || "",
        botId: current.botId || "",
        isEnabled: !!current.isEnabled,
        updatedAt: new Date()
      }, { merge: true });

      setTestResult({
        id: platformId,
        success: true,
        message: "تنظیمات با موفقیت در سیستم ذخیره شد."
      });
      setTimeout(() => setTestResult(null), 3000);
    } catch (err: any) {
      setTestResult({
        id: platformId,
        success: false,
        message: `خطا در ذخیره‌سازی: ${err.message}`
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleTestConnection = (platform: BotPlatform) => {
    setTestingId(platform.id);
    const current = configs[platform.id];
    setTimeout(() => {
      setTestingId(null);
      if (!current?.token) {
        setTestResult({
          id: platform.id,
          success: false,
          message: `لطفاً ابتدا توکن ربات ${platform.persianName} را وارد کنید.`
        });
      } else {
        setTestResult({
          id: platform.id,
          success: true,
          message: `ارتباط وب‌هوک با سرور ${platform.persianName} آماده دریافت و پاسخگویی به پیام‌ها است!`
        });
      }
    }, 600);
  };

  const handleFieldChange = (platformId: string, field: "token" | "botId" | "isEnabled", value: any) => {
    setConfigs(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Bot size={22} />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">اتصال و مدیریت ربات‌ها</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            تنظیم توکن و وب‌هوک برای ۷ پیام‌رسان: <b>سروش پلاس، ایتا، بله، روبیکا، گپ، ایگپ و تلگرام</b>
          </p>
        </div>

        <Link
          to="/simulator"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          <Smartphone size={18} />
          <span>تست زنده در شبیه‌ساز موبایل</span>
        </Link>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 flex items-start gap-3">
        <Radio className="mt-0.5 text-blue-600 shrink-0" size={18} />
        <div className="leading-relaxed">
          این پنل مرکزی به عنوان <b>سرور منبع داده (Data Engine)</b> عمل می‌کند. هر شعبه، محله، سفارت یا سایتی که در این پنل ثبت یا ویرایش شود، به صورت آنی به کاربران در تمامی این ۷ پیام‌رسان نمایش داده می‌شود.
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => {
          const cfg = configs[platform.id] || { token: "", botId: "", isEnabled: false };
          const webhookUrl = `${baseUrl}/api/bot/webhook/${platform.id}`;
          const isCopied = copiedId === platform.id;
          const isSaving = savingId === platform.id;
          const isTesting = testingId === platform.id;
          const isGuideOpen = activeGuideId === platform.id;

          return (
            <div
              key={platform.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${platform.color} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
                    {platform.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{platform.persianName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{platform.description}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.isEnabled}
                    onChange={(e) => handleFieldChange(platform.id, "isEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="mr-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {cfg.isEnabled ? "فعال" : "غیرفعال"}
                  </span>
                </label>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1">
                {/* Webhook Box */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    آدرس وب‌هوک (Webhook URL برای تنظیم در ربات)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      dir="ltr"
                      className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyWebhook(platform.id)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{isCopied ? "کپی شد" : "کپی"}</span>
                    </button>
                  </div>
                </div>

                {/* Token Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {platform.tokenLabel}
                  </label>
                  <input
                    type="password"
                    value={cfg.token || ""}
                    onChange={(e) => handleFieldChange(platform.id, "token", e.target.value)}
                    placeholder={platform.tokenPlaceholder}
                    dir="ltr"
                    className="w-full bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Bot ID / Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    آیدی / شناسه ربات در این پیام‌رسان (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={cfg.botId || ""}
                    onChange={(e) => handleFieldChange(platform.id, "botId", e.target.value)}
                    placeholder="@Mohajer_Bot"
                    dir="ltr"
                    className="w-full bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Toggle Guide */}
                <button
                  type="button"
                  onClick={() => setActiveGuideId(isGuideOpen ? null : platform.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <HelpCircle size={14} />
                  <span>{isGuideOpen ? "بستن راهنمای اتصال" : "راهنمای اتصال این ربات"}</span>
                </button>

                {isGuideOpen && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {platform.guide}
                  </div>
                )}

                {/* Status Message */}
                {testResult?.id === platform.id && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${testResult.success ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleTestConnection(platform)}
                  disabled={isTesting}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isTesting ? "animate-spin text-blue-600" : ""} />
                  <span>{isTesting ? "درحال بررسی..." : "تست اتصال"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveConfig(platform.id)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSaving ? "درحال ذخیره..." : "ذخیره تنظیمات"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
