import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MapPin,
  Building2,
  X,
  BellRing,
  ShieldCheck,
  Eye,
  ExternalLink,
  Sparkles,
  Tag,
  Clock
} from "lucide-react";
import ImageUploader from "../components/ImageUploader";
import { PROVINCES_LIST } from "./Broadcast";

export interface FoundDocItem {
  id: string;
  docType: string; // کارت آمایش, پاسپورت, برگه سرشماری, تذکره, گواهینامه, کارت بانکی, سایر
  ownerName: string;
  docNumber: string; // شماره مدرک / کد یکتا / شماره پاسپورت
  province: string;
  city?: string;
  holdingLocation: string; // نام دفتر کفالت یا محل نگهداری
  contactPhone: string;
  imageUrl?: string;
  notes?: string;
  status: "available" | "returned"; // موجود در دفتر / تحویل داده شده
  createdAt: any;
}

export interface LostAlertItem {
  id: string;
  docType: string;
  ownerName: string;
  docNumber: string;
  contactPhone: string;
  platform?: string;
  province?: string;
  status: "active" | "matched" | "closed";
  notes?: string;
  createdAt: any;
}

const DOC_TYPES = [
  "کارت هوشمند و آمایش",
  "گذرنامه و پاسپورت",
  "برگه سرشماری و تثبیت",
  "تذکره الکترونیکی / کاغذی",
  "گواهینامه رانندگی",
  "کارت عابربانک و شناسایی",
  "مدارک تحصیلی و پرونده",
  "سایر اسناد هویتی"
];

