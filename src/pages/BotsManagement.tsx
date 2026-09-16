import React, { useState, useEffect } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Bot,
  Copy,
  Check,
  Radio,
  Save,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Lock,
  Megaphone,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Send
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getChannelLockConfigs,
  saveChannelLockConfigs,
  ChannelLockConfig
} from "../data/channelLockSettings";
import { SocialIconUploader } from "../components/SocialIconUploader";
import { SocialIconDisplay } from "../components/SocialIconDisplay";

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
  defaultChannelPlaceholder: string;
  defaultUrlPlaceholder: string;
}

const PLATFORMS: BotPlatform[] = [
  {
    id: "telegram",
    name: "Telegram",
    persianName: "تلگرام (Telegram)",
    color: "from-blue-600 to-indigo-700",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    badgeText: "text-blue-700 dark:text-blue-300",
    description: "محبوب‌ترین پیام‌رسان بین‌المللی برای ارتباط با مهاجرین خارج و داخل ایران",
    guide: "۱. در تلگرام به @BotFather پیام دهید، دستور /newbot را بفرستید و نام و نام‌کاربری ربات را تعیین کنید.\n۲. توکن دریافتی (HTTP API Token) را کپی کرده و در کادر توکن وارد نمایید.\n۳. روی دکمه «⚡️ ثبت خودکار وب‌هوک در تلگرام» در پایین همین کادر کلیک فرمایید تا وب‌هوک فوراً توسط سرور ثبت شود.\n▫️ روش دستی: می‌توانید این لینک را در مرورگر اینترنت خود باز کنید:\nhttps://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEBHOOK_URL>\n۴. جهت عضویت اجباری، ربات را ادمین کانال تلگرام خود کنید.",
    tokenLabel: "توکن ربات تلگرام (HTTP API Token)",
    tokenPlaceholder: "مثال: 789123456:AAFlk90XyZ123456...",
    defaultChannelPlaceholder: "@mohajer_news_official",
    defaultUrlPlaceholder: "https://t.me/mohajer_news_official"
  },
  {
    id: "bale",
    name: "Bale",
    persianName: "بله (Bale)",
    color: "from-emerald-500 to-teal-600",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    description: "پیام‌رسان بله با پشتیبانی از وب‌هوک و کیبوردهای اختصاصی",
    guide: "۱. به بازوی @BotFather در پیام‌رسان بله پیام دهید.\n۲. دستور /newbot را ارسال کرده و نام و شناسه ربات را مشخص کنید.\n۳. توکن دریافتی را در کادر زیر وارد کنید.\n۴. روی دکمه «⚡️ ثبت خودکار وب‌هوک در بله» کلیک کنید یا آدرس وب‌هوک را کپی کرده و ست نمایید.",
    tokenLabel: "توکن ربات بله (Bot Token)",
    tokenPlaceholder: "مثال: 1234567890:AbCdEfGhIjKlMnOpQrStUvWxYz",
    defaultChannelPlaceholder: "@mohajer_consular",
    defaultUrlPlaceholder: "https://ble.ir/mohajer_consular"
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
    tokenPlaceholder: "مثال: bot12345:67890abcdef...",
    defaultChannelPlaceholder: "@mohajer_khabar",
    defaultUrlPlaceholder: "https://eitaa.com/mohajer_khabar"
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
    tokenPlaceholder: "مثال: rubika_token_98234...",
    defaultChannelPlaceholder: "@mohajer_rubika",
    defaultUrlPlaceholder: "https://rubika.ir/mohajer_rubika"
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
    tokenPlaceholder: "مثال: srp_token_abc123xyz",
    defaultChannelPlaceholder: "@mohajer_srp",
    defaultUrlPlaceholder: "https://splus.ir/mohajer_srp"
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
    tokenPlaceholder: "مثال: gap_sec_tok_9912...",
    defaultChannelPlaceholder: "@mohajer_gap",
    defaultUrlPlaceholder: "https://gap.im/mohajer_gap"
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
    tokenPlaceholder: "مثال: igap_key_44390...",
    defaultChannelPlaceholder: "@mohajer_igap",
    defaultUrlPlaceholder: "https://igap.net/mohajer_igap"
  }
];

