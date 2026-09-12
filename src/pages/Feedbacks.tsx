import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Star,
  Trash2,
  Edit2,
  CheckCircle2,
  Building2,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  Smartphone,
  Phone,
  ThumbsUp,
  AlertTriangle,
  Plus,
  X,
  Save
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

  // New Feedback Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState<Partial<FeedbackItem>>({
    officeCode: "301",
    officeName: "دفتر کفالت کد ۳۰۱ تهران (شهرری)",
    rating: 5,
    comment: "",
    userName: "",
    userPhone: "",
    platform: "ایتا",
    status: "pending"
  });

  // Edit Feedback Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    const q = query(collection(db, "office_feedbacks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        } as FeedbackItem));
        setFeedbacks(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

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

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.comment && !newFeedback.rating) {
      alert("لطفاً امتیاز یا متن نظر را وارد فرمایید.");
      return;
    }

    try {
      await addDoc(collection(db, "office_feedbacks"), {
        officeCode: newFeedback.officeCode || "عمومی",
        officeName: newFeedback.officeName || "دفتر کفالت",
        rating: Number(newFeedback.rating) || 5,
        comment: newFeedback.comment || "",
        userName: newFeedback.userName || "مهاجر محترم",
        userPhone: newFeedback.userPhone || "",
        platform: newFeedback.platform || "ربات پیام‌رسان",
        status: newFeedback.status || "reviewed",
        createdAt: Timestamp.now()
      });
      setIsNewModalOpen(false);
      setNewFeedback({
        officeCode: "301",
        officeName: "دفتر کفالت کد ۳۰۱ تهران (شهرری)",
        rating: 5,
        comment: "",
        userName: "",
        userPhone: "",
        platform: "ایتا",
        status: "pending"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (item: FeedbackItem) => {
    setEditingFeedback({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback) return;

    try {
      await updateDoc(doc(db, "office_feedbacks", editingFeedback.id), {
        officeCode: editingFeedback.officeCode,
        officeName: editingFeedback.officeName,
        rating: Number(editingFeedback.rating),
        comment: editingFeedback.comment,
        userName: editingFeedback.userName,
        userPhone: editingFeedback.userPhone,
        platform: editingFeedback.platform,
        status: editingFeedback.status
      });
      setIsEditModalOpen(false);
      setEditingFeedback(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Distinct offices for filter
  const distinctOffices = Array.from(new Set(feedbacks.map((f) => f.officeCode).filter(Boolean)));

  // Calculate rating stats
  const totalCount = feedbacks.length;
  const avgRating =
    totalCount > 0
      ? (feedbacks.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalCount).toFixed(1)
      : "۰.۰";

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbacks.filter((f) => Math.round(f.rating) === star).length,
    pct:
      totalCount > 0
        ? Math.round((feedbacks.filter((f) => Math.round(f.rating) === star).length / totalCount) * 100)
        : 0
  }));

  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesStar = starFilter === "all" || Math.round(item.rating) === parseInt(starFilter, 10);
    const matchesOffice = officeFilter === "all" || item.officeCode === officeFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStar && matchesOffice;

    return (
      matchesStar &&
      matchesOffice &&
      ((item.officeName || "").toLowerCase().includes(q) ||
        (item.officeCode || "").toLowerCase().includes(q) ||
        (item.comment || "").toLowerCase().includes(q) ||
        (item.userName || "").toLowerCase().includes(q))
    );
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
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
              <span>سامانه ثبت رضایت و پایش خدمات دفاتر</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">نظرات و امتیازات مراجعین دفاتر کفالت</h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
              بازخوردهای دریافتی از کاربران ربات‌های بله، ایتا، روبیکا و وب‌سایت در مورد کیفیت تکریم ارباب‌رجوع، سرعت نوبت‌دهی و رضایت عمومی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-amber-800 hover:bg-amber-50 font-black text-xs shadow-xl flex items-center gap-2 transition-transform active:scale-95"
            >
              <Plus size={16} />
              <span>ثبت بازخورد جدید</span>
            </button>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-black">{avgRating}</div>
                <div className="text-[11px] text-amber-100 font-medium mt-0.5">میانگین از ۵</div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <div className="text-3xl font-black">{totalCount}</div>
                <div className="text-[11px] text-amber-100 font-medium mt-0.5">کل نظرات ثبت شده</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
            <ThumbsUp size={16} className="text-amber-500" />
            <span>توزیع درصد رضایتمندی</span>
          </h3>

          <div className="space-y-2 pt-1">
            {starCounts.map((item) => (
              <div key={item.star} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 text-gray-600 dark:text-gray-300 font-bold">
                  <span>{item.star}</span>
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="w-12 text-left font-mono text-gray-400 text-[11px]">
                  {item.pct}٪ ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter controls */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2 mb-3">
              <Filter size={16} className="text-blue-500" />
              <span>فیلتر و جستجوی پیشرفته</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="جستجو در متن، نام دفتر، کد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={starFilter}
                  onChange={(e) => setStarFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="all">همه امتیازات</option>
                  <option value="5">۵ ستاره (عالی)</option>
                  <option value="4">۴ ستاره (خوب)</option>
                  <option value="3">۳ ستاره (متوسط)</option>
                  <option value="2">۲ ستاره (ضعیف)</option>
                  <option value="1">۱ ستاره (ناراضی)</option>
                </select>
              </div>

              <div>
                <select
                  value={officeFilter}
                  onChange={(e) => setOfficeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="all">همه دفاتر کفالت</option>
                  {distinctOffices.map((code) => (
                    <option key={code} value={code}>
                      دفتر کد {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span>تعداد نتایج نمایش داده شده: {filteredFeedbacks.length} مورد</span>
            {(searchQuery || starFilter !== "all" || officeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStarFilter("all");
                  setOfficeFilter("all");
                }}
                className="text-amber-600 hover:underline font-bold"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedbacks Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">در حال بارگذاری نظرات مراجعین...</div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-xs">هیچ نظری با معیارهای مشخص شده یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between gap-4 hover:border-amber-200 dark:hover:border-amber-900 transition-all"
              >
                <div className="space-y-3">
                  {/* Top: Office info & Stars & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black flex items-center gap-1">
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
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="ویرایش نظر"
                      >
                        <Edit2 size={16} />
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
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString("fa-IR") : "امروز"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Feedback Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-amber-500" />
                <span>ثبت نظر و بازخورد جدید برای دفتر کفالت</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFeedback} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    کد دفتر کفالت *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeedback.officeCode}
                    onChange={(e) => setNewFeedback({ ...newFeedback, officeCode: e.target.value })}
                    placeholder="مثال: ۳۰۱"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    امتیاز رضایت (۱ تا ۵)
                  </label>
                  <select
                    value={newFeedback.rating}
                    onChange={(e) => setNewFeedback({ ...newFeedback, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={5}>۵ ستاره - بسیار عالی</option>
                    <option value={4}>۴ ستاره - خوب</option>
                    <option value={3}>۳ ستاره - متوسط</option>
                    <option value={2}>۲ ستاره - ضعیف</option>
                    <option value={1}>۱ ستاره - ناراضی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام دفتر کفالت
                </label>
                <input
                  type="text"
                  value={newFeedback.officeName}
                  onChange={(e) => setNewFeedback({ ...newFeedback, officeName: e.target.value })}
                  placeholder="دفتر کفالت کد ۳۰۱ تهران (شهرری)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام کاربر / متقاضی
                  </label>
                  <input
                    type="text"
                    value={newFeedback.userName}
                    onChange={(e) => setNewFeedback({ ...newFeedback, userName: e.target.value })}
                    placeholder="اختیاری یا ناشناس"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تلفن همراه
                  </label>
                  <input
                    type="text"
                    value={newFeedback.userPhone}
                    onChange={(e) => setNewFeedback({ ...newFeedback, userPhone: e.target.value })}
                    placeholder="0912..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  پیام‌رسان / منبع دریافت
                </label>
                <select
                  value={newFeedback.platform}
                  onChange={(e) => setNewFeedback({ ...newFeedback, platform: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ایتا">ایتا</option>
                  <option value="بله">بله</option>
                  <option value="روبیکا">روبیکا</option>
                  <option value="تلگرام">تلگرام</option>
                  <option value="سروش‌پلاس">سروش‌پلاس</option>
                  <option value="وب‌سایت">وب‌سایت</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  متن دیدگاه / انتقاد / پیشنهاد *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                  placeholder="توضیحات مراجع درباره برخورد پرسنل، معطلی نوبت و..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 text-xs font-black rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-md"
                >
                  ثبت بازخورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Feedback Modal */}
      {isEditModalOpen && editingFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-amber-500" />
                <span>ویرایش نظر و بازخورد</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    کد دفتر کفالت *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFeedback.officeCode}
                    onChange={(e) => setEditingFeedback({ ...editingFeedback, officeCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    امتیاز رضایت (۱ تا ۵)
                  </label>
                  <select
                    value={editingFeedback.rating}
                    onChange={(e) => setEditingFeedback({ ...editingFeedback, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={5}>۵ ستاره - بسیار عالی</option>
                    <option value={4}>۴ ستاره - خوب</option>
                    <option value={3}>۳ ستاره - متوسط</option>
                    <option value={2}>۲ ستاره - ضعیف</option>
                    <option value={1}>۱ ستاره - ناراضی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام دفتر کفالت
                </label>
                <input
                  type="text"
                  value={editingFeedback.officeName}
                  onChange={(e) => setEditingFeedback({ ...editingFeedback, officeName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام کاربر / متقاضی
                  </label>
                  <input
                    type="text"
                    value={editingFeedback.userName || ""}
                    onChange={(e) => setEditingFeedback({ ...editingFeedback, userName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تلفن همراه
                  </label>
                  <input
                    type="text"
                    value={editingFeedback.userPhone || ""}
                    onChange={(e) => setEditingFeedback({ ...editingFeedback, userPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وضعیت بررسی
                </label>
                <select
                  value={editingFeedback.status || "pending"}
                  onChange={(e) => setEditingFeedback({ ...editingFeedback, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="pending">در انتظار بررسی</option>
                  <option value="reviewed">بررسی شده و تایید</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  متن دیدگاه / انتقاد / پیشنهاد *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingFeedback.comment}
                  onChange={(e) => setEditingFeedback({ ...editingFeedback, comment: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 text-xs font-black rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-md flex items-center gap-1.5"
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
