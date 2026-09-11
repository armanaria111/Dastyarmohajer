import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  Phone,
  Clock,
  Users,
  ShieldCheck,
  FileText,
  Zap,
  HelpCircle,
  ExternalLink
} from "lucide-react";

interface SmsConfig {
  hasApiKey: boolean;
  maskedKey: string;
  lineNumber: string;
  defaultTemplateId: string;
  isEnabled: boolean;
}

interface SmsStatus {
  connected: boolean;
  credit: number;
  lines: any[];
  activeLine?: string;
  message?: string;
}

interface SmsLog {
  id: string;
  type: string;
  mobiles?: string[];
  mobile?: string;
  count?: number;
  message?: string;
  templateId?: string;
  lineNumber?: string;
  success: boolean;
  resultMessage?: string;
  createdAt: any;
}

export default function SmsManagement() {
  const [activeTab, setActiveTab] = useState<"send" | "verify" | "config" | "logs">("send");
  const [config, setConfig] = useState<SmsConfig>({
    hasApiKey: false,
    maskedKey: "",
    lineNumber: "",
    defaultTemplateId: "",
    isEnabled: true
  });
  const [status, setStatus] = useState<SmsStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [lineNumberInput, setLineNumberInput] = useState("");
  const [templateIdInput, setTemplateIdInput] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Send Bulk SMS Form
  const [recipientType, setRecipientType] = useState<"custom" | "requests">("custom");
  const [customNumbers, setCustomNumbers] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fast Verify Template Form
  const [verifyMobile, setVerifyMobile] = useState("");
  const [verifyTemplateId, setVerifyTemplateId] = useState("");
  const [paramName1, setParamName1] = useState("Code");
  const [paramVal1, setParamVal1] = useState("");
  const [paramName2, setParamName2] = useState("Name");
  const [paramVal2, setParamVal2] = useState("");
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load config & status on mount
  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/sms/config");
      const data = await res.json();
      setConfig(data);
      if (data.lineNumber) setLineNumberInput(data.lineNumber);
      if (data.defaultTemplateId) setTemplateIdInput(data.defaultTemplateId);
    } catch (err) {
      console.error("Failed to load SMS config:", err);
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/sms/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch SMS status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/sms/logs");
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error("Failed to fetch SMS logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveFeedback(null);
    try {
      const res = await fetch("/api/sms/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim() || undefined,
          lineNumber: lineNumberInput.trim(),
          defaultTemplateId: templateIdInput.trim(),
          isEnabled: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSaveFeedback({ success: true, message: data.message || "تنظیمات ذخیره شد." });
        setApiKeyInput("");
        fetchConfig();
        fetchStatus();
      } else {
        setSaveFeedback({ success: false, message: data.error || "خطا در ذخیره تنظیمات." });
      }
    } catch (err: any) {
      setSaveFeedback({ success: false, message: err.message || "خطا در برقراری ارتباط." });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingSms(true);
    setSendResult(null);

    try {
      let mobiles: string[] = [];

      if (recipientType === "custom") {
        mobiles = customNumbers
          .split(/[\n,;]+/)
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
      } else {
        // Fetch phone numbers from requests
        const reqRes = await fetch("/api/data/requests");
        const reqData = await reqRes.json();
        if (Array.isArray(reqData)) {
          mobiles = reqData.map((r: any) => r.phone).filter(Boolean);
        }
      }

      if (mobiles.length === 0) {
        setSendResult({ success: false, message: "شماره موبایلی برای ارسال یافت نشد." });
        setSendingSms(false);
        return;
      }

      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobiles,
          message: smsMessage,
          lineNumber: lineNumberInput || config.lineNumber
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({
          success: true,
          message: data.message || `پیامک به ${mobiles.length} گیرنده با موفقیت ارسال شد.`
        });
        setSmsMessage("");
        if (recipientType === "custom") setCustomNumbers("");
        fetchStatus();
      } else {
        setSendResult({
          success: false,
          message: data.error || "خطا در ارسال پیامک. لطفاً خط و اعتبار را بررسی فرمایید."
        });
      }
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || "خطای غیرمنتظره در سرور." });
    } finally {
      setSendingSms(false);
    }
  };

  const handleSendVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingVerify(true);
    setVerifyResult(null);

    try {
      const parameters: any[] = [];
      if (paramName1 && paramVal1) {
        parameters.push({ name: paramName1.trim(), value: paramVal1.trim() });
      }
      if (paramName2 && paramVal2) {
        parameters.push({ name: paramName2.trim(), value: paramVal2.trim() });
      }

      const res = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: verifyMobile,
          templateId: verifyTemplateId || templateIdInput || config.defaultTemplateId,
          parameters
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyResult({
          success: true,
          message: "پیامک اعتبارسنجی با قالب اختصاصی با موفقیت ارسال شد."
        });
        setVerifyMobile("");
        setParamVal1("");
        setParamVal2("");
        fetchStatus();
      } else {
        setVerifyResult({
          success: false,
          message: data.error || "ارسال پیامک با قالب ناموفق بود."
        });
      }
    } catch (err: any) {
      setVerifyResult({ success: false, message: err.message || "خطای ارتباط با سرور." });
    } finally {
      setSendingVerify(false);
    }
  };

  // Character calculation for Persian SMS
  const charCount = smsMessage.length;
  const partsCount = charCount === 0 ? 0 : charCount <= 70 ? 1 : Math.ceil(charCount / 67);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <MessageSquare size={22} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              سامانه پیامکی دستیار مهاجر (sms.ir)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            اتصال مستقیم به وب‌سرویس رسمی sms.ir، ارسال پیامک نوبت‌دهی، تایید هویت و اطلاع‌رسانی فوری
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw size={14} className={loadingStatus ? "animate-spin text-blue-600" : ""} />
            <span>بروزرسانی اعتبار</span>
          </button>
          <a
            href="https://panel.sms.ir"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
          >
            <ExternalLink size={14} />
            <span>پنل مدیریت sms.ir</span>
          </a>
        </div>
      </div>

      {/* Credit & Connection Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 block">وضعیت اتصال به sms.ir</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status?.connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              ></span>
              <span className="font-black text-sm text-gray-900 dark:text-white">
                {status?.connected ? "متصل و فعال" : "نیاز به تنظیم API Key"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Phone size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 block">شماره خط اختصاصی فرستنده</span>
            <span className="font-black font-mono text-sm text-gray-900 dark:text-white mt-0.5 block" dir="ltr">
              {config.lineNumber || status?.activeLine || "تنظیم نشده"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Key size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 block">اعتبار باقی‌مانده (ریال/پیامک)</span>
            <span className="font-black font-mono text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {status?.credit ? status.credit.toLocaleString("fa-IR") : "۰"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 block">ارسال با بلک‌لیست (پترن)</span>
            <span className="font-black text-xs text-gray-900 dark:text-white mt-0.5 block">
              پشتیبانی از قالب اعتبارسنجی
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2">
        <button
          onClick={() => setActiveTab("send")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "send"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Send size={16} />
          <span>ارسال پیامک تکی و گروهی</span>
        </button>

        <button
          onClick={() => setActiveTab("verify")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "verify"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Zap size={16} />
          <span>ارسال سریع با قالب (پترن / کد تایید)</span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "config"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Key size={16} />
          <span>تنظیمات و کلید API</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "logs"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Clock size={16} />
          <span>گزارشات ارسال</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SEND BULK / SINGLE SMS                             */}
      {/* ========================================================= */}
      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Send size={18} className="text-blue-600" />
              <span>ارسال پیامک اطلاع‌رسانی به متقاضیان</span>
            </h3>

            {sendResult && (
              <div
                className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  sendResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                    : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300"
                }`}
              >
                {sendResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{sendResult.message}</span>
              </div>
            )}

            <form onSubmit={handleSendBulk} className="space-y-4 text-xs">
              {/* Recipient Selector */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
                  انتخاب مخاطبان:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecipientType("custom")}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      recipientType === "custom"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    شماره‌های دلخواه (تکی یا لیست)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType("requests")}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      recipientType === "requests"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    ارسال به کلیه متقاضیان نوبت‌دهی
                  </button>
                </div>
              </div>

              {recipientType === "custom" ? (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    شماره موبایل گیرنده(ها):
                  </label>
                  <textarea
                    rows={3}
                    value={customNumbers}
                    onChange={(e) => setCustomNumbers(e.target.value)}
                    placeholder="09121234567&#10;09359876543 (شماره‌ها را با اینتر یا کاما جدا کنید)"
                    dir="ltr"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    فرمت معتبر: 09123456789 (همراه با صفر اول)
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Users size={18} />
                  <span>پیامک به تمام متقاضیانی که در بخش نوبت‌دهی شماره موبایل ثبت کرده‌اند فرستاده خواهد شد.</span>
                </div>
              )}

              {/* Message text */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-700 dark:text-gray-300 font-bold">
                    متن پیامک:
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {charCount} کاراکتر ({partsCount} پارت پیامک فارسی)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="متقاضی محترم، نوبت شما در دفتر کفالت ثبت شد. لطفاً در تاریخ مقرر به آدرس دفتر مراجعه فرمایید. دستیار مهاجر"
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Quick Template Buttons */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 block mb-1.5">
                  متن‌های آماده جهت درج سریع:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "مهاجر گرامی، نوبت شما در سامانه دستیار مهاجر با موفقیت ثبت گردید. جهت پیگیری، کد رهگیری خود را به همراه داشته باشید."
                      )
                    }
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-[10px] font-medium"
                  >
                    + تایید ثبت نوبت
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "هشدار: آخرین مهلت ثبت‌نام در طرح سرشماری اتباع تا پایان هفته جاری می‌باشد. لطفاً هر چه سریع‌تر اقدام فرمایید."
                      )
                    }
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-[10px] font-medium"
                  >
                    + یادآوری مهلت طرح‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSmsMessage(
                        "متقاضی محترم، تذکره الکترونیکی شما چاپ شده و آماده تحویل در شعبه مربوطه است."
                      )
                    }
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-[10px] font-medium"
                  >
                    + اطلاع تحویل تذکره
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sendingSms || !smsMessage.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>{sendingSms ? "درحال ارسال پیامک..." : "ارسال پیامک از طریق sms.ir"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Guide Card */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <ShieldCheck size={20} />
                <span>راهنمای وب‌سرویس sms.ir:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                سامانه پیامک دستیار مهاجر به‌طور مستقیم از طریق API رسمی نسخه جدید سامانه <b>sms.ir</b> اقدام به ارسال پیامک می‌نماید.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>پیامک‌های حاوی لینک یا اطلاع‌رسانی فوری با خطوط خدماتی بدون فیلتر بلک‌لیست ارسال می‌شوند.</li>
                <li>هزینه هر پیامک بر اساس تعرفه مصوب پنل کاربری شما کسر می‌گردد.</li>
                <li>کلیه پیامک‌ها در دیتابیس ثبت شده و در برگه گزارشات قابل رهگیری هستند.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FAST TEMPLATE (VERIFY / OTP / PATTERN)             */}
      {/* ========================================================= */}
      {activeTab === "verify" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm max-w-2xl space-y-5">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <span>ارسال سریع با قالب (پترن و کد تایید - عبور از بلک‌لیست)</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              پیامک‌های قالب (Verify) در کمتر از ۵ ثانیه حتی به شماره‌هایی که پیامک تبلیغاتی را مسدود کرده‌اند ارسال می‌شود.
            </p>
          </div>

          {verifyResult && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                verifyResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300"
              }`}
            >
              {verifyResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{verifyResult.message}</span>
            </div>
          )}

          <form onSubmit={handleSendVerify} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                شماره موبایل گیرنده:
              </label>
              <input
                type="text"
                value={verifyMobile}
                onChange={(e) => setVerifyMobile(e.target.value)}
                placeholder="09121234567"
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                شناسه قالب در sms.ir (Template ID):
              </label>
              <input
                type="text"
                value={verifyTemplateId}
                onChange={(e) => setVerifyTemplateId(e.target.value)}
                placeholder={config.defaultTemplateId || "مثال: 100001"}
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600 space-y-3">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                پارامترهای متغیر در قالب:
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">نام متغیر اول (مثلاً Code):</label>
                  <input
                    type="text"
                    value={paramName1}
                    onChange={(e) => setParamName1(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">مقدار متغیر اول (کد عددی):</label>
                  <input
                    type="text"
                    value={paramVal1}
                    onChange={(e) => setParamVal1(e.target.value)}
                    placeholder="12345"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">نام متغیر دوم (مثلاً Name):</label>
                  <input
                    type="text"
                    value={paramName2}
                    onChange={(e) => setParamName2(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-0.5">مقدار متغیر دوم (نام کاربر):</label>
                  <input
                    type="text"
                    value={paramVal2}
                    onChange={(e) => setParamVal2(e.target.value)}
                    placeholder="احمد رضایی"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingVerify || !verifyMobile}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap size={16} />
              <span>{sendingVerify ? "درحال ارسال..." : "ارسال فوری اعتبارسنجی"}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CONFIGURATION & API KEY                             */}
      {/* ========================================================= */}
      {activeTab === "config" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm max-w-2xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
            <Key className="text-blue-600" size={20} />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              تنظیمات کلید ارتباطی و خط فرستنده sms.ir
            </h3>
          </div>

          {saveFeedback && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                saveFeedback.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300"
              }`}
            >
              {saveFeedback.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{saveFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                کلید وب‌سرویس (API Key):
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={config.hasApiKey ? `کلید فعلی: ${config.maskedKey} (جهت تغییر، کلید جدید وارد کنید)` : "کلید دریافتی از panel.sms.ir را اینجا وارد کنید"}
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                جهت دریافت کلید API، در پنل sms.ir به منوی «برنامه‌نویسان / کلید وب‌سرویس» بروید.
              </span>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                شماره خط اختصاصی فرستنده:
              </label>
              <input
                type="text"
                value={lineNumberInput}
                onChange={(e) => setLineNumberInput(e.target.value)}
                placeholder="مثال: 30007732990001"
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                شناسه پیش‌فرض قالب اعتبارسنجی (اختیاری):
              </label>
              <input
                type="text"
                value={templateIdInput}
                onChange={(e) => setTemplateIdInput(e.target.value)}
                placeholder="مثال: 100001"
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <ShieldCheck size={16} />
                <span>{saveLoading ? "درحال ذخیره‌سازی..." : "ذخیره تنظیمات sms.ir"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SENT LOGS                                          */}
      {/* ========================================================= */}
      {activeTab === "logs" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              <span>تاریخچه پیامک‌های ارسال‌شده از سیستم</span>
            </h3>
            <button
              onClick={fetchLogs}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-lg"
            >
              <RefreshCw size={14} className={loadingLogs ? "animate-spin" : ""} />
            </button>
          </div>

          {loadingLogs ? (
            <div className="text-center py-8 text-xs text-gray-400">درحال بارگذاری تاریخچه...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">هنوز پیامکی ارسال نشده است.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400">
                    <th className="py-2.5 px-3">نوع</th>
                    <th className="py-2.5 px-3">شماره گیرنده</th>
                    <th className="py-2.5 px-3">متن یا قالب</th>
                    <th className="py-2.5 px-3">وضعیت</th>
                    <th className="py-2.5 px-3">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="py-2.5 px-3 font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px]">
                          {log.type === "verify" ? "اعتبارسنجی" : "ارسال پیام"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono" dir="ltr">
                        {log.mobile || (log.mobiles ? `${log.mobiles.length} شماره` : "—")}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-gray-600 dark:text-gray-300">
                        {log.message || `قالب کد ${log.templateId}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.success
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          }`}
                        >
                          {log.success ? "موفق" : "ناموفق"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString("fa-IR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
