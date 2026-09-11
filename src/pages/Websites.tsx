import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Plus, Trash2, Edit3, Globe, ExternalLink, Search, X } from "lucide-react";

interface WebsiteItem {
  id: string;
  name: string;
  url: string;
  description: string;
}

export default function Websites() {
  const [data, setData] = useState<WebsiteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", url: "", description: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "websites"), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WebsiteItem)));
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "websites", editingId), formData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "websites"), formData);
      setIsAdding(false);
    }
    setFormData({ name: "", url: "", description: "" });
  };

  const handleEdit = (item: WebsiteItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      url: item.url || "",
      description: item.description || ""
    });
    setIsAdding(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`آیا از حذف سایت «${name}» اطمینان دارید؟`)) {
      await deleteDoc(doc(db, "websites", id));
      if (editingId === id) {
        setIsAdding(false);
        setEditingId(null);
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", url: "", description: "" });
  };

  const filteredData = data.filter(item => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.url?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سایت‌های خدماتی</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">معرفی سایت‌های رسمی و سامانه‌های نوبت‌دهی مهاجرین</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", url: "", description: "" });
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow transition-all"
          >
            <Plus size={20} />
            افزودن سایت جدید
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی سامانه یا وب‌سایت خدماتی..."
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm pr-10"
        />
        <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              <span>{editingId ? "ویرایش اطلاعات سایت" : "افزودن سایت خدماتی جدید"}</span>
            </h3>
            <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام سایت یا سامانه *</label>
            <input
              required
              placeholder="مثال: سامانه نوبت‌دهی سازمان ملی مهاجرت (سهما)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس سایت (URL) *</label>
            <input
              required
              placeholder="https://irmigrationorg.ir"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">توضیحات و خدمات سامانه</label>
            <textarea
              placeholder="سامانه برای ثبت درخواست‌های کارت هوشمند، شناسه یکتا و امور دانشجویی..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              rows={3}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow">
              {editingId ? "ذخیره تغییرات" : "ذخیره سایت"}
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
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{item.name}</h3>
                    <span className="text-xs text-gray-400 font-mono block mt-0.5" dir="ltr">{item.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="ویرایش"
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

              {item.description && (
                <p className="text-gray-600 dark:text-gray-300 text-xs mt-3 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
              <a
                href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
              >
                <ExternalLink size={13} />
                <span>ورود به سامانه</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
