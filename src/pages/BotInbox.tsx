import React, { useState } from "react";
import {
  MessageSquare,
  Bot,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Phone,
  CornerDownLeft,
  Sparkles,
  Download,
  Trash2
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

interface SupportMessage {
  id: string;
  userName: string;
  phone: string;
  platform: "eitaa" | "bale" | "rubika" | "telegram" | "soroush";
  chatId: string;
  userMessage: string;
  createdAt: string;
  status: "pending" | "replied";
  replyMessage?: string;
  repliedAt?: string;
}

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: "MSG-801",
    userName: "عبدالله رسولی",
    phone: "09124445566",
    platform: "eitaa",
    chatId: "eitaa_user_4432",
    userMessage: "سلام وقت بخیر، نوبت دفتر کفالت شعبه پیروزی تهران رو گرفتم اما پیامک یا کدرهگیری برام نیومده، آیا نوبت من تایید شده؟",
    createdAt: "۱۰ دقیقه پیش",
    status: "pending"
  },
  {
    id: "MSG-802",
    userName: "مریم احمدزی",
    phone: "09361112233",
    platform: "rubika",
    chatId: "rubika_user_7721",
    userMessage: "با سلام، تذکره همسرم را چند ماه پیش در کابل درخواست داده بودیم، چطور می‌توانم بفهمم به سفارت در تهران رسیده یا خیر؟",
    createdAt: "۳۵ دقیقه پیش",
    status: "pending"
  },
  {
    id: "MSG-803",
    userName: "نورمحمد حیدری",
    phone: "09158889900",
    platform: "bale",
    chatId: "bale_chat_9001",
    userMessage: "سلام، من کارگاه خیاطی در پاکدشت دارم و نیاز به ۳ چرخکار افغانستانی دارم، چطور در بخش کاریابی آگهی بگذارم؟",
    createdAt: "۲ ساعت پیش",
    status: "replied",
    replyMessage: "سلام و احترام. اطلاعات تماس و عنوان شغلی شما ثبت گردید و در سامانه کاریابی دستیار مهاجر منتشر شد. متقاضیان مستقیماً با شما تماس خواهند گرفت.",
    repliedAt: "۱ ساعت پیش"
  },
  {
    id: "MSG-804",
    userName: "کامران سلطانی",
    phone: "09193334455",
    platform: "telegram",
    chatId: "@kamran_slt",
    userMessage: "آیا برای ثبت نام مدارس دخترم که برگه حمایت تحصیلی دارد نیاز به تمدید برگه است؟",
    createdAt: "دیروز",
    status: "replied",
    replyMessage: "سلام. برگه‌های حمایت تحصیلی صادره با ابلاغیه جدید وزارت آموزش و پرورش برای سال تحصیلی جدید معتبر بوده و نیازی به مراجعه حضوری به دفتر کفالت نیست مگر آنکه مدرسه تقاضای تاییدیه جدید نماید.",
    repliedAt: "دیروز"
  }
];

