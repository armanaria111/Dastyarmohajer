import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Plus, Trash2, Building2, MapPin, Phone, ExternalLink, Search, Clock, ShieldCheck, Edit3 } from "lucide-react";

interface KefalatOffice {
  id: string;
  code: string;
  name: string;
  provinceCity: string;
  neighborhood: string;
  address: string;
  phone: string;
  locationUrl: string;
  workingHours: string;
  description: string;
}

export default function Branches() {
  const [offices, setOffices] = useState<KefalatOffice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("همه");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    provinceCity: "تهران",
    neighborhood: "",
    address: "",
    phone: "",
    locationUrl: "",
    workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
    description: "انجام کلیه خدمات کارت هوشمند، تمدید برگه سرشماری، نوبت‌دهی و امور اقامتی اتباع"
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "branches"), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          code: d.code || "",
          name: d.name || `دفتر کفالت کد ${d.code || ""}`,
          provinceCity: d.provinceCity || d.city || "تهران",
          neighborhood: d.neighborhood || "",
          address: d.address || "",
          phone: d.phone || "",
          locationUrl: d.locationUrl || "",
          workingHours: d.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
          description: d.description || ""
        } as KefalatOffice;
      });
      setOffices(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateDoc(doc(db, "branches", editingId), formData);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "branches"), formData);
    }
    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (office: KefalatOffice) => {
    setEditingId(office.id);
    setFormData({
      code: office.code,
      name: office.name,
      provinceCity: office.provinceCity,
      neighborhood: office.neighborhood,
      address: office.address,
      phone: office.phone,
      locationUrl: office.locationUrl,
      workingHours: office.workingHours,
      description: office.description
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این دفتر کفالت اطمینان دارید؟ این تغییر بلافاصله در تمام ربات‌ها اعمال خواهد شد.")) {
      await deleteDoc(doc(db, "branches", id));
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      provinceCity: "تهران",
      neighborhood: "",
      address: "",
      phone: "",
      locationUrl: "",
      workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
      description: "انجام کلیه خدمات کارت هوشمند، تمدید برگه سرشماری، نوبت‌دهی و امور اقامتی اتباع"
    });
    setEditingId(null);
  };

  const filteredOffices = offices.filter(b => {
    const q = searchQuery.trim().toLowerCase();
    const matchesCity = selectedCityFilter === "همه" || b.provinceCity.includes(selectedCityFilter) || b.neighborhood.includes(selectedCityFilter);
    if (!matchesCity) return false;
    if (!q) return true;
    return (
      b.code?.toLowerCase().includes(q) ||
      b.name?.toLowerCase().includes(q) ||
      b.neighborhood?.toLowerCase().includes(q) ||
      b.provinceCity?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    );
  });

  const cityTags = ["همه", "تهران", "مشهد", "اصفهان", "قم", "شیراز", "البرز"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 size={22} />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">دفاتر کفالت، اقامت و اشتغال اتباع</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت پایگاه داده دفاتر کفالت متصل به ربات‌های ایتا، بله، روبیکا، سروش، گپ، ایگپ و تلگرام
          </p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              resetForm();
            } else {
              setIsAdding(true);
            }
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-md active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>{isAdding ? "بستن فرم" : "افزودن دفتر کفالت جدید"}</span>
        </button>
      </div>

      {/* City Filters & Search Input */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2">فیلتر استانی / شهری:</span>
          {cityTags.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCityFilter(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedCityFilter === city
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با کد دفتر کفالت (مثلاً: 101)، نام شهر، محله یا آدرس دقیق..."
            className="w-full pr-10 pl-24 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2.5 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
          <div className="md:col-span-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              <span>{editingId ? "ویرایش مشخصات دفتر کفالت" : "مشخصات دفتر کفالت جدید"}</span>
            </h3>
            <span className="text-xs text-gray-500">اطلاعات فوراً در ربات‌ها قابل جستجو خواهد بود</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">کد دفتر کفالت *</label>
            <input required placeholder="مثال: 101 یا 205" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="input-field" dir="ltr" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام رسمی دفتر کفالت *</label>
            <input required placeholder="مثال: دفتر کفالت شماره ۱۰۱ شهرری" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان / شهر *</label>
            <input required placeholder="مثال: تهران، مشهد، اصفهان..." value={formData.provinceCity} onChange={e => setFormData({...formData, provinceCity: e.target.value})} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">منطقه / محله *</label>
            <input required placeholder="مثال: شهرری، گلشهر، باقرشهر..." value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شماره تماس دفتر *</label>
            <input required placeholder="مثال: 021-55901234" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" dir="ltr" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ساعات کاری دفتر</label>
            <input placeholder="مثال: ۸:۰۰ الی ۱۶:۰۰" value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: e.target.value})} className="input-field" />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">لینک نقشه و مسیریابی (گوگل مپ، نشان، بلد)</label>
            <input placeholder="https://maps.google.com/..." value={formData.locationUrl} onChange={e => setFormData({...formData, locationUrl: e.target.value})} className="input-field font-mono text-xs" dir="ltr" />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس کامل پستی *</label>
            <textarea required placeholder="استان، شهرستان، خیابان، پلاک و طبقه..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field" rows={2} />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">خدمات ارائه‌شده و توضیحات تکمیلی</label>
            <textarea placeholder="توضیحات در خصوص کارت هوشمند، مدارک مورد نیاز یا شرایط نوبت‌دهی..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" rows={2} />
          </div>
          
          <div className="md:col-span-3 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => { setIsAdding(false); resetForm(); }} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold text-sm">انصراف</button>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md">
              {editingId ? "ثبت ویرایش دفتر" : "ذخیره و انتشار در ربات‌ها"}
            </button>
          </div>
        </form>
      )}

      {/* Offices Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">درحال بارگذاری اطلاعات دفاتر کفالت...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOffices.map(office => (
            <div key={office.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all relative flex flex-col justify-between">
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-3 rounded-2xl shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800">
                          کد {office.code}
                        </span>
                        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg">
                          {office.provinceCity}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {office.name || `دفتر کفالت کد ${office.code}`}
                      </h3>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(office)}
                      title="ویرایش مشخصات"
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(office.id)}
                      title="حذف دفتر"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <span><strong className="text-gray-800 dark:text-gray-200">آدرس:</strong> {office.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-emerald-500 shrink-0" />
                    <span><strong className="text-gray-800 dark:text-gray-200">تلفن تماس:</strong> <span dir="ltr" className="font-mono">{office.phone}</span></span>
                  </div>

                  {office.workingHours && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <span><strong className="text-gray-800 dark:text-gray-200">ساعات کاری:</strong> {office.workingHours}</span>
                    </div>
                  )}

                  {office.description && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      {office.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>فعال و متصل به ۷ ربات</span>
                </span>
                {office.locationUrl ? (
                  <a
                    href={office.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>مسیریابی و لوکیشن</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-400">لوکیشن ثبت نشده</span>
                )}
              </div>
            </div>
          ))}

          {filteredOffices.length === 0 && !isAdding && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
              <Building2 size={40} className="mx-auto text-gray-400 opacity-60" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {searchQuery ? "موردی با مشخصات جستجو شده یافت نشد." : "هنوز هیچ دفتر کفالتی ثبت نشده است."}
              </p>
              <p className="text-xs text-gray-500">
                می‌توانید با دکمه «افزودن دفتر کفالت جدید» اولین دفتر را اضافه کنید.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .input-field {
          @apply w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs outline-none transition-all;
        }
      `}</style>
    </div>
  );
}

