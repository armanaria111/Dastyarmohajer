import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FileSearch,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Home,
  ShieldCheck,
  Building,
  CreditCard,
  Download,
  ExternalLink,
  X,
  Check,
  RefreshCw,
  QrCode,
  Landmark,
  BadgeAlert
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

// 1. Embassy Passport Interface
export interface EmbassyPassportRecord {
  id: string;
  receiptNumber: string; // e.g. "AFG-TEH-2024-8921" or bank slip
  tazkiraNumber: string;
  previousPassport?: string;
  fullName: string;
  fatherName: string;
  status: "ready_for_pickup" | "processing_kabul" | "printing" | "delivered" | "defective";
  boxNumber: string; // e.g. "کارتن ۱۲ - بسته ۴"
  counterNumber: string; // e.g. "باجه شماره ۳"
  pickupDate: string; // e.g. "۱۴۰۳/۰۹/۱۰"
  pickupTime: string; // e.g. "ساعت ۹ الی ۱۲ صبح"
  notes?: string;
  updatedAt: any;
}

// 2. Khodnevis Real Estate Contract Interface
export interface KhodnevisContractRecord {
  id: string;
  trackingCode: string; // 13-digit code
  postalCode: string;
  tenantName: string;
  tenantYekta: string; // Yekta or FIDA
  landlordName: string;
  propertyAddress: string;
  province: string;
  city: string;
  status: "signed_verified" | "waiting_witness" | "expired";
  startDate: string;
  endDate: string;
  deposit: string; // ودیعه (تومان)
  monthlyRent: string; // اجاره ماهیانه (تومان)
  kefalatApproved: boolean; // تاییدیه دفاتر کفالت و احراز سکونت
  updatedAt: any;
}

// 3. FIDA Code Record Interface
export interface FidaRecord {
  id: string;
  fidaCode: string; // 12 digits
  passportNumber: string;
  yektaCode: string;
  fullNameFa: string;
  fullNameEn: string;
  fatherName: string;
  nationality: string;
  birthDate: string;
  issueDate: string;
  status: "active" | "suspended" | "expired";
  bankStatus: string;
  registrationStatus: string;
  purpose: string;
  updatedAt: any;
}

// Initial Starter Data
const SEED_PASSPORTS: Omit<EmbassyPassportRecord, "id">[] = [
  {
    receiptNumber: "AFG-TEH-1403-1048",
    tazkiraNumber: "1398-04-12904",
    previousPassport: "P9018421",
    fullName: "محمد جواد حسینی",
    fatherName: "عبدالقیوم",
    status: "ready_for_pickup",
    boxNumber: "کارتن شماره ۱۴ - ردیف ۲",
    counterNumber: "باجه شماره ۵ (تحویل گذرنامه‌های الکترونیک)",
    pickupDate: "۱۴۰۳/۰۹/۰۵",
    pickupTime: "ساعت ۸:۳۰ الی ۱۱:۳۰ صبح",
    notes: "اصل فیش بانکی سپه و تذکره الکترونیکی هنگام تحویل الزامی است.",
    updatedAt: Timestamp.now()
  },
  {
    receiptNumber: "AFG-TEH-1403-1049",
    tazkiraNumber: "1397-01-44910",
    fullName: "فاطمه رضایی",
    fatherName: "محمد سرور",
    status: "processing_kabul",
    boxNumber: "-",
    counterNumber: "-",
    pickupDate: "در انتظار تایید مرکز کابل",
    pickupTime: "-",
    notes: "اطلاعات بیومتریک با موفقیت به اداره پاسپورت کابل ارسال شده و در صف صدور است.",
    updatedAt: Timestamp.now()
  },
  {
    receiptNumber: "AFG-TEH-1403-1050",
    tazkiraNumber: "1399-08-31092",
    fullName: "کامران سلطانی",
    fatherName: "حبیب الله",
    status: "ready_for_pickup",
    boxNumber: "کارتن شماره ۱۸ - ردیف ۳",
    counterNumber: "باجه شماره ۵",
    pickupDate: "۱۴۰۳/۰۹/۰۸",
    pickupTime: "ساعت ۹:۰۰ الی ۱۲:۰۰",
    notes: "پاسپورت چاپ و وارد سفارت شده است. تحویل با حضور شخص متقاضی صورت می‌گیرد.",
    updatedAt: Timestamp.now()
  }
];

