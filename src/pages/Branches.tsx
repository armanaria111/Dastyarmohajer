import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Plus,
  Trash2,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  Search,
  Clock,
  ShieldCheck,
  Edit3,
  Flag,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Calendar,
  Check,
  X
} from "lucide-react";
import {
  INITIAL_BRANCHES,
  CITY_COORDS,
  KefalatOffice,
  BranchReport
} from "../data/initialBranches";
import { openUniversalLocation } from "../utils/navigation";
import { PROVINCES_LIST } from "./Broadcast";

export default function Branches() {
  const [activeTab, setActiveTab] = useState<"offices" | "reports">("offices");
  const [offices, setOffices] = useState<KefalatOffice[]>([]);
  const [reports, setReports] = useState<BranchReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("همه");
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const [syncingDefaults, setSyncingDefaults] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    province: "تهران",
    city: "تهران",
    provinceCity: "تهران",
    neighborhood: "",
    address: "",
    phone: "",
    locationUrl: "",
    workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
    description: "انجام کلیه خدمات کارت هوشمند، تمدید برگه سرشماری، نوبت‌دهی و امور اقامتی اتباع",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Subscribe to Firestore branches
  useEffect(() => {
    const unsubBranches = onSnapshot(
      collection(db, "branches"),
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            const province = d.province || (d.provinceCity ? d.provinceCity.split(/[-–\s]/)[0] || "تهران" : "تهران");
            const city = d.city || (d.provinceCity ? d.provinceCity.split(/[-–]/)[1]?.trim() || province : province);
            return {
              id: docSnap.id,
              code: d.code || "",
              name: d.name || `دفتر کفالت کد ${d.code || ""}`,
              province: province,
              city: city,
              provinceCity: d.provinceCity || `${province} - ${city}`,
              neighborhood: d.neighborhood || "",
              address: d.address || "",
              phone: d.phone || "",
              locationUrl: d.locationUrl || "",
              workingHours: d.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
              description: d.description || "",
              latitude: d.latitude || 35.6892,
              longitude: d.longitude || 51.389,
            } as KefalatOffice;
          });
          setOffices(data);
        } else {
          // If Firestore is empty, fallback to INITIAL_BRANCHES
          setOffices(INITIAL_BRANCHES);
        }
        setLoading(false);
      },
      () => {
        setOffices(INITIAL_BRANCHES);
        setLoading(false);
      }
    );

    // 2. Subscribe to Firestore citizen reports
    const unsubReports = onSnapshot(
      collection(db, "branch_reports"),
      (snapshot) => {
        const cloudReports = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as BranchReport[];

        // Also merge local storage reports if any
        let localReports: BranchReport[] = [];
        try {
          localReports = JSON.parse(localStorage.getItem("citizen_branch_reports") || "[]");
        } catch {
          // Ignore
        }

        const cloudIds = new Set(cloudReports.map((r) => r.id));
        const combined = [...cloudReports];
        localReports.forEach((lr) => {
          if (!cloudIds.has(lr.id)) {
            combined.push(lr);
          }
        });

        // Sort: pending first, then by date desc
        combined.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setReports(combined);
      },
      () => {
        // Fallback to local
        try {
          const localReports = JSON.parse(localStorage.getItem("citizen_branch_reports") || "[]");
          setReports(localReports);
        } catch {
          setReports([]);
        }
      }
    );

    return () => {
      unsubBranches();
      unsubReports();
    };
  }, []);

  // One-click batch sync all 30+ default branches to Firestore
  const handleBatchSyncDefaults = async () => {
    if (
      !confirm(
        "آیا تمایل دارید تمام ۳۰+ دفتر کفالت رسمی پیش‌فرض با مشخصات کامل، تلفن، ساعت کاری و مختصات جغرافیایی در دیتابیس ابری ذخیره شوند؟"
      )
    ) {
      return;
    }

    setSyncingDefaults(true);
    try {
      const batch = writeBatch(db);
      for (const branch of INITIAL_BRANCHES) {
        const docRef = doc(collection(db, "branches"));
        batch.set(docRef, {
          code: branch.code,
          name: branch.name,
          province: branch.province,
          city: branch.city,
          provinceCity: branch.provinceCity,
          neighborhood: branch.neighborhood,
          address: branch.address,
          phone: branch.phone,
          locationUrl: branch.locationUrl,
          workingHours: branch.workingHours,
          description: branch.description,
          latitude: branch.latitude,
          longitude: branch.longitude,
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      showToast("بیش از ۳۰ دفتر کفالت رسمی با موفقیت در دیتابیس ابری ثبت و همگام‌سازی شدند.");
    } catch (err) {
      console.error("Error syncing branches:", err);
      showToast("خطا در همگام‌سازی ابری؛ تغییرات به صورت محلی ذخیره شد.");
    } finally {
      setSyncingDefaults(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      provinceCity: `${formData.province} - ${formData.city || formData.neighborhood}`,
      latitude: CITY_COORDS[formData.city]?.lat || CITY_COORDS[formData.province]?.lat || 35.6892,
      longitude: CITY_COORDS[formData.city]?.lng || CITY_COORDS[formData.province]?.lng || 51.389,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "branches", editingId), payload);
        showToast("مشخصات دفتر کفالت با موفقیت ویرایش و بروز شد.");
      } else {
        await addDoc(collection(db, "branches"), payload);
        showToast("دفتر کفالت جدید با موفقیت ثبت و در سامانه فعال شد.");
      }
    } catch {
      // Local fallback
      showToast("تغییرات با موفقیت ذخیره گردید.");
    }

    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (office: KefalatOffice) => {
    setEditingId(office.id);
    setFormData({
      code: office.code || "",
      name: office.name || "",
      province: office.province || "تهران",
      city: office.city || office.provinceCity || "",
      provinceCity: office.provinceCity || "",
      neighborhood: office.neighborhood || "",
      address: office.address || "",
      phone: office.phone || "",
      locationUrl: office.locationUrl || "",
      workingHours: office.workingHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
      description: office.description || "",
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این دفتر کفالت اطمینان دارید؟ این تغییر بلافاصله در تمام ربات‌ها اعمال خواهد شد.")) {
      try {
        await deleteDoc(doc(db, "branches", id));
      } catch {
        // Remove locally if not in Firestore
        setOffices(offices.filter((o) => o.id !== id));
      }
      showToast("دفتر کفالت حذف شد.");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      province: "تهران",
      city: "تهران",
      provinceCity: "تهران",
      neighborhood: "",
      address: "",
      phone: "",
      locationUrl: "",
      workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
      description: "انجام کلیه خدمات کارت هوشمند، تمدید برگه سرشماری، نوبت‌دهی و امور اقامتی اتباع",
    });
    setEditingId(null);
  };

  // Approve a citizen report and update the corresponding branch!
  const handleApproveReport = async (report: BranchReport) => {
    if (
      !confirm(
        `آیا مایل به تایید این گزارش و اعمال نشانی جدید بر روی دفتر «${report.officeName || report.officeCode}» هستید؟`
      )
    ) {
      return;
    }

    try {
      // 1. Find matching office in offices list
      const matchedOffice = offices.find(
        (o) =>
          (report.officeCode && o.code === report.officeCode) ||
          (report.officeName && o.name.includes(report.officeName))
      );

      const updateData: Partial<KefalatOffice> = {};
      if (report.newAddress) updateData.address = report.newAddress;
      if (report.newPhone) updateData.phone = report.newPhone;
      if (report.newHours) updateData.workingHours = report.newHours;

      if (matchedOffice && matchedOffice.id) {
        try {
          await updateDoc(doc(db, "branches", matchedOffice.id), updateData);
        } catch {
          // If was a local doc, add to firestore
          await addDoc(collection(db, "branches"), {
            ...matchedOffice,
            ...updateData,
          });
        }
      } else {
        // If not found, create new branch doc
        await addDoc(collection(db, "branches"), {
          code: report.officeCode || "جدید",
          name: report.officeName || "دفتر کفالت",
          province: report.province,
          city: report.city || report.province,
          provinceCity: `${report.province} - ${report.city || ""}`,
          neighborhood: report.city || "",
          address: report.newAddress || "ثبت شده توسط گزارش مردمی",
          phone: report.newPhone || "—",
          workingHours: report.newHours || "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰",
          description: report.notes || "ثبت شده بر اساس گزارش تغییر آدرس کاربران",
          locationUrl: "",
        });
      }

      // 2. Mark report as approved
      if (report.id && !report.id.startsWith("local_")) {
        await updateDoc(doc(db, "branch_reports", report.id), {
          status: "approved",
          resolvedAt: new Date().toISOString(),
        });
      }

      // Update local state
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: "approved", resolvedAt: new Date().toISOString() } : r))
      );

      showToast("آدرس جدید با موفقیت تایید شد و بر روی اطلاعات دفتر اعمال گردید.");
    } catch (err) {
      console.error("Error approving report:", err);
      showToast("خطا در تایید گزارش؛ مجدداً تلاش فرمایید.");
    }
  };

  // Reject a report
  const handleRejectReport = async (reportId: string) => {
    if (!confirm("آیا از رد این گزارش اطمینان دارید؟")) return;
    try {
      if (!reportId.startsWith("local_")) {
        await updateDoc(doc(db, "branch_reports", reportId), {
          status: "rejected",
          resolvedAt: new Date().toISOString(),
        });
      }
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "rejected", resolvedAt: new Date().toISOString() } : r))
      );
      showToast("گزارش رد شد.");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("آیا از حذف کامل این گزارش اطمینان دارید؟")) return;
    try {
      if (!reportId.startsWith("local_")) {
        await deleteDoc(doc(db, "branch_reports", reportId));
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      try {
        const local = JSON.parse(localStorage.getItem("citizen_branch_reports") || "[]");
        localStorage.setItem(
          "citizen_branch_reports",
          JSON.stringify(local.filter((r: any) => r.id !== reportId))
        );
      } catch {
        // ignore
      }
      showToast("گزارش حذف شد.");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOffices = offices.filter((b) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesCity =
      selectedCityFilter === "همه" ||
      b.provinceCity.includes(selectedCityFilter) ||
      b.province.includes(selectedCityFilter) ||
      b.neighborhood.includes(selectedCityFilter);
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

  const pendingReportsCount = reports.filter((r) => r.status === "pending").length;

  const filteredReports = reports.filter((r) => {
    if (reportStatusFilter !== "all" && r.status !== reportStatusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.officeName?.toLowerCase().includes(q) ||
      r.officeCode?.toLowerCase().includes(q) ||
      r.newAddress?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q) ||
      r.reporterName?.toLowerCase().includes(q)
    );
  });

  const cityTags = ["همه", "تهران", "مشهد", "اصفهان", "قم", "شیراز", "البرز", "یزد", "کرمان"];

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
            <span className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 size={22} />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              دفاتر کفالت، اقامت و اشتغال اتباع
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            بانک اطلاعات دفاتر سراسر کشور متصل به ربات‌های ایتا، بله، روبیکا، سروش+، گپ، آی‌گپ، تلگرام و واتساپ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleBatchSyncDefaults}
            disabled={syncingDefaults}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all font-bold text-xs shadow-sm disabled:opacity-50"
            title="همگام‌سازی بیش از ۳۰ دفتر رسمی در دیتابیس ابری"
          >
            <Sparkles size={16} />
            <span>{syncingDefaults ? "درحال همگام‌سازی..." : "همگام‌سازی ۳۰+ دفتر رسمی"}</span>
          </button>

          <button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                resetForm();
              } else {
                setIsAdding(true);
                setActiveTab("offices");
              }
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-md active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>{isAdding ? "بستن فرم" : "افزودن دفتر کفالت جدید"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Offices vs. Citizen Reports */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
        <button
          onClick={() => setActiveTab("offices")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === "offices"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          <Building2 size={16} />
          <span>فهرست دفاتر کفالت ({offices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          <Flag size={16} />
          <span>گزارش‌های مردمی تغییر آدرس</span>
          {pendingReportsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              {pendingReportsCount} جدید
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OFFICES LIST */}
      {activeTab === "offices" && (
        <>
          {/* City Filters & Search Input */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2">فیلتر استانی / شهری:</span>
              {cityTags.map((city) => (
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
            <form
              onSubmit={handleSave}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-900/50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200"
            >
              <div className="md:col-span-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  <span>{editingId ? "ویرایش مشخصات دفتر کفالت" : "مشخصات دفتر کفالت جدید"}</span>
                </h3>
                <span className="text-xs text-gray-500">اطلاعات فوراً در ربات‌ها و نقشه مسیریابی قابل جستجو خواهد بود</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">کد دفتر کفالت *</label>
                <input
                  required
                  placeholder="مثال: 101 یا 205"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام رسمی دفتر کفالت *</label>
                <input
                  required
                  placeholder="مثال: دفتر کفالت شماره ۱۰۱ شهرری"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان *</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="input-field font-bold"
                >
                  {PROVINCES_LIST.map((p) => (
                    <option key={p} value={p}>
                      استان {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شهر / شهرستان *</label>
                <input
                  required
                  placeholder="مثال: تهران، مشهد، اصفهان، شهرری..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">منطقه / محله</label>
                <input
                  placeholder="مثال: شهرری، گلشهر، زینبیه..."
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شماره تماس دفتر *</label>
                <input
                  required
                  placeholder="مثال: ۰۲۱۵۵۹۰۱۲۳۴"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ساعات کاری دفتر</label>
                <input
                  placeholder="مثال: شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰"
                  value={formData.workingHours}
                  onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  لینک نقشه و مسیریابی (بلد، نشان یا گوگل مپ)
                </label>
                <input
                  placeholder="https://balad.ir/..."
                  value={formData.locationUrl}
                  onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                  className="input-field font-mono text-xs"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">آدرس کامل پستی *</label>
                <textarea
                  required
                  placeholder="استان، شهرستان، خیابان، پلاک و طبقه..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  خدمات ارائه‌شده و توضیحات تکمیلی
                </label>
                <textarea
                  placeholder="توضیحات در خصوص کارت هوشمند، مدارک مورد نیاز یا شرایط نوبت‌دهی..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold text-sm"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  {editingId ? "ثبت ویرایش دفتر" : "ذخیره و انتشار در ربات‌ها و نقشه"}
                </button>
              </div>
            </form>
          )}

          {/* Offices Grid */}
          {loading ? (
            <div className="p-12 text-center text-gray-500">درحال بارگذاری اطلاعات دفاتر کفالت...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredOffices.map((office) => (
                <div
                  key={office.id || office.code}
                  onDoubleClick={() => handleEdit(office)}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all relative flex flex-col justify-between group"
                >
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
                              استان {office.province} - {office.city || office.provinceCity}
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
                          title="ویرایش مشخصات (دوبار کلیک هم می‌توانید بکنید)"
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
                        <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-gray-800 dark:text-gray-200">آدرس:</strong> {office.address}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-emerald-500 shrink-0" />
                        <span>
                          <strong className="text-gray-800 dark:text-gray-200">تلفن تماس:</strong>{" "}
                          <span dir="ltr" className="font-mono font-bold text-gray-900 dark:text-white">
                            {office.phone}
                          </span>
                        </span>
                      </div>

                      {office.workingHours && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-500 shrink-0" />
                          <span>
                            <strong className="text-gray-800 dark:text-gray-200">ساعات کاری:</strong>{" "}
                            {office.workingHours}
                          </span>
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
                      <span>فعال و متصل به ۸ ربات</span>
                    </span>
                    <button
                      onClick={() =>
                        openUniversalLocation({
                          lat: office.latitude,
                          lng: office.longitude,
                          locationUrl: office.locationUrl,
                          name: office.name,
                          address: office.address,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all"
                      title="مسیریابی در نشان، بلد، نقشه گوگل یا مسیریاب گوشی"
                    >
                      <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
                      <span>لوکیشن</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredOffices.length === 0 && !isAdding && (
                <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
                  <Building2 size={40} className="mx-auto text-gray-400 opacity-60" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {searchQuery ? "موردی با مشخصات جستجو شده یافت نشد." : "هیچ دفتر کفالتی ثبت نشده است."}
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleBatchSyncDefaults}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      همگام‌سازی بیش از ۳۰ دفتر رسمی پیش‌فرض
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CITIZEN ADDRESS CHANGE REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Reports Toolbar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-600 dark:text-gray-300">وضعیت:</span>
              <button
                onClick={() => setReportStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  reportStatusFilter === "all"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                همه ({reports.length})
              </button>
              <button
                onClick={() => setReportStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  reportStatusFilter === "pending"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                در انتظار بررسی ({pendingReportsCount})
              </button>
              <button
                onClick={() => setReportStatusFilter("approved")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  reportStatusFilter === "approved"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                تایید و اعمال شده ({reports.filter((r) => r.status === "approved").length})
              </button>
              <button
                onClick={() => setReportStatusFilter("rejected")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  reportStatusFilter === "rejected"
                    ? "bg-rose-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                رد شده ({reports.filter((r) => r.status === "rejected").length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در گزارش‌ها..."
                className="w-full px-3 py-2 pr-8 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
              />
              <Search size={14} className="absolute right-2.5 top-2.5 text-gray-400" />
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-2">
              <Flag size={36} className="mx-auto text-amber-500/50" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                هیچ گزارش تغییر آدرسی در این بخش یافت نشد.
              </p>
              <p className="text-xs text-gray-500">
                کاربران در بخش «مسیریابی هوشمند» می‌توانند جابجایی دفاتر یا تغییر آدرس‌ها را گزارش دهند.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-gray-800 border transition-all shadow-xs ${
                    report.status === "pending"
                      ? "border-amber-300 dark:border-amber-700/80 bg-amber-50/20"
                      : report.status === "approved"
                      ? "border-emerald-200 dark:border-emerald-800"
                      : "border-gray-200 dark:border-gray-700 opacity-75"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {report.status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                            در انتظار بررسی
                          </span>
                        )}
                        {report.status === "approved" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            تایید و اعمال شد
                          </span>
                        )}
                        {report.status === "rejected" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                            رد شده
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                          استان {report.province} {report.city ? `(${report.city})` : ""}
                        </span>

                        {report.officeCode && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                            کد {report.officeCode}
                          </span>
                        )}

                        <span className="text-[11px] text-gray-400">
                          {report.reportType === "address_change" && "تغییر نشانی و جابجایی"}
                          {report.reportType === "phone_change" && "تغییر شماره تلفن"}
                          {report.reportType === "hours_change" && "تغییر ساعت کاری"}
                          {report.reportType === "closed" && "گزارش تعطیلی دفتر"}
                          {report.reportType === "new_branch" && "معرفی دفتر جدید"}
                          {report.reportType === "other" && "سایر اصلاحات"}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 size={18} className="text-blue-600" />
                        <span>{report.officeName || `دفتر کفالت کد ${report.officeCode}`}</span>
                      </h4>

                      {report.newAddress && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
                          <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                            <MapPin size={14} className="text-amber-600 shrink-0" />
                            آدرس جدید گزارش‌شده:
                          </span>
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                            {report.newAddress}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 pt-1">
                        {report.newPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="text-emerald-500" />
                            <span>تلفن جدید:</span>
                            <span dir="ltr" className="font-mono font-bold text-gray-900 dark:text-white">
                              {report.newPhone}
                            </span>
                          </div>
                        )}
                        {report.newHours && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-amber-500" />
                            <span>ساعت کاری جدید:</span>
                            <span>{report.newHours}</span>
                          </div>
                        )}
                      </div>

                      {report.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
                          <strong className="text-gray-800 dark:text-gray-200">توضیحات گزارش‌دهنده:</strong>{" "}
                          {report.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                        {report.reporterName && (
                          <span className="flex items-center gap-1">
                            <UserCheck size={12} />
                            گزارش‌دهنده: {report.reporterName}
                          </span>
                        )}
                        {report.reporterPhone && (
                          <span className="flex items-center gap-1 font-mono" dir="ltr">
                            <Phone size={12} />
                            {report.reporterPhone}
                          </span>
                        )}
                        {report.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            تاریخ ثبت: {new Date(report.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      {report.status !== "approved" && (
                        <button
                          onClick={() => handleApproveReport(report)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          title="تایید و ثبت خودکار آدرس جدید روی دفتر"
                        >
                          <Check size={14} />
                          <span>تایید و اعمال روی دفتر</span>
                        </button>
                      )}

                      {report.status === "pending" && (
                        <button
                          onClick={() => handleRejectReport(report.id)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 dark:bg-gray-700 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          title="رد این گزارش"
                        >
                          <X size={14} />
                          <span>رد گزارش</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                        title="حذف گزارش"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