export default function BotsManagement() {
  const [activeTab, setActiveTab] = useState<"tokens" | "channel_lock">("channel_lock");
  const [configs, setConfigs] = useState<Record<string, { token: string; botId: string; isEnabled: boolean }>>({});
  const [channelLocks, setChannelLocks] = useState<Record<string, ChannelLockConfig>>(() => getChannelLockConfigs());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [settingWebhookId, setSettingWebhookId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [lockSaveSuccess, setLockSaveSuccess] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{
    pollingActive: boolean;
    hasToken: boolean;
    botInfo?: { id: number; username: string; first_name: string };
    webhookInfo?: { url: string; last_error_message?: string; pending_update_count?: number };
    lastMessage?: { senderId: string; userName: string; text: string; time: string };
  } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  const baseUrl = window.location.origin;

  const fetchTelegramStatus = async () => {
    try {
      const res = await fetch("/api/bot/telegram/status");
      const data = await res.json();
      setTelegramStatus(data);
    } catch (e) {
      console.warn("Error fetching telegram status:", e);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();
    const timer = setInterval(fetchTelegramStatus, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleStartPolling = async () => {
    try {
      const res = await fetch("/api/bot/telegram/start-polling", { method: "POST" });
      const data = await res.json();
      fetchTelegramStatus();
      setTestResult({
        id: "telegram",
        success: true,
        message: data.message || "دریافت زنده فعال شد."
      });
    } catch (e: any) {
      setTestResult({
        id: "telegram",
        success: false,
        message: e.message
      });
    }
  };

  const handleSendTelegramTest = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/bot/telegram/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setTestResult({
        id: "telegram",
        success: !!data.ok,
        message: data.message
      });
    } catch (e: any) {
      setTestResult({
        id: "telegram",
        success: false,
        message: `خطا در ارسال تست: ${e.message}`
      });
    } finally {
      setSendingTest(false);
    }
  };

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

  const handleRegisterWebhookApi = async (platformId: string) => {
    const current = configs[platformId];
    if (!current?.token?.trim()) {
      setTestResult({
        id: platformId,
        success: false,
        message: "لطفاً ابتدا توکن ربات را در کادر بالا وارد فرمایید."
      });
      return;
    }
    const webhookUrl = `${baseUrl}/api/bot/webhook/${platformId}`;
    setSettingWebhookId(platformId);
    try {
      const res = await fetch("/api/bot/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformId,
          token: current.token.trim(),
          webhookUrl
        })
      });
      const data = await res.json();
      const pName = platformId === "telegram" ? "تلگرام" : platformId === "bale" ? "بله" : platformId === "soroush" ? "سروش پلاس" : platformId;
      if (data.ok) {
        setTestResult({
          id: platformId,
          success: true,
          message: `وب‌هوک با موفقیت برای ${pName} ثبت شد! (${data.description || "انجام شد"})`
        });
      } else {
        setTestResult({
          id: platformId,
          success: false,
          message: `خطای ${pName}: ${data.description || "ناموفق"}`
        });
      }
    } catch (e: any) {
      setTestResult({
        id: platformId,
        success: false,
        message: `خطا در اتصال به سرور: ${e.message}`
      });
    } finally {
      setSettingWebhookId(null);
    }
  };

  const handleCheckWebhookInfo = async (platformId: string) => {
    const current = configs[platformId];
    if (!current?.token?.trim()) {
      setTestResult({
        id: platformId,
        success: false,
        message: "لطفاً ابتدا توکن ربات را وارد فرمایید."
      });
      return;
    }
    setTestingId(platformId);
    try {
      const res = await fetch("/api/bot/get-webhook-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformId,
          token: current.token.trim()
        })
      });
      const data = await res.json();
      if (data.ok && data.result) {
        const info = data.result;
        setTestResult({
          id: platformId,
          success: true,
          message: `وضعیت وب‌هوک: آدرس ثبت‌شده: ${info.url || "تنظیم نشده"} | آخرین خطا: ${info.last_error_message || "ندارد (سالم)"}`
        });
      } else {
        setTestResult({
          id: platformId,
          success: false,
          message: `پاسخ سرور: ${data.description || "خطا در دریافت وضعیت"}`
        });
      }
    } catch (e: any) {
      setTestResult({
        id: platformId,
        success: false,
        message: `خطا: ${e.message}`
      });
    } finally {
      setTestingId(null);
    }
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

  const handleTestConnection = async (platform: BotPlatform) => {
    setTestingId(platform.id);
    const current = configs[platform.id];
    if (!current?.token?.trim()) {
      setTestingId(null);
      setTestResult({
        id: platform.id,
        success: false,
        message: `لطفاً ابتدا توکن ربات ${platform.persianName} را وارد فرمایید.`
      });
      return;
    }

    try {
      const res = await fetch("/api/bot/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platform.id,
          token: current.token.trim()
        })
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult({
          id: platform.id,
          success: true,
          message: `✅ تست ارتباط با سرور ${platform.persianName} موفقیت‌آمیز بود! (${data.message})`
        });
      } else {
        setTestResult({
          id: platform.id,
          success: false,
          message: `⚠️ پاسخ سرور ${platform.persianName}: ${data.message || data.error || "عدم دریافت پاسخ"}`
        });
      }
    } catch (e: any) {
      setTestResult({
        id: platform.id,
        success: false,
        message: `خطای شبکه: ${e.message}`
      });
    } finally {
      setTestingId(null);
    }
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

  // Update a single platform's channel lock config
  const updateChannelLock = (platformId: string, updates: Partial<ChannelLockConfig>) => {
    setChannelLocks(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        ...updates
      }
    }));
  };

  // Save all channel locks
  const handleSaveChannelLocks = () => {
    saveChannelLockConfigs(channelLocks);
    setLockSaveSuccess(true);
    setTimeout(() => setLockSaveSuccess(false), 3000);
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
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              مدیریت ربات‌ها و عضویت اجباری
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            تنظیم عضویت اجباری در کانال (Force Join) و اتصال توکن و وب‌هوک در ۷ پیام‌رسان
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/simulator"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Smartphone size={16} />
            <span>تست قفل در شبیه‌ساز موبایل</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2">
        <button
          onClick={() => setActiveTab("channel_lock")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "channel_lock"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Lock size={16} />
          <span>عضویت اجباری در کانال (Force Join)</span>
        </button>

        <button
          onClick={() => setActiveTab("tokens")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "tokens"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Radio size={16} />
          <span>توکن و وب‌هوک پیام‌رسان‌ها</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MANDATORY CHANNEL MEMBERSHIP (FORCE JOIN)          */}
      {/* ========================================================= */}
      {activeTab === "channel_lock" && (
        <div className="space-y-6">
          {/* Explanation Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl text-xs space-y-2 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-black text-sm text-amber-950 dark:text-amber-100">
              <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400" />
              <span>نحوه عملکرد قفل عضویت اجباری کانال (Force Join):</span>
            </div>
            <p className="leading-relaxed text-amber-900/90 dark:text-amber-200/90 text-xs">
              هنگامی که قفل عضویت اجباری برای یک پیام‌رسان فعال باشد، کاربر به محض استارت یا ارسال هر پیامی در ربات،
              با پیغام قفل مواجه می‌شود. ربات به او لینک و شناسه کانال رسمی همان پیام‌رسان را داده و از او می‌خواهد ابتدا عضو کانال شود و دکمه <b>«تایید و بررسی عضویت»</b> را لمس کند تا منوها و استعلام‌ها برایش باز شوند.
            </p>
          </div>

          {lockSaveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>تنظیمات قفل عضویت اجباری با موفقیت ذخیره و در کلیه ربات‌ها فعال گردید.</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveChannelLocks}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Save size={16} />
              <span>ذخیره کلیه تنظیمات عضویت اجباری</span>
            </button>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLATFORMS.map((platform) => {
              const lock = channelLocks[platform.id] || {
                enabled: false,
                channelName: `کانال رسمی ${platform.persianName}`,
                channelUsername: platform.defaultChannelPlaceholder,
                channelUrl: platform.defaultUrlPlaceholder,
                lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال الزامی است."
              };

              return (
                <div
                  key={platform.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
                    lock.enabled
                      ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {/* Card Top */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-3">
                      <SocialIconDisplay
                        customIconUrl={lock.customIconUrl}
                        iconType={platform.id}
                        platform={platform.name}
                        fallbackGradient={platform.color}
                        className="w-10 h-10 rounded-xl shadow-xs"
                        iconSize={20}
                        alt={platform.persianName}
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                          {platform.persianName}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          lock.enabled
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                        }`}>
                          {lock.enabled ? "عضویت اجباری فعال است 🔒" : "قفل غیرفعال (استفاده آزاد) 🔓"}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lock.enabled}
                        onChange={(e) => updateChannelLock(platform.id, { enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                        نام کانال رسمی (نمایش به کاربر):
                      </label>
                      <input
                        type="text"
                        value={lock.channelName}
                        onChange={(e) => updateChannelLock(platform.id, { channelName: e.target.value })}
                        placeholder={`کانال رسمی اخبار مهاجرین (${platform.name})`}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                          شناسه / آیدی کانال:
                        </label>
                        <input
                          type="text"
                          value={lock.channelUsername}
                          onChange={(e) => updateChannelLock(platform.id, { channelUsername: e.target.value })}
                          placeholder={platform.defaultChannelPlaceholder}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                          لینک مستقیم عضویت در کانال:
                        </label>
                        <input
                          type="text"
                          value={lock.channelUrl}
                          onChange={(e) => updateChannelLock(platform.id, { channelUrl: e.target.value })}
                          placeholder={platform.defaultUrlPlaceholder}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                        توضیح یا پیام قفل برای کاربر (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={lock.lockMessage || ""}
                        onChange={(e) => updateChannelLock(platform.id, { lockMessage: e.target.value })}
                        placeholder="جهت استفاده از خدمات هوشمند و نوبت‌دهی، عضویت در کانال الزامی است."
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Custom Channel Icon/Logo Upload */}
                    <SocialIconUploader
                      label="آیکون یا لوگوی اختصاصی کانال"
                      customIconUrl={lock.customIconUrl}
                      iconType={platform.id}
                      platform={platform.name}
                      onCustomIconChange={(url) => updateChannelLock(platform.id, { customIconUrl: url })}
                    />
                  </div>

                  {/* Card bottom */}
                  <div className="pt-2 flex items-center justify-between">
                    <a
                      href={lock.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      <ExternalLink size={12} />
                      <span>تست باز کردن کانال</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleSaveChannelLocks}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Save size={13} />
                      <span>ذخیره این ربات</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveChannelLocks}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Save size={16} />
              <span>ذخیره کلیه تنظیمات عضویت اجباری</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TOKENS & WEBHOOKS                                   */}
      {/* ========================================================= */}
      {activeTab === "tokens" && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
            <Radio className="mt-0.5 text-blue-600 shrink-0" size={18} />
            <div className="leading-relaxed">
              این پنل مرکزی به عنوان <b>سرور منبع داده (Data Engine)</b> عمل می‌کند. هر شعبه، محله، سفارت یا سایتی که در این پنل ثبت یا ویرایش شود، به صورت آنی به کاربران در تمامی این ۷ پیام‌رسان نمایش داده می‌شود.
            </div>
          </div>

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
                      <SocialIconDisplay
                        iconType={platform.id}
                        platform={platform.name}
                        fallbackGradient={platform.color}
                        className="w-10 h-10 rounded-xl shadow-xs"
                        iconSize={22}
                        alt={platform.persianName}
                      />
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
                    </label>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Webhook URL */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        آدرس اختصاصی وب‌هوک (Webhook URL)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          dir="ltr"
                          className="flex-1 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-600 dark:text-gray-400 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyWebhook(platform.id)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 transition-colors"
                        >
                          {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span>{isCopied ? "کپی شد" : "کپی"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Token Field */}
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

                    {/* Telegram Real-time Polling & Live Status */}
                    {platform.id === "telegram" && (
                      <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                              دریافت زنده و بدون وقفه (Long Polling)
                            </span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                            {telegramStatus?.pollingActive ? "🟢 آنلاین و متصل" : "در انتظار اتصال"}
                          </span>
                        </div>

                        <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                          ربات تلگرام شما به صورت زنده و دوطرفه به سیستم متصل است. در این حالت نیازی به دامنه اختصاصی یا تنظیم وب‌هوک خارجی نیست و تمامی پیام‌ها، دکمه‌ها و استعلام‌ها بدون تاخیر پاسخ داده می‌شوند.
                        </p>

                        {telegramStatus?.botInfo?.username && (
                          <div className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-slate-900/70 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                            <span className="text-gray-500 dark:text-gray-400">شناسه ربات متصل:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 dir-ltr font-mono">
                              @{telegramStatus.botInfo.username} ({telegramStatus.botInfo.first_name})
                            </span>
                          </div>
                        )}

                        {telegramStatus?.lastMessage && (
                          <div className="p-2 bg-white/80 dark:bg-slate-900/70 rounded-lg text-[10px] text-gray-700 dark:text-gray-300 space-y-0.5 border border-emerald-100 dark:border-emerald-900">
                            <div className="font-bold flex items-center justify-between text-gray-500 dark:text-gray-400">
                              <span>آخرین فعالیت کاربر:</span>
                              <span className="font-mono">{new Date(telegramStatus.lastMessage.time).toLocaleTimeString("fa-IR")}</span>
                            </div>
                            <div className="text-emerald-800 dark:text-emerald-300 font-medium truncate">
                              از طرف <b>{telegramStatus.lastMessage.userName}</b>: «{telegramStatus.lastMessage.text}»
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={handleSendTelegramTest}
                            disabled={sendingTest || !cfg.token}
                            className="flex-1 min-w-[170px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                          >
                            <Send size={13} className={sendingTest ? "animate-spin" : ""} />
                            <span>{sendingTest ? "درحال ارسال..." : "ارسال پیام تست به تلگرام من"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleStartPolling}
                            className="py-2 px-3 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all"
                          >
                            همگام‌سازی اتصال
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Direct setWebhook Feature for Telegram, Bale, and Soroush */}
                    {(platform.id === "telegram" || platform.id === "bale" || platform.id === "soroush") && (
                      <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                            <Zap size={14} className="text-amber-500 fill-amber-500" />
                            <span>ثبت وب‌هوک با متد setWebhook</span>
                          </span>
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
                            اتصال مستقیم API
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                          پس از وارد کردن توکن، با کلیک روی دکمه زیر، سرور وب‌هوک را مستقیماً در {platform.persianName} ثبت می‌کند و نیازی به کدنویسی یا تنظیمات دستی نیست.
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleRegisterWebhookApi(platform.id)}
                            disabled={settingWebhookId === platform.id || !cfg.token}
                            className="flex-1 min-w-[170px] py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                          >
                            <Zap size={13} className={settingWebhookId === platform.id ? "animate-spin" : ""} />
                            <span>
                              {settingWebhookId === platform.id ? `درحال ثبت در ${platform.persianName}...` : `⚡️ ثبت خودکار وب‌هوک در ${platform.persianName}`}
                            </span>
                          </button>
                          {(platform.id === "telegram" || platform.id === "bale") && (
                            <button
                              type="button"
                              onClick={() => handleCheckWebhookInfo(platform.id)}
                              disabled={testingId === platform.id || !cfg.token}
                              className="py-2 px-3 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              title="استعلام آخرین وضعیت وب‌هوک از سرور پیام‌رسان"
                            >
                              استعلام وضعیت
                            </button>
                          )}
                        </div>

                        {/* Direct Browser Link */}
                        {cfg.token && (
                          <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/50 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                              <span>لینک مرورگر جهت ثبت مستقیم:</span>
                              <a
                                href={platform.id === "telegram"
                                  ? `https://api.telegram.org/bot${cfg.token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
                                  : platform.id === "bale"
                                  ? `https://tapi.bale.ai/bot${cfg.token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
                                  : `https://api.splus.ir/${cfg.token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>تست در مرورگر</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                            <div className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900 rounded p-1.5 text-gray-600 dark:text-gray-300 break-all select-all dir-ltr text-left">
                              {platform.id === "telegram"
                                ? `https://api.telegram.org/bot${cfg.token.trim()}/setWebhook?url=${webhookUrl}`
                                : platform.id === "bale"
                                ? `https://tapi.bale.ai/bot${cfg.token.trim()}/setWebhook?url=${webhookUrl}`
                                : `https://api.splus.ir/${cfg.token.trim()}/setWebhook?url=${webhookUrl}`}
                            </div>
                          </div>
                        )}
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
      )}
    </div>
  );
}