export default function BotInbox() {
  const [messages, setMessages] = useState<SupportMessage[]>(INITIAL_MESSAGES);
  const [selectedMsgId, setSelectedMsgId] = useState<string>(INITIAL_MESSAGES[0].id);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "replied">("all");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const selectedMsg = messages.find((m) => m.id === selectedMsgId) || messages[0];

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.userName.includes(searchTerm) ||
      m.phone.includes(searchTerm) ||
      m.userMessage.includes(searchTerm);
    const matchesPlatform = platformFilter === "all" || m.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMsg) return;

    setIsSendingReply(true);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMsg.id
            ? {
                ...m,
                status: "replied",
                replyMessage: replyText,
                repliedAt: "هم‌اکنون"
              }
            : m
        )
      );
      setReplyText("");
      setIsSendingReply(false);
    }, 600);
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case "eitaa":
        return { name: "ایتا", bg: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800" };
      case "bale":
        return { name: "بله", bg: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800" };
      case "rubika":
        return { name: "روبیکا", bg: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800" };
      case "telegram":
        return { name: "تلگرام", bg: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800" };
      case "soroush":
        return { name: "سروش+", bg: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800" };
      default:
        return { name: platform, bg: "bg-gray-100 text-gray-700" };
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "شناسه پیام",
      "نام کاربر",
      "شماره تماس",
      "پیام‌رسان",
      "شناسه چت",
      "پیام کاربر",
      "وضعیت",
      "پاسخ پشتیبان",
      "زمان پیام",
      "زمان پاسخ"
    ];
    const rows = filteredMessages.map((m) => [
      m.id,
      m.userName,
      m.phone,
      m.platform,
      m.chatId,
      m.userMessage,
      m.status === "replied" ? "پاسخ داده شده" : "در انتظار پاسخ",
      m.replyMessage || "—",
      m.createdAt,
      m.repliedAt || "—"
    ]);
    exportToCSV("پیام_های_پشتیبانی_ربات_ها", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
            <span>صندوق پشتیبانی مستقیم کاربران ربات‌ها (Live Inbox)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            مشاهده پیام‌ها و پرسش‌های کاربران ایتا، بله، روبیکا و تلگرام با امکان پاسخگویی مستقیم و آنی به پی‌وی ربات
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors"
        >
          <Download size={16} />
          <span>خروجی اکسل مکاتبات</span>
        </button>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / List of Conversations (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter box */}
          <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام، شماره یا متن پیام..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار پاسخ</option>
                <option value="replied">پاسخ داده شده</option>
              </select>

              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="all">همه پیام‌رسان‌ها</option>
                <option value="eitaa">ایتا</option>
                <option value="bale">بله</option>
                <option value="rubika">روبیکا</option>
                <option value="telegram">تلگرام</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-gray-400 text-xs">
                هیچ پیامی یافت نشد.
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isSelected = m.id === selectedMsg?.id;
                const platformBadge = getPlatformLabel(m.platform);

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMsgId(m.id)}
                    className={`w-full text-right p-4 rounded-2xl border transition-all text-xs flex flex-col gap-2 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-xs"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-gray-900 dark:text-white">{m.userName}</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${platformBadge.bg}`}>
                          {platformBadge.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">{m.createdAt}</span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed text-[11px]">
                      {m.userMessage}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 w-full text-[10px]">
                      <span className="text-gray-400 font-mono">{m.phone}</span>
                      {m.status === "pending" ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Clock size={11} />
                          <span>در انتظار پاسخ</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>پاسخ داده شد</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right / Message Detail & Reply Box (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col shadow-xs overflow-hidden h-[680px]">
          {selectedMsg ? (
            <>
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">{selectedMsg.userName}</h3>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${getPlatformLabel(selectedMsg.platform).bg}`}>
                        {getPlatformLabel(selectedMsg.platform).name}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {selectedMsg.phone} • شناسه: {selectedMsg.chatId}
                    </div>
                  </div>
                </div>

                <div className="text-left text-xs">
                  <span className="text-gray-400 text-[10px]">ارسال شده:</span>
                  <div className="font-bold text-gray-700 dark:text-gray-300 text-[11px]">{selectedMsg.createdAt}</div>
                </div>
              </div>

              {/* Chat Thread Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {/* User Message Bubble */}
                <div className="flex flex-col items-start max-w-xl">
                  <span className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                    <User size={11} />
                    <span>پیام کاربر ({getPlatformLabel(selectedMsg.platform).name})</span>
                  </span>
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tr-none text-xs text-gray-800 dark:text-gray-100 leading-relaxed shadow-2xs">
                    {selectedMsg.userMessage}
                  </div>
                </div>

                {/* Admin Reply Bubble (if exists) */}
                {selectedMsg.replyMessage && (
                  <div className="flex flex-col items-end max-w-xl mr-auto">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1 font-bold">
                      <Bot size={12} />
                      <span>پاسخ ارسال‌شده توسط اپراتور به ربات کاربر • {selectedMsg.repliedAt}</span>
                    </span>
                    <div className="p-4 bg-blue-600 text-white rounded-2xl rounded-tl-none text-xs leading-relaxed shadow-md">
                      {selectedMsg.replyMessage}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>پاسخ مستقیم به پی‌وی کاربر در {getPlatformLabel(selectedMsg.platform).name}:</span>
                    <span className="text-emerald-600 font-bold">بدون نیاز به شارژ پیامک (رایگان در ربات)</span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="متن پاسخ خود به کاربر را تایپ فرمایید..."
                      className="w-full p-3 text-xs rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>{isSendingReply ? "در حال ارسال به ربات..." : "ارسال پاسخ به کاربر در ربات"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              پیامی انتخاب نشده است.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
