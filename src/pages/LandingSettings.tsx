import React, { useState, useEffect } from "react";
import {
  Globe,
  Bot,
  Megaphone,
  KeyRound,
  Save,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import {
  getLandingConfig,
  saveLandingConfig,
  LandingConfig,
  BotLinkItem,
  NewsChannelItem,
  getStoredAdminCredentials,
  saveAdminCredentials,
  DEFAULT_BOT_LINKS
} from "../data/landingSettings";
import { SocialIconUploader } from "../components/SocialIconUploader";

export default function LandingSettings() {
  const [activeTab, setActiveTab] = useState<"bots" | "news" | "security">("bots");
  const [config, setConfig] = useState<LandingConfig>(() => getLandingConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin Credentials State
  const [adminCreds, setAdminCreds] = useState(() => getStoredAdminCredentials());
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const creds = getStoredAdminCredentials();
    setAdminCreds(creds);
    setNewUsername(creds.username);
  }, []);

  // Save Landing Page Configuration
  const handleSaveConfig = () => {
    saveLandingConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Update a specific bot item
  const updateBot = (index: number, updates: Partial<BotLinkItem>) => {
    const updated = [...config.botLinks];
    updated[index] = { ...updated[index], ...updates };
    setConfig({ ...config, botLinks: updated });
  };

  // Add new bot link
  const addBotLink = (preset?: Partial<BotLinkItem>) => {
    const newBot: BotLinkItem = {
      id: preset?.id || "bot_" + Date.now(),
      name: preset?.name || "ربات جدید",
      persianName: preset?.persianName || "ربات جدید",
      iconType: preset?.iconType || "telegram",
      username: preset?.username || "@new_bot",
      url: preset?.url || "https://t.me/",
      description: preset?.description || "خدمات استعلام و نوبت‌دهی",
      color: preset?.color || "from-blue-600 to-indigo-600",
      isActive: preset?.isActive !== undefined ? preset.isActive : true,
      customIconUrl: preset?.customIconUrl,
    };
    setConfig({ ...config, botLinks: [...config.botLinks, newBot] });
  };

  // Restore all 8 official bots
  const restoreAllOfficialBots = () => {
    if (confirm("آیا تمایل دارید تمام ۸ ربات رسمی سامانه (تلگرام، بله، ایتا، روبیکا، سروش+، گپ، آی‌گپ و واتساپ) بارگذاری و فعال شوند؟")) {
      // Merge with existing bots without duplicating IDs, and excluding shad
      const existingMap = new Map(config.botLinks.filter((b) => b.id !== "shad").map((b) => [b.id, b]));
      DEFAULT_BOT_LINKS.forEach((defBot) => {
        if (!existingMap.has(defBot.id)) {
          existingMap.set(defBot.id, { ...defBot });
        }
      });
      const merged = Array.from(existingMap.values());
      setConfig({ ...config, botLinks: merged });
      saveLandingConfig({ ...config, botLinks: merged });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Remove bot link
  const removeBotLink = (index: number) => {
    if (confirm("آیا از حذف این ربات از صفحه لندینگ اطمینان دارید؟")) {
      const updated = config.botLinks.filter((_, i) => i !== index);
      setConfig({ ...config, botLinks: updated });
    }
  };

  // Update a specific news channel
  const updateNews = (index: number, updates: Partial<NewsChannelItem>) => {
    const updated = [...config.newsChannels];
    updated[index] = { ...updated[index], ...updates };
    setConfig({ ...config, newsChannels: updated });
  };

  // Add new news channel
  const addNewsChannel = () => {
    const newChan: NewsChannelItem = {
      id: "chan_" + Date.now(),
      title: "کانال جدید",
      platform: "تلگرام",
      url: "https://t.me/",
      handle: "@",
      description: "توضیحات کانال خبری",
      badge: "اطلاعیه رسمی",
    };
    setConfig({ ...config, newsChannels: [...config.newsChannels, newChan] });
  };

  // Remove news channel
  const removeNewsChannel = (index: number) => {
    const updated = config.newsChannels.filter((_, i) => i !== index);
    setConfig({ ...config, newsChannels: updated });
  };

  // Update Admin Login Credentials
  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    const cleanUser = newUsername.trim();
    const cleanPass = newPassword.trim();

    if (!cleanUser) {
      setSecurityMessage({ text: "نام کاربری نمی‌تواند خالی باشد.", type: "error" });
      return;
    }

    if (cleanPass && cleanPass !== confirmPassword.trim()) {
      setSecurityMessage({ text: "رمز عبور جدید با تکرار آن یکسان نیست.", type: "error" });
      return;
    }

    const finalPass = cleanPass || adminCreds.password;
    saveAdminCredentials(cleanUser, finalPass);
    setAdminCreds({ username: cleanUser, password: finalPass });
    setNewPassword("");
    setConfirmPassword("");
    setSecurityMessage({
      text: `اطلاعات ورود مدیر با موفقیت بروزرسانی شد. نام کاربری: ${cleanUser}`,
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="text-blue-600 dark:text-blue-400" size={24} />
            <span>مدیریت لندینگ پیج و امنیت ادمین</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ویرایش لینک ربات‌ها، کانال‌های خبری و تغییر نام کاربری و رمز عبور اختصاصی مدیر (/Arman)
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Save size={16} />
          <span>ذخیره تغییرات لندینگ</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>تغییرات لندینگ پیج با موفقیت ذخیره و در صفحه اصلی اعمال گردید.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2">
        <button
          onClick={() => setActiveTab("bots")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "bots"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Bot size={16} />
          <span>لینک ربات‌های پیام‌رسان ({config.botLinks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("news")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "news"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Megaphone size={16} />
          <span>کانال‌های خبری و مراجع ({config.newsChannels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <KeyRound size={16} />
          <span>تغییر نام کاربری و رمز عبور مدیر (/Arman)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* Tab 1: Bot Links */}
      {/* ========================================================= */}
      {activeTab === "bots" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
            <div>
              <span className="font-bold">مدیریت لینک‌های دسترسی به ربات‌های سامانه (تعداد فعلی: {config.botLinks.length} ربات):</span>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                شامل تمام پیام‌رسان‌های ایرانی و بین‌المللی (تلگرام، بله، ایتا، روبیکا، سروش+، گپ، آی‌گپ و واتساپ). می‌توانید هر کدام را ویرایش، غیرفعال یا ربات دلخواه اضافه کنید.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={restoreAllOfficialBots}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                title="بارگذاری تمام ۸ ربات رسمی سامانه"
              >
                <Sparkles size={14} />
                <span>همگام‌سازی تمام ۸ ربات رسمی</span>
              </button>
              <button
                type="button"
                onClick={() => addBotLink()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
              >
                <Plus size={14} />
                <span>افزودن ربات سفارشی</span>
              </button>
            </div>
          </div>

          {/* Quick Add Presets if any are not in list */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">افزودن سریع ربات:</span>
            {DEFAULT_BOT_LINKS.filter((db) => !config.botLinks.some((b) => b.id === db.id)).map((missing) => (
              <button
                key={missing.id}
                type="button"
                onClick={() => addBotLink(missing)}
                className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <Plus size={12} className="text-blue-500" />
                <span>+ {missing.persianName}</span>
              </button>
            ))}
            {DEFAULT_BOT_LINKS.filter((db) => !config.botLinks.some((b) => b.id === db.id)).length === 0 && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>تمام ۹ پیام‌رسان رسمی در لیست بالا قرار دارند</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.botLinks.map((bot, index) => (
              <div
                key={bot.id}
                className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Bot size={18} className="text-blue-600" />
                      <span>{bot.persianName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBotLink(index)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="حذف ربات"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bot.isActive}
                      onChange={(e) => updateBot(index, { isActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>فعال در لندینگ</span>
                  </label>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">لینک مستقیم ورود به ربات (URL):</label>
                    <input
                      type="text"
                      value={bot.url}
                      onChange={(e) => updateBot(index, { url: e.target.value })}
                      placeholder="https://t.me/your_bot"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">شناسه / آیدی ربات (Handle):</label>
                    <input
                      type="text"
                      value={bot.username}
                      onChange={(e) => updateBot(index, { username: e.target.value })}
                      placeholder="@your_bot"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">متن کوتاه توضیحات:</label>
                    <input
                      type="text"
                      value={bot.description}
                      onChange={(e) => updateBot(index, { description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Custom Social Icon Upload */}
                  <SocialIconUploader
                    label="لوگو یا آیکون اختصاصی ربات"
                    customIconUrl={bot.customIconUrl}
                    iconType={bot.iconType}
                    platform={bot.name}
                    onCustomIconChange={(url) => updateBot(index, { customIconUrl: url })}
                    onIconTypeChange={(type) => updateBot(index, { iconType: type })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
            >
              <Save size={16} />
              <span>ذخیره تغییرات ربات‌ها</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Tab 2: News Channels */}
      {/* ========================================================= */}
      {activeTab === "news" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200">
            <span>کانال‌های زیر در بخش «کانال‌های خبری و مراجع اطلاع‌رسانی» لندینگ پیج نمایش داده می‌شوند.</span>
            <button
              type="button"
              onClick={addNewsChannel}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <Plus size={14} />
              <span>افزودن کانال جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.newsChannels.map((channel, index) => (
              <div
                key={channel.id}
                className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-500">کانال شماره {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeNewsChannel(index)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                    title="حذف کانال"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">عنوان کانال:</label>
                    <input
                      type="text"
                      value={channel.title}
                      onChange={(e) => updateNews(index, { title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">لینک عضویت کانال (URL):</label>
                    <input
                      type="text"
                      value={channel.url}
                      onChange={(e) => updateNews(index, { url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-xs"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">آیدی یا پلتفرم:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={channel.handle}
                        onChange={(e) => updateNews(index, { handle: e.target.value })}
                        placeholder="@channel_id"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-xs"
                        dir="ltr"
                      />
                      <input
                        type="text"
                        value={channel.platform}
                        onChange={(e) => updateNews(index, { platform: e.target.value })}
                        placeholder="تلگرام / ایتا / بله"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">نشان / برچسب:</label>
                    <input
                      type="text"
                      value={channel.badge}
                      onChange={(e) => updateNews(index, { badge: e.target.value })}
                      placeholder="اخبار فوری و رسمی"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1 font-bold">توضیحات کوتاه:</label>
                    <input
                      type="text"
                      value={channel.description}
                      onChange={(e) => updateNews(index, { description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* Custom Social Icon Upload */}
                  <SocialIconUploader
                    label="لوگو یا آیکون اختصاصی کانال"
                    customIconUrl={channel.customIconUrl}
                    iconType={channel.iconType || channel.platform}
                    platform={channel.platform}
                    onCustomIconChange={(url) => updateNews(index, { customIconUrl: url })}
                    onIconTypeChange={(type) => updateNews(index, { iconType: type })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
            >
              <Save size={16} />
              <span>ذخیره تغییرات کانال‌ها</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Tab 3: Admin Credentials & Secret Route Security */}
      {/* ========================================================= */}
      {activeTab === "security" && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black">
              <ShieldCheck size={18} className="text-amber-600" />
              <span>نکات امنیتی دسترسی به پنل مدیریت:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300/90 leading-relaxed text-[11px]">
              <li>آدرس اختصاصی ورود شما به این پنل: <strong className="font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">/Arman</strong> است.</li>
              <li>هیچ پیوند یا دکمه‌ای برای ورود مدیر در صفحه عمومی لندینگ نمایش داده نمی‌شود.</li>
              <li>اطلاعات پیش‌فرض فعلی: نام کاربری: <strong className="font-mono">admin</strong> | رمز عبور: <strong className="font-mono">admin</strong></li>
            </ul>
          </div>

          <form onSubmit={handleUpdateCredentials} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600" />
              <span>تغییر نام کاربری و کلمه عبور مدیر:</span>
            </h3>

            {securityMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  securityMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                    : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-300"
                }`}
              >
                {securityMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                نام کاربری مدیر (Username):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                رمز عبور جدید (در صورت عدم تغییر، خالی بگذارید):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="رمز عبور جدید..."
                  className="w-full pr-9 pl-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {newPassword && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  تکرار رمز عبور جدید:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور..."
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save size={16} />
                <span>ذخیره مشخصات جدید مدیر</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
