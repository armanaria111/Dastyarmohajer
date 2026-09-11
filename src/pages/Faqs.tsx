import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Plus, Trash2, Edit3, HelpCircle, Search, X, Globe2 } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  language: string;
}

export default function Faqs() {
  const [data, setData] = useState<FaqItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ question: "", answer: "", language: "fa" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "faqs"), (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FaqItem)));
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "faqs", editingId), formData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "faqs"), formData);
      setIsAdding(false);
    }
    setFormData({ question: "", answer: "", language: "fa" });
  };

  const handleEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setFormData({
      question: item.question || "",
      answer: item.answer || "",
      language: item.language || "fa"
    });
    setIsAdding(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id: string, question: string) => {
    if (confirm(`آیا از حذف این پرسش و پاسخ اطمینان دارید؟`)) {
      await deleteDoc(doc(db, "faqs", id));
      if (editingId === id) {
        setIsAdding(false);
        setEditingId(null);
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ question: "", answer: "", language: "fa" });
  };

  const filteredData = data.filter(item => {
    const matchesLang = selectedLang === "all" || item.language === selectedLang;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesLang;
    return matchesLang && (
      item.question?.toLowerCase().includes(q) ||
      item.answer?.toLowerCase().includes(q)
    );
  });

  const getLangBadge = (lang: string) => {
    switch (lang) {
      case "pa": return <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-md font-bold">پشتو (پښتو)</span>;
      case "en": return <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md font-bold">انگلیسی (English)</span>;
      case "ar": return <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md font-bold">عربی (العربية)</span>;
      default: return <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md font-bold">فارسی / دری</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سوالات متداول (FAQ)</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">پاسخ‌های خودکار ربات به پرسش‌های پرتکرار مهاجرین</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ question: "", answer: "", language: "fa" });
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow transition-all"
          >
            <Plus size={20} />
            افزودن سوال جدید
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در سوالات و پاسخ‌ها..."
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm pr-10"
          />
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
        >
          <option value="all">همه زبان‌ها</option>
          <option value="fa">فارسی / دری</option>
          <option value="pa">پشتو</option>
          <option value="en">انگلیسی</option>
          <option value="ar">عربی</option>
        </select>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle size={18} className="text-blue-600" />
              <span>{editingId ? "ویرایش سوال و جواب" : "افزودن سوال جدید به ربات"}</span>
            </h3>
            <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">صورت سوال / کلیدواژه *</label>
            <input
              required
              placeholder="مثال: برای تمدید برگه سرشماری به کدام دفتر کفالت مراجعه کنم؟"
              value={formData.question}
              onChange={e => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">زبان پاسخ</label>
            <select
              value={formData.language}
              onChange={e => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              <option value="fa">فارسی / دری</option>
              <option value="pa">پشتو (پښتو)</option>
              <option value="en">انگلیسی (English)</option>
              <option value="ar">عربی (العربية)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">پاسخ کامل ربات *</label>
            <textarea
              required
              placeholder="متن راهنمایی، مدارک لازم، آدرس و قوانین..."
              value={formData.answer}
              onChange={e => setFormData({ ...formData, answer: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              rows={4}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow">
              {editingId ? "ذخیره تغییرات" : "افزودن به ربات"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredData.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative hover:border-blue-200 dark:hover:border-blue-800 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl shrink-0 mt-0.5">
                  <HelpCircle size={22} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{item.question}</h3>
                    {getLangBadge(item.language)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed pt-1">
                    {item.answer}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="ویرایش"
                >
                  <Edit3 size={17} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.question)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
