import React, { useState, useEffect } from "react";
import {
  Navigation,
  X,
  MapPin,
  Compass,
  Phone,
  ExternalLink,
  Search,
  Building2,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { PROVINCES_LIST } from "../pages/Broadcast";

interface Branch {
  id: string;
  name: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  workingHours?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Approximate city coordinates for distance calculations when specific lat/lng missing
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  تهران: { lat: 35.6892, lng: 51.389 },
  مشهد: { lat: 36.2972, lng: 59.6067 },
  اصفهان: { lat: 32.6546, lng: 51.668 },
  شیراز: { lat: 29.5918, lng: 52.5837 },
  قم: { lat: 34.6401, lng: 50.8764 },
  کرج: { lat: 35.8327, lng: 50.9915 },
  یزد: { lat: 31.8974, lng: 54.3569 },
  کرمان: { lat: 30.2839, lng: 57.0834 },
  سمنان: { lat: 35.5769, lng: 53.397 },
  قزوین: { lat: 36.2688, lng: 50.0041 },
  اراک: { lat: 34.0954, lng: 49.7013 },
  بوشهر: { lat: 28.9234, lng: 50.8203 }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function GpsFinderModal({ isOpen, onClose }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // Load branches
    const unsub = onSnapshot(collection(db, "branches"), (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        let lat = data.latitude;
        let lng = data.longitude;
        if (!lat && CITY_COORDS[data.city || data.province]) {
          lat = CITY_COORDS[data.city || data.province].lat;
          lng = CITY_COORDS[data.city || data.province].lng;
        }
        return {
          id: doc.id,
          name: data.name || "دفتر خدمات اتباع",
          province: data.province || "تهران",
          city: data.city || data.province || "",
          address: data.address || "آدرس ثبت نشده",
          phone: data.phone || "—",
          workingHours: data.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۴:۰۰",
          latitude: lat,
          longitude: lng
        } as Branch;
      });
      setBranches(list);
      setLoading(false);
    });

    // Automatically attempt to fetch GPS
    requestGpsLocation();

    return () => unsub();
  }, [isOpen]);

  const requestGpsLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsError("امکان دریافت خودکار موقعیت فراهم نشد. لطفاً استان خود را دستی انتخاب فرمایید.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute distances if coords available
  const processedBranches = branches.map((b) => {
    let dist: number | undefined = undefined;
    if (userCoords && b.latitude && b.longitude) {
      dist = calculateDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
    }
    return { ...b, distanceKm: dist };
  });

  // Filter & Sort
  const filteredBranches = processedBranches
    .filter((b) => {
      const matchProv = selectedProvince === "all" || b.province === selectedProvince;
      const matchSearch =
        !searchQuery.trim() ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProv && matchSearch;
    })
    .sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  const openNavigation = (b: Branch, app: "neshan" | "balad" | "google") => {
    const lat = b.latitude || 35.6892;
    const lng = b.longitude || 51.389;
    const title = encodeURIComponent(b.name);

    if (app === "neshan") {
      window.open(`https://neshan.org/maps?lat=${lat}&lng=${lng}#c${lat}-${lng}-16z`, "_blank");
    } else if (app === "balad") {
      window.open(`https://balad.ir/location?latitude=${lat}&longitude=${lng}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Navigation size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                مسیریابی هوشمند و نزدیک‌ترین دفاتر کفالت
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                یافتن سریع نزدیک‌ترین دفتر کفالت و مسیریابی مستقیم با نشان، بلد و Google Maps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white flex items-center gap-1.5 font-black text-xs sm:text-sm shrink-0 border border-white/25 shadow-sm"
            title="بستن پنجره"
          >
            <X size={18} />
            <span>بستن</span>
          </button>
        </div>

        {/* GPS Controls & Filters Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={requestGpsLocation}
              className="flex-1 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Compass size={16} />
              <span>{userCoords ? "موقعیت مکانی فعال شد" : "مکان‌یابی با GPS"}</span>
            </button>
          </div>

          <div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200"
            >
              <option value="all">همه استان‌های کشور</option>
              {PROVINCES_LIST.map((p) => (
                <option key={p} value={p}>
                  استان {p}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا آدرس دفتر..."
              className="w-full px-3 py-2.5 pr-8 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs text-gray-800 dark:text-gray-200"
            />
            <Search size={14} className="absolute right-2.5 top-3 text-gray-400" />
          </div>
        </div>

        {/* GPS Alert Notice if active or failed */}
        {userCoords && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} />
              دفاتر بر اساس نزدیک‌ترین فاصله به موقعیت فعلی شما مرتب‌سازی شدند.
            </span>
            <span className="font-mono">GPS Active</span>
          </div>
        )}

        {gpsError && (
          <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2 border-b border-amber-200 dark:border-amber-800">
            <AlertCircle size={14} />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Offices List */}
        <div className="p-6 max-h-[480px] overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-10 text-xs text-gray-400">درحال دریافت فهرست دفاتر...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">دفتر کفالتی با این مشخصات یافت نشد.</div>
          ) : (
            filteredBranches.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-400 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                      استان {b.province} - {b.city}
                    </span>
                    {b.distanceKm !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono">
                        فاصله: حدود {b.distanceKm} کیلومتر
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    <span>{b.name}</span>
                  </h4>

                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <MapPin size={14} className="shrink-0 mt-0.5 text-gray-400" />
                    <span>{b.address}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1 font-mono" dir="ltr">
                      <Phone size={12} />
                      {b.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {b.workingHours}
                    </span>
                  </div>
                </div>

                {/* Navigation App Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => openNavigation(b, "neshan")}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>مسیریابی با نشان</span>
                    <ExternalLink size={12} />
                  </button>

                  <button
                    onClick={() => openNavigation(b, "balad")}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>مسیریابی با بلد</span>
                    <ExternalLink size={12} />
                  </button>

                  <button
                    onClick={() => openNavigation(b, "google")}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Google Maps</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
          >
            <X size={16} />
            <span>بستن پنجره</span>
          </button>
        </div>
      </div>
    </div>
  );
}
