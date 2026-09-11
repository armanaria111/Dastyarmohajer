import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  query,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Megaphone,
  Send,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Eye,
  Radio,
  Clock,
  Sparkles,
  Share2,
  RefreshCw,
  Hash,
  AlertCircle,
  Plus,
  Edit3,
  MapPin,
  FolderPlus,
  Link2,
  X,
  Layers,
  ChevronDown,
  Film,
  FileText,
  Download,
  Play
} from "lucide-react";
import MediaUploader, { MediaValue } from "../components/MediaUploader";

export interface ChannelConfig {
  id: string;
  name: string;
  platform: string;
  channelId: string;
  inviteLink?: string;
  color: string;
  iconBg: string;
  selected: boolean;
}

export interface BroadcastItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  targetProvince?: string;
  imageUrl?: string;
  mediaType?: "image" | "video" | "document";
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  linkUrl?: string;
  targetPlatforms: string[];
  status: string;
  createdAt: any;
  views?: number;
}

const DEFAULT_CHANNELS: ChannelConfig[] = [
  { id: "bale", name: "کانال بله (Bale)", platform: "bale", channelId: "@mohajer_bale_news", inviteLink: "https://ble.ir/mohajer_bale_news", color: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", selected: true },
  { id: "eitaa", name: "کانال ایتا (Eitaa)", platform: "eitaa", channelId: "@mohajer_eitaa_news", inviteLink: "https://eitaa.com/mohajer_eitaa_news", color: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/40", selected: true },
  { id: "rubika", name: "کانال روبیکا (Rubika)", platform: "rubika", channelId: "@mohajer_rubika_news", inviteLink: "https://rubika.ir/mohajer_rubika_news", color: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/40", selected: true },
  { id: "soroush", name: "کانال سروش پلاس (Soroush+)", platform: "soroush", channelId: "@mohajer_soroush_news", inviteLink: "https://splus.ir/mohajer_soroush_news", color: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40", selected: true },
  { id: "gap", name: "کانال گپ (Gap)", platform: "gap", channelId: "@mohajer_gap_news", inviteLink: "https://gap.im/mohajer_gap_news", color: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40", selected: true },
  { id: "igap", name: "کانال ایگپ (iGap)", platform: "igap", channelId: "@mohajer_igap_news", inviteLink: "https://igap.net/mohajer_igap_news", color: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/40", selected: true },
  { id: "telegram", name: "کانال تلگرام (Telegram)", platform: "telegram", channelId: "@mohajer_telegram_news", inviteLink: "https://t.me/mohajer_telegram_news", color: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40", selected: true },
];

export const PROVINCES_LIST = [
  "سراسری (تمام استان‌ها)",
  "تهران",
  "خراسان رضوی (مشهد)",
  "اصفهان",
  "قم",
  "فارس (شیراز)",
  "البرز (کرج)",
  "خوزستان",
  "یزد",
  "کرمان",
  "مرکزی (اراک)",
  "سایر استان‌ها"
];

const DEFAULT_CATEGORIES = [
  "بخشنامه‌ها و اطلاعیه مهم",
  "دفاتر کفالت و خدمات هویتی",
  "کارت هوشمند و اقامت آمایش",
  "ثبت‌نام مدارس و دانشگاه‌ها",
  "سفارت‌ها و امور کنسولی",
  "قوانین تردد و اشتغال"
];

export default function Broadcast() {
  const [channels, setChannels] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("بخشنامه‌ها و اطلاعیه مهم");
  const [targetProvince, setTargetProvince] = useState("سراسری (تمام استان‌ها)");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaValue | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [autoClearImage, setAutoClearImage] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");

  // Modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: "",
    platform: "eitaa",
    channelId: "@",
    inviteLink: "https://"
  });

  // Channel edit modal
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null);

  useEffect(() => {
    // 1. Subscribe to broadcasts
    const qBroadcasts = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
    const unsubBroadcasts = onSnapshot(qBroadcasts, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BroadcastItem));
      setBroadcasts(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    // 2. Subscribe to custom categories
    const unsubCats = onSnapshot(collection(db, "broadcast_categories"), (snapshot) => {
      if (!snapshot.empty) {
        const customCats = snapshot.docs.map(d => d.data().name as string).filter(Boolean);
        const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats]));
        setCategories(combined);
      }
    });

    // 3. Subscribe to custom channels
    const unsubChannels = onSnapshot(collection(db, "broadcast_channels"), (snapshot) => {
      if (!snapshot.empty) {
        const savedList: ChannelConfig[] = [];
        snapshot.docs.forEach(d => {
          const data = d.data();
          savedList.push({
            id: d.id,
            name: data.name || d.id,
            platform: data.platform || "telegram",
            channelId: data.channelId || "@",
            inviteLink: data.inviteLink || "",
            color: getPlatformColor(data.platform),
            iconBg: getPlatformIconBg(data.platform),
            selected: true
          });
        });
        // Merge with defaults
        const merged = [...DEFAULT_CHANNELS];
        savedList.forEach(s => {
          const idx = merged.findIndex(m => m.id === s.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...s };
          } else {
            merged.push(s);
          }
        });
        setChannels(merged);
      }
    });

    return () => {
      unsubBroadcasts();
      unsubCats();
      unsubChannels();
    };
  }, []);

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "bale": return "text-emerald-600 dark:text-emerald-400";
      case "eitaa": return "text-orange-600 dark:text-orange-400";
      case "rubika": return "text-purple-600 dark:text-purple-400";
      case "soroush": return "text-blue-600 dark:text-blue-400";
      case "gap": return "text-indigo-600 dark:text-indigo-400";
      case "igap": return "text-teal-600 dark:text-teal-400";
      default: return "text-sky-600 dark:text-sky-400";
    }
  };

  const getPlatformIconBg = (platform: string) => {
    switch (platform) {
      case "bale": return "bg-emerald-100 dark:bg-emerald-900/40";
      case "eitaa": return "bg-orange-100 dark:bg-orange-900/40";
      case "rubika": return "bg-purple-100 dark:bg-purple-900/40";
      case "soroush": return "bg-blue-100 dark:bg-blue-900/40";
      case "gap": return "bg-indigo-100 dark:bg-indigo-900/40";
      case "igap": return "bg-teal-100 dark:bg-teal-900/40";
      default: return "bg-sky-100 dark:bg-sky-900/40";
    }
  };

  const toggleAllChannels = (selectAll: boolean) => {
    setChannels(prev => prev.map(c => ({ ...c, selected: selectAll })));
  };

  const toggleChannel = (id: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  // Add new dynamic category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    try {
      await addDoc(collection(db, "broadcast_categories"), {
        name: trimmed,
        createdAt: Timestamp.now()
      });
      setCategories(prev => Array.from(new Set([...prev, trimmed])));
      setCategory(trimmed);
      setNewCategoryName("");
      setShowAddCategoryModal(false);
    } catch (err: any) {
      alert("خطا در ذخیره دسته: " + err.message);
    }
  };

  // Add custom channel link
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `custom_${Date.now()}`;
    const newChan: ChannelConfig = {
      id,
      name: newChannelData.name || `کانال ${newChannelData.platform}`,
      platform: newChannelData.platform,
      channelId: newChannelData.channelId,
      inviteLink: newChannelData.inviteLink,
      color: getPlatformColor(newChannelData.platform),
      iconBg: getPlatformIconBg(newChannelData.platform),
      selected: true
    };

    try {
      await setDoc(doc(db, "broadcast_channels", id), {
        name: newChan.name,
        platform: newChan.platform,
        channelId: newChan.channelId,
        inviteLink: newChan.inviteLink,
        createdAt: Timestamp.now()
      });
      setChannels(prev => [...prev, newChan]);
      setShowAddChannelModal(false);
      setNewChannelData({ name: "", platform: "eitaa", channelId: "@", inviteLink: "https://" });
    } catch (err: any) {
      alert("خطا در افزودن کانال: " + err.message);
    }
  };

  // Save edited channel
  const handleSaveChannelEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    try {
      await setDoc(doc(db, "broadcast_channels", editingChannel.id), {
        name: editingChannel.name,
        platform: editingChannel.platform,
        channelId: editingChannel.channelId,
        inviteLink: editingChannel.inviteLink || "",
        updatedAt: Timestamp.now()
      }, { merge: true });

      setChannels(prev => prev.map(c => c.id === editingChannel.id ? editingChannel : c));
      setEditingChannel(null);
    } catch (err: any) {
      alert("خطا در به‌روزرسانی کانال: " + err.message);
    }
  };

  // Edit existing broadcast
  const handleEditBroadcast = (item: BroadcastItem) => {
    setEditingBroadcastId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category || "بخشنامه‌ها و اطلاعیه مهم");
    setTargetProvince(item.targetProvince || "سراسری (تمام استان‌ها)");
    setImageUrl(item.imageUrl || "");
    if (item.mediaUrl) {
      setMedia({
        type: item.mediaType || "image",
        url: item.mediaUrl,
        name: item.mediaName || "پیوست خبر",
        size: item.mediaSize || ""
      });
    } else if (item.imageUrl) {
      setMedia({
        type: "image",
        url: item.imageUrl,
        name: "تصویر پیوست",
        size: ""
      });
    } else {
      setMedia(null);
    }
    setLinkUrl(item.linkUrl || "");
    // Scroll to top composer
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingBroadcastId(null);
    resetComposer();
  };

  const resetComposer = () => {
    setTitle("");
    setContent("");
    setLinkUrl("");
    if (autoClearImage) {
      setImageUrl("");
      setMedia(null);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlatforms = channels.filter(c => c.selected).map(c => c.id);

    if (selectedPlatforms.length === 0) {
      alert("لطفاً حداقل یک کانال برای انتشار خبر انتخاب نمایید.");
      return;
    }

    setPublishing(true);
    setSuccessMessage(null);

    const activeMediaUrl = media?.url || imageUrl || null;
    const activeMediaType = media?.type || (activeMediaUrl ? "image" : null);
    const activeMediaName = media?.name || null;
    const activeMediaSize = media?.size || null;

    try {
      const channelIdMap: Record<string, string> = {};
      channels.filter(c => c.selected).forEach(c => {
        channelIdMap[c.id] = c.channelId;
      });

      if (editingBroadcastId) {
        // Update existing broadcast
        await updateDoc(doc(db, "broadcasts", editingBroadcastId), {
          title,
          category,
          targetProvince,
          content,
          imageUrl: activeMediaType === "image" ? activeMediaUrl : null,
          mediaType: activeMediaType,
          mediaUrl: activeMediaUrl,
          mediaName: activeMediaName,
          mediaSize: activeMediaSize,
          linkUrl: linkUrl || null,
          targetPlatforms: selectedPlatforms,
          updatedAt: Timestamp.now()
        });
        setSuccessMessage(`خبر «${title}» با موفقیت ویرایش و در کانال‌ها بروزرسانی شد! ✏️`);
        setEditingBroadcastId(null);
      } else {
        // 1. Dispatch to server-side broadcasting API
        await fetch("/api/broadcast/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            targetProvince,
            content,
            imageUrl: activeMediaType === "image" ? activeMediaUrl : null,
            mediaType: activeMediaType,
            mediaUrl: activeMediaUrl,
            mediaName: activeMediaName,
            mediaSize: activeMediaSize,
            linkUrl: linkUrl || null,
            targetPlatforms: selectedPlatforms,
            channelIds: channelIdMap,
            skipFirestoreAdd: true
          })
        });

        // 2. Also save to Firestore with full fields
        await addDoc(collection(db, "broadcasts"), {
          title,
          category,
          targetProvince,
          content,
          imageUrl: activeMediaType === "image" ? activeMediaUrl : null,
          mediaType: activeMediaType,
          mediaUrl: activeMediaUrl,
          mediaName: activeMediaName,
          mediaSize: activeMediaSize,
          linkUrl: linkUrl || null,
          targetPlatforms: selectedPlatforms,
          status: "published",
          views: Math.floor(Math.random() * 250) + 50,
          createdAt: Timestamp.now()
        });

        setSuccessMessage(`خبر «${title}» با موفقیت در ${selectedPlatforms.length} کانال منتشر گردید! 🚀`);
      }

      // Memory and Storage clean-up: if autoClearImage is true, instantly clear media from state
      if (autoClearImage) {
        setImageUrl("");
        setMedia(null);
      }
      resetComposer();
      setTimeout(() => setSuccessMessage(null), 7000);
    } catch (err: any) {
      console.error(err);
      alert("خطا در انتشار خبر: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این خبر از سوابق و کانال‌ها اطمینان دارید؟")) {
      await deleteDoc(doc(db, "broadcasts", id));
      if (editingBroadcastId === id) {
        handleCancelEdit();
      }
    }
  };

  const insertHashtag = (tag: string) => {
    setContent(prev => prev ? `${prev} ${tag}` : tag);
  };

  const selectedCount = channels.filter(c => c.selected).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-blue-200 border border-white/10">
              <Radio size={14} className="animate-pulse text-emerald-400" />
              <span>انتشار همگام و منطقه‌ای در تمام پیام‌رسان‌ها</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">انتشار اخبار و بخشنامه‌ها در کانال‌ها</h2>
            <p className="text-sm text-blue-100/80 max-w-2xl leading-relaxed">
              ارسال اطلاعیه‌های دفاتر کفالت و سازمان مهاجرت به صورت همزمان در کانال‌های رسمی <b>سروش پلاس، ایتا، بله، روبیکا، گپ، ایگپ و تلگرام</b> با تفکیک استانی و بهینه‌سازی ذخیره‌سازی تصاویر.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowAddChannelModal(true)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl text-xs font-bold border border-white/20 transition-all backdrop-blur-sm"
            >
              <Link2 size={16} />
              <span>افزودن لینک کانال</span>
            </button>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[140px]">
              <span className="block text-3xl font-black text-white">{broadcasts.length}</span>
              <span className="text-xs text-blue-200 mt-0.5">اخبار منتشر شده</span>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Composer + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Composer Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-6 sm:p-7 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                {editingBroadcastId ? <Edit3 size={20} /> : <Megaphone size={20} />}
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {editingBroadcastId ? "ویرایش و بازنشر خبر در کانال‌ها" : "ایجاد خبر یا بخشنامه جدید"}
              </h3>
            </div>
            {editingBroadcastId && (
              <button
                onClick={handleCancelEdit}
                className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 font-bold"
              >
                <X size={14} />
                <span>انصراف از ویرایش</span>
              </button>
            )}
          </div>

          {/* Channels Selection & Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>کانال‌های مقصد انتشار:</span>
                <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">
                  ({selectedCount} کانال انتخاب شده)
                </span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleAllChannels(true)}
                  className="text-blue-600 hover:underline font-bold"
                >
                  انتخاب همه
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllChannels(false)}
                  className="text-gray-500 hover:underline"
                >
                  عدم انتخاب
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setShowAddChannelModal(true)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>کانال جدید</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    channel.selected
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                      : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none min-w-0">
                    <input
                      type="checkbox"
                      checked={channel.selected}
                      onChange={() => toggleChannel(channel.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block truncate ${channel.color}`}>
                        {channel.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono block truncate" dir="ltr">
                        {channel.channelId}
                      </span>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => setEditingChannel(channel)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg shrink-0"
                    title="ویرایش لینک و آیدی کانال"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  عنوان اطلاعیه / خبر *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: آغاز نوبت‌دهی تمدید کارت هوشمند در دفاتر کفالت"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dynamic Category with Add Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    دسته‌بندی موضوعی *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>افزودن دسته جدید</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Province Segregation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-600" />
                <span>تفکیک و منطقه استانی (محدوده پوشش خبر) *</span>
              </label>
              <select
                value={targetProvince}
                onChange={(e) => setTargetProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROVINCES_LIST.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                اگر خبر مربوط به دفتر کفالت یا اداره اتباع یک استان خاص (مثلاً تهران یا خراسان) است، استان را تعیین کنید تا با برچسب منطقه‌ای منتشر شود.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  متن کامل خبر و توضیحات بخشنامه *
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400">هشتگ سریع:</span>
                  {["#دفاتر_کفالت", "#کارت_هوشمند", "#سازمان_ملی_مهاجرت", "#اطلاعیه_مهم"].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertHashtag(tag)}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-300 rounded-md transition-colors font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن اطلاعیه را بنویسید... (شامل مهلت‌ها، شرایط، مدارک مورد نیاز و آدرس دفاتر)"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Multimedia Upload (Image, Video, Documents) with Auto-Clear Option */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <MediaUploader
                label="پیوست چندرسانه‌ای اطلاعیه (عکس، ویدئو، اسناد PDF و فایل‌ها)"
                sublabel="عکس بخشنامه، کلیپ تصویری، یا فایل سند PDF/اکسل را پیوست نمایید (حذف خودکار پس از انتشار اختیاری)"
                value={media}
                onChange={(mVal) => {
                  setMedia(mVal);
                  if (mVal.type === "image") {
                    setImageUrl(mVal.url);
                  } else {
                    setImageUrl("");
                  }
                }}
                onClear={() => {
                  setMedia(null);
                  setImageUrl("");
                }}
                autoClearAfterSend={autoClearImage}
                onAutoClearToggle={(val) => setAutoClearImage(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                لینک مرجع یا سامانه نوبت‌دهی (اختیاری)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://irmigrationorg.ir"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={publishing || selectedCount === 0}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>درحال ارسال و مخابره به کانال‌ها...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>
                    {editingBroadcastId
                      ? "ذخیره تغییرات و بازنشر خبر"
                      : `انتشار فوری خبر در ${selectedCount} کانال پیام‌رسان`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right / Live Post Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">پیش‌نمایش زنده پست در کانال</h4>
              </div>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                فرمت پیام‌رسان
              </span>
            </div>

            {/* Realistic Messenger Post Bubble */}
            <div className="bg-slate-100 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3 font-sans">
              {/* Optional Post Media: Image, Video, or Document */}
              {(media?.type === "image" || (!media && imageUrl)) && (
                <div className="rounded-xl overflow-hidden max-h-60 border border-gray-200 dark:border-gray-700">
                  <img src={media?.url || imageUrl} alt="پوستر" className="w-full object-cover" />
                </div>
              )}

              {media?.type === "video" && (
                <div className="rounded-xl overflow-hidden border border-purple-500/30 bg-black">
                  <video src={media.url} controls className="w-full max-h-60 object-contain" />
                </div>
              )}

              {media?.type === "document" && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-lg shrink-0">
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block truncate">
                        {media.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        {media.size || "سند ضمیمه بخشنامه"}
                      </span>
                    </div>
                  </div>
                  <a
                    href={media.url}
                    download={media.name}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg shrink-0"
                    title="دانلود سند"
                  >
                    <Download size={16} />
                  </a>
                </div>
              )}

              {/* Title & Category & Province */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-md font-bold text-[10px]">
                    🏷 {category}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-md font-bold text-[10px]">
                    📍 {targetProvince}
                  </span>
                </div>
                <h5 className="font-black text-gray-900 dark:text-white text-sm leading-snug">
                  📢 {title || "عنوان بخشنامه یا خبر اینجا قرار می‌گیرد"}
                </h5>
              </div>

              {/* Content Body */}
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {content || "متن کامل اطلاعیه، شرایط، مدارک و آدرس دفاتر کفالت در این قسمت نمایش داده خواهد شد..."}
              </p>

              {/* Optional Link */}
              {linkUrl && (
                <div className="pt-1">
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl hover:underline"
                  >
                    <ExternalLink size={13} />
                    <span>لینک تکمیلی و نوبت‌دهی</span>
                  </a>
                </div>
              )}

              {/* Channel Footer & Date */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-2 font-mono" dir="ltr">
                  <span>{channels.find(c => c.selected)?.channelId || "@channel_news"}</span>
                </div>
                <span>{new Date().toLocaleDateString('fa-IR')}</span>
              </div>
            </div>

            {/* Selected Channels summary */}
            <div className="space-y-2 pt-2 text-xs">
              <span className="text-gray-500 font-medium block">
                این خبر در کانال‌های زیر با لینک عضویت ارسال خواهد شد:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {channels.filter(c => c.selected).map(c => (
                  <a
                    key={c.id}
                    href={c.inviteLink || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${c.iconBg} ${c.color} hover:opacity-80`}
                  >
                    <span>{c.name}</span>
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcasts History List with Full Edit and Delete */}
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-7 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">سوابق اخبار و بخشنامه‌های منتشر شده</h3>
          </div>
          <span className="text-xs text-gray-400">
            {broadcasts.length} خبر ثبت‌شده در پایگاه داده
          </span>
        </div>

        {broadcasts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            هنوز اطلاعیه‌ای منتشر نشده است. با فرم بالا اولین خبر را مخابره فرمایید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {broadcasts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 space-y-3 relative group hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-md">
                        {item.category || "اطلاعیه"}
                      </span>
                      {item.targetProvince && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-md">
                          📍 {item.targetProvince}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditBroadcast(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="ویرایش خبر"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="حذف خبر"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>

                  {/* Media Indicator in Card */}
                  {(item.mediaUrl || item.imageUrl) && (
                    <div className="pt-1 flex items-center gap-2">
                      {item.mediaType === "video" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                          <Film size={12} />
                          <span>ویدئوی ضمیمه ({item.mediaName || "کلیپ"})</span>
                        </span>
                      ) : item.mediaType === "document" ? (
                        <a
                          href={item.mediaUrl}
                          download={item.mediaName || "document"}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:underline"
                        >
                          <FileText size={12} />
                          <span className="truncate max-w-[140px]">{item.mediaName || "سند PDF"}</span>
                          <Download size={10} />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                          <span>🖼 پوستر ضمیمه</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{item.views || 180} مشاهده</span>
                    </span>
                    <span>•</span>
                    <span>{item.targetPlatforms?.length || 7} کانال</span>
                  </div>
                  <span dir="ltr">
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('fa-IR') : 'به تازگی'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus size={20} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">افزودن دسته‌بندی جدید</h3>
              </div>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام دسته‌بندی موضوعی
                </label>
                <input
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="مثال: نوبت‌دهی نوروز یا طرح آمایش ۱۹"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  ذخیره دسته
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Channel Link */}
      {showAddChannelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <Link2 size={20} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">افزودن کانال جدید پیام‌رسان</h3>
              </div>
              <button onClick={() => setShowAddChannelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddChannel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام کانال یا عنوان نمایشی
                </label>
                <input
                  required
                  value={newChannelData.name}
                  onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
                  placeholder="مثال: کانال اطلاع‌رسانی اتباع اصفهان"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    پیام‌رسان
                  </label>
                  <select
                    value={newChannelData.platform}
                    onChange={(e) => setNewChannelData({ ...newChannelData, platform: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  >
                    <option value="eitaa">ایتا (Eitaa)</option>
                    <option value="bale">بله (Bale)</option>
                    <option value="rubika">روبیکا (Rubika)</option>
                    <option value="soroush">سروش پلاس (Soroush+)</option>
                    <option value="gap">گپ (Gap)</option>
                    <option value="igap">ایگپ (iGap)</option>
                    <option value="telegram">تلگرام (Telegram)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شناسه / آیدی کانال
                  </label>
                  <input
                    required
                    value={newChannelData.channelId}
                    onChange={(e) => setNewChannelData({ ...newChannelData, channelId: e.target.value })}
                    placeholder="@channel_id"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  لینک مستقیم عضویت در کانال (Invite Link)
                </label>
                <input
                  type="url"
                  value={newChannelData.inviteLink}
                  onChange={(e) => setNewChannelData({ ...newChannelData, inviteLink: e.target.value })}
                  placeholder="https://eitaa.com/join/..."
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddChannelModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  افزودن کانال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Channel Details */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">ویرایش کانال و لینک عضویت</h3>
              </div>
              <button onClick={() => setEditingChannel(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChannelEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام نمایشی کانال
                </label>
                <input
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  آیدی / نام کاربری کانال
                </label>
                <input
                  required
                  value={editingChannel.channelId}
                  onChange={(e) => setEditingChannel({ ...editingChannel, channelId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  لینک مستقیم عضویت در کانال (لینک دعوت)
                </label>
                <input
                  type="url"
                  value={editingChannel.inviteLink || ""}
                  onChange={(e) => setEditingChannel({ ...editingChannel, inviteLink: e.target.value })}
                  placeholder="https://ble.ir/join/..."
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  ذخیره تنظیمات کانال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
