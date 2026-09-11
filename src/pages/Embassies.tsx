import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Plus, Trash2, Edit3, Landmark, Phone, Globe, MapPin, Search, X, Check } from "lucide-react";

interface EmbassyItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  description: string;
}

export default function Embassies() {
  const [data, setData] = useState<EmbassyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    description: ""
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "embassies"), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmbassyItem)));
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "embassies", editingId), formData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "embassies"), formData);
      setIsAdding(false);
    }
    setFormData({ name: "", address: "", phone: "", website: "", description: "" });
  };

  const handleEdit = (item: EmbassyItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      address: item.address || "",
      phone: item.phone || "",
      website: item.website || "",
      description: item.description || ""
    });
    setIsAdding(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`آیا از حذف سفارت «${name}» اطمینان دارید؟`)) {
      await deleteDoc(doc(db, "embassies", id));
      if (editingId === id) {
        setIsAdding(false);
        setEditingId(null);
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", address: "", phone: "", website: "", description: "" });
  };

  const filteredData = data.filter(item => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name?.toLowerCase().includes(query) ||
      item.address?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سفارت‌ها و کنسولگری‌ها</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">مدیریت لیست سفارتخانه‌ها و کنسولگری‌ها با قابلیت افزودن، ویرایش و حذف</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", address: "", phone: "", website: "", description: "" });
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow transition-all"
          >
            <Plus size={20} />
            افزودن سفارت جدید
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی سفارت یا کنسولگری (نام، شهر، آدرس، تلفن)..."
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm pr-10"
        />
        <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md"
          >
            پاک کردن
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Landmark size={18} className="text-blue-600" />
              <span>{editingId ? "ویرایش اطلاعات سفارت" : "افزودن سفارت یا کنسولگری جدید"}</span>
            </h3>
            <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام سفارت / کنسولگری *</label>
            <input
              required
              placeholder="مثال: سفارت کبرای جمهوری اسلامی افغانستان در تهران"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شماره تماس رسمی (قابل شماره‌گیری) *</label>
            <input
              required
              placeholder="۰۲۱-۸۸۸۸۸۸۸۸"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس وب‌سایت یا پرتال کنسولی</label>
            <input
              placeholder="https://iran.mfa.af"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس دقیق پستی *</label>
            <textarea
              required
              placeholder="تهران، خیابان دکتر بهشتی، ..."
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">توضیحات و خدمات کنسولی (تذکره، پاسپورت، تثبیت هویت)</label>
            <textarea
              placeholder="ساعات پذیرش، نحوه نوبت‌دهی و خدمات ارائه شده..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              rows={2}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow">
              {editingId ? "ذخیره تغییرات" : "افزودن به لیست"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredData.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg"
                      >
                        <Phone size={12} />
                        <span dir="ltr">{item.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="ویرایش اطلاعات"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <p className="flex items-start gap-1.5 leading-relaxed">
                  <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <span>{item.address}</span>
                </p>
                {item.description && (
                  <p className="text-gray-500 dark:text-gray-400 pt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {item.website && (
              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                <a
                  href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  <Globe size={13} />
                  <span>مشاهده پرتال وب‌سایت</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