export default function LostDocuments() {
  const [activeTab, setActiveTab] = useState<"found" | "lost">("found");
  const [foundDocs, setFoundDocs] = useState<FoundDocItem[]>([]);
  const [lostAlerts, setLostAlerts] = useState<LostAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");

  // Found Doc Form
  const [isAddingFound, setIsAddingFound] = useState(false);
  const [editingFoundId, setEditingFoundId] = useState<string | null>(null);
  const [foundFormData, setFoundFormData] = useState({
    docType: "کارت هوشمند و آمایش",
    ownerName: "",
    docNumber: "",
    province: "تهران",
    city: "شهرری",
    holdingLocation: "دفتر کفالت کد ۱۰۱ شهرری",
    contactPhone: "۰۲۱۵۵۹۰۱۲۳۴",
    imageUrl: "",
    notes: "",
    status: "available" as const
  });
  const [autoClearImg, setAutoClearImg] = useState(true);

  // Lost Alert Form
  const [isAddingLost, setIsAddingLost] = useState(false);
  const [editingLostId, setEditingLostId] = useState<string | null>(null);
  const [lostFormData, setLostFormData] = useState({
    docType: "کارت هوشمند و آمایش",
    ownerName: "",
    docNumber: "",
    contactPhone: "",
    platform: "web",
    province: "تهران",
    notes: "",
    status: "active" as const
  });

  useEffect(() => {
    // 1. Subscribe to found documents
    const qFound = query(collection(db, "found_documents"), orderBy("createdAt", "desc"));
    const unsubFound = onSnapshot(qFound, (snap) => {
      setFoundDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FoundDocItem)));
      setLoading(false);
    }, (err) => console.error(err));

    // 2. Subscribe to lost document alerts
    const qLost = query(collection(db, "lost_document_alerts"), orderBy("createdAt", "desc"));
    const unsubLost = onSnapshot(qLost, (snap) => {
      setLostAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as LostAlertItem)));
    }, (err) => console.error(err));

    return () => {
      unsubFound();
      unsubLost();
    };
  }, []);

  // Matching algorithm: checks if a found doc matches any user alert
  const findMatchesForFound = (foundDoc: FoundDocItem): LostAlertItem[] => {
    if (!foundDoc.ownerName && !foundDoc.docNumber) return [];
    const fName = foundDoc.ownerName.trim().toLowerCase();
    const fNum = (foundDoc.docNumber || "").trim().toLowerCase();

    return lostAlerts.filter(lost => {
      const lName = (lost.ownerName || "").trim().toLowerCase();
      const lNum = (lost.docNumber || "").trim().toLowerCase();

      const numMatch = fNum && lNum && (fNum === lNum || fNum.includes(lNum) || lNum.includes(fNum));
      const nameMatch = fName && lName && (fName === lName || (fName.length > 5 && (fName.includes(lName) || lName.includes(fName))));

      return numMatch || nameMatch;
    });
  };

  // Matching algorithm: checks if a lost alert matches any found doc
  const findMatchesForLost = (lostAlert: LostAlertItem): FoundDocItem[] => {
    if (!lostAlert.ownerName && !lostAlert.docNumber) return [];
    const lName = lostAlert.ownerName.trim().toLowerCase();
    const lNum = (lostAlert.docNumber || "").trim().toLowerCase();

    return foundDocs.filter(found => {
      const fName = (found.ownerName || "").trim().toLowerCase();
      const fNum = (found.docNumber || "").trim().toLowerCase();

      const numMatch = fNum && lNum && (fNum === lNum || fNum.includes(lNum) || lNum.includes(fNum));
      const nameMatch = fName && lName && (fName === lName || (fName.length > 5 && (fName.includes(lName) || lName.includes(fName))));

      return numMatch || nameMatch;
    });
  };

  // Save Found Document
  const handleSaveFound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFoundId) {
        await updateDoc(doc(db, "found_documents", editingFoundId), {
          ...foundFormData,
          updatedAt: Timestamp.now()
        });
        setEditingFoundId(null);
      } else {
        await addDoc(collection(db, "found_documents"), {
          ...foundFormData,
          createdAt: Timestamp.now()
        });
      }

      setIsAddingFound(false);
      if (autoClearImg) {
        setFoundFormData({
          docType: "کارت هوشمند و آمایش",
          ownerName: "",
          docNumber: "",
          province: "تهران",
          city: "شهرری",
          holdingLocation: "دفتر کفالت کد ۱۰۱ شهرری",
          contactPhone: "۰۲۱۵۵۹۰۱۲۳۴",
          imageUrl: "",
          notes: "",
          status: "available"
        });
      }
    } catch (err: any) {
      alert("خطا در ذخیره مدرک پیدا شده: " + err.message);
    }
  };

  // Save Lost Alert
  const handleSaveLost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLostId) {
        await updateDoc(doc(db, "lost_document_alerts", editingLostId), {
          ...lostFormData,
          updatedAt: Timestamp.now()
        });
        setEditingLostId(null);
      } else {
        await addDoc(collection(db, "lost_document_alerts"), {
          ...lostFormData,
          createdAt: Timestamp.now()
        });
      }

      setIsAddingLost(false);
      setLostFormData({
        docType: "کارت هوشمند و آمایش",
        ownerName: "",
        docNumber: "",
        contactPhone: "",
        platform: "web",
        province: "تهران",
        notes: "",
        status: "active"
      });
    } catch (err: any) {
      alert("خطا در ثبت درخواست مفقودی: " + err.message);
    }
  };

  const handleDeleteFound = async (id: string, name: string) => {
    if (confirm(`آیا از حذف مدرک پیدا شده به نام «${name}» اطمینان دارید؟`)) {
      await deleteDoc(doc(db, "found_documents", id));
    }
  };

  const handleDeleteLost = async (id: string, name: string) => {
    if (confirm(`آیا از حذف اعلان مفقودی به نام «${name}» اطمینان دارید؟`)) {
      await deleteDoc(doc(db, "lost_document_alerts", id));
    }
  };

  const handleToggleFoundStatus = async (item: FoundDocItem) => {
    const nextStatus = item.status === "available" ? "returned" : "available";
    await updateDoc(doc(db, "found_documents", item.id), { status: nextStatus });
  };

  // Filtered lists
  const filteredFound = foundDocs.filter(item => {
    const matchesType = docTypeFilter === "all" || item.docType === docTypeFilter;
    const matchesProv = provinceFilter === "all" || item.province === provinceFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesType && matchesProv;
    return matchesType && matchesProv && (
      (item.ownerName || "").toLowerCase().includes(q) ||
      (item.docNumber || "").toLowerCase().includes(q) ||
      (item.holdingLocation || "").toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    );
  });

  const filteredLost = lostAlerts.filter(item => {
    const matchesType = docTypeFilter === "all" || item.docType === docTypeFilter;
    const matchesProv = provinceFilter === "all" || item.province === provinceFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesType && matchesProv;
    return matchesType && matchesProv && (
      (item.ownerName || "").toLowerCase().includes(q) ||
      (item.docNumber || "").toLowerCase().includes(q) ||
      (item.contactPhone || "").toLowerCase().includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-bold text-teal-100 border border-white/20">
              <ShieldCheck size={14} className="text-teal-300" />
              <span>سامانه هوشمند استعلام و تطبیق اسناد مهاجرین</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">اسناد و مدارک مفقودی و پیدا شده</h2>
            <p className="text-sm text-teal-100/90 max-w-2xl leading-relaxed">
              ثبت اسناد پیدا شده (کارت آمایش، پاسپورت، برگه سرشماری، تذکره و کارت بانکی) توسط دفاتر کفالت، و ثبت مشخصات اسناد گمشده توسط کاربران همراه با <b>سیستم تطبیق هوشمند و تماس مستقیم</b>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[120px]">
              <span className="block text-2xl font-black">{foundDocs.length}</span>
              <span className="text-xs text-teal-100">مدارک پیدا شده</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[120px]">
              <span className="block text-2xl font-black">{lostAlerts.length}</span>
              <span className="text-xs text-teal-100">اعلان‌های مفقودی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("found")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "found"
                ? "bg-teal-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Building2 size={16} />
            <span>مدارک پیدا شده در دفاتر کفالت ({foundDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("lost")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "lost"
                ? "bg-teal-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <BellRing size={16} />
            <span>اعلان‌های مفقودی ثبت‌شده کاربران ({lostAlerts.length})</span>
          </button>
        </div>

        <div>
          {activeTab === "found" ? (
            <button
              onClick={() => {
                setEditingFoundId(null);
                setIsAddingFound(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow"
            >
              <Plus size={16} />
              <span>ثبت مدرک پیدا شده جدید</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingLostId(null);
                setIsAddingLost(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow"
            >
              <Plus size={16} />
              <span>ثبت مفقودی مدرک جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام صاحب مدرک، شماره سند یا کد یکتا..."
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 pr-10"
          />
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300"
          >
            <option value="all">همه انواع مدارک</option>
            {DOC_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300"
          >
            <option value="all">همه استان‌ها</option>
            {PROVINCES_LIST.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal / Form: Add or Edit Found Document */}
      {isAddingFound && (
        <form onSubmit={handleSaveFound} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-teal-200 dark:border-teal-900/60 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <Building2 size={18} className="text-teal-600" />
              <span>{editingFoundId ? "ویرایش اطلاعات مدرک پیدا شده" : "ثبت مدرک پیدا شده و تحویل‌شده به دفتر"}</span>
            </h3>
            <button type="button" onClick={() => setIsAddingFound(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نوع مدرک پیدا شده *</label>
            <select
              value={foundFormData.docType}
              onChange={e => setFoundFormData({ ...foundFormData, docType: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            >
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام و نام خانوادگی روی مدرک *</label>
            <input
              required
              placeholder="مثال: محمد رضا حیدری"
              value={foundFormData.ownerName}
              onChange={e => setFoundFormData({ ...foundFormData, ownerName: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              شماره مدرک / کد یکتا / شماره پاسپورت *
            </label>
            <input
              required
              placeholder="مثال: 9812345678 یا P1234567"
              value={foundFormData.docNumber}
              onChange={e => setFoundFormData({ ...foundFormData, docNumber: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان محل پیدا شدن *</label>
            <select
              value={foundFormData.province}
              onChange={e => setFoundFormData({ ...foundFormData, province: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            >
              {PROVINCES_LIST.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              محل نگهداری مدرک (دفتر کفالت / سازمان) *
            </label>
            <input
              required
              placeholder="مثال: دفتر کفالت ۱۰۱ شهرری - اتاق بایگانی"
              value={foundFormData.holdingLocation}
              onChange={e => setFoundFormData({ ...foundFormData, holdingLocation: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              شماره تماس مستقیم تحویل مدرک (قابل کلیک) *
            </label>
            <input
              required
              placeholder="۰۲۱۵۵۹۰۱۲۳۴"
              value={foundFormData.contactPhone}
              onChange={e => setFoundFormData({ ...foundFormData, contactPhone: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              label="تصویر یا اسکن مدرک (اختیاری)"
              sublabel="جهت تطبیق چهره و نام صاحب سند (بهینه‌سازی حجم خودکار)"
              value={foundFormData.imageUrl}
              onChange={dataUrl => setFoundFormData({ ...foundFormData, imageUrl: dataUrl })}
              onClear={() => setFoundFormData({ ...foundFormData, imageUrl: "" })}
              autoClearAfterSend={autoClearImg}
              onAutoClearToggle={val => setAutoClearImg(val)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">توضیحات و مشخصات تکمیلی</label>
            <textarea
              placeholder="محل پیدا شدن، جزئیات ظاهری، مدارک همراه و..."
              value={foundFormData.notes}
              onChange={e => setFoundFormData({ ...foundFormData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              rows={2}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setIsAddingFound(false)} className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
            <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow">
              {editingFoundId ? "ذخیره تغییرات" : "ثبت مدرک در سامانه"}
            </button>
          </div>
        </form>
      )}

      {/* Modal / Form: Add or Edit Lost Alert */}
      {isAddingLost && (
        <form onSubmit={handleSaveLost} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-blue-200 dark:border-blue-900/60 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <BellRing size={18} className="text-blue-600" />
              <span>{editingLostId ? "ویرایش اعلان مفقودی" : "ثبت مفقودی مدرک جهت اطلاع‌رسانی خودکار"}</span>
            </h3>
            <button type="button" onClick={() => setIsAddingLost(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نوع مدرک گم‌شده *</label>
            <select
              value={lostFormData.docType}
              onChange={e => setLostFormData({ ...lostFormData, docType: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            >
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نام صاحب مدرک *</label>
            <input
              required
              placeholder="نام و نام خانوادگی درج شده روی مدرک"
              value={lostFormData.ownerName}
              onChange={e => setLostFormData({ ...lostFormData, ownerName: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شماره مدرک یا کد یکتا (در صورت وجود)</label>
            <input
              placeholder="شماره پاسپورت، کد یکتا یا شماره آمایش"
              value={lostFormData.docNumber}
              onChange={e => setLostFormData({ ...lostFormData, docNumber: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              شماره موبایل کاربر جهت اطلاع‌رسانی پیدا شدن *
            </label>
            <input
              required
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={lostFormData.contactPhone}
              onChange={e => setLostFormData({ ...lostFormData, contactPhone: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان مفقود شدن</label>
            <select
              value={lostFormData.province}
              onChange={e => setLostFormData({ ...lostFormData, province: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            >
              {PROVINCES_LIST.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">پیام‌رسان جهت ارسال پیام</label>
            <select
              value={lostFormData.platform}
              onChange={e => setLostFormData({ ...lostFormData, platform: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            >
              <option value="eitaa">ایتا</option>
              <option value="bale">بله</option>
              <option value="rubika">روبیکا</option>
              <option value="soroush">سروش پلاس</option>
              <option value="telegram">تلگرام</option>
              <option value="web">پیامک / تماس تلفنی</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">توضیحات و نشانی تقریبی مفقودی</label>
            <textarea
              placeholder="تاریخ و ساعت تقریبی گم‌شدن، رنگ جلد و..."
              value={lostFormData.notes}
              onChange={e => setLostFormData({ ...lostFormData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
              rows={2}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setIsAddingLost(false)} className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">انصراف</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow">
              {editingLostId ? "ذخیره تغییرات" : "ثبت اعلان مفقودی"}
            </button>
          </div>
        </form>
      )}

      {/* View 1: Found Documents Grid */}
      {activeTab === "found" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>نمایش {filteredFound.length} مدرک پیدا شده</span>
          </div>

          {filteredFound.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700 text-center space-y-2">
              <FileText size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">موردی یافت نشد</p>
              <p className="text-xs text-gray-400">
                می‌توانید با دکمه بالا اسناد جدید پیدا شده را در دفاتر کفالت ثبت کنید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFound.map((item) => {
                const matches = findMatchesForFound(item);
                const cleanPhone = (item.contactPhone || "").replace(/[^0-9+]/g, "");

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-gray-800 p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      matches.length > 0
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-gray-100 dark:border-gray-700 shadow-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Match Alert Notification Badge */}
                      {matches.length > 0 && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-emerald-600 animate-pulse" />
                            <span>تطابق هوشمند یافت شد! ({matches.length} متقاضی)</span>
                          </div>
                          <a
                            href={`tel:${matches[0].contactPhone}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-[11px] inline-flex items-center gap-1 shadow-xs"
                          >
                            <Phone size={11} />
                            <span>تماس با صاحب سند ({matches[0].contactPhone})</span>
                          </a>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-md text-xs font-bold border border-teal-200 dark:border-teal-800/40">
                              {item.docType}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-bold">
                              📍 {item.province}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.status === "available"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              }`}
                            >
                              {item.status === "available" ? "موجود در دفتر" : "تحویل داده شد"}
                            </span>
                          </div>

                          <h3 className="text-base font-black text-gray-900 dark:text-white pt-1">
                            {item.ownerName}
                          </h3>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 block" dir="ltr">
                            شماره سند: {item.docNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleFoundStatus(item)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              item.status === "available"
                                ? "text-gray-400 hover:text-emerald-600 hover:bg-gray-100"
                                : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            }`}
                            title="تغییر وضعیت به تحویل داده شده"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFound(item.id, item.ownerName)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Image Preview if available */}
                      {item.imageUrl && (
                        <div className="rounded-xl overflow-hidden max-h-40 border border-gray-200 dark:border-gray-700">
                          <img src={item.imageUrl} alt="مدرک" className="w-full object-cover" />
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 pt-1">
                        <p className="flex items-center gap-1.5 font-medium">
                          <Building2 size={14} className="text-teal-600 shrink-0" />
                          <span>محل تحویل: {item.holdingLocation}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={14} className="text-blue-600 shrink-0" />
                          <a
                            href={`tel:${cleanPhone}`}
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline font-mono bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md"
                          >
                            تماس جهت تحویل: {item.contactPhone}
                          </a>
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-gray-400">
                      <span>ثبت توسط دفتر کفالت</span>
                      <span dir="ltr">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('fa-IR') : 'به تازگی'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Lost Alerts Grid */}
      {activeTab === "lost" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>نمایش {filteredLost.length} اعلان مفقودی کاربران</span>
          </div>

          {filteredLost.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700 text-center space-y-2">
              <BellRing size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">موردی یافت نشد</p>
              <p className="text-xs text-gray-400">
                کاربران می‌توانند از طریق دکمه «ثبت مفقودی مدرک جدید» یا از طریق ربات پیام‌رسان مشخصات سند گم‌شده خود را ثبت کنند.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLost.map((alert) => {
                const matches = findMatchesForLost(alert);
                const cleanPhone = (alert.contactPhone || "").replace(/[^0-9+]/g, "");

                return (
                  <div
                    key={alert.id}
                    className={`bg-white dark:bg-gray-800 p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      matches.length > 0
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                        : "border-gray-100 dark:border-gray-700 shadow-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Match Alert Notification Badge */}
                      {matches.length > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between gap-2 text-xs text-blue-800 dark:text-blue-200 font-bold">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-600 animate-pulse" />
                            <span>مدرک تطبیقی در دفاتر کفالت موجود است!</span>
                          </div>
                          <span className="text-[11px] font-mono underline">
                            دفتر: {matches[0].holdingLocation}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-md text-xs font-bold border border-blue-200 dark:border-blue-800/40">
                              {alert.docType}
                            </span>
                            {alert.province && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-bold">
                                📍 {alert.province}
                              </span>
                            )}
                            {alert.platform && (
                              <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-md text-[10px] font-bold">
                                {alert.platform}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-black text-gray-900 dark:text-white pt-1">
                            {alert.ownerName}
                          </h3>
                          {alert.docNumber && (
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 block" dir="ltr">
                              شماره سند: {alert.docNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteLost(alert.id, alert.ownerName)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"
                            title="حذف اعلان"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 pt-1">
                        <p className="flex items-center gap-1.5">
                          <Phone size={14} className="text-emerald-600 shrink-0" />
                          <a
                            href={`tel:${cleanPhone}`}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md"
                          >
                            شماره تماس متقاضی: {alert.contactPhone}
                          </a>
                        </p>
                        {alert.notes && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                            {alert.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-gray-400">
                      <span>ثبت شده توسط متقاضی</span>
                      <span dir="ltr">
                        {alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleDateString('fa-IR') : 'به تازگی'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
