import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  User,
  RefreshCw,
  Scale,
  HelpCircle
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_QUESTIONS = [
  "شرایط افتتاح حساب بانکی و کارت عابربانک برای اتباع چیست؟",
  "آیا با برگه سرشماری می‌توان گواهینامه رانندگی گرفت؟",
  "نحوه دریافت برگه تردد بین استانی برای مسافرت چگونه است؟",
  "مدارک لازم برای تثبیت هویت در سفارت افغانستان چیست؟",
  "قوانین بیمه سلامت و تامین اجتماعی برای مهاجرین چگونه است؟"
];

export default function AiLegalAdvisorModal({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "سلام و درود بر شما هم‌وطن و مهاجر گرامی! من دستیار هوشمند حقوقی و اقامتی «دستیار مهاجر» هستم. می‌توانید هرگونه سوال در مورد قوانین اقامت، دفاتر کفالت، ثبت‌نام مدارس، گواهینامه، امور کنسولی و بانکی را از من بپرسید تا با استناد به آخرین بخشنامه‌ها شما را راهنمایی کنم.",
      timestamp: "هم‌اکنون"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build history
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/ai/legal-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history })
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "خطا در دریافت پاسخ از هوش مصنوعی");
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "متاسفانه ارتباط موقتاً با سرور مشاور هوشمند برقرار نشد. لطفاً چند لحظه بعد مجدداً تلاش فرمایید.",
        timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
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
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 sm:my-6 flex flex-col h-[650px] max-h-[92vh] transition-all relative"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">مشاور هوش مصنوعی اقامتی و حقوقی</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  آنلاین
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5 line-clamp-1">
                پاسخگوی ۲۴ ساعته قوانین اقامت، دفاتر کفالت، پاسپورت و امور بانکی
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

        {/* Suggestion Pills */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
            <span className="text-gray-400 font-bold ml-1">پرسش‌های پرتکرار:</span>
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sq)}
                className="px-3 py-1 rounded-lg bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-600 transition-all hover:border-blue-300"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md shadow-blue-500/20"
                }`}
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-xs whitespace-pre-line"
                }`}
              >
                <div className="text-xs">{m.text}</div>
                <div
                  className={`text-[9px] mt-2 text-right ${
                    m.role === "user" ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot size={16} />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xs text-xs text-gray-500 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                <span>مشاور در حال بررسی قوانین و تدوین پاسخ است...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال خود را درباره اقامت، پاسپورت، گواهینامه، مدارس و امور کنسولی بنویسید..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-xs focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
              title="ارسال پیام"
            >
              <Send size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-gray-700 dark:text-gray-300 rounded-2xl transition-all text-xs font-bold flex items-center gap-1 shrink-0"
              title="بستن پنجره"
            >
              <X size={18} />
              <span className="hidden sm:inline">بستن</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