const SEED_KHODNEVIS: Omit<KhodnevisContractRecord, "id">[] = [
  {
    trackingCode: "1403082910842",
    postalCode: "1874918273",
    tenantName: "عبدالرحیم محمدی",
    tenantYekta: "982019481023",
    landlordName: "علی اکبر میرزایی",
    propertyAddress: "استان تهران، شهرستان ری، باقرشهر، خیابان ۲۲ بهمن، پلاک ۴۲، طبقه ۲",
    province: "تهران",
    city: "شهرری",
    status: "signed_verified",
    startDate: "۱۴۰۳/۰۷/۰۱",
    endDate: "۱۴۰۴/۰۷/۰۱",
    deposit: "۱۵۰,۰۰۰,۰۰۰ تومان",
    monthlyRent: "۴,۵۰۰,۰۰۰ تومان",
    kefalatApproved: true,
    updatedAt: Timestamp.now()
  },
  {
    trackingCode: "1403081520193",
    postalCode: "9182736451",
    tenantName: "نوراحمد ابراهیمی",
    tenantYekta: "982019485521",
    landlordName: "حسین حسینی",
    propertyAddress: "خراسان رضوی، مشهد مقدس، بلوار طبرسی شمالی، طبرسی ۲۸، پلاک ۱۸",
    province: "خراسان رضوی",
    city: "مشهد",
    status: "signed_verified",
    startDate: "۱۴۰۳/۰۸/۰۱",
    endDate: "۱۴۰۴/۰۸/۰۱",
    deposit: "۸۰,۰۰۰,۰۰۰ تومان",
    monthlyRent: "۳,۲۰۰,۰۰۰ تومان",
    kefalatApproved: true,
    updatedAt: Timestamp.now()
  }
];

const SEED_FIDA: Omit<FidaRecord, "id">[] = [
  {
    fidaCode: "982019482710",
    passportNumber: "O01482910",
    yektaCode: "982019481023",
    fullNameFa: "عبدالله رسولی",
    fullNameEn: "ABDULLAH RASOULI",
    fatherName: "غلام سخی",
    nationality: "افغانستان",
    birthDate: "۱۳۷۱/۰۴/۱۵",
    issueDate: "۱۴۰۲/۰۳/۱۰",
    status: "active",
    bankStatus: "متصل به شبکه شاپرک و شتاب (مجوز حساب بانکی و کارت)",
    registrationStatus: "معتبر جهت اسناد رسمی و ثبت شرکت",
    purpose: "افتتاح حساب بانکی، کارت بانکی، ثبت اسناد و شرکت‌ها",
    updatedAt: Timestamp.now()
  },
  {
    fidaCode: "982019482711",
    passportNumber: "PA9021845",
    yektaCode: "982019485521",
    fullNameFa: "مریم احمدی",
    fullNameEn: "MARYAM AHMADI",
    fatherName: "نادر",
    nationality: "افغانستان",
    birthDate: "۱۳۷۶/۰۸/۲۰",
    issueDate: "۱۴۰۲/۰۵/۲۲",
    status: "active",
    bankStatus: "متصل به شبکه شاپرک و شتاب",
    registrationStatus: "معتبر جهت امور اداری و دانشگاهی",
    purpose: "امور دانشگاهی، بیمه و گواهینامه رانندگی",
    updatedAt: Timestamp.now()
  }
];

