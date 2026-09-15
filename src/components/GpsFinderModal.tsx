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
  AlertCircle,
  Flag,
  CheckCircle2,
  Send,
  HelpCircle,
  Info
} from "lucide-react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PROVINCES_LIST } from "../pages/Broadcast";
import {
  INITIAL_BRANCHES,
  CITY_COORDS,
  KefalatOffice,
  BranchReport
} from "../data/initialBranches";
import { openUniversalLocation } from "../utils/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface DisplayBranch extends KefalatOffice {
  distanceKm?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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
  // Always initialize with comprehensive realistic branches so it's never empty!
  const [branches, setBranches] = useState<KefalatOffice[]>(INITIAL_BRANCHES);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportForm, setReportForm] = useState<{
    officeCode: string;
    officeName: string;
    province: string;
    city: string;
    reportType: BranchReport["reportType"];
    newAddress: string;
    newPhone: string;
    newHours: string;
    notes: string;
    reporterName: string;
    reporterPhone: string;
  }>({
    officeCode: "",
    officeName: "",
    province: "تهران",
    city: "",
    reportType: "address_change",
    newAddress: "",
    newPhone: "",
    newHours: "",
    notes: "",
    reporterName: "",
    reporterPhone: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    // Load branches from Firestore and merge with defaults
    const unsub = onSnapshot(
      collection(db, "branches"),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudBranches = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let lat = typeof data.latitude === "number" ? data.latitude : 0;
            let lng = typeof data.longitude === "number" ? data.longitude : 0;
            const city = data.city || (data.provinceCity ? data.provinceCity.split(/[-–\s]/)[1] || "" : "");
            const province = data.province || (data.provinceCity ? data.provinceCity.split(/[-–\s]/)[0] || "تهران" : "تهران");

            if (!lat && city && CITY_COORDS[city]) {
              lat = CITY_COORDS[city].lat;
              lng = CITY_COORDS[city].lng;
            } else if (!lat && province && CITY_COORDS[province]) {
              lat = CITY_COORDS[province].lat;
              lng = CITY_COORDS[province].lng;
            }

            return {
              id: docSnap.id,
              code: data.code || "",
              name: data.name || (data.code ? `دفتر کفالت کد ${data.code}` : "دفتر خدمات کفالت"),
              province: province,
              city: city || province,
              provinceCity: data.provinceCity || `${province} - ${city}`,
              neighborhood: data.neighborhood || "",
              address: data.address || "آدرس ثبت نشده",
              phone: data.phone || "—",
              locationUrl: data.locationUrl || "",
              workingHours: data.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
              description: data.description || "",
              latitude: lat || 35.6892,
              longitude: lng || 51.389,
            } as KefalatOffice;
          });

          // Merge: Keep custom branches and merge missing ones from INITIAL_BRANCHES
          const existingCodes = new Set(cloudBranches.map((b) => b.code).filter(Boolean));
          const complementary = INITIAL_BRANCHES.filter((ib) => !existingCodes.has(ib.code));
          setBranches([...cloudBranches, ...complementary]);
        } else {
          // If Firestore collection has no documents yet, show full default directory
          setBranches(INITIAL_BRANCHES);
        }
        setLoading(false);
      },
      () => {
        // Fallback on error
        setBranches(INITIAL_BRANCHES);
        setLoading(false);
      }
    );

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
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsError("امکان دریافت خودکار موقعیت فراهم نشد. لطفاً استان خود را دستی انتخاب فرمایید.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isReportOpen) {
          setIsReportOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isReportOpen, onClose]);

  // Open Report Modal for a specific office
  const openReportModalForOffice = (b?: KefalatOffice) => {
    if (b) {
      setReportForm({
        officeCode: b.code || "",
        officeName: b.name || "",
        province: b.province || "تهران",
        city: b.city || "",
        reportType: "address_change",
        newAddress: b.address || "",
        newPhone: b.phone !== "—" ? b.phone : "",
        newHours: b.workingHours || "",
        notes: "",
        reporterName: "",
        reporterPhone: "",
      });
    } else {
      setReportForm({
        officeCode: "",
        officeName: "",
        province: selectedProvince !== "all" ? selectedProvince : "تهران",
        city: "",
        reportType: "address_change",
        newAddress: "",
        newPhone: "",
        newHours: "",
        notes: "",
        reporterName: "",
        reporterPhone: "",
      });
    }
    setReportSuccess(false);
    setIsReportOpen(true);
  };

  // Submit User Report to Firestore & Local Storage
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.officeName.trim() && !reportForm.officeCode.trim()) {
      alert("لطفاً نام یا کد دفتر کفالت را وارد فرمایید.");
      return;
    }
    if (!reportForm.newAddress.trim() && !reportForm.notes.trim() && !reportForm.newPhone.trim()) {
      alert("لطفاً آدرس جدید، شماره جدید یا توضیحات تغییر را وارد فرمایید.");
      return;
    }

    setReportSubmitting(true);
    const newReport: Omit<BranchReport, "id"> = {
      officeCode: reportForm.officeCode.trim(),
      officeName: reportForm.officeName.trim(),
      province: reportForm.province,
      city: reportForm.city.trim(),
      reportType: reportForm.reportType,
      newAddress: reportForm.newAddress.trim(),
      newPhone: reportForm.newPhone.trim(),
      newHours: reportForm.newHours.trim(),
      notes: reportForm.notes.trim(),
      reporterName: reportForm.reporterName.trim(),
      reporterPhone: reportForm.reporterPhone.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "branch_reports"), newReport);
    } catch (err) {
      console.warn("Could not save report to cloud directly, saving locally:", err);
    }

    // Always cache locally
    try {
      const existing = JSON.parse(localStorage.getItem("citizen_branch_reports") || "[]");
      existing.unshift({ ...newReport, id: "local_" + Date.now() });
      localStorage.setItem("citizen_branch_reports", JSON.stringify(existing.slice(0, 50)));
    } catch {
      // Ignore local storage error
    }

    setReportSubmitting(false);
    setReportSuccess(true);
  };

  if (!isOpen) return null;

  // Compute distances if coords available
  const processedBranches: DisplayBranch[] = branches.map((b) => {
    let dist: number | undefined = undefined;
    if (userCoords && b.latitude && b.longitude) {
      dist = calculateDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
    }
    return { ...b, distanceKm: dist };
  });

  // Filter & Sort
  const filteredBranches = processedBranches
    .filter((b) => {
      const matchProv =
        selectedProvince === "all" ||
        b.province.includes(selectedProvince) ||
        (b.provinceCity && b.provinceCity.includes(selectedProvince));

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.province?.toLowerCase().includes(q) ||
        b.neighborhood?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q);

      return matchProv && matchSearch;
    })
    .sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

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
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-800 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Navigation size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black">
                  مسیریابی هوشمند و فهرست دفاتر کفالت
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px] font-bold">
                  {filteredBranches.length} دفتر فعال
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">
                یافتن سریع نزدیک‌ترین دفتر کفالت، نشانی دقیق و اتصال مستقیم با دکمه لوکیشن به مسیریاب گوشی (نشان، بلد یا گوگل‌مپ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openReportModalForOffice()}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs items-center gap-1.5 transition-all shadow-sm"
              title="گزارش جابجایی یا تغییر آدرس دفتر کفالت"
            >
              <Flag size={14} />
              <span>گزارش تغییر آدرس</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 font-bold text-xs sm:text-sm shrink-0 border border-white/25 transition-all"
              title="بستن"
            >
              <X size={18} />
              <span className="hidden sm:inline">بستن</span>
            </button>
          </div>
        </div>

        {/* Action Notice & Report Banner */}
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Info size={16} className="text-amber-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              آیا آدرس یا تلفن دفتری تغییر کرده است؟ با گزارش شما، نشانی نقشه و ربات‌ها سریعاً بروزرسانی می‌شود.
            </span>
          </div>
          <button
            onClick={() => openReportModalForOffice()}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all shadow-xs"
          >
            <Flag size={12} />
            <span>ثبت گزارش تغییر آدرس</span>
          </button>
        </div>

        {/* GPS Controls & Filters Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={requestGpsLocation}
              className={`flex-1 px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs text-xs ${
                userCoords
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Compass size={16} />
              <span>{userCoords ? "موقعیت مکانی شما فعال است" : "مکان‌یابی خودکار با GPS"}</span>
            </button>
          </div>

          <div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200"
            >
              <option value="all">همه استان‌ها (نمایش سراسری کشور)</option>
              {PROVINCES_LIST.map((p) => {
                const count = branches.filter(
                  (b) => b.province.includes(p) || (b.provinceCity && b.provinceCity.includes(p))
                ).length;
                return (
                  <option key={p} value={p}>
                    استان {p} {count > 0 ? `(${count} دفتر)` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کد، نام، شهر، خیابان..."
              className="w-full px-3 py-2.5 pr-8 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
            />
            <Search size={14} className="absolute right-2.5 top-3 text-gray-400" />
          </div>
        </div>

        {/* GPS Active/Error notices */}
        {userCoords && (
          <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} />
              دفاتر بر اساس نزدیک‌ترین فاصله به موقعیت مکانی شما مرتب شدند.
            </span>
            <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">GPS مرتب‌سازی فعال</span>
          </div>
        )}

        {gpsError && (
          <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{gpsError}</span>
            </div>
            <button
              onClick={() => setSelectedProvince("تهران")}
              className="underline text-[10px] hover:text-amber-950 font-bold shrink-0"
            >
              انتخاب استان تهران
            </button>
          </div>
        )}

        {/* Offices List */}
        <div className="p-4 sm:p-5 max-h-[500px] overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-400">درحال بارگذاری فهرست دفاتر کفالت...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Building2 size={32} className="mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-500">دفتر کفالتی با فیلتر انتخابی یافت نشد.</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProvince("all");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  نمایش همه دفاتر کشور
                </button>
                <button
                  onClick={() => openReportModalForOffice()}
                  className="px-4 py-2 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold"
                >
                  گزارش یا ثبت دفتر جدید
                </button>
              </div>
            </div>
          ) : (
            filteredBranches.map((b) => (
              <div
                key={b.id || b.code}
                className="p-4 sm:p-4.5 bg-white dark:bg-gray-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                      استان {b.province} {b.city ? `(${b.city})` : ""}
                    </span>
                    {b.code && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                        کد {b.code}
                      </span>
                    )}
                    {b.neighborhood && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px]">
                        محدوده: {b.neighborhood}
                      </span>
                    )}
                    {b.distanceKm !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono">
                        فاصله: حدود {b.distanceKm} کیلومتر
                      </span>
                    )}
                  </div>

                  <h4 className="font-black text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600 shrink-0" />
                    <span>{b.name}</span>
                  </h4>

                  <p className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5 leading-relaxed">
                    <MapPin size={14} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{b.address}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1 font-mono" dir="ltr">
                      <Phone size={12} className="text-emerald-600" />
                      {b.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-blue-500" />
                      {b.workingHours}
                    </span>
                  </div>

                  {b.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 italic pt-0.5">
                      {b.description}
                    </p>
                  )}
                </div>

                {/* Navigation and Report Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() =>
                      openUniversalLocation({
                        lat: b.latitude,
                        lng: b.longitude,
                        locationUrl: b.locationUrl,
                        name: b.name || `دفتر کفالت ${b.code}`,
                        address: b.address,
                      })
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    title="مسیریابی در نشان، بلد، گوگل مپ یا نقشه پیش‌فرض گوشی"
                  >
                    <MapPin size={14} className="text-white" />
                    <span>لوکیشن</span>
                    <ExternalLink size={12} className="opacity-80" />
                  </button>

                  <button
                    onClick={() => openReportModalForOffice(b)}
                    className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                    title="گزارش جابجایی یا اصلاح مشخصات این دفتر"
                  >
                    <Flag size={12} />
                    <span>گزارش تغییر مشخصات</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <HelpCircle size={14} className="text-blue-500" />
            <span>نیاز به ثبت دفتر جدید دارید؟ از دکمه گزارش تغییر آدرس استفاده کنید.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openReportModalForOffice()}
              className="sm:hidden px-3 py-2 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Flag size={14} />
              <span>گزارش آدرس</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
            >
              <X size={16} />
              <span>بستن پنجره</span>
            </button>
          </div>
        </div>

        {/* USER REPORT MODAL (Sub-modal for reporting address/info changes) */}
        {isReportOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsReportOpen(false);
            }}
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
          >
            <div
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-4 transition-all relative flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Flag size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base">گزارش تغییر آدرس و اطلاعات دفتر کفالت</h4>
                    <p className="text-[11px] text-amber-100">کمک به بروزرسانی نشانی‌ها برای سایر هموطنان و مهاجرین</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {reportSuccess ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h5 className="font-black text-base text-gray-900 dark:text-white">سپاس از همکاری ارزشمند شما!</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                      گزارش شما با موفقیت ثبت شد. پس از بررسی و تایید کارشناسان، آدرس جدید بلافاصله در نقشه، لیست هوشمند و ربات‌های ۸‌گانه سامانه بروزرسانی خواهد شد.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsReportOpen(false);
                      setReportSuccess(false);
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    متوجه شدم، بستن
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        نام دفتر کفالت <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reportForm.officeName}
                        onChange={(e) => setReportForm({ ...reportForm, officeName: e.target.value })}
                        placeholder="مثلاً: دفتر کفالت ۱۰۱ شهرری"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        کد دفتر (در صورت اطلاع)
                      </label>
                      <input
                        type="text"
                        value={reportForm.officeCode}
                        onChange={(e) => setReportForm({ ...reportForm, officeCode: e.target.value })}
                        placeholder="مثلاً: 101"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        استان <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={reportForm.province}
                        onChange={(e) => setReportForm({ ...reportForm, province: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold"
                      >
                        {PROVINCES_LIST.map((p) => (
                          <option key={p} value={p}>
                            استان {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        شهر یا منطقه
                      </label>
                      <input
                        type="text"
                        value={reportForm.city}
                        onChange={(e) => setReportForm({ ...reportForm, city: e.target.value })}
                        placeholder="مثلاً: شهرری یا مشهد"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      نوع گزارش یا تغییر <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={reportForm.reportType}
                      onChange={(e) =>
                        setReportForm({ ...reportForm, reportType: e.target.value as BranchReport["reportType"] })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white font-bold"
                    >
                      <option value="address_change">تغییر نشانی و آدرس جدید (جابجایی دفتر)</option>
                      <option value="phone_change">تغییر یا اصلاح شماره تلفن تماس</option>
                      <option value="hours_change">تغییر ساعات پذیرش و کاری</option>
                      <option value="closed">گزارش تعطیلی دائم یا انحلال دفتر</option>
                      <option value="new_branch">معرفی دفتر کفالت جدید (ثبت نشده در لیست)</option>
                      <option value="other">سایر اصلاحات اطلاعاتی</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      آدرس جدید یا دقیق‌تر دفتر
                    </label>
                    <textarea
                      rows={2}
                      value={reportForm.newAddress}
                      onChange={(e) => setReportForm({ ...reportForm, newAddress: e.target.value })}
                      placeholder="خیابان، میدان، پلاک و مشخصات محل جدید دفتر را بنویسید..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        شماره تلفن جدید (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={reportForm.newPhone}
                        onChange={(e) => setReportForm({ ...reportForm, newPhone: e.target.value })}
                        placeholder="مثلاً: ۰۲۱۵۵۹۰۰۱۱۱"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        ساعات کاری جدید (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={reportForm.newHours}
                        onChange={(e) => setReportForm({ ...reportForm, newHours: e.target.value })}
                        placeholder="مثلاً: ۸ الی ۱۵"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      توضیحات تکمیلی یا علت تغییر
                    </label>
                    <textarea
                      rows={2}
                      value={reportForm.notes}
                      onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                      placeholder="اگر توضیح خاصی وجود دارد (مثلاً تابلوی جدید نصب شده یا منبع خبر) اینجا بنویسید..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        نام شما (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={reportForm.reporterName}
                        onChange={(e) => setReportForm({ ...reportForm, reporterName: e.target.value })}
                        placeholder="نام گزارش‌دهنده"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        شماره تماس شما (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={reportForm.reporterPhone}
                        onChange={(e) => setReportForm({ ...reportForm, reporterPhone: e.target.value })}
                        placeholder="جهت تایید گزارش در صورت نیاز"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={reportSubmitting}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
                    >
                      <Send size={14} />
                      <span>{reportSubmitting ? "درحال ارسال..." : "ثبت و ارسال گزارش"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
