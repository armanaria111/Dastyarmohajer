import React, { useState, useEffect, useRef } from "react";
import { processBotMessage, BotResponse, MAIN_KEYBOARD } from "../bot/botEngine";
import { Send, Smartphone, RotateCcw, Sparkles, CheckCheck, Bot, User, ArrowRight, ExternalLink, Phone, Lock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { getPlatformLockConfig } from "../data/channelLockSettings";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const MESSENGERS = [
  { id: "bale", name: "بله (Bale)", color: "bg-emerald-600", headerBg: "bg-emerald-600", userBubble: "bg-emerald-600 text-white" },
  { id: "eitaa", name: "ایتا (Eitaa)", color: "bg-orange-600", headerBg: "bg-orange-600", userBubble: "bg-orange-600 text-white" },
  { id: "soroush", name: "سروش پلاس (Soroush+)", color: "bg-blue-600", headerBg: "bg-blue-600", userBubble: "bg-blue-600 text-white" },
  { id: "rubika", name: "روبیکا (Rubika)", color: "bg-purple-600", headerBg: "bg-purple-600", userBubble: "bg-purple-600 text-white" },
  { id: "gap", name: "گپ (Gap)", color: "bg-sky-600", headerBg: "bg-sky-600", userBubble: "bg-sky-600 text-white" },
  { id: "igap", name: "ایگپ (iGap)", color: "bg-indigo-600", headerBg: "bg-indigo-600", userBubble: "bg-indigo-600 text-white" },
  { id: "telegram", name: "تلگرام (Telegram)", color: "bg-blue-500", headerBg: "bg-blue-500", userBubble: "bg-blue-500 text-white" },
];

export default function BotSimulator() {
  const [selectedPlatform, setSelectedPlatform] = useState("bale");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [keyboard, setKeyboard] = useState<string[][]>(MAIN_KEYBOARD);
  const [sessionState, setSessionState] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessenger = MESSENGERS.find(m => m.id === selectedPlatform) || MESSENGERS[0];

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  };

  // Initialize with greeting
  useEffect(() => {
    resetChat();
  }, [selectedPlatform]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const resetChat = async () => {
    setLoading(true);
    const initial = await processBotMessage({
      platform: selectedPlatform,
      userId: "sim-user-1",
      text: "/start",
      sessionState: {}
    });

    setMessages([
      {
        id: "msg-0",
        sender: "bot",
        text: initial.replyText,
        time: getTimeString()
      }
    ]);
    setKeyboard(initial.keyboard);
    setSessionState(initial.sessionState || {});
    setLoading(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text,
      time: getTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response: BotResponse = await processBotMessage({
        platform: selectedPlatform,
        userId: "sim-user-1",
        text,
        sessionState
      });

      const botMsg: Message = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: response.replyText,
        time: getTimeString()
      };

      setMessages(prev => [...prev, botMsg]);
      setKeyboard(response.keyboard || MAIN_KEYBOARD);
      setSessionState(response.sessionState || {});
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "bot",
          text: `خطا در پردازش پیام: ${err.message}`,
          time: getTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render simple markdown with bold and linebreaks
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // replace **text** with <strong>
      const parts = line.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
      return (
        <div key={idx} className="min-h-[1.2rem]">
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return <code key={pIdx} className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">{part.slice(1, -1)}</code>;
            }
            if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
              const textMatch = part.match(/\[(.*?)\]/);
              const urlMatch = part.match(/\((.*?)\)/);
              if (textMatch && urlMatch) {
                const href = urlMatch[1];
                const isTel = href.startsWith("tel:");
                if (isTel) {
                  return (
                    <a
                      key={pIdx}
                      href={href}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <Phone size={12} className="animate-pulse" />
                      <span>{textMatch[1]}</span>
                    </a>
                  );
                }
                return (
                  <a key={pIdx} href={href} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
                    {textMatch[1]} <ExternalLink size={10} />
                  </a>
                );
              }
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Smartphone size={22} />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">شبیه‌ساز و تست زنده ربات</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            تست عملکرد گفتگو و جستجوی شعب، سفارت‌ها و پیگیری درخواست‌ها در قالب پیام‌رسان‌ها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
          >
            <RotateCcw size={14} />
            <span>شروع مجدد (/start)</span>
          </button>
          <Link
            to="/admin/bots"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Lock size={14} />
            <span>تنظیمات ربات‌ها و قفل کانال</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Platform Switcher & Force Join Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 ml-1">انتخاب پیام‌رسان:</span>
          {MESSENGERS.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedPlatform(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedPlatform === m.id
                  ? `${m.color} text-white shadow-md scale-105`
                  : "bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80"></span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {(() => {
          const lock = getPlatformLockConfig(selectedPlatform);
          return (
            <div className="shrink-0 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold ${
                lock.enabled
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              }`}>
                {lock.enabled ? <Lock size={12} /> : <ShieldCheck size={12} />}
                <span>
                  {lock.enabled ? `عضویت اجباری: ${lock.channelUsername || "فعال"}` : "عضویت آزاد"}
                </span>
              </span>
            </div>
          );
        })()}
      </div>

      {/* Main Grid: Simulator on Center/Left + Quick Test Triggers on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mobile Phone Mockup */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-gray-900 rounded-[40px] p-3 shadow-2xl border-4 border-gray-800">
            {/* Phone Notch & Speaker */}
            <div className="w-full flex justify-center items-center py-1 relative">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-950 rounded-full ml-2"></div>
                <div className="w-10 h-1.5 bg-gray-800 rounded-full"></div>
              </div>
            </div>

            {/* Phone Screen */}
            <div className="w-full bg-[#efeae2] dark:bg-[#0f172a] rounded-[32px] overflow-hidden flex flex-col h-[640px] border border-gray-700/50">
              {/* Messenger Header Bar */}
              <div className={`${currentMessenger.headerBg} text-white px-4 py-3 flex items-center justify-between shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-none">دستیار مهاجر ({currentMessenger.name.split(" ")[0]})</h4>
                    <span className="text-[11px] opacity-80 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      پاسخگوی آنلاین ۲۴/۷
                    </span>
                  </div>
                </div>
                <button onClick={resetChat} title="پاک کردن گفتگو" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-[13px] leading-relaxed relative ${
                        msg.sender === "user"
                          ? `${currentMessenger.userBubble} rounded-br-none`
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200/60 dark:border-gray-700"
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                      <div className={`text-[10px] mt-1.5 text-left flex items-center justify-end gap-1 opacity-60`}>
                        <span>{msg.time}</span>
                        {msg.sender === "user" && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-end">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Keyboard (Bottom buttons like real bot) */}
              {keyboard && keyboard.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-850 p-2 border-t border-gray-200 dark:border-gray-700 space-y-1.5 max-h-40 overflow-y-auto">
                  {keyboard.map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-1.5">
                      {row.map((btnText, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleSendMessage(btnText)}
                          disabled={loading}
                          className="flex-1 py-2 px-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm active:scale-[0.98] transition-all truncate"
                          title={btnText}
                        >
                          {btnText}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="p-2.5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="پیام، کد دفتر کفالت یا نام شهر را بنویسید..."
                  className="flex-1 px-3.5 py-2.5 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || !inputText.trim()}
                  className={`p-2.5 rounded-xl text-white ${currentMessenger.color} hover:opacity-90 disabled:opacity-40 transition-all`}
                >
                  <Send size={16} className="rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Test Actions Side Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-white">
              <Sparkles className="text-amber-500" size={18} />
              <span>فرمان‌های آماده برای تست سریع</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              با کلیک روی هر گزینه، فرمان به ربات ارسال شده و پاسخ متصل به پایگاه داده و دفاتر کفالت نمایش داده می‌شود:
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                  <Lock size={12} />
                  <span>تست عضویت اجباری در کانال (Force Join):</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSendMessage("📢 عضویت در کانال")}
                    className="p-2 bg-white dark:bg-gray-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg text-[11px] font-bold text-amber-900 dark:text-amber-200 text-center transition-all"
                  >
                    📢 دریافت لینک کانال
                  </button>
                  <button
                    onClick={() => handleSendMessage("✅ بررسی و تایید عضویت")}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold text-center transition-all shadow-xs"
                  >
                    ✅ تایید عضویت
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleSendMessage("🏢 جستجوی دفاتر کفالت")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>🔍 تست منوی جستجوی دفاتر کفالت</span>
                <span className="text-gray-400 text-[10px]">🏢 دفاتر کفالت</span>
              </button>

              <button
                onClick={() => handleSendMessage("101")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>📍 جستجوی مستقیم کد دفتر ۱۰۱ (شهرری)</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">101</span>
              </button>

              <button
                onClick={() => handleSendMessage("گلشهر")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>📍 جستجوی دفاتر منطقه گلشهر (مشهد)</span>
                <span className="text-emerald-600 dark:text-emerald-400">گلشهر</span>
              </button>

              <button
                onClick={() => handleSendMessage("📢 آخرین اخبار و بخشنامه‌ها")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>📢 دریافت آخرین اخبار منتشر شده در کانال‌ها</span>
                <span className="text-purple-600 dark:text-purple-400">اخبار کانال‌ها</span>
              </button>

              <button
                onClick={() => handleSendMessage("🏛 سفارت‌ها و کنسولگری‌ها")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>🏛 نمایش لیست سفارتخانه‌ها</span>
                <span className="text-indigo-600 dark:text-indigo-400">سفارت‌ها</span>
              </button>

              <button
                onClick={() => handleSendMessage("🌐 سایت‌های خدماتی")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>🌐 سامانه‌ها و سایت‌های مهم مهاجرین</span>
                <span className="text-purple-600 dark:text-purple-400">سایت‌ها</span>
              </button>

              <button
                onClick={() => handleSendMessage("❓ سوالات متداول")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>❓ پرسش و پاسخ‌های متداول (FAQ)</span>
                <span className="text-amber-600 dark:text-amber-400">سوالات</span>
              </button>

              <button
                onClick={() => handleSendMessage("📝 ثبت درخواست آنلاین")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>📝 ثبت نام آنلاین و دریافت کد رهگیری</span>
                <span className="text-red-500 dark:text-red-400">ثبت نام</span>
              </button>

              <button
                onClick={() => handleSendMessage("🔍 پیگیری وضعیت درخواست")}
                className="w-full text-right p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
              >
                <span>🔍 استعلام و پیگیری لحظه‌ای درخواست</span>
                <span className="text-teal-600 dark:text-teal-400">پیگیری</span>
              </button>
            </div>
          </div>

          {/* Workflow card */}
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-200">
              <Bot size={16} />
              <span>ارتباط همزمان با دیتابیس پنل:</span>
            </h5>
            <p className="leading-relaxed">
              هر تغییری در منوهای <b>«شعب و محله‌ها»</b>، <b>«سفارت‌ها»</b>، <b>«سایت‌های خدماتی»</b> یا <b>«تغییر وضعیت درخواست‌ها»</b> ایجاد کنید، در همان ثانیه در چت‌بات‌های تمامی پیام‌رسان‌ها منعکس می‌گردد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
