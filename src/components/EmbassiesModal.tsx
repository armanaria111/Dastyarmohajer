import React, { useState, useEffect } from "react";
import {
  Landmark,
  X,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Search,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { INITIAL_EMBASSIES, EmbassyItem } from "../data/initialEmbassies";
import { openUniversalLocation } from "../utils/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmbassiesModal({ isOpen, onClose }: Props) {
  const [embassies, setEmbassies] = useState<EmbassyItem[]>(INITIAL_EMBASSIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("همه");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "embassies"),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || "",
              country: data.country || "افغانستان",
              type: data.type || "embassy",
              province: data.province || "تهران",
              city: data.city || "تهران",
              address: data.address || "",
              phone: data.phone || "",
              website: data.website || "",
              locationUrl: data.locationUrl || "",
              workingHours: data.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
              description: data.description || "",
              latitude: data.latitude,
              longitude: data.longitude,
            } as EmbassyItem;
          });
          setEmbassies(list);
        } else {
          setEmbassies(INITIAL_EMBASSIES);
        }
      },
      () => {
        setEmbassies(INITIAL_EMBASSIES);
      }
    );
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const filtered = embassies.filter((item) => {
    const matchesCity =
      selectedCity === "همه" ||
      item.city?.includes(selectedCity) ||
      item.province?.includes(selectedCity) ||
      item.address?.includes(selectedCity);

    if (!matchesCity) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q) ||
      item.address?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const cityTabs = ["همه", "تهران", "مشهد", "زاهدان"];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-800 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Landmark size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black">
                  سفارت‌ها و کنسولگری‌ها
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px] font-bold">
                  {filtered.length} مرکز فعال
                </span>
              </div>
              <p className="text-[11px] text-purple-100 mt-0.5">
                نشانی دقیق، ساعات کاری، شماره تماس‌های رسمی و لینک مستقیم لوکیشن در نشان، بلد و Google Maps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="بستن"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
              فیلتر شهر:
            </span>
            {cityTabs.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCity === c
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
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
              placeholder="جستجوی نام سفارت، کنسولگری، آدرس یا خدمات..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10 text-slate-900 dark:text-white"
            />
            <Search
              size={17}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md"
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                          {item.type === "consulate" ? "سرکنسولگری" : "سفارت کبرا"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {item.city}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                        {item.name}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800 dark:text-slate-200">آدرس:</strong>{" "}
                      {item.address}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-500 shrink-0" />
                      <span>تلفن تماس:</span>
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
                        <Clock size={13} className="text-amber-500 shrink-0" />
                        <span>{item.workingHours}</span>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl leading-relaxed mt-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Location & Website */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-3 flex-wrap">
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
                  title="مسیریابی مستقیم در نشان، بلد، گوگل مپ یا نقشه گوشی"
                >
                  <MapPin size={14} className="text-white" />
                  <span>لوکیشن</span>
                  <ExternalLink size={12} className="opacity-80" />
                </button>

                {item.website ? (
                  <a
                    href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    <Globe size={13} />
                    <span>پرتال رسمی</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">وب‌سایت ثبت نشده</span>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
              مرکزی با این مشخصات یافت نشد.
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-4">
          <div className="flex items-center gap-1.5">
            <Info size={14} className="text-blue-500 shrink-0" />
            <span>
              جهت انجام امور پاسپورت و تذکره، داشتن نوبت قبلی از سامانه‌های کنسولی الزامی است.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
