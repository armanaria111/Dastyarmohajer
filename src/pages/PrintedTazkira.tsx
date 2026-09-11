import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Search,
  FileSpreadsheet,
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  X,
  Sparkles,
  Layers,
  MapPin,
  Box,
  User,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  RefreshCw,
  QrCode,
  Calendar,
  Database,
  Server,
  Copy,
  Info
} from "lucide-react";
import { TazkiraRecord, INITIAL_TAZKIRAS } from "../data/initialTazkiras";
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  fetchTazkirasFromSupabase,
  insertTazkirasToSupabase,
  updateTazkiraInSupabase,
  deleteTazkiraFromSupabase
} from "../supabase";
import {
  parseExcelFile,
  parsePdfFile,
  parsePdfWithAI,
  parsePdfFileLocally,
  parseRawTextTable,
  exportTazkirasToExcel,
  AFGHAN_PROVINCES,
  normalizePersian
} from "../utils/tazkiraParser";

export default function PrintedTazkira() {
  const [tazkiras, setTazkiras] = useState<TazkiraRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedBox, setSelectedBox] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals & Panels
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TazkiraRecord | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<TazkiraRecord | null>(null);

  // Supabase Integration & Database Settings
  const [showDbSettingsModal, setShowDbSettingsModal] = useState(false);
  const [useSupabase, setUseSupabase] = useState(isSupabaseConfigured());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(getSupabaseCredentials().anonKey);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [testingDb, setTestingDb] = useState(false);
  const [syncingToSupabase, setSyncingToSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // File Upload State
  const [uploadTab, setUploadTab] = useState<"excel" | "pdf" | "paste">("pdf");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pdfEngine, setPdfEngine] = useState<"ai" | "local">("ai");
  const [defaultBoxForUpload, setDefaultBoxForUpload] = useState("B");
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedRecords, setAnalyzedRecords] = useState<TazkiraRecord[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [batchImporting, setBatchImporting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState<Partial<TazkiraRecord>>({
    fullName: "",
    surname: "",
    fatherName: "",
    province: "هرات",
    boxNumber: "B",
    remarks: "19-06-1405",
    status: "ready"
  });

  // 1. Data Loading (Supabase or Firestore)
  const refreshData = async () => {
    if (useSupabase) {
      setLoading(true);
      try {
        const list = await fetchTazkirasFromSupabase();
        setTazkiras(list);
      } catch (err: any) {
        console.error("Supabase load error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (useSupabase) {
      refreshData();
    } else {
      const q = query(collection(db, "printed_tazkiras"), orderBy("rowNumber", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: TazkiraRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any)
        }));
        setTazkiras(list);
        setLoading(false);
      }, (err) => {
        console.error("Firestore error loading tazkiras:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [useSupabase]);

  // 2. Seed Initial Samples from User PDF if empty
  const handleSeedInitialData = async () => {
    if (!confirm(`آیا تمایل دارید اطلاعات نمونه جدول پی‌دی‌اف توزیع تذکره الکترونیکی (${INITIAL_TAZKIRAS.length} متقاضی از باکس‌های B، A و A-1) را در سیستم ذخیره نمایید؟`)) {
      return;
    }

    setBatchImporting(true);
    try {
      // Chunk writes into Firestore batches of max 200
      const batchSize = 200;
      for (let i = 0; i < INITIAL_TAZKIRAS.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = INITIAL_TAZKIRAS.slice(i, i + batchSize);
        chunk.forEach((item) => {
          const docRef = doc(collection(db, "printed_tazkiras"));
          batch.set(docRef, {
            ...item,
            importedAt: Timestamp.now()
          });
        });
        await batch.commit();
      }
      alert("اطلاعات نمونه با موفقیت در پایگاه داده ثبت شد.");
    } catch (err: any) {
      alert("خطا در بارگذاری اطلاعات اولیه: " + err.message);
    } finally {
      setBatchImporting(false);
    }
  };

  // 3. Handle File Analysis
  const handleAnalyzeFile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsAnalyzing(true);
    setUploadMessage(null);
    setAnalysisProgress("در حال آماده‌سازی فایل برای تحلیل...");

    try {
      let parsed: TazkiraRecord[] = [];

      if (uploadTab === "excel") {
        if (!uploadFile) throw new Error("لطفاً یک فایل اکسل انتخاب نمایید.");
        setAnalysisProgress("در حال خواندن برگه‌ها و سطرهای فایل اکسل...");
        parsed = await parseExcelFile(uploadFile);
      } else if (uploadTab === "pdf") {
        if (!uploadFile) throw new Error("لطفاً یک فایل PDF یا تصویر جدول انتخاب نمایید.");
        
        if (pdfEngine === "ai") {
          try {
            parsed = await parsePdfWithAI(
              uploadFile,
              defaultBoxForUpload,
              (msg) => setAnalysisProgress(msg)
            );
          } catch (aiErr: any) {
            console.warn("AI parse encountered error, trying local spatial parser:", aiErr);
            setAnalysisProgress("سرویس هوش مصنوعی با ترافیک موقت روبرو شد (کد 503). در حال تلاش با موتور محلی مرورگر...");
            try {
              parsed = await parsePdfFileLocally(uploadFile, defaultBoxForUpload);
            } catch (localErr: any) {
              console.warn("Local parser also failed:", localErr);
              throw aiErr;
            }
          }
        } else {
          setAnalysisProgress("در حال استخراج هندسی سطرهای جدول از PDF با موتور محلی...");
          try {
            parsed = await parsePdfFileLocally(uploadFile, defaultBoxForUpload);
          } catch (localErr: any) {
            console.warn("Local PDF parse failed, switching to AI:", localErr);
            setAnalysisProgress("استخراج متنی محلی ناموفق بود. در حال استخراج با موتور هوش مصنوعی Gemini...");
            parsed = await parsePdfWithAI(
              uploadFile,
              defaultBoxForUpload,
              (msg) => setAnalysisProgress(msg)
            );
          }
        }
      } else if (uploadTab === "paste") {
        if (!pastedText.trim()) throw new Error("لطفاً متن جدول یا خروجی اسکن را پیست فرمایید.");
        setAnalysisProgress("در حال تفکیک ستون‌ها و شناسایی نام‌ها...");
        parsed = parseRawTextTable(pastedText, defaultBoxForUpload || "B", "ورود متنی");
      }

      if (parsed.length === 0) {
        throw new Error("هیچ رکوردی در این فایل شناسایی نشد. در صورت اسکن تصویری، گزینه «هوش مصنوعی Gemini» را انتخاب نمایید.");
      }

      setAnalyzedRecords(parsed);
      setUploadMessage({
        type: "success",
        text: `تعداد ${parsed.length} رکورد تذکره الکترونیکی با موفقیت توسط سیستم استخراج و شناسایی شد. لطفاً پیش‌نمایش زیر را بررسی نموده و برای ثبت نهایی در سیستم دکمه «تایید و ذخیره در سیستم» را بزنید.`
      });
    } catch (err: any) {
      setUploadMessage({
        type: "error",
        text: err.message || "خطا در تحلیل فایل. در صورت مشکل در خواندن PDF، از موتور هوش مصنوعی Gemini استفاده فرمایید."
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  // 4. Commit Analyzed Records (Supabase or Firestore)
  const handleCommitBatch = async () => {
    if (analyzedRecords.length === 0) return;
    setBatchImporting(true);

    try {
      if (useSupabase) {
        setAnalysisProgress("در حال ذخیره دسته‌ای در پایگاه داده Supabase...");
        await insertTazkirasToSupabase(analyzedRecords);
        await refreshData();
      } else {
        const batchSize = 250;
        for (let i = 0; i < analyzedRecords.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = analyzedRecords.slice(i, i + batchSize);
          chunk.forEach((item) => {
            const docRef = doc(collection(db, "printed_tazkiras"));
            batch.set(docRef, {
              ...item,
              importedAt: Timestamp.now()
            });
          });
          await batch.commit();
        }
      }

      alert(`تعداد ${analyzedRecords.length} تذکره جدید با موفقیت به پایگاه داده اضافه شد.`);
      setAnalyzedRecords([]);
      setUploadFile(null);
      setPastedText("");
      setShowUploadModal(false);
      setUploadMessage(null);
    } catch (err: any) {
      alert("خطا در ذخیره سازی رکوردهای گروهی: " + err.message);
    } finally {
      setBatchImporting(false);
    }
  };

  // 5. Add Single Manual Record
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.fullName || !manualForm.surname || !manualForm.fatherName) {
      alert("لطفاً نام، تخلص و نام پدر را وارد فرمایید.");
      return;
    }

    try {
      const nextRow = tazkiras.length > 0 ? Math.max(...tazkiras.map(t => t.rowNumber || 0)) + 1 : 1;
      const newRec: TazkiraRecord = {
        rowNumber: nextRow,
        fullName: normalizePersian(manualForm.fullName),
        surname: normalizePersian(manualForm.surname),
        fatherName: normalizePersian(manualForm.fatherName),
        province: manualForm.province || "هرات",
        boxNumber: (manualForm.boxNumber || "B").toUpperCase(),
        remarks: manualForm.remarks || "19-06-1405",
        status: (manualForm.status || "ready") as "ready" | "delivered",
        sourceFile: "ثبت دستی کارشناس"
      };

      if (useSupabase) {
        await insertTazkirasToSupabase([newRec]);
        await refreshData();
      } else {
        await addDoc(collection(db, "printed_tazkiras"), {
          ...newRec,
          importedAt: Timestamp.now()
        });
      }

      setShowAddManualModal(false);
      setManualForm({
        fullName: "",
        surname: "",
        fatherName: "",
        province: "هرات",
        boxNumber: "B",
        remarks: "19-06-1405",
        status: "ready"
      });
      alert("تذکره متقاضی با موفقیت ثبت شد.");
    } catch (err: any) {
      alert("خطا در ثبت تذکره: " + err.message);
    }
  };

  // 6. Update Record (e.g. Toggle Delivered Status)
  const handleToggleStatus = async (item: TazkiraRecord) => {
    if (!item.id) return;
    const newStatus = item.status === "delivered" ? "ready" : "delivered";
    const newDeliveredAt = newStatus === "delivered" ? new Date().toISOString() : undefined;
    try {
      if (useSupabase) {
        await updateTazkiraInSupabase(item.id, {
          status: newStatus,
          deliveredAt: newDeliveredAt
        });
        setTazkiras(prev => prev.map(t => t.id === item.id ? { ...t, status: newStatus, deliveredAt: newDeliveredAt } : t));
      } else {
        await updateDoc(doc(db, "printed_tazkiras", item.id), {
          status: newStatus,
          deliveredAt: newDeliveredAt || null
        });
      }
    } catch (err: any) {
      alert("خطا در تغییر وضعیت تذکره: " + err.message);
    }
  };

  // 7. Delete Record
  const handleDeleteRecord = async (id?: string) => {
    if (!id) return;
    if (!confirm("آیا از حذف این رکورد تذکره از لیست چاپ‌شده‌ها اطمینان دارید؟")) return;
    try {
      if (useSupabase) {
        await deleteTazkiraFromSupabase(id);
        setTazkiras(prev => prev.filter(t => t.id !== id));
      } else {
        await deleteDoc(doc(db, "printed_tazkiras", id));
      }
    } catch (err: any) {
      alert("خطا در حذف رکورد: " + err.message);
    }
  };

  // 7.1 Sync all loaded records to Supabase
  const handleSyncToSupabase = async () => {
    if (tazkiras.length === 0) {
      alert("هیچ رکوردی برای انتقال یافت نشد.");
      return;
    }
    setSyncingToSupabase(true);
    try {
      const inserted = await insertTazkirasToSupabase(tazkiras);
      alert(`تعداد ${inserted} رکورد تذکره با موفقیت در جدول Supabase کپی و همگام شد.`);
      setUseSupabase(true);
      await refreshData();
    } catch (err: any) {
      alert("خطا در انتقال به Supabase: " + err.message);
    } finally {
      setSyncingToSupabase(false);
    }
  };

  // 7.2 Test connection to Supabase
  const handleTestConnection = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
      const res = await testSupabaseConnection();
      setDbTestResult(res);
      if (res.success) {
        setUseSupabase(true);
        await refreshData();
      }
    } catch (err: any) {
      setDbTestResult({ success: false, message: err.message || String(err) });
    } finally {
      setTestingDb(false);
    }
  };

  // 8. Filtered List
  const filteredTazkiras = useMemo(() => {
    const q = normalizePersian(searchTerm.toLowerCase().trim());
    return tazkiras.filter((item) => {
      const matchSearch =
        !q ||
        normalizePersian(item.fullName).includes(q) ||
        normalizePersian(item.surname).includes(q) ||
        normalizePersian(item.fatherName).includes(q) ||
        item.province.includes(q) ||
        item.boxNumber.toLowerCase().includes(q) ||
        String(item.rowNumber).includes(q);

      const matchProv = selectedProvince === "all" || item.province === selectedProvince;
      const matchBox = selectedBox === "all" || item.boxNumber === selectedBox;
      const matchStatus = selectedStatus === "all" || item.status === selectedStatus;

      return matchSearch && matchProv && matchBox && matchStatus;
    });
  }, [tazkiras, searchTerm, selectedProvince, selectedBox, selectedStatus]);

  // Unique boxes and provinces in current DB
  const availableBoxes = useMemo(() => {
    const set = new Set(tazkiras.map(t => t.boxNumber).filter(Boolean));
    return Array.from(set).sort();
  }, [tazkiras]);

  const availableProvinces = useMemo(() => {
    const set = new Set(tazkiras.map(t => t.province).filter(Boolean));
    return Array.from(set).sort();
  }, [tazkiras]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-900 via-blue-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs text-blue-200 font-bold backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>سامانه استعلام و توزیع تذکره الکترونیکی (بایومتریک ایران)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              مدیریت و استعلام لیست تذکره‌های چاپ‌شده
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              تحلیل و ورود داده‌های فایل‌های PDF و اکسل توزیع تذکره، تفکیک بر اساس شماره باکس (B, A, A-1)، جستجوی فوری بر اساس نام و تخلص و نام پدر، و صدور رسید نوبت تحویل.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowDbSettingsModal(true)}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 border shadow-sm ${
                useSupabase
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-200"
                  : "bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/40 text-blue-200"
              }`}
              title="تنظیمات دیتابیس Supabase و نحوه استقرار در Render"
            >
              <Database size={15} className={useSupabase ? "text-emerald-400" : "text-blue-300"} />
              <span>دیتابیس: {useSupabase ? "Supabase (PostgreSQL)" : "Firebase"}</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Upload size={16} />
              <span>تحلیل و آپلود فایل (PDF/Excel)</span>
            </button>

            <button
              onClick={() => setShowAddManualModal(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>افزودن دستی</span>
            </button>

            <button
              onClick={() => exportTazkirasToExcel(filteredTazkiras)}
              disabled={filteredTazkiras.length === 0}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="دانلود فایل اکسل رکوردهای فعلی"
            >
              <Download size={16} />
              <span>خروجی اکسل</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-blue-200 block">کل تذکره‌های چاپ‌شده</span>
            <span className="text-xl sm:text-2xl font-black text-white">{tazkiras.length} مدرک</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-300 block">آماده تحویل در کنسولگری</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">
              {tazkiras.filter(t => t.status !== "delivered").length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-purple-300 block">تحویل داده شده</span>
            <span className="text-xl sm:text-2xl font-black text-purple-300">
              {tazkiras.filter(t => t.status === "delivered").length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-amber-300 block">باکس‌های توزیع</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">
              {availableBoxes.length > 0 ? availableBoxes.join("، ") : "باکس B, A, A-1"}
            </span>
          </div>
        </div>
      </div>

      {/* Empty State Banner with 1-Click Seed Button */}
      {tazkiras.length === 0 && !loading && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950/40 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-3xl text-center space-y-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 w-12 h-12 rounded-2xl mx-auto flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            هنوز رکوردی در بانک اطلاعاتی تذکره‌های چاپ‌شده ثبت نشده است
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            شما می‌توانید فایل PDF یا اکسل توزیع تذکره‌های خود را آپلود نمایید، یا با کلیک بر روی دکمه زیر، نمونه اطلاعات ۲۱ صفحه‌ای ارسال‌شده شما (باکس B، A و A-1) را با یک کلیک در دیتابیس بارگذاری کنید:
          </p>
          <div className="pt-2">
            <button
              onClick={handleSeedInitialData}
              disabled={batchImporting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              {batchImporting ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>بارگذاری نمونه اطلاعات جدول پی‌دی‌اف شما (Seed Demo Data)</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute right-3.5 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام متقاضی، تخلص، نام پدر، ولایت یا ردیف..."
              className="w-full pl-9 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter: Province */}
          <div className="md:col-span-3">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">تمام ولایت‌ها ({availableProvinces.length})</option>
              {availableProvinces.map((prov) => (
                <option key={prov} value={prov}>ولایت {prov}</option>
              ))}
            </select>
          </div>

          {/* Filter: Box Number */}
          <div className="md:col-span-2">
            <select
              value={selectedBox}
              onChange={(e) => setSelectedBox(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">تمام باکس‌ها</option>
              {availableBoxes.map((box) => (
                <option key={box} value={box}>باکس {box}</option>
              ))}
            </select>
          </div>

          {/* Filter: Status */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">وضعیت تحویل (همه)</option>
              <option value="ready">آماده تحویل</option>
              <option value="delivered">تحویل داده شده</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span>نمایش <strong>{filteredTazkiras.length}</strong> از <strong>{tazkiras.length}</strong> مدرک</span>
            {(searchTerm || selectedProvince !== "all" || selectedBox !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedProvince("all");
                  setSelectedBox("all");
                  setSelectedStatus("all");
                }}
                className="text-blue-600 hover:underline text-[11px] font-bold"
              >
                پاک‌سازی فیلترها
              </button>
            )}
          </div>

          <div className="text-[11px] text-gray-400">
            سازگار با ربات‌های تلگرام، بله، ایتا و روبیکا جهت استعلام آنلاین
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
            <span>درحال بارگذاری اطلاعات تذکره‌ها...</span>
          </div>
        ) : filteredTazkiras.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs space-y-2">
            <Search size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
            <p className="font-bold text-gray-600 dark:text-gray-300">هیچ رکوردی با مشخصات جستجو شده یافت نشد.</p>
            <p>نام یا تخلص دیگری را امتحان کنید یا فیلترها را ریست فرمایید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold">
                  <th className="py-3.5 px-4"># ردیف</th>
                  <th className="py-3.5 px-4">نام متقاضی</th>
                  <th className="py-3.5 px-4">تخلص</th>
                  <th className="py-3.5 px-4">نام پدر</th>
                  <th className="py-3.5 px-4">ولایت</th>
                  <th className="py-3.5 px-4 text-center">شماره باکس</th>
                  <th className="py-3.5 px-4">ملاحظات / تاریخ</th>
                  <th className="py-3.5 px-4 text-center">وضعیت تحویل</th>
                  <th className="py-3.5 px-4 text-center">عملیات و رسید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-700 dark:text-gray-200">
                {filteredTazkiras.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-gray-400">
                      {item.rowNumber || idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      {item.fullName}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {item.surname}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {item.fatherName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-[11px]">
                        <MapPin size={11} className="text-gray-400" />
                        <span>{item.province}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-xs ${
                          item.boxNumber === "B"
                            ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : item.boxNumber === "A"
                            ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        }`}
                      >
                        باکس {item.boxNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {item.remarks || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-all ${
                          item.status === "delivered"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        {item.status === "delivered" ? (
                          <>
                            <Check size={12} />
                            <span>تحویل شد</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} />
                            <span>آماده تحویل</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="مشاهده و چاپ رسید نوبت تحویل تذکره"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="حذف از لیست"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Upload and Analyze File (Excel / PDF / Paste) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-2xl w-full border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
                  <Upload size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    تحلیل و ورود هوشمند لیست تذکره‌های چاپ‌شده
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    پشتیبانی از فایل‌های Excel (.xlsx, .xls, .csv)، فایل‌های PDF و کپی-پیست مستقیم جداول
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setAnalyzedRecords([]);
                  setUploadMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Upload Format Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl">
              <button
                type="button"
                onClick={() => setUploadTab("excel")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  uploadTab === "excel"
                    ? "bg-white dark:bg-gray-800 text-emerald-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <FileSpreadsheet size={15} />
                <span>فایل اکسل (.xlsx, .xls)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("pdf")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  uploadTab === "pdf"
                    ? "bg-white dark:bg-gray-800 text-blue-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <FileText size={15} />
                <span>فایل PDF یا تصویر جدول</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("paste")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  uploadTab === "paste"
                    ? "bg-white dark:bg-gray-800 text-purple-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Sparkles size={15} />
                <span>کپی-پیست متن جدول</span>
              </button>
            </div>

            {/* Tab 1 & 2: File Picker */}
            {uploadTab !== "paste" ? (
              <div className="space-y-4">
                {/* Engine Selector for PDF */}
                {uploadTab === "pdf" && (
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>موتور پردازش و استخراج سند:</span>
                      </span>
                      <span className="text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-medium">
                        پشتیبانی از اسناد اسکن‌شده
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPdfEngine("ai")}
                        className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                          pdfEngine === "ai"
                            ? "border-blue-500 bg-white dark:bg-gray-800 shadow-xs ring-1 ring-blue-500"
                            : "border-gray-200 dark:border-gray-700 hover:bg-white/60 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                            <Sparkles size={13} className="text-blue-600" />
                            هوش مصنوعی Gemini
                          </span>
                          {pdfEngine === "ai" && <CheckCircle2 size={14} className="text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                          استخراج هوشمند PDFهای اداری، صفحات اسکن‌شده، تصاویر عکس‌برداری‌شده و اصلاح حروفی
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPdfEngine("local")}
                        className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                          pdfEngine === "local"
                            ? "border-blue-500 bg-white dark:bg-gray-800 shadow-xs ring-1 ring-blue-500"
                            : "border-gray-200 dark:border-gray-700 hover:bg-white/60 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            پردازش محلی مرورگر
                          </span>
                          {pdfEngine === "local" && <CheckCircle2 size={14} className="text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                          استخراج سریع متنی درون مرورگر (مخصوص PDFهای دیجیتال با لایه متنی سالم)
                        </p>
                      </button>
                    </div>

                    {/* Default Box Selector */}
                    <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        شماره باکس / کارتن توزیع پیش‌فرض:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {["B", "A", "A-1", "B-2", "C"].map((box) => (
                          <button
                            key={box}
                            type="button"
                            onClick={() => setDefaultBoxForUpload(box)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              defaultBoxForUpload === box
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                            }`}
                          >
                            {box}
                          </button>
                        ))}
                        <input
                          type="text"
                          value={defaultBoxForUpload}
                          onChange={(e) => setDefaultBoxForUpload(e.target.value)}
                          placeholder="کارتن"
                          className="w-16 px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-center font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* File Dropzone */}
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-gray-50/50 dark:bg-gray-900/30 transition-all"
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept={uploadTab === "excel" ? ".xlsx, .xls, .csv" : ".pdf, .png, .jpg, .jpeg, .webp"}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl">
                      {uploadTab === "excel" ? <FileSpreadsheet size={28} /> : <FileText size={28} />}
                    </div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {uploadFile ? uploadFile.name : `برای انتخاب فایل ${uploadTab === "excel" ? "اکسل" : "PDF یا تصویر جدول"} کلیک کنید یا فایل را بکشید`}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {uploadTab === "excel" 
                        ? "فرمت‌های پشتیبانی‌شده: .xlsx, .xls, .csv"
                        : "فرمت‌های پشتیبانی‌شده: اسناد PDF (متنی و اسکن) و تصاویر JPG/PNG جدول توزیع"}
                    </span>
                  </div>
                </div>

                {/* Live Progress Info */}
                {isAnalyzing && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3">
                    <RefreshCw size={18} className="animate-spin text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                      {analysisProgress || "در حال پردازش سند با هوش مصنوعی و استخراج ردیف‌های جدول..."}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-400">
                    ستون‌های هدف: ردیف، نام، تخلص، نام پدر، ولایت، شماره باکس، ملاحظات
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyzeFile}
                    disabled={!uploadFile || isAnalyzing}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{isAnalyzing ? "در حال استخراج..." : "تحلیل و استخراج اطلاعات تذکره‌ها"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 3: Paste Table Text */
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      متن سطرهای جدول را اینجا پیست فرمایید:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedText(
`1	احمد	جمشیدی	نعمت الله	هرات	B	19-06-1405
2	درسا	جمشیدی	امید	هرات	B	19-06-1405
3	دنیا	جمشیدی	امید	هرات	B	19-06-1405
4	عبدالله	جمشیدی	ذبیح الله	هرات	B	19-06-1405
5	هواگل	جمشیدی	شیرمحمد	هرات	B	19-06-1405
6	امیرحسین	جمشیدی	حسن	فاریاب	B	19-06-1405
7	امیرحمزه	جمشیدی	حسن	فاریاب	B	19-06-1405
8	امیرعلی	جمشیدی	امید	هرات	B	19-06-1405
9	مهدی	جمشیدی	محمد	هرات	B	19-06-1405
10	غنچه	جمشیدی	حسن	فاریاب	B	19-06-1405`
                        );
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-bold underline"
                    >
                      درج ۱۰ سطر نمونه تذکره جهت تست سریع
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="نمونه: 1	احمد	جمشیدی	نعمت الله	هرات	B	19-06-1405"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    سیستم به صورت خودکار ستون‌ها را بر اساس تب، خط تیره، ویرگول یا فاصله‌های چندگانه تفکیک می‌کند.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAnalyzeFile}
                    disabled={!pastedText.trim() || isAnalyzing}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>پردازش هوشمند متن جدول</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notification messages */}
            {uploadMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium space-y-2 ${
                  uploadMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  {uploadMessage.type === "success" ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{uploadMessage.text}</span>
                </div>

                {uploadMessage.type === "error" && uploadTab === "pdf" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200 dark:border-amber-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setPdfEngine("local");
                        setTimeout(() => handleAnalyzeFile(), 100);
                      }}
                      className="px-3 py-1 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                    >
                      ⚡ تغییر خودکار به «پردازش محلی مرورگر» و تلاش مجدد
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadTab("paste")}
                      className="px-3 py-1 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                    >
                      📋 کپی-پیست متن جدول (بدون نیاز به هوش مصنوعی)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analyzed Records Preview */}
            {analyzedRecords.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs">
                    پیش‌نمایش رکوردهای استخراج‌شده ({analyzedRecords.length} نفر):
                  </h4>
                  <span className="text-[11px] text-blue-600 font-mono">
                    آماده برای ثبت در دیتابیس
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 font-bold">
                        <th className="p-2">#</th>
                        <th className="p-2">نام</th>
                        <th className="p-2">تخلص</th>
                        <th className="p-2">نام پدر</th>
                        <th className="p-2">ولایت</th>
                        <th className="p-2">باکس</th>
                        <th className="p-2">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {analyzedRecords.slice(0, 30).map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="p-2 font-mono text-gray-400">{r.rowNumber}</td>
                          <td className="p-2 font-bold">{r.fullName}</td>
                          <td className="p-2 text-blue-600">{r.surname}</td>
                          <td className="p-2">{r.fatherName}</td>
                          <td className="p-2">{r.province}</td>
                          <td className="p-2 font-mono font-bold">{r.boxNumber}</td>
                          <td className="p-2 text-gray-400 font-mono">{r.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {analyzedRecords.length > 30 && (
                  <p className="text-[10px] text-gray-400 text-center">
                    ... و {analyzedRecords.length - 30} رکورد دیگر
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAnalyzedRecords([])}
                    className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitBatch}
                    disabled={batchImporting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    {batchImporting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>تایید و ذخیره نهایی در دیتابیس ({analyzedRecords.length} رکورد)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Manual Single Record */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                  <Plus size={20} />
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  ثبت دستی تذکره الکترونیکی چاپ‌شده
                </h3>
              </div>
              <button onClick={() => setShowAddManualModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام کوچک متقاضی *
                </label>
                <input
                  required
                  value={manualForm.fullName}
                  onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                  placeholder="مثلاً: احمد یا فاطمه"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تخلص (فامیلی) *
                  </label>
                  <input
                    required
                    value={manualForm.surname}
                    onChange={(e) => setManualForm({ ...manualForm, surname: e.target.value })}
                    placeholder="مثلاً: جمشیدی"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام پدر *
                  </label>
                  <input
                    required
                    value={manualForm.fatherName}
                    onChange={(e) => setManualForm({ ...manualForm, fatherName: e.target.value })}
                    placeholder="مثلاً: نعمت الله"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ولایت (افغانستان)
                  </label>
                  <input
                    value={manualForm.province}
                    onChange={(e) => setManualForm({ ...manualForm, province: e.target.value })}
                    placeholder="مثلاً: هرات، بلخ، دایکندی"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره باکس توزیع *
                  </label>
                  <input
                    required
                    value={manualForm.boxNumber}
                    onChange={(e) => setManualForm({ ...manualForm, boxNumber: e.target.value })}
                    placeholder="مثلاً: B یا A یا A-1"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  ملاحظات / تاریخ توزیع
                </label>
                <input
                  value={manualForm.remarks}
                  onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
                  placeholder="مثلاً: 19-06-1405"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  ذخیره در بانک اطلاعاتی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Receipt Slip for Applicant */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 dark:border-gray-700 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base">رسید استعلام و نوبت تحویل تذکره الکترونیکی</h3>
                  <span className="text-[11px] text-gray-400">بخش کنسولی و توزیع مدارک هویتی</span>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-5 bg-slate-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">وضعیت تذکره</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={16} />
                    <span>چاپ شده و آماده تحویل</span>
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 block">شماره ردیف در جدول</span>
                  <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
                    #{selectedReceipt.rowNumber}
                  </span>
                </div>
              </div>

              {/* Big Box Number Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-center shadow-md">
                <span className="text-xs text-blue-100 block">شماره باکس جهت مراجعه به باجه توزیع:</span>
                <span className="text-3xl font-black font-mono tracking-wider">
                  باکس {selectedReceipt.boxNumber}
                </span>
              </div>

              {/* Details List */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-gray-400 text-[11px] block">نام کامل متقاضی:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedReceipt.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">تخلص (شهرت):</span>
                  <strong className="text-blue-600 dark:text-blue-400">{selectedReceipt.surname}</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">نام پدر:</span>
                  <strong className="text-gray-800 dark:text-gray-200">{selectedReceipt.fatherName}</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">ولایت در افغانستان:</span>
                  <strong className="text-gray-800 dark:text-gray-200">{selectedReceipt.province}</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">تاریخ / نوبت:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{selectedReceipt.remarks}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">تاریخ صدور رسید:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {new Date().toLocaleDateString("fa-IR")}
                  </span>
                </div>
              </div>

              {/* Guidelines */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                <span className="font-bold block">مدارک الزامی جهت تحویل تذکره:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  <li>حضور شخص متقاضی (یا سرپرست قانونی خانوار)</li>
                  <li>اصل فیش واریزی و برگه نوبت بایومتریک انجام شده در ایران</li>
                  <li>اصل مدرک شناسایی قبلی (پاسپورت، کارت آمایش، یا تذکره کاغذی)</li>
                </ul>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-bold"
              >
                بستن
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-all"
                >
                  <Printer size={16} />
                  <span>پرینت رسید</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal: Supabase Database & Render Configuration */}
      {/* ========================================================= */}
      {showDbSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    پیکربندی دیتابیس Supabase و سرور Render
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    استفاده از پایگاه داده PostgreSQL بدون محدودیت سهمیه روزانه و استقرار در هاست ابری Render
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbSettingsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Active Engine Badge */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              useSupabase
                ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
            }`}>
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <span className={`w-3 h-3 rounded-full animate-pulse ${useSupabase ? "bg-emerald-500" : "bg-blue-500"}`} />
                <span>پایگاه داده در حال استفاده:</span>
                <span className="font-black underline">
                  {useSupabase ? "Supabase (PostgreSQL - سهمیه خواندن نامحدود)" : "Firebase Firestore"}
                </span>
              </div>
              {useSupabase && (
                <button
                  type="button"
                  onClick={() => {
                    setUseSupabase(false);
                  }}
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-bold hover:bg-gray-100"
                >
                  تغییر به Firebase
                </button>
              )}
            </div>

            {/* Supabase Connection Form */}
            <div className="space-y-3.5 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <Server size={14} className="text-emerald-600" />
                <span>مشخصات پروژه شما در Supabase:</span>
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Project URL (آدرس اختصاصی پروژه در Supabase):
                </label>
                <input
                  type="text"
                  placeholder="https://xyzabcdefg.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Anon / Public API Key (کلید دسترسی عمومی):
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white font-mono placeholder:text-gray-400 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingDb || !supabaseUrlInput || !supabaseKeyInput}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw size={14} className={testingDb ? "animate-spin" : ""} />
                  <span>{testingDb ? "در حال تست..." : "ذخیره و تست اتصال به Supabase"}</span>
                </button>

                {useSupabase && tazkiras.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={syncingToSupabase}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    <span>{syncingToSupabase ? "در حال انتقال..." : `انتقال ${tazkiras.length} رکورد فعلی به Supabase`}</span>
                  </button>
                )}

                {(supabaseUrlInput || supabaseKeyInput) && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSupabaseCredentials();
                      setSupabaseUrlInput("");
                      setSupabaseKeyInput("");
                      setDbTestResult(null);
                      setUseSupabase(false);
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition-all"
                  >
                    پاکسازی تنظیمات
                  </button>
                )}
              </div>

              {/* Test Result Message */}
              {dbTestResult && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${
                  dbTestResult.success
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                    : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800"
                }`}>
                  {dbTestResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  <div>
                    <span>{dbTestResult.message}</span>
                    {dbTestResult.count !== undefined && (
                      <span className="block text-[11px] font-normal mt-0.5">
                        تعداد رکوردهای موجود در جدول: {dbTestResult.count} رکورد
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Two Quick Step Guides: SQL Schema & Render Deployment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Box 1: SQL Schema */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <Database size={14} className="text-blue-600" />
                    <span>۱. ساخت جدول در Supabase</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.printed_tazkiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    row_number INTEGER,
    full_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    father_name TEXT NOT NULL,
    province TEXT DEFAULT 'هرات',
    box_number TEXT DEFAULT 'B',
    remarks TEXT,
    status TEXT DEFAULT 'ready',
    delivered_at TIMESTAMPTZ,
    source_file TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.printed_tazkiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all" ON public.printed_tazkiras FOR ALL USING (true);`);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }}
                    className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 hover:bg-gray-100"
                  >
                    {copiedSql ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedSql ? "کپی شد!" : "کپی اسکریپت SQL"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  فایل آماده <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">supabase_schema.sql</code> در پروژه ایجاد شده است. کافیست آن را در بخش <strong>SQL Editor</strong> داشبورد Supabase کپی و اجرا (Run) کنید.
                </p>
              </div>

              {/* Box 2: Render Blueprint */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-2xl space-y-2">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <Server size={14} className="text-emerald-600" />
                  <span>۲. استقرار روی سرور Render</span>
                </span>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  فایل کانفیگ <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">render.yaml</code> در ریشه پروژه قرار گرفت. وقتی مخزن GitHub خود را در <strong>Render.com</strong> متصل نمایید، به عنوان Web Service شناسایی شده و به صورت خودکار بیلد و آنلاین می‌شود.
                </p>
              </div>
            </div>

            {/* Modal Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDbSettingsModal(false)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                تایید و بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
