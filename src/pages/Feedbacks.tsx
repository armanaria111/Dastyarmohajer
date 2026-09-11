import React, { useState, useEffect } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import {
  Star,
  Trash2,
  CheckCircle2,
  Building2,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  Smartphone,
  Phone,
  ThumbsUp,
  AlertTriangle
} from "lucide-react";

interface FeedbackItem {
  id: string;
  officeCode: string;
  officeName: string;
  rating: number; // 1 to 5
  comment: string;
  userName?: string;
  userPhone?: string;
  platform?: string;
  status?: string;
  createdAt: any;
}

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<string>("all");
  const [officeFilter, setOfficeFilter] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "office_feedbacks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FeedbackItem));
      setFeedbacks(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این نظر اطمینان دارید؟")) {
      await deleteDoc(doc(db, "office_feedbacks", id));
    }
  };

  const handleToggleStatus = async (item: FeedbackItem) => {
    const newStatus = item.status === "reviewed" ? "pending" : "reviewed";
    await updateDoc(doc(db, "office_feedbacks", item.id), {
      status: newStatus
    });
  };

  // Distinct offices for filter
  const distinctOffices = Array.from(new Set(feedbacks.map(f => f.officeCode).filter(Boolean)));

  // Calculate rating stats
  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0
    ? (feedbacks.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalCount).toFixed(1)
    : "۰.۰";

  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: feedbacks.filter(f => Math.round(f.rating) === star).length,
    pct: totalCount > 0 ? Math.round((feedbacks.filter(f => Math.round(f.rating) === star).length / totalCount) * 100) : 0
  }));

  const filteredFeedbacks = feedbacks.filter(item => {
    const matchesStar = starFilter === "all" || Math.round(item.rating) === parseInt(starFilter, 10);
    const matchesOffice = officeFilter === "all" || item.officeCode === officeFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStar && matchesOffice;

    return matchesStar && matchesOffice && (
      (item.officeName || "").toLowerCase().includes(q) ||
      (item.officeCode || "").toLowerCase().includes(q) ||
      (item.comment || "").toLowerCase().includes(q) ||
      (item.userName || "").toLowerCase().includes(q)
    );
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            size={14}
            className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-bold text-amber-100 border border-white/20">
              <Star size={14} className="fill-amber-300 text-amber-300" />
              <span>سامانه ارزیابی کیفیت و تکریم ارباب‌رجوع</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">نظرات و رضایت‌سنجی دفاتر کفالت</h2>
            <p className="text-sm text-amber-100/90 max-w-2xl leading-relaxed">
              مشاهده بازخوردها و امتیازات ثبت‌شده توسط مهاجرین از طریق ربات‌های پیام‌رسان بله، ایتا، روبیکا و تلگرام در خصوص سرعت خدمات، نوبت‌دهی و رفتار پرسنل دفاتر.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center px-3 border-l border-white/20">
              <span className="block text-3xl font-black">{avgRating}</span>
              <span className="text-xs text-amber-100">میانگین رضایت از ۵</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-3xl font-black">{totalCount}</span>
              <span className="text-xs text-amber-100">کل نظرات ثبت‌شده</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Distribution Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Star breakdown bars (5 cols) */}
        <div className="md:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <ThumbsUp size={16} className="text-amber-500" />
            <span>توزیع امتیازات کاربران به دفاتر</span>
          </h3>

          <div className="space-y-2 pt-2">
            {starCounts.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-14 font-bold flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <span>{star}</span>
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-left font-mono text-gray-400 text-[11px]">{count} نظر</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Search & Filters (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Filter size={16} className="text-blue-600" />
              <span>فیلتر و جستجوی پیشرفته بازخوردها</span>
            </h3>

            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در متن نظر، کد دفتر کفالت یا نام کاربر..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 pr-10"
              />
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  امتیاز ستاره:
                </label>
                <select
                  value={starFilter}
                  onChange={(e) => setStarFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">همه ستاره‌ها (۱ تا ۵)</option>
                  <option value="5">فقط ۵ ستاره (عالی)</option>
                  <option value="4">فقط ۴ ستاره (خوب)</option>
                  <option value="3">فقط ۳ ستاره (متوسط)</option>
                  <option value="2">فقط ۲ ستاره (ضعیف)</option>
                  <option value="1">فقط ۱ ستاره (خیلی ضعیف)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  دفتر کفالت:
                </label>
                <select
                  value={officeFilter}
                  onChange={(e) => setOfficeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">همه دفاتر کفالت</option>
                  {distinctOffices.map(code => (
                    <option key={code} value={code}>دفتر کفالت کد {code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <span>نمایش {filteredFeedbacks.length} از {totalCount} نظر</span>
            {(searchQuery || starFilter !== "all" || officeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStarFilter("all");
                  setOfficeFilter("all");
                }}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedbacks Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white text-base">
          لیست نظرات ثبت شده کاربران ربات
        </h3>

        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700 text-center space-y-2">
            <MessageSquare size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">نظری یافت نشد</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              کاربران ربات می‌توانند از طریق گزینه «⭐ نظرسنجی و ثبت نظر دفتر کفالت» در پیام‌رسان‌ها به شعب امتیاز دهند.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-200 dark:hover:border-amber-900/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                          <Building2 size={13} />
                          <span>{item.officeName || `دفتر کفالت کد ${item.officeCode}`}</span>
                        </span>
                        {renderStars(item.rating || 5)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.status === "reviewed"
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        title={item.status === "reviewed" ? "بررسی شده" : "علامت‌گذاری به عنوان بررسی شده"}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="حذف نظر"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                    {item.comment || "کاربر فقط امتیاز ستاره ثبت نموده و توضیحات متنی وارد نکرده است."}
                  </p>
                </div>

                {/* Footer details */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {item.userName || "کاربر ناشناس"}
                    </span>
                    {item.platform && (
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                        {item.platform}
                      </span>
                    )}
                    {item.userPhone && (
                      <a
                        href={`tel:${item.userPhone}`}
                        className="text-blue-600 hover:underline flex items-center gap-0.5 font-mono"
                      >
                        <Phone size={10} />
                        <span>{item.userPhone}</span>
                      </a>
                    )}
                  </div>

                  <span dir="ltr">
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('fa-IR') : 'امروز'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
