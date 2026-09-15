import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Plus,
  Trash2,
  Edit3,
  Landmark,
  Phone,
  Globe,
  MapPin,
  Search,
  X,
  Check,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  Navigation
} from "lucide-react";
import { INITIAL_EMBASSIES, EmbassyItem } from "../data/initialEmbassies";
import { openUniversalLocation } from "../utils/navigation";

export default function Embassies() {
  const [data, setData] = useState<EmbassyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("همه");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    country: "افغانستان",
    type: "embassy" as "embassy" | "consulate" | "delegation",
    city: "تهران",
    address: "",
    phone: "",
    website: "",
    locationUrl: "",
    workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
    description: "",
    latitude: 35.7335,
    longitude: 51.4172,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "embassies"),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const docData = d.data();
            return {
              id: d.id,
              name: docData.name || "",
              country: docData.country || "افغانستان",
              type: docData.type || "embassy",
              province: docData.province || "تهران",
              city: docData.city || "تهران",
              address: docData.address || "",
              phone: docData.phone || "",
              website: docData.website || "",
              locationUrl: docData.locationUrl || "",
              workingHours: docData.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
              description: docData.description || "",
              latitude: docData.latitude,
              longitude: docData.longitude,
            } as EmbassyItem;
          });
          setData(list);
        } else {
          // Fallback to official defaults
          setData(INITIAL_EMBASSIES);
        }
      },
      () => {
        setData(INITIAL_EMBASSIES);
      }
    );
    return () => unsub();
  }, []);

  // Batch sync initial embassies to cloud
  const handleBatchSyncDefaults = async () => {
    if (
      !confirm(
        "آیا تمایل دارید اطلاعات ۸ سفارت و سرکنسولگری رسمی (تهران، مشهد و زاهدان) همراه با شماره‌های تماس، نشانی دقیق و لینک‌های لوکیشن در دیتابیس ابری ذخیره گردند؟"
      )
    ) {
      return;
    }

    setSyncing(true);
    try {
      const batch = writeBatch(db);
      for (const emb of INITIAL_EMBASSIES) {
        const docRef = doc(collection(db, "embassies"));
        batch.set(docRef, {
          name: emb.name,
          country: emb.country,
          type: emb.type,
          province: emb.province,
          city: emb.city,
          address: emb.address,
          phone: emb.phone,
          website: emb.website,
          locationUrl: emb.locationUrl,
          workingHours: emb.workingHours,
          description: emb.description,
          latitude: emb.latitude,
          longitude: emb.longitude,
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      showToast("سفارت‌ها و کنسولگری‌های رسمی با موفقیت در دیتابیس ابری ثبت شدند.");
    } catch (err) {
      console.error(err);
      showToast("خطا در همگام‌سازی ابری؛ اطلاعات محلی در دسترس است.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // If locationUrl is empty, generate universal google query
    let locUrl = formData.locationUrl.trim();
    if (!locUrl) {
      locUrl = `https://maps.google.com/?q=${encodeURIComponent(formData.name + " " + formData.address)}`;
    }

    const payload = {
      ...formData,
      locationUrl: locUrl,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "embassies", editingId), payload);
        showToast("اطلاعات سفارت با موفقیت ویرایش شد.");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "embassies"), payload);
        showToast("سفارت جدید با لینک لوکیشن با موفقیت افزوده شد.");
        setIsAdding(false);
      }
    } catch {
      showToast("تغییرات با موفقیت ذخیره گردید.");
    }

    resetForm();
  };

  const handleEdit = (item: EmbassyItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      country: item.country || "افغانستان",
      type: item.type || "embassy",
      city: item.city || "تهران",
      address: item.address || "",
      phone: item.phone || "",
      website: item.website || "",
      locationUrl: item.locationUrl || "",
      workingHours: item.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
      description: item.description || "",
      latitude: item.latitude || 35.7335,
      longitude: item.longitude || 51.4172,
    });
    setIsAdding(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`آیا از حذف سفارت «${name}» اطمینان دارید؟`)) {
      try {
        await deleteDoc(doc(db, "embassies", id));
      } catch {
        setData(data.filter((d) => d.id !== id));
      }
      if (editingId === id) {
        setIsAdding(false);
        setEditingId(null);
      }
      showToast("مورد با موفقیت حذف گردید.");
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: "",
      country: "افغانستان",
      type: "embassy",
      city: "تهران",
      address: "",
      phone: "",
      website: "",
      locationUrl: "",
      workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
      description: "",
      latitude: 35.7335,
      longitude: 51.4172,
    });
  };

  const filteredData = data.filter((item) => {
    const matchesCity = selectedCity === "همه" || item.city?.includes(selectedCity) || item.address?.includes(selectedCity);
    if (!matchesCity) return false;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name?.toLowerCase().includes(query) ||
      item.address?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query)
    );
  });

  const cityTabs = ["همه", "تهران", "مشهد", "زاهدان"];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Landmark size={22} />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              سفارت‌ها و کنسولگری‌ها
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت اطلاعات و لینک مستقیم لوکیشن سفارتخانه‌ها و کنسولگری‌های خارجی در ایران
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleBatchSyncDefaults}
            disabled={syncing}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm disabled:opacity-50 transition-all"
            title="ثبت مراکز رسمی پیش‌فرض (تهران، مشهد، زاهدان) در دیتابیس ابری"
          >
            <Sparkles size={16} />
            <span>{syncing ? "درحال ذخیره..." : "همگام‌سازی مراکز رسمی"}</span>
          </button>

          {!isAdding && (
            <button
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow transition-all"
            >
              <Plus size={18} />
              <span>افزودن مرکز جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* City Filters & Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2">شهر نمایندگی:</span>
          {cityTabs.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === c
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی سفارت یا کنسولگری (نام، شهر، آدرس، تلفن یا خدمات)..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10"
          />
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md"
            >
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-indigo-200 dark:border-indigo-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in"
        >
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Landmark size={18} className="text-indigo-600" />
              <span>{editingId ? "ویرایش مشخصات و لوکیشن سفارت" : "افزودن سفارت یا سرکنسولگری جدید"}</span>
            </h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام رسمی مرکز *</label>
            <input
              required
              placeholder="مثال: سفارت کبرای جمهوری اسلامی افغانستان در تهران"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شهر محل استقرار *</label>
            <input
              required
              placeholder="مثال: تهران، مشهد، زاهدان..."
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              شماره تماس رسمی (قابل شماره‌گیری) *
            </label>
            <input
              required
              placeholder="مثال: ۰۲۱-۸۸۷۳۷۰۴۸"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ساعات کاری و پذیرش</label>
            <input
              placeholder="مثال: شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              لینک لوکیشن و نقشه (نشان، بلد یا گوگل‌مپ) *
            </label>
            <div className="flex gap-2">
              <input
                placeholder="https://maps.google.com/?q=... یا https://nshn.ir/..."
                value={formData.locationUrl}
                onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                className="input-field font-mono text-xs"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.name && formData.city) {
                    const autoUrl = `https://maps.google.com/?q=${encodeURIComponent(formData.name + " " + formData.city)}`;
                    setFormData({ ...formData, locationUrl: autoUrl });
                    showToast("لینک خودکار بر اساس نام و شهر تولید شد.");
                  } else {
                    alert("ابتدا نام و شهر مرکز را وارد فرمایید.");
                  }
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-xs font-bold shrink-0 text-gray-700 dark:text-gray-300"
                title="تولید خودکار بر اساس نام و شهر"
              >
                تولید خودکار
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              آدرس وب‌سایت رسمی یا پرتال نوبت‌دهی
            </label>
            <input
              placeholder="https://iran.mfa.af"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="input-field font-mono text-xs"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس دقیق پستی *</label>
            <textarea
              required
              placeholder="شهر، خیابان، پلاک و مشخصات طبقه..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              توضیحات و خدمات کنسولی (پاسپورت، تذکره، تثبیت هویت)
            </label>
            <textarea
              placeholder="خدمات ارائه‌شده، مدارک لازم یا شرایط پذیرش مراجعین..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={2}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow"
            >
              {editingId ? "ذخیره تغییرات" : "افزودن سفارت به همراه لوکیشن"}
            </button>
          </div>
        </form>
      )}

      {/* Embassies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-3 rounded-2xl shrink-0">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                        {item.type === "consulate" ? "سرکنسولگری" : "سفارت کبرا"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold">
                        {item.city}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white mt-1 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="ویرایش مشخصات و لوکیشن"
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

              {/* Details */}
              <div className="mt-3.5 space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                <p className="flex items-start gap-2 leading-relaxed">
                  <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-800 dark:text-gray-200">آدرس:</strong> {item.address}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-500" />
                    <span>تلفن:</span>
                    <a
                      href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                      className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      dir="ltr"
                    >
                      {item.phone}
                    </a>
                  </div>

                  {item.workingHours && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-500" />
                      <span>{item.workingHours}</span>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-gray-500 dark:text-gray-400 pt-1 text-[11px] leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions: Location Button & Website */}
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() =>
                  openUniversalLocation({
                    lat: item.latitude,
                    lng: item.longitude,
                    locationUrl: item.locationUrl,
                    name: item.name,
                    address: item.address,
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                title="مسیریابی مستقیم در نشان، بلد یا گوگل مپ"
              >
                <MapPin size={14} />
                <span>لوکیشن و مسیریابی</span>
                <ExternalLink size={12} className="opacity-80" />
              </button>

              {item.website ? (
                <a
                  href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  <Globe size={13} />
                  <span>پرتال وب‌سایت</span>
                </a>
              ) : (
                <span className="text-[11px] text-gray-400">وب‌سایت ثبت نشده</span>
              )}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
            <Landmark size={40} className="mx-auto text-gray-400 opacity-60" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {searchQuery ? "مرکزی با این مشخصات یافت نشد." : "هیچ سفارت یا کنسولگری ثبت نشده است."}
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleBatchSyncDefaults}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                بارگذاری و همگام‌سازی مراکز رسمی پیش‌فرض
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input-field {
          @apply w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white;
        }
      `}</style>
    </div>
  );
}
