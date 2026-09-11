import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Trash2,
  Edit3,
  Plus,
  X,
  Phone,
  MessageSquare
} from "lucide-react";

interface RequestItem {
  id: string;
  trackingCode?: string;
  applicantName?: string;
  phone?: string;
  requestType?: string;
  officeCode?: string;
  status: string;
  adminNotes?: string;
  createdAt: any;
}

export default function Requests() {
  const [data, setData] = useState<RequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingItem, setEditingItem] = useState<RequestItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    applicantName: "",
    phone: "",
    requestType: "نوبت‌دهی تمدید کارت آمایش",
    officeCode: "",
    status: "pending",
    adminNotes: ""
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "requests"), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RequestItem)));
    });
    return () => unsub();
  }, []);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    await updateDoc(doc(db, "requests", editingItem.id), {
      status: editingItem.status,
      adminNotes: editingItem.adminNotes || "",
      applicantName: editingItem.applicantName || "",
      phone: editingItem.phone || "",
      requestType: editingItem.requestType || "",
      updatedAt: Timestamp.now()
    });

    setEditingItem(null);
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackingCode = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    await addDoc(collection(db, "requests"), {
      trackingCode,
      ...formData,
      createdAt: Timestamp.now()
    });
    setIsAdding(false);
    setFormData({
      applicantName: "",
      phone: "",
      requestType: "نوبت‌دهی تمدید کارت آمایش",
      officeCode: "",
      status: "pending",
      adminNotes: ""
    });
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`آیا از حذف درخواست با کد رهگیری «${code}» اطمینان دارید؟`)) {
      await deleteDoc(doc(db, "requests", id));
      if (editingItem?.id === id) {
        setEditingItem(null);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'rejected': return <XCircle className="text-red-500" size={18} />;
      case 'in_progress': return <AlertCircle className="text-blue-500" size={18} />;
      default: return <Clock className="text-amber-500" size={18} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'تایید شده و نوبت صادر شد';
      case 'rejected': return 'رد شده / نقص مدرک';
      case 'in_progress': return 'در حال پیگیری در دفتر';
      default: return 'در انتظار بررسی اولیه';
    }
  };

  const filteredData = data.filter(item => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    const code = (item.trackingCode || item.id).toLowerCase();
    const name = (item.applicantName || "").toLowerCase();
    const phone = (item.phone || "").toLowerCase();
    return matchesStatus && (code.includes(q) || name.includes(q) || phone.includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">درخواست‌ها و نوبت‌دهی</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">مدیریت، پیگیری وضعیت، ویرایش و ثبت درخواست‌های نوبت دفاتر کفالت</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow transition-all"
        >
          <Plus size={20} />
          ثبت نوبت دستی
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با کد رهگیری، نام متقاضی یا شماره تماس..."
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm pr-10"
          />
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">در انتظار بررسی</option>
          <option value="in_progress">درحال پیگیری</option>
          <option value="approved">تایید شده</option>
          <option value="rejected">رد شده</option>
        </select>
      </div>

      {/* Modal / Form: Add Manual Request */}
      {isAdding && (
        <form onSubmit={handleAddManual} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              <span>ثبت درخواست نوبت‌دهی حضوری / تلفنی</span>
            </h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام و نام خانوادگی متقاضی *</label>
            <input
              required
              placeholder="مثال: عبدالحمید محمدی"
              value={formData.applicantName}
              onChange={e => setFormData({ ...formData, applicantName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شماره تماس (جهت اطلاع‌رسانی) *</label>
            <input
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نوع درخواست خدماتی</label>
            <select
              value={formData.requestType}
              onChange={e => setFormData({ ...formData, requestType: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              <option>نوبت‌دهی تمدید کارت هوشمند</option>
              <option>تمدید برگه سرشماری</option>
              <option>صدور گواهی اشتغال</option>
              <option>ثبت‌نام تحصیلی فرزندان</option>
              <option>استعلام پروانه کار</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">کد یا نام دفتر کفالت مقصد</label>
            <input
              placeholder="مثال: دفتر ۱۰۱ ری یا ۲۰۴ مشهد"
              value={formData.officeCode}
              onChange={e => setFormData({ ...formData, officeCode: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">یادداشت اداری و توضیحات تکمیلی</label>
            <textarea
              placeholder="مدارک تحویل گرفته شده، تاریخ مقرر مراجعه و..."
              value={formData.adminNotes}
              onChange={e => setFormData({ ...formData, adminNotes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              rows={2}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow">
              ثبت نوبت
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-lg w-full border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  ویرایش وضعیت درخواست {editingItem.trackingCode}
                </h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام متقاضی
                </label>
                <input
                  value={editingItem.applicantName || ""}
                  onChange={e => setEditingItem({ ...editingItem, applicantName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  شماره تماس
                </label>
                <input
                  value={editingItem.phone || ""}
                  onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وضعیت رسیدگی *
                </label>
                <select
                  value={editingItem.status}
                  onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold"
                >
                  <option value="pending">در انتظار بررسی</option>
                  <option value="in_progress">درحال پیگیری در دفتر کفالت</option>
                  <option value="approved">تایید شده (ارسال پیامک نوبت)</option>
                  <option value="rejected">رد شده (نقص مدارک)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  یادداشت و نتیجه بررسی (برای متقاضی)
                </label>
                <textarea
                  value={editingItem.adminNotes || ""}
                  onChange={e => setEditingItem({ ...editingItem, adminNotes: e.target.value })}
                  placeholder="مثال: نوبت شما برای روز دوشنبه ساعت ۱۰ صبح در دفتر ۱۰۱ تایید شد. اصل برگه سرشماری همراه باشد."
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-5 py-4">کد رهگیری</th>
                <th className="px-5 py-4">نام متقاضی</th>
                <th className="px-5 py-4">شماره تماس</th>
                <th className="px-5 py-4">نوع درخواست</th>
                <th className="px-5 py-4">تاریخ ثبت</th>
                <th className="px-5 py-4">وضعیت</th>
                <th className="px-5 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-xs">
                    موردی برای نمایش یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.trackingCode || item.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4 font-bold">{item.applicantName || "نامشخص"}</td>
                    <td className="px-5 py-4">
                      {item.phone ? (
                        <a
                          href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-mono font-bold hover:underline"
                        >
                          <Phone size={12} />
                          <span dir="ltr">{item.phone}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">{item.requestType || "ثبت‌نام عمومی"}</td>
                    <td className="px-5 py-4 text-xs" dir="ltr">
                      {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString('fa-IR') : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {getStatusIcon(item.status)}
                        <span>{getStatusLabel(item.status)}</span>
                      </div>
                      {item.adminNotes && (
                        <span className="text-[10px] text-gray-400 block truncate max-w-[180px] mt-0.5">
                          {item.adminNotes}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="ویرایش وضعیت و یادداشت"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.trackingCode || item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="حذف درخواست"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