export default function SmartInquiries() {
  const [activeTab, setActiveTab] = useState<"passport" | "khodnevis" | "fida">("passport");

  // Real-time Lists from Firestore
  const [passports, setPassports] = useState<EmbassyPassportRecord[]>([]);
  const [contracts, setContracts] = useState<KhodnevisContractRecord[]>([]);
  const [fidaRecords, setFidaRecords] = useState<FidaRecord[]>([]);

  // Search States
  const [passportSearchQuery, setPassportSearchQuery] = useState("");
  const [passportSearchResult, setPassportSearchResult] = useState<EmbassyPassportRecord | null>(null);
  const [passportHasSearched, setPassportHasSearched] = useState(false);

  const [khodnevisSearchQuery, setKhodnevisSearchQuery] = useState("");
  const [khodnevisSearchResult, setKhodnevisSearchResult] = useState<KhodnevisContractRecord | null>(null);
  const [khodnevisHasSearched, setKhodnevisHasSearched] = useState(false);

  const [fidaSearchQuery, setFidaSearchQuery] = useState("");
  const [fidaSearchResult, setFidaSearchResult] = useState<FidaRecord | null>(null);
  const [fidaHasSearched, setFidaHasSearched] = useState(false);

  // Admin View / CRUD Modals State
  const [showAdminTable, setShowAdminTable] = useState(false);

  // Modals
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [editingPassportId, setEditingPassportId] = useState<string | null>(null);
  const [passportForm, setPassportForm] = useState({
    receiptNumber: "",
    tazkiraNumber: "",
    previousPassport: "",
    fullName: "",
    fatherName: "",
    status: "ready_for_pickup" as EmbassyPassportRecord["status"],
    boxNumber: "",
    counterNumber: "باجه شماره ۵",
    pickupDate: "",
    pickupTime: "ساعت ۹ الی ۱۲ ظهر",
    notes: ""
  });

  const [isKhodnevisModalOpen, setIsKhodnevisModalOpen] = useState(false);
  const [editingKhodnevisId, setEditingKhodnevisId] = useState<string | null>(null);
  const [khodnevisForm, setKhodnevisForm] = useState({
    trackingCode: "",
    postalCode: "",
    tenantName: "",
    tenantYekta: "",
    landlordName: "",
    propertyAddress: "",
    province: "تهران",
    city: "تهران",
    status: "signed_verified" as KhodnevisContractRecord["status"],
    startDate: "",
    endDate: "",
    deposit: "",
    monthlyRent: "",
    kefalatApproved: true
  });

  const [isFidaModalOpen, setIsFidaModalOpen] = useState(false);
  const [editingFidaId, setEditingFidaId] = useState<string | null>(null);
  const [fidaForm, setFidaForm] = useState({
    fidaCode: "",
    passportNumber: "",
    yektaCode: "",
    fullNameFa: "",
    fullNameEn: "",
    fatherName: "",
    nationality: "افغانستان",
    birthDate: "",
    issueDate: "",
    status: "active" as FidaRecord["status"],
    bankStatus: "متصل به سامانه شاپرک و شتاب",
    registrationStatus: "معتبر جهت اسناد رسمی و شرکت‌ها",
    purpose: "افتتاح حساب، کارت بانکی، ثبت اسناد و شرکت‌ها"
  });

  // Load Passports
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "embassy_passports"), (snap) => {
      if (!snap.empty) {
        setPassports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmbassyPassportRecord)));
      } else {
        SEED_PASSPORTS.forEach((p, idx) => {
          setDoc(doc(db, "embassy_passports", `pass_${idx + 1}`), p).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  // Load Khodnevis
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "khodnevis_contracts"), (snap) => {
      if (!snap.empty) {
        setContracts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KhodnevisContractRecord)));
      } else {
        SEED_KHODNEVIS.forEach((k, idx) => {
          setDoc(doc(db, "khodnevis_contracts", `khod_${idx + 1}`), k).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  // Load FIDA
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "fida_records"), (snap) => {
      if (!snap.empty) {
        setFidaRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FidaRecord)));
      } else {
        SEED_FIDA.forEach((f, idx) => {
          setDoc(doc(db, "fida_records", `fida_${idx + 1}`), f).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  // 1. Passport Inquiry Handler
  const handleSearchPassport = (e: React.FormEvent) => {
    e.preventDefault();
    setPassportHasSearched(true);
    const q = passportSearchQuery.trim().toLowerCase();
    if (!q) {
      setPassportSearchResult(null);
      return;
    }

    const found = passports.find(
      (p) =>
        (p.receiptNumber || "").toLowerCase().includes(q) ||
        (p.tazkiraNumber || "").toLowerCase().includes(q) ||
        (p.previousPassport || "").toLowerCase().includes(q) ||
        (p.fullName || "").includes(q)
    );
    setPassportSearchResult(found || null);
  };

  // 2. Khodnevis Inquiry Handler
  const handleSearchKhodnevis = (e: React.FormEvent) => {
    e.preventDefault();
    setKhodnevisHasSearched(true);
    const q = khodnevisSearchQuery.trim().toLowerCase();
    if (!q) {
      setKhodnevisSearchResult(null);
      return;
    }

    const found = contracts.find(
      (c) =>
        (c.trackingCode || "").toLowerCase().includes(q) ||
        (c.postalCode || "").toLowerCase().includes(q) ||
        (c.tenantYekta || "").toLowerCase().includes(q) ||
        (c.tenantName || "").includes(q)
    );
    setKhodnevisSearchResult(found || null);
  };

  // 3. FIDA Inquiry Handler
  const handleSearchFida = (e: React.FormEvent) => {
    e.preventDefault();
    setFidaHasSearched(true);
    const q = fidaSearchQuery.trim().toLowerCase();
    if (!q) {
      setFidaSearchResult(null);
      return;
    }

    const found = fidaRecords.find(
      (f) =>
        (f.fidaCode || "").toLowerCase().includes(q) ||
        (f.passportNumber || "").toLowerCase().includes(q) ||
        (f.yektaCode || "").toLowerCase().includes(q) ||
        (f.fullNameFa || "").includes(q) ||
        (f.fullNameEn || "").toLowerCase().includes(q)
    );
    setFidaSearchResult(found || null);
  };

  // Passport CRUD
  const handleSavePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportForm.receiptNumber || !passportForm.fullName) {
      alert("لطفاً شماره رسید/فیش و نام متقاضی را وارد نمایید.");
      return;
    }

    try {
      if (editingPassportId) {
        await updateDoc(doc(db, "embassy_passports", editingPassportId), {
          ...passportForm,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, "embassy_passports"), {
          ...passportForm,
          updatedAt: Timestamp.now()
        });
      }
      setIsPassportModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePassport = async (id: string) => {
    if (confirm("آیا از حذف این رکورد گذرنامه اطمینان دارید؟")) {
      try {
        await deleteDoc(doc(db, "embassy_passports", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Khodnevis CRUD
  const handleSaveKhodnevis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!khodnevisForm.trackingCode || !khodnevisForm.tenantName) {
      alert("لطفاً کد رهگیری و نام مستاجر را وارد کنید.");
      return;
    }

    try {
      if (editingKhodnevisId) {
        await updateDoc(doc(db, "khodnevis_contracts", editingKhodnevisId), {
          ...khodnevisForm,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, "khodnevis_contracts"), {
          ...khodnevisForm,
          updatedAt: Timestamp.now()
        });
      }
      setIsKhodnevisModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKhodnevis = async (id: string) => {
    if (confirm("آیا از حذف این قرارداد خودنویس اطمینان دارید؟")) {
      try {
        await deleteDoc(doc(db, "khodnevis_contracts", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // FIDA CRUD
  const handleSaveFida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fidaForm.fidaCode || !fidaForm.fullNameFa) {
      alert("لطفاً کد ۱۲ رقمی فیدا و نام فارسی را وارد کنید.");
      return;
    }

    try {
      if (editingFidaId) {
        await updateDoc(doc(db, "fida_records", editingFidaId), {
          ...fidaForm,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, "fida_records"), {
          ...fidaForm,
          updatedAt: Timestamp.now()
        });
      }
      setIsFidaModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFida = async (id: string) => {
    if (confirm("آیا از حذف این کد فیدا اطمینان دارید؟")) {
      try {
        await deleteDoc(doc(db, "fida_records", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20">
              <FileSearch size={16} />
              <span>موتور جامع استعلام مدارک و رهگیری سامانه‌های ملی و کنسولی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              سامانه استعلامات هوشمند اتباع و مهاجرین
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              استعلام آنلاین وضعیت پاسپورت سفارت افغانستان در تهران، اعتبارسنجی قرارداد اجاره سامانه خودنویس وزارت راه و استعلام کد فراگیر ۱۲ رقمی فیدا.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setShowAdminTable(!showAdminTable)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>{showAdminTable ? "بازگشت به فرم استعلام" : "مدیریت بانک اطلاعاتی (ادمین)"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/20 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("passport");
              setShowAdminTable(false);
            }}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "passport"
                ? "bg-blue-600 text-white shadow-md font-black"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Landmark size={16} />
            <span>۱. استعلام پاسپورت سفارت افغانستان (تهران)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("khodnevis");
              setShowAdminTable(false);
            }}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "khodnevis"
                ? "bg-emerald-600 text-white shadow-md font-black"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Home size={16} />
            <span>۲. استعلام سامانه خودنویس املاک (اجاره‌نامه)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("fida");
              setShowAdminTable(false);
            }}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "fida"
                ? "bg-purple-600 text-white shadow-md font-black"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <CreditCard size={16} />
            <span>۳. استعلام کد فراگیر فیدا (FIDA Code)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EMBASSY PASSPORT INQUIRY SECTION */}
      {/* ========================================================================= */}
      {activeTab === "passport" && !showAdminTable && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Landmark size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                پیگیری و استعلام پاسپورت الکترونیک سفارت افغانستان در تهران
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                جهت اطلاع از آماده بودن پاسپورت و شماره کارتن، شماره فیش واریزی بانکی، شماره تذکره یا نام متقاضی را در کادر زیر وارد فرمایید.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearchPassport} className="max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={passportSearchQuery}
                  onChange={(e) => setPassportSearchQuery(e.target.value)}
                  placeholder="شماره فیش بانکی (مثلاً AFG-TEH...) یا شماره تذکره..."
                  className="w-full pr-11 pl-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <Search size={16} />
                <span>استعلام</span>
              </button>
            </form>

            {/* Result Display */}
            {passportHasSearched && (
              <div className="max-w-2xl mx-auto pt-4 border-t border-slate-100 dark:border-slate-700 animate-in fade-in duration-200">
                {passportSearchResult ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                          <CheckCircle2 size={22} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-mono">شماره پرونده / فیش: {passportSearchResult.receiptNumber}</div>
                          <h3 className="text-base font-black text-gray-900 dark:text-white">
                            {passportSearchResult.fullName} (فرزند {passportSearchResult.fatherName})
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto ${
                          passportSearchResult.status === "ready_for_pickup"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : passportSearchResult.status === "processing_kabul"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {passportSearchResult.status === "ready_for_pickup"
                          ? "✓ چاپ شده و آماده تحویل"
                          : passportSearchResult.status === "processing_kabul"
                          ? "در مرحله صدور در مرکز کابل"
                          : "در حال بررسی مدارک"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">شماره تذکره الکترونیکی:</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {passportSearchResult.tazkiraNumber}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">محل نگهداری / کارتن:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                          {passportSearchResult.boxNumber || "تعیین نشده"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">باجه تحویل در سفارت:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {passportSearchResult.counterNumber || "باجه امور گذرنامه"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">تاریخ نوبت مراجعه:</span>
                        <span className="font-bold text-emerald-600 mt-1 block">
                          {passportSearchResult.pickupDate || "اعلام خواهد شد"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700 col-span-2">
                        <span className="text-gray-400 block text-[11px]">ساعت کاری جهت تحویل:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {passportSearchResult.pickupTime || "ساعت ۹ الی ۱۲ ظهر"}
                        </span>
                      </div>
                    </div>

                    {passportSearchResult.notes && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                        <strong>نکات مهم تحویل:</strong> {passportSearchResult.notes}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Printer size={15} />
                        <span>چاپ رسید استعلام سفارت</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-2">
                    <AlertCircle size={24} className="mx-auto text-amber-500" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">
                      رکوردی با مشخصات وارد شده در لیست ارسالی سفارت یافت نشد.
                    </p>
                    <p className="text-[11px] text-gray-400">
                      لطفاً شماره فیش یا شماره تذکره را بدون فاصله وارد کرده یا با باجه پیگیری سفارت تماس حاصل فرمایید.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KHODNEVIS REAL ESTATE CONTRACT INQUIRY SECTION */}
      {/* ========================================================================= */}
      {activeTab === "khodnevis" && !showAdminTable && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Home size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                استعلام قرارداد اجاره در سامانه خودنویس (وزارت راه و شهرسازی)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                اعتبارسنجی کد رهگیری ۱۳ رقمی اجاره‌نامه مسکونی و تاییدیه احراز سکونت اتباع جهت ارائه به دفاتر خدمات اقامت و اشتغال (کفالت).
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearchKhodnevis} className="max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={khodnevisSearchQuery}
                  onChange={(e) => setKhodnevisSearchQuery(e.target.value)}
                  placeholder="کد رهگیری ۱۳ رقمی خودنویس یا کد پستی ملک..."
                  className="w-full pr-11 pl-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <Search size={16} />
                <span>استعلام قرارداد</span>
              </button>
            </form>

            {/* Result Display */}
            {khodnevisHasSearched && (
              <div className="max-w-2xl mx-auto pt-4 border-t border-slate-100 dark:border-slate-700 animate-in fade-in duration-200">
                {khodnevisSearchResult ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                          <CheckCircle2 size={22} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-mono">کد رهگیری: {khodnevisSearchResult.trackingCode}</div>
                          <h3 className="text-base font-black text-gray-900 dark:text-white">
                            مستاجر: {khodnevisSearchResult.tenantName}
                          </h3>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                        ✓ قرارداد رسمی دارای اعتبار قانونی
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">موجر (مالک):</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {khodnevisSearchResult.landlordName}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">کد پستی ۱۰ رقمی:</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {khodnevisSearchResult.postalCode}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700 col-span-2">
                        <span className="text-gray-400 block text-[11px]">نشانی دقیق ملک مسکونی:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {khodnevisSearchResult.propertyAddress}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">مبلغ ودیعه (قرض‌الحسنه):</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {khodnevisSearchResult.deposit}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">مبلغ اجاره ماهیانه:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {khodnevisSearchResult.monthlyRent}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                      <span className="font-bold">تاییدیه احراز سکونت جهت ارائه به دفاتر کفالت:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[11px]">
                        مورد تایید و معتبر
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Printer size={15} />
                        <span>چاپ گواهی استعلام خودنویس</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-2">
                    <AlertCircle size={24} className="mx-auto text-amber-500" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">
                      قراردادی با این کد رهگیری در پایگاه داده خودنویس ثبت نشده است.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FIDA CODE INQUIRY SECTION */}
      {/* ========================================================================= */}
      {activeTab === "fida" && !showAdminTable && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <CreditCard size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                استعلام و راستی‌آزمایی شناسه فراگیر اتباع خارجی (کد فیدا - FIDA)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                استعلام اصالت کد ۱۲ رقمی فراگیر جهت افتتاح حساب بانکی، رفع مسدودی کارت‌های شتاب، ثبت رسمی شرکت و گواهینامه رانندگی.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearchFida} className="max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={fidaSearchQuery}
                  onChange={(e) => setFidaSearchQuery(e.target.value)}
                  placeholder="کد ۱۲ رقمی فیدا (مثلاً 982019...) یا شماره گذرنامه..."
                  className="w-full pr-11 pl-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <Search size={16} />
                <span>استعلام فیدا</span>
              </button>
            </form>

            {/* Result Display */}
            {fidaHasSearched && (
              <div className="max-w-2xl mx-auto pt-4 border-t border-slate-100 dark:border-slate-700 animate-in fade-in duration-200">
                {fidaSearchResult ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                          <CheckCircle2 size={22} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-mono">شناسه فراگیر (FIDA): {fidaSearchResult.fidaCode}</div>
                          <h3 className="text-base font-black text-gray-900 dark:text-white">
                            {fidaSearchResult.fullNameFa} ({fidaSearchResult.fullNameEn})
                          </h3>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                        ✓ کد فعال و معتبر در پایگاه شناسه فراگیر
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">شماره گذرنامه / سند:</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {fidaSearchResult.passportNumber}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">نام پدر:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {fidaSearchResult.fatherName}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">تابعیت:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {fidaSearchResult.nationality}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-gray-400 block text-[11px]">تاریخ صدور کد:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                          {fidaSearchResult.issueDate}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700 col-span-2">
                        <span className="text-gray-400 block text-[11px]">وضعیت در شبکه بانکی (بانک مرکزی):</span>
                        <span className="font-bold text-emerald-600 mt-1 block">
                          {fidaSearchResult.bankStatus}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                      <strong>کاربردهای مجاز:</strong> {fidaSearchResult.purpose}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Printer size={15} />
                        <span>چاپ گواهی تاییدیه کد فیدا</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-2">
                    <AlertCircle size={24} className="mx-auto text-amber-500" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">
                      شناسه فراگیر فیدا با این شماره در سیستم یافت نشد.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADMIN MANAGEMENT TABLE & CRUD (When showAdminTable is true) */}
      {/* ========================================================================= */}
      {showAdminTable && (
        <div className="space-y-6">
          {/* Admin Header with Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">
                مدیریت رکوردهای دیتابیس ({activeTab === "passport" ? "پاسپورت‌ها" : activeTab === "khodnevis" ? "قراردادهای خودنویس" : "کدهای فیدا"})
              </h3>
              <p className="text-xs text-gray-500">
                افزودن، ویرایش و حذف رکوردهای استعلامی متصل به دیتابیس فایربیس
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "passport" && (
                <button
                  onClick={() => {
                    setEditingPassportId(null);
                    setPassportForm({
                      receiptNumber: "",
                      tazkiraNumber: "",
                      previousPassport: "",
                      fullName: "",
                      fatherName: "",
                      status: "ready_for_pickup",
                      boxNumber: "",
                      counterNumber: "باجه شماره ۵",
                      pickupDate: "",
                      pickupTime: "ساعت ۹ الی ۱۲ ظهر",
                      notes: ""
                    });
                    setIsPassportModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>ثبت رکورد پاسپورت جدید</span>
                </button>
              )}

              {activeTab === "khodnevis" && (
                <button
                  onClick={() => {
                    setEditingKhodnevisId(null);
                    setKhodnevisForm({
                      trackingCode: "",
                      postalCode: "",
                      tenantName: "",
                      tenantYekta: "",
                      landlordName: "",
                      propertyAddress: "",
                      province: "تهران",
                      city: "تهران",
                      status: "signed_verified",
                      startDate: "",
                      endDate: "",
                      deposit: "",
                      monthlyRent: "",
                      kefalatApproved: true
                    });
                    setIsKhodnevisModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>ثبت قرارداد خودنویس جدید</span>
                </button>
              )}

              {activeTab === "fida" && (
                <button
                  onClick={() => {
                    setEditingFidaId(null);
                    setFidaForm({
                      fidaCode: "",
                      passportNumber: "",
                      yektaCode: "",
                      fullNameFa: "",
                      fullNameEn: "",
                      fatherName: "",
                      nationality: "افغانستان",
                      birthDate: "",
                      issueDate: "",
                      status: "active",
                      bankStatus: "متصل به سامانه شاپرک و شتاب",
                      registrationStatus: "معتبر جهت اسناد رسمی و شرکت‌ها",
                      purpose: "افتتاح حساب، کارت بانکی، ثبت اسناد و شرکت‌ها"
                    });
                    setIsFidaModalOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>ثبت شناسه فیدا جدید</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-x-auto p-5">
            {activeTab === "passport" && (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 text-gray-400 font-bold">
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-3">شماره فیش / رسید</th>
                    <th className="py-3 px-3">نام و نام پدر</th>
                    <th className="py-3 px-3">شماره تذکره</th>
                    <th className="py-3 px-3">کارتن / باجه</th>
                    <th className="py-3 px-3">وضعیت صدور</th>
                    <th className="py-3 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {passports.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{p.receiptNumber}</td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                        {p.fullName} ({p.fatherName})
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-400">{p.tazkiraNumber}</td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                        {p.boxNumber} / {p.counterNumber}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPassportId(p.id);
                              setPassportForm({
                                receiptNumber: p.receiptNumber,
                                tazkiraNumber: p.tazkiraNumber,
                                previousPassport: p.previousPassport || "",
                                fullName: p.fullName,
                                fatherName: p.fatherName,
                                status: p.status,
                                boxNumber: p.boxNumber,
                                counterNumber: p.counterNumber,
                                pickupDate: p.pickupDate,
                                pickupTime: p.pickupTime,
                                notes: p.notes || ""
                              });
                              setIsPassportModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="ویرایش"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePassport(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "khodnevis" && (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 text-gray-400 font-bold">
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-3">کد رهگیری</th>
                    <th className="py-3 px-3">مستاجر</th>
                    <th className="py-3 px-3">موجر</th>
                    <th className="py-3 px-3">شهر / کد پستی</th>
                    <th className="py-3 px-3">تاییدیه کفالت</th>
                    <th className="py-3 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contracts.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">{c.trackingCode}</td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{c.tenantName}</td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{c.landlordName}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {c.city} ({c.postalCode})
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {c.kefalatApproved ? "معتبر" : "رد شده"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingKhodnevisId(c.id);
                              setKhodnevisForm({
                                trackingCode: c.trackingCode,
                                postalCode: c.postalCode,
                                tenantName: c.tenantName,
                                tenantYekta: c.tenantYekta,
                                landlordName: c.landlordName,
                                propertyAddress: c.propertyAddress,
                                province: c.province,
                                city: c.city,
                                status: c.status,
                                startDate: c.startDate,
                                endDate: c.endDate,
                                deposit: c.deposit,
                                monthlyRent: c.monthlyRent,
                                kefalatApproved: c.kefalatApproved
                              });
                              setIsKhodnevisModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="ویرایش"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteKhodnevis(c.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "fida" && (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 text-gray-400 font-bold">
                    <th className="py-3 px-3">ردیف</th>
                    <th className="py-3 px-3">کد ۱۲ رقمی فیدا</th>
                    <th className="py-3 px-3">نام و نام خانوادگی</th>
                    <th className="py-3 px-3">نام پدر / گذرنامه</th>
                    <th className="py-3 px-3">تاریخ صدور</th>
                    <th className="py-3 px-3">وضعیت</th>
                    <th className="py-3 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fidaRecords.map((f, idx) => (
                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-purple-600">{f.fidaCode}</td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                        {f.fullNameFa} ({f.fullNameEn})
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {f.fatherName} / {f.passportNumber}
                      </td>
                      <td className="py-3 px-3 font-mono">{f.issueDate}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingFidaId(f.id);
                              setFidaForm({
                                fidaCode: f.fidaCode,
                                passportNumber: f.passportNumber,
                                yektaCode: f.yektaCode,
                                fullNameFa: f.fullNameFa,
                                fullNameEn: f.fullNameEn,
                                fatherName: f.fatherName,
                                nationality: f.nationality,
                                birthDate: f.birthDate,
                                issueDate: f.issueDate,
                                status: f.status,
                                bankStatus: f.bankStatus,
                                registrationStatus: f.registrationStatus,
                                purpose: f.purpose
                              });
                              setIsFidaModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="ویرایش"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteFida(f.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Passport Add/Edit */}
      {isPassportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                {editingPassportId ? "ویرایش رکورد گذرنامه سفارت" : "ثبت گذرنامه جدید سفارت"}
              </h3>
              <button onClick={() => setIsPassportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePassport} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره فیش / رسید *
                  </label>
                  <input
                    type="text"
                    required
                    value={passportForm.receiptNumber}
                    onChange={(e) => setPassportForm({ ...passportForm, receiptNumber: e.target.value })}
                    placeholder="AFG-TEH-..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تذکره الکترونیکی
                  </label>
                  <input
                    type="text"
                    value={passportForm.tazkiraNumber}
                    onChange={(e) => setPassportForm({ ...passportForm, tazkiraNumber: e.target.value })}
                    placeholder="1398-04-..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={passportForm.fullName}
                    onChange={(e) => setPassportForm({ ...passportForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام پدر
                  </label>
                  <input
                    type="text"
                    value={passportForm.fatherName}
                    onChange={(e) => setPassportForm({ ...passportForm, fatherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    وضعیت
                  </label>
                  <select
                    value={passportForm.status}
                    onChange={(e) => setPassportForm({ ...passportForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  >
                    <option value="ready_for_pickup">چاپ شده و آماده تحویل</option>
                    <option value="processing_kabul">در مرحله تایید در کابل</option>
                    <option value="printing">در صف چاپ</option>
                    <option value="delivered">تحویل داده شده</option>
                    <option value="defective">دارای نقص مدرک</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    کارتن / ردیف
                  </label>
                  <input
                    type="text"
                    value={passportForm.boxNumber}
                    onChange={(e) => setPassportForm({ ...passportForm, boxNumber: e.target.value })}
                    placeholder="کارتن ۱۴ - ردیف ۲"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تاریخ نوبت تحویل
                  </label>
                  <input
                    type="text"
                    value={passportForm.pickupDate}
                    onChange={(e) => setPassportForm({ ...passportForm, pickupDate: e.target.value })}
                    placeholder="۱۴۰۳/۰۹/۰۵"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ساعت مراجعه
                  </label>
                  <input
                    type="text"
                    value={passportForm.pickupTime}
                    onChange={(e) => setPassportForm({ ...passportForm, pickupTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نکات تحویل و مدارک
                </label>
                <textarea
                  rows={2}
                  value={passportForm.notes}
                  onChange={(e) => setPassportForm({ ...passportForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPassportModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-md"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Khodnevis Add/Edit */}
      {isKhodnevisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                {editingKhodnevisId ? "ویرایش قرارداد خودنویس" : "ثبت قرارداد خودنویس جدید"}
              </h3>
              <button onClick={() => setIsKhodnevisModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveKhodnevis} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    کد رهگیری ۱۳ رقمی *
                  </label>
                  <input
                    type="text"
                    required
                    value={khodnevisForm.trackingCode}
                    onChange={(e) => setKhodnevisForm({ ...khodnevisForm, trackingCode: e.target.value })}
                    placeholder="140308..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    کد پستی ۱۰ رقمی
                  </label>
                  <input
                    type="text"
                    value={khodnevisForm.postalCode}
                    onChange={(e) => setKhodnevisForm({ ...khodnevisForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام مستاجر اتباع *
                  </label>
                  <input
                    type="text"
                    required
                    value={khodnevisForm.tenantName}
                    onChange={(e) => setKhodnevisForm({ ...khodnevisForm, tenantName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام موجر (مالک)
                  </label>
                  <input
                    type="text"
                    value={khodnevisForm.landlordName}
                    onChange={(e) => setKhodnevisForm({ ...khodnevisForm, landlordName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نشانی کامل ملک
                </label>
                <input
                  type="text"
                  value={khodnevisForm.propertyAddress}
                  onChange={(e) => setKhodnevisForm({ ...khodnevisForm, propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    مبلغ ودیعه
                  </label>
                  <input
                    type="text"
                    value={khodnevisForm.deposit}
                    onChange={(e) => setKhodnevisForm({ ...khodnevisForm, deposit: e.target.value })}
                    placeholder="۱۰۰,۰۰۰,۰۰۰ تومان"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    اجاره ماهیانه
                  </label>
                  <input
                    type="text"
                    value={khodnevisForm.monthlyRent}
                    onChange={(e) => setKhodnevisForm({ ...khodnevisForm, monthlyRent: e.target.value })}
                    placeholder="۳,۰۰۰,۰۰۰ تومان"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="kefalatApproved"
                  checked={khodnevisForm.kefalatApproved}
                  onChange={(e) => setKhodnevisForm({ ...khodnevisForm, kefalatApproved: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="kefalatApproved" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  تاییدیه احراز سکونت جهت ارائه به دفاتر کفالت فعال است
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKhodnevisModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  ذخیره قرارداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FIDA Add/Edit */}
      {isFidaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                {editingFidaId ? "ویرایش شناسه فیدا" : "ثبت شناسه فیدا جدید"}
              </h3>
              <button onClick={() => setIsFidaModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveFida} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    کد ۱۲ رقمی فیدا *
                  </label>
                  <input
                    type="text"
                    required
                    value={fidaForm.fidaCode}
                    onChange={(e) => setFidaForm({ ...fidaForm, fidaCode: e.target.value })}
                    placeholder="982019..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره گذرنامه / کارت
                  </label>
                  <input
                    type="text"
                    value={fidaForm.passportNumber}
                    onChange={(e) => setFidaForm({ ...fidaForm, passportNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام و نام خانوادگی (فارسی) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fidaForm.fullNameFa}
                    onChange={(e) => setFidaForm({ ...fidaForm, fullNameFa: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام به لاتین (English)
                  </label>
                  <input
                    type="text"
                    value={fidaForm.fullNameEn}
                    onChange={(e) => setFidaForm({ ...fidaForm, fullNameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 font-mono uppercase"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام پدر
                  </label>
                  <input
                    type="text"
                    value={fidaForm.fatherName}
                    onChange={(e) => setFidaForm({ ...fidaForm, fatherName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تاریخ صدور کد
                  </label>
                  <input
                    type="text"
                    value={fidaForm.issueDate}
                    onChange={(e) => setFidaForm({ ...fidaForm, issueDate: e.target.value })}
                    placeholder="۱۴۰۲/۰۳/۱۰"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وضعیت در شبکه بانکی (بانک مرکزی)
                </label>
                <input
                  type="text"
                  value={fidaForm.bankStatus}
                  onChange={(e) => setFidaForm({ ...fidaForm, bankStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  کاربردهای مجاز کد
                </label>
                <input
                  type="text"
                  value={fidaForm.purpose}
                  onChange={(e) => setFidaForm({ ...fidaForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFidaModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-md"
                >
                  ذخیره شناسه فیدا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
