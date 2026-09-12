import React, { useState, useEffect } from "react";
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
  Trash2,
  Edit2,
  Plus,
  X,
  Save
} from "lucide-react";
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
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

  // New Message Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState<Partial<SupportMessage>>({
    userName: "",
    phone: "",
    platform: "eitaa",
    chatId: "",
    userMessage: "",
    status: "pending"
  });

  // Edit Message Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SupportMessage | null>(null);

  // Sync with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "support_messages"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportMessage));
        setMessages(list);
        if (list.length > 0 && !list.some((m) => m.id === selectedMsgId)) {
          setSelectedMsgId(list[0].id);
        }
      } else {
        INITIAL_MESSAGES.forEach((item) => {
          setDoc(doc(db, "support_messages", item.id), item).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  const selectedMsg = messages.find((m) => m.id === selectedMsgId) || messages[0];

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      (m.userName || "").includes(searchTerm) ||
      (m.phone || "").includes(searchTerm) ||
      (m.userMessage || "").includes(searchTerm);
    const matchesPlatform = platformFilter === "all" || m.platform === platformFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMsg) return;

    setIsSendingReply(true);
    const repliedAt = "هم‌اکنون";
    setTimeout(async () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMsg.id
            ? {
                ...m,
                status: "replied",
                replyMessage: replyText,
                repliedAt
              }
            : m
        )
      );

      try {
        await updateDoc(doc(db, "support_messages", selectedMsg.id), {
          status: "replied",
          replyMessage: replyText,
          repliedAt
        });
      } catch {
        // fallback
      }

      setReplyText("");
      setIsSendingReply(false);
    }, 500);
  };

  const handleDeleteMessage = async (id: string) => {
    if (confirm("آیا از حذف این پیام و تیکت پشتیبانی اطمینان دارید؟")) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      try {
        await deleteDoc(doc(db, "support_messages", id));
      } catch {
        // fallback
      }
    }
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.userName || !newMessage.userMessage) {
      alert("لطفاً نام کاربر و متن پیام را وارد فرمایید.");
      return;
    }
    const id = `MSG-${Date.now().toString().slice(-4)}`;
    const created: SupportMessage = {
      id,
      userName: newMessage.userName || "",
      phone: newMessage.phone || "",
      platform: (newMessage.platform as any) || "eitaa",
      chatId: newMessage.chatId || newMessage.phone || "user_bot",
      userMessage: newMessage.userMessage || "",
      createdAt: "لحظاتی پیش",
      status: "pending"
    };

    setMessages([created, ...messages]);
    setSelectedMsgId(id);
    setIsNewModalOpen(false);
    setNewMessage({
      userName: "",
      phone: "",
      platform: "eitaa",
      chatId: "",
      userMessage: "",
      status: "pending"
    });

    try {
      await setDoc(doc(db, "support_messages", id), created);
    } catch {
      // fallback
    }
  };

  const handleOpenEdit = (msg: SupportMessage) => {
    setEditingMessage({ ...msg });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage) return;

    setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? editingMessage : m)));
    setIsEditModalOpen(false);

    try {
      await updateDoc(doc(db, "support_messages", editingMessage.id), { ...editingMessage });
    } catch {
      // fallback
    }
    setEditingMessage(null);
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
      getPlatformLabel(m.platform).name,
      m.chatId,
      m.userMessage,
      m.status === "replied" ? "پاسخ داده شده" : "در انتظار پاسخ",
      m.replyMessage || "-",
      m.createdAt,
      m.repliedAt || "-"
    ]);
    exportToCSV("صندوق_پیام_های_پشتیبانی_ربات", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
            <span>صندوق پیام‌ها و تیکت‌های پشتیبانی ربات‌ها</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            دریافت سوالات و تقاضاهای متقاضیان از ایتا، بله، روبیکا، تلگرام و سروش‌پلاس با قابلیت ارسال پاسخ آنی
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus size={16} />
            <span>ثبت تیکت جدید</span>
          </button>
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Messages List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col h-[750px]">
          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام، شماره یا متن پیام..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه پیام‌رسان‌ها</option>
                <option value="eitaa">ایتا</option>
                <option value="bale">بله</option>
                <option value="rubika">روبیکا</option>
                <option value="telegram">تلگرام</option>
                <option value="soroush">سروش+</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار پاسخ</option>
                <option value="replied">پاسخ داده شده</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">هیچ پیامی با این مشخصات یافت نشد.</div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMsg?.id;
                const platformBadge = getPlatformLabel(msg.platform);

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMsgId(msg.id)}
                    className={`p-4 text-right cursor-pointer transition-colors relative group ${
                      isSelected
                        ? "bg-blue-50/60 dark:bg-blue-950/30 border-r-4 border-blue-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-gray-900 dark:text-white">{msg.userName}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${platformBadge.bg}`}>
                          {platformBadge.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">{msg.createdAt}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(msg);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity"
                          title="ویرایش پیام"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition-opacity"
                          title="حذف پیام"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                      {msg.userMessage}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-[11px]">
                      <span className="font-mono text-gray-400">{msg.phone}</span>
                      {msg.status === "replied" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>پاسخ داده شد</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <Clock size={12} />
                          <span>در انتظار پاسخ</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right / Conversation & Reply (7 cols) */}
        {selectedMsg ? (
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col h-[750px]">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  {selectedMsg.userName[0]}
                </div>
                <div>
                  <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{selectedMsg.userName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getPlatformLabel(selectedMsg.platform).bg}`}>
                      {getPlatformLabel(selectedMsg.platform).name}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="text-blue-500" />
                      {selectedMsg.phone}
                    </span>
                    <span>شناسه ربات: {selectedMsg.chatId}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(selectedMsg)}
                  className="p-2 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="ویرایش تیکت"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMsg.id)}
                  className="p-2 text-gray-500 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="حذف پیام"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-900/20">
              {/* User Message Bubble */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
                  <User size={14} />
                </div>
                <div className="max-w-xl bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tr-xs border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                    {selectedMsg.userMessage}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 font-mono text-left">{selectedMsg.createdAt}</div>
                </div>
              </div>

              {/* Bot / Admin Reply Bubble */}
              {selectedMsg.replyMessage && (
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-xl bg-blue-600 text-white p-4 rounded-2xl rounded-tl-xs shadow-md">
                    <div className="text-xs leading-relaxed">{selectedMsg.replyMessage}</div>
                    <div className="text-[10px] text-blue-100 mt-2 text-left flex items-center justify-end gap-1">
                      <CheckCircle2 size={11} />
                      <span>ارسال شده در پیام‌رسان • {selectedMsg.repliedAt}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <Bot size={14} />
                  </div>
                </div>
              )}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800">
              <div className="relative">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`پاسخ مستقیم به ${selectedMsg.userName} در پیام‌رسان ${getPlatformLabel(selectedMsg.platform).name}...`}
                  className="w-full p-3 pl-24 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="absolute left-3 bottom-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSendingReply ? "در حال مخابره..." : "ارسال پاسخ"}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-gray-400">
            پیامی انتخاب نشده است.
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                <span>ثبت تیکت / پیام پشتیبانی جدید</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMessage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی کاربر *
                </label>
                <input
                  type="text"
                  required
                  value={newMessage.userName}
                  onChange={(e) => setNewMessage({ ...newMessage, userName: e.target.value })}
                  placeholder="مثال: عبدالله رسولی"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس همراه
                  </label>
                  <input
                    type="text"
                    value={newMessage.phone}
                    onChange={(e) => setNewMessage({ ...newMessage, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">پیام‌رسان</label>
                  <select
                    value={newMessage.platform}
                    onChange={(e) => setNewMessage({ ...newMessage, platform: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="eitaa">ایتا</option>
                    <option value="bale">بله</option>
                    <option value="rubika">روبیکا</option>
                    <option value="telegram">تلگرام</option>
                    <option value="soroush">سروش+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  شناسه چت در ربات (Chat ID)
                </label>
                <input
                  type="text"
                  value={newMessage.chatId}
                  onChange={(e) => setNewMessage({ ...newMessage, chatId: e.target.value })}
                  placeholder="مثال: eitaa_user_4432"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  متن پیام یا سوال کاربر *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newMessage.userMessage}
                  onChange={(e) => setNewMessage({ ...newMessage, userMessage: e.target.value })}
                  placeholder="سوال کاربر درباره نوبت، تذکره، مدارک یا خدمات..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  ثبت تیکت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {isEditModalOpen && editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                <span>ویرایش تیکت / پیام ({editingMessage.id})</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی کاربر *
                </label>
                <input
                  type="text"
                  required
                  value={editingMessage.userName}
                  onChange={(e) => setEditingMessage({ ...editingMessage, userName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس همراه
                  </label>
                  <input
                    type="text"
                    value={editingMessage.phone}
                    onChange={(e) => setEditingMessage({ ...editingMessage, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">پیام‌رسان</label>
                  <select
                    value={editingMessage.platform}
                    onChange={(e) => setEditingMessage({ ...editingMessage, platform: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="eitaa">ایتا</option>
                    <option value="bale">بله</option>
                    <option value="rubika">روبیکا</option>
                    <option value="telegram">تلگرام</option>
                    <option value="soroush">سروش+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وضعیت پاسخ
                </label>
                <select
                  value={editingMessage.status}
                  onChange={(e) => setEditingMessage({ ...editingMessage, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">در انتظار پاسخ</option>
                  <option value="replied">پاسخ داده شده</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  متن پیام کاربر *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingMessage.userMessage}
                  onChange={(e) => setEditingMessage({ ...editingMessage, userMessage: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  متن پاسخ پشتیبان
                </label>
                <textarea
                  rows={2}
                  value={editingMessage.replyMessage || ""}
                  onChange={(e) => setEditingMessage({ ...editingMessage, replyMessage: e.target.value })}
                  placeholder="متن پاسخ ارسال شده برای کاربر..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
