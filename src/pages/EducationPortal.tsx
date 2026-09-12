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
  GraduationCap,
  BookOpen,
  School,
  Award,
  Calendar,
  ExternalLink,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  HelpCircle,
  Download,
  Filter,
  Check,
  X,
  Phone,
  Clock,
  Sparkles
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

export interface EducationBulletin {
  id: string;
  title: string;
  category: "scholarship" | "university" | "school" | "sirat";
  targetAudience: string; // e.g. "کارشناسی ارشد و دکتری" or "دانش‌آموزان پایه اول"
  organization: string; // e.g. "سازمان سنجش" or "وزارت علوم / سامانه سجاد"
  deadline: string;
  description: string;
  requirements: string[];
  linkUrl: string;
  isActive: boolean;
  createdAt: any;
}

export interface StudentConsultation {
  id: string;
  fullName: string;
  mobile: string;
  educationLevel: string;
  documentType: string;
  topic: string;
  message: string;
  status: "pending" | "answered" | "rejected";
  adminReply?: string;
  createdAt: any;
}

// Starter Data for Bulletins if empty
const INITIAL_BULLETINS: Omit<EducationBulletin, "id">[] = [
  {
    title: "دریافت شناسه اتباع (کد سازمان سنجش) ویژه کنکور ۱۴۰۳ - ۱۴۰۴",
    category: "university",
    targetAudience: "داوطلبان کنکور سراسری و ارشد",
    organization: "سازمان سنجش آموزش کشور (sanjesh.org)",
    deadline: "همزمان با شروع ثبت‌نام آزمون‌ها",
    description: "کلیه داوطلبان افغانستانی دارای کارت آمایش معتبر، گذرنامه اقامتی یا برگه سرشماری ملزم به ورود به پورتال سازمان سنجش و دریافت کد پیگیری ۱۳ رقمی اتباع خارجی هستند.",
    requirements: [
      "کارت آمایش معتبر مرحله ۱۷ یا ۱۸ / گذرنامه با روادید معتبر",
      "کد اختصاصی ۱۰ رقمی یا شناسه یکتا",
      "معدل کل و کتبی دیپلم یا مدرک کارشناسی"
    ],
    linkUrl: "https://sanjesh.org",
    isActive: true,
    createdAt: Timestamp.now()
  },
  {
    title: "ثبت‌نام در سامانه امور دانشجویان بین‌المللی (سجاد - Saorg)",
    category: "scholarship",
    targetAudience: "کلیه دانشجویان پذیرفته‌شده دانشگاه‌های ایران",
    organization: "سازمان امور دانشجویان وزارت علوم (saorg.ir)",
    deadline: "قبل از آغاز ترم تحصیلی جدید",
    description: "دانشجویان پس از قبولی در دانشگاه ملزم به تشکیل پرونده، بارگذاری مدارک و پیگیری مراحل اخذ گذرنامه تحصیلی و تبدیل ویزا در سامانه سجاد هستند.",
    requirements: [
      "گواهی پذیرش رسمی یا کارنامه قبولی سازمان سنجش",
      "پاسپورت معتبر یا کارت آمایش جهت تبدیل وضعیت",
      "تصویر آخرین مدرک تحصیلی تایید شده",
      "رسید واریز تعرفه کارشناسی سامانه سجاد"
    ],
    linkUrl: "https://saorg.ir",
    isActive: true,
    createdAt: Timestamp.now()
  },
  {
    title: "نوبت‌دهی پایگاه‌های سنجش سلامت نوآموزان بدو ورود به دبستان (سامانه سیرت)",
    category: "sirat",
    targetAudience: "نوآموزان پیش‌دبستانی و کلاس اولی‌ها",
    organization: "سازمان آموزش و پرورش استثنایی و وزارت آموزش و پرورش",
    deadline: "پایان خردادماه هر سال تحصیلی",
    description: "کلیه متولدین نیمه دوم سال ۱۳۹۶ و نیمه اول ۱۳۹۷ اتباع خارجی جهت ثبت‌نام در پایه اول دبستان باید در سامانه سیرت نوبت‌گیری نموده و گواهی سلامت دریافت نمایند.",
    requirements: [
      "کد یکتا دانش‌آموز (درج شده در برگه سرشماری یا کارت آمایش)",
      "کارت واکسیناسیون تکمیل شده مراکز بهداشت",
      "عکس ۳×۴ پرسنلی با زمینه سفید",
      "شناسه پستی محل سکونت خانوار"
    ],
    linkUrl: "https://sirat.medu.ir",
    isActive: true,
    createdAt: Timestamp.now()
  },
  {
    title: "ثبت‌نام کتاب‌های درسی و احراز هویت در پنجره واحد (مای مدیو - my.medu.ir)",
    category: "school",
    targetAudience: "تمامی پایه‌های تحصیلی مدارس ایران",
    organization: "وزارت آموزش و پرورش (my.medu.ir)",
    deadline: "مطابق تقویم تحصیلی مدارس",
    description: "ورود به پنجره خدمات الکترونیک وزارت آموزش و پرورش برای دانش‌آموزان اتباع با انتخاب گزینه «ورود کاربران اتباع خارجی» با کد یکتا یا کد اختصاصی امکان‌پذیر است.",
    requirements: [
      "کد یکتا / شناسه اختصاصی دانش‌آموز",
      "تاریخ تولد دقیق مطابق مدرک اقامتی",
      "شماره موبایل ثبت‌شده به نام سرپرست خانوار"
    ],
    linkUrl: "https://my.medu.ir",
    isActive: true,
    createdAt: Timestamp.now()
  },
  {
    title: "فراخوان بورسیه‌های شهریه دانشجویان غیرایرانی دانشگاه‌های جامع کشور",
    category: "scholarship",
    targetAudience: "رتبه‌های برتر علمی، نخبگان و مدال‌آوران اتباع",
    organization: "اداره امور بین‌الملل دانشگاه‌های تهران، فردوسی و امیرکبیر",
    deadline: "۳۰ مهرماه",
    description: "اعطای تخفیف ۵۰ تا ۱۰۰ درصدی شهریه تحصیلی به دانشجویان نخبه و ممتاز علمی افغانستانی مقیم ایران در رشته‌های علوم پایه، مهندسی و علوم انسانی.",
    requirements: [
      "معدل الف (بالای ۱۷ در مقطع قبلی)",
      "ثبت حداقل یک مقاله یا دستاورد علمی/پژوهشی معتبر",
      "توصیه‌نامه اساتید هیئت علمی",
      "فاقد سابقه سوء انضباطی در دانشگاه"
    ],
    linkUrl: "https://saorg.ir",
    isActive: true,
    createdAt: Timestamp.now()
  }
];

export default function EducationPortal() {
  const [activeTab, setActiveTab] = useState<"guides" | "scholarships" | "schools" | "admin" | "consultations">("guides");
  const [bulletins, setBulletins] = useState<EducationBulletin[]>([]);
  const [consultations, setConsultations] = useState<StudentConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Admin Bulletin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "university" as EducationBulletin["category"],
    targetAudience: "",
    organization: "",
    deadline: "",
    description: "",
    requirementsText: "",
    linkUrl: "",
    isActive: true
  });

  // Public Student Consultation Form State
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    fullName: "",
    mobile: "",
    educationLevel: "کارشناسی",
    documentType: "کارت آمایش",
    topic: "کنکور سراسری و کد سازمان سنجش",
    message: ""
  });
  const [consultSuccess, setConsultSuccess] = useState(false);

  // Admin Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeConsult, setActiveConsult] = useState<StudentConsultation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<"pending" | "answered" | "rejected">("answered");

  // Real-time Firestore Sync for Bulletins
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "education_bulletins"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EducationBulletin));
        setBulletins(list);
      } else {
        // Seed initial bulletins
        INITIAL_BULLETINS.forEach((b, i) => {
          setDoc(doc(db, "education_bulletins", `edu_${i + 1}`), b).catch(() => {});
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Real-time Firestore Sync for Student Consultations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "student_consultations"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentConsultation));
      setConsultations(list);
    });

    return () => unsub();
  }, []);

  // Filtered Bulletins
  const filteredBulletins = bulletins.filter((b) => {
    const matchesSearch =
      (b.title || "").includes(searchQuery) ||
      (b.organization || "").includes(searchQuery) ||
      (b.description || "").includes(searchQuery);
    const matchesCat = categoryFilter === "all" || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Handlers for Bulletins
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      category: "university",
      targetAudience: "",
      organization: "",
      deadline: "",
      description: "",
      requirementsText: "",
      linkUrl: "https://",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: EducationBulletin) => {
    setEditingId(b.id);
    setFormData({
      title: b.title,
      category: b.category,
      targetAudience: b.targetAudience,
      organization: b.organization,
      deadline: b.deadline,
      description: b.description,
      requirementsText: (b.requirements || []).join("\n"),
      linkUrl: b.linkUrl || "https://",
      isActive: b.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const handleSaveBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.organization) {
      alert("لطفاً عنوان و نام سازمان مرجع را وارد فرمایید.");
      return;
    }

    const requirements = formData.requirementsText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: formData.title,
      category: formData.category,
      targetAudience: formData.targetAudience,
      organization: formData.organization,
      deadline: formData.deadline,
      description: formData.description,
      requirements,
      linkUrl: formData.linkUrl,
      isActive: formData.isActive,
      updatedAt: Timestamp.now()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "education_bulletins", editingId), payload);
      } else {
        await addDoc(collection(db, "education_bulletins"), {
          ...payload,
          createdAt: Timestamp.now()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving bulletin:", err);
      alert("خطا در ذخیره اطلاعات.");
    }
  };

  const handleDeleteBulletin = async (id: string) => {
    if (confirm("آیا از حذف این بخشنامه / بورسیه تحصیلی اطمینان دارید؟")) {
      try {
        await deleteDoc(doc(db, "education_bulletins", id));
      } catch (err) {
        console.error("Error deleting bulletin:", err);
      }
    }
  };

  // Public Student Consultation Submission
  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultForm.fullName || !consultForm.mobile || !consultForm.message) {
      alert("لطفاً نام، شماره موبایل و متن سوال خود را وارد کنید.");
      return;
    }

    try {
      await addDoc(collection(db, "student_consultations"), {
        ...consultForm,
        status: "pending",
        createdAt: Timestamp.now()
      });
      setConsultSuccess(true);
      setTimeout(() => {
        setConsultSuccess(false);
        setIsConsultModalOpen(false);
        setConsultForm({
          fullName: "",
          mobile: "",
          educationLevel: "کارشناسی",
          documentType: "کارت آمایش",
          topic: "کنکور سراسری و کد سازمان سنجش",
          message: ""
        });
      }, 2500);
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت درخواست.");
    }
  };

  // Admin Reply Handler
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsult) return;

    try {
      await updateDoc(doc(db, "student_consultations", activeConsult.id), {
        adminReply: replyText,
        status: replyStatus,
        answeredAt: Timestamp.now()
      });
      setReplyModalOpen(false);
      setActiveConsult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    if (confirm("آیا از حذف این درخواست مشاوره تحصیلی اطمینان دارید؟")) {
      try {
        await deleteDoc(doc(db, "student_consultations", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportBulletins = () => {
    const headers = ["عنوان بخشنامه", "دسته‌بندی", "مخاطبان هدف", "سازمان مجری", "مهلت اقدام", "لینک ثبت‌نام", "وضعیت"];
    const rows = bulletins.map((b) => [
      b.title,
      b.category,
      b.targetAudience,
      b.organization,
      b.deadline,
      b.linkUrl,
      b.isActive ? "فعال" : "غیرفعال"
    ]);
    exportToCSV("دستورالعمل_ها_و_بورسیه_های_تحصیلی_اتباع", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20">
              <GraduationCap size={16} />
              <span>پایگاه تخصصی آموزش، سنجش سلامت و دانشگاه‌های غیرایرانی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              سامانه جامع امور مدارس، سنجش نوآموزان و دانشگاه‌های اتباع
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-3xl leading-relaxed">
              راهنمای دریافت کد سنجش کنکور، سامانه سجاد (Saorg)، گذرنامه تحصیلی، نوبت‌دهی سنجش سلامت مدارس (سیرت)، ثبت‌نام مای مدیو و بورسیه‌های فعال دانشگاه‌های ایران.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsConsultModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-800 hover:bg-blue-50 text-xs font-black flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Send size={15} />
              <span>درخواست مشاوره تحصیلی رایگان</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus size={15} />
              <span>افزودن اطلاعیه / بورسیه جدید</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/20 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("guides")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "guides"
                ? "bg-white text-blue-900 shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <BookOpen size={16} />
            <span>راهنمای گام‌به‌گام کنکور و دانشگاه</span>
          </button>

          <button
            onClick={() => setActiveTab("schools")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "schools"
                ? "bg-white text-blue-900 shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <School size={16} />
            <span>مدارس و سنجش سلامت (سیرت / مای مدیو)</span>
          </button>

          <button
            onClick={() => setActiveTab("scholarships")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "scholarships"
                ? "bg-white text-blue-900 shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Award size={16} />
            <span>فهرست بورسیه‌ها و بخشنامه‌ها ({bulletins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("consultations")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "consultations"
                ? "bg-white text-blue-900 shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <UserCheck size={16} />
            <span>صندوق مشاوره‌های دانشجویی ({consultations.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Step-by-Step University & Exam Guides */}
      {activeTab === "guides" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1: Sanjesh Code */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-black text-lg">
                ۱
              </div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">
                دریافت کد پیگیری سازمان سنجش
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                داوطلبان افغانستانی برای ثبت‌نام در کنکور سراسری، کارشناسی ارشد و دکتری باید ابتدا وارد بخش «ثبت‌نام داوطلبان اتباع غیرایرانی» در سایت سنجش شده و کد ۱۳ رقمی اختصاصی را دریافت کنند.
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <a
                  href="https://sanjesh.org"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>ورود به سایت سازمان سنجش</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Step 2: Saorg (Sajjad Portal) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-black text-lg">
                ۲
              </div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">
                سامانه سجاد و گذرنامه دانشجویی
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                پس از قبولی در دانشگاه، کلیه امور کنسولی، اخذ اقامت تحصیلی، تمدید ویزای دانشجویی، خروج و مراجعت و فارغ‌التحصیلی منحصراً از طریق پورتال سازمان امور دانشجویان وزارت علوم (Saorg) انجام می‌گیرد.
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <a
                  href="https://saorg.ir"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-slate-700 dark:hover:bg-indigo-600 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>ورود به سامانه سجاد (Saorg.ir)</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Step 3: University Tuition & Status Change */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-black text-lg">
                ۳
              </div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">
                شهریه و بورسیه‌های تحصیلی
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                دانشجویان افغانستانی بسته به دانشگاه (دولتی روزانه، شبانه، پردیس خودگردان، پیام‌نور و آزاد اسلامی) شهریه ریالی یا ارزی پرداخت می‌کنند و نخبگان می‌توانند از بورسیه وزارت علوم یا دانشگاه بهره‌مند شوند.
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setActiveTab("scholarships")}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white dark:bg-slate-700 dark:hover:bg-teal-600 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>مشاهده جدول بورسیه‌ها</span>
                  <Award size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Detailed University FAQ & Checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <span>مدارک الزامی جهت ثبت‌نام قطعی در دانشگاه‌های ایران</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 dark:text-gray-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-blue-600 dark:text-blue-400">الف) مدارک هویتی و اقامتی:</div>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>اصل و کپی گذرنامه دارای حداقل ۶ ماه اعتبار یا کارت آمایش مرحله آخر</li>
                  <li>شناسه اختصاصی ۱۰ رقمی (کد فیدا / کد یکتا)</li>
                  <li>۶ قطعه عکس پرسنلی رنگی ۴×۳ پشت‌نویسی شده</li>
                  <li>برگه تاییدیه عدم منع تردد در استان محل تحصیل</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-indigo-600 dark:text-indigo-400">ب) مدارک تحصیلی و تاییدیه:</div>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>اصل گواهی موقت و ریزنمرات مقطع قبلی (دیپلم / کارشناسی)</li>
                  <li>تاییدیه تحصیلی آموزش و پرورش یا سازمان امور دانشجویان</li>
                  <li>کارنامه سازمان سنجش با درج وضعیت قبولی</li>
                  <li>تعهدنامه محضری رعایت مقررات دانشجویان بین‌الملل</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Schools & Sirat Health Assessment */}
      {activeTab === "schools" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <School className="text-emerald-600" size={22} />
                  <span>راهنمای ثبت‌نام مدارس و سنجش سلامت نوآموزان اتباع</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  دستورالعمل جامع نوبت‌دهی سامانه سیرت و پنجره واحد مای مدیو (my.medu.ir)
                </p>
              </div>

              <a
                href="https://my.medu.ir"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shrink-0"
              >
                <span>ورود به سامانه مای مدیو</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sirat Health Center Guide */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>مراحل پایگاه سنجش سلامت نوآموزان (سامانه سیرت)</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">
                  <li>دریافت و آماده‌سازی «کد یکتا» یا «شناسه اختصاصی» فرزند از برگه سرشماری یا کارت آمایش.</li>
                  <li>ورود سرپرست به سامانه سیرت (sirat.medu.ir) با شماره موبایل ثبت شده به نام سرپرست.</li>
                  <li>انتخاب استان، شهر، نزدیک‌ترین مرکز جامع سنجش و رزرو روز و ساعت مراجعه.</li>
                  <li>مراجعه حضوری به پایگاه سنجش همراه با نوآموز جهت ارزیابی بینایی، شنوایی، آمادگی تحصیلی و جسمی.</li>
                  <li>ثبت نتیجه قبولی سنجش سلامت در سامانه کشوری و دریافت برگه سلامت جهت تحویل به مدرسه.</li>
                </ol>
              </div>

              {/* Educational Support Certificate Guide */}
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
                  <AlertCircle size={18} />
                  <span>برگه حمایت تحصیلی ویژه دانش‌آموزان فاقد مدرک</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">
                  <li>بر اساس فرمان رهبری، تمامی کودکان افغانستانی حق تحصیل در مدارس دولتی ایران را دارند.</li>
                  <li>خانواده‌های فاقد مدرک معتبر با اعلام سازمان ملی مهاجرت به دفاتر کفالت مراجعه و نوبت دریافت می‌کنند.</li>
                  <li>پس از احراز هویت اولیه در دفاتر خدمات و کفالت، «برگه حمایت تحصیلی» دارای کد یکتا صادر می‌شود.</li>
                  <li>با این برگه والدین می‌توانند فرزند را در پایگاه سنجش سلامت و سپس مدرسه نزدیک محل سکونت ثبت‌نام نمایند.</li>
                  <li>اعتبار برگه حمایت تحصیلی یک سال تحصیلی است و سالانه باید تجدید شود.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Scholarships & Official Circulars List */}
      {activeTab === "scholarships" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute right-3 top-2.5 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="جستجو در بورسیه‌ها و بخشنامه‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه دسته‌ها</option>
                <option value="university">دانشگاه و کنکور</option>
                <option value="scholarship">بورسیه تحصیلی</option>
                <option value="school">مدارس مای مدیو</option>
                <option value="sirat">سنجش سلامت سیرت</option>
              </select>
            </div>

            <button
              onClick={handleExportBulletins}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download size={14} />
              <span>خروجی اکسل</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBulletins.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {item.organization}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{item.deadline}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-black text-gray-900 dark:text-white leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.description}
                  </p>

                  {item.requirements && item.requirements.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300">شرایط و مدارک مورد نیاز:</div>
                      <ul className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                        {item.requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span>ثبت‌نام و جزئیات رسمی</span>
                    <ExternalLink size={13} />
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all"
                      title="ویرایش"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteBulletin(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                      title="حذف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Student Consultations Inbox (Admin View) */}
      {activeTab === "consultations" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" />
              <span>درخواست‌های مشاوره ثبت‌شده توسط دانش‌آموزان و دانشجویان ({consultations.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-100 dark:border-slate-800 text-gray-400 font-bold">
                  <th className="py-3 px-3">ردیف</th>
                  <th className="py-3 px-3">نام متقاضی</th>
                  <th className="py-3 px-3">شماره تماس</th>
                  <th className="py-3 px-3">مقطع / مدرک</th>
                  <th className="py-3 px-3">موضوع مشاوره</th>
                  <th className="py-3 px-3">متن سوال</th>
                  <th className="py-3 px-3">وضعیت</th>
                  <th className="py-3 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {consultations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      هنوز درخواست مشاوره‌ای ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  consultations.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                      <td className="py-3 px-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{item.fullName}</td>
                      <td className="py-3 px-3 font-mono text-blue-600 dark:text-blue-400">{item.mobile}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                        {item.educationLevel} ({item.documentType})
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-800 dark:text-gray-200">{item.topic}</td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {item.message}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "answered"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.status === "answered"
                            ? "پاسخ داده شد"
                            : item.status === "rejected"
                            ? "رد شد"
                            : "در انتظار بررسی"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setActiveConsult(item);
                              setReplyText(item.adminReply || "");
                              setReplyStatus(item.status || "answered");
                              setReplyModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            title="پاسخ به متقاضی"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteConsultation(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="حذف درخواست"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Bulletin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="text-blue-600" size={18} />
                <span>{editingId ? "ویرایش بخشنامه / بورسیه" : "افزودن بخشنامه یا بورسیه جدید"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBulletin} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  عنوان اطلاعیه / بورسیه *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: فراخوان بورسیه تحصیلی دانشگاه تهران"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    دسته‌بندی
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="university">دانشگاه و کنکور</option>
                    <option value="scholarship">بورسیه تحصیلی</option>
                    <option value="school">مدارس مای مدیو</option>
                    <option value="sirat">سنجش سلامت سیرت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سازمان مرجع *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="سازمان سنجش / وزارت علوم"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    مخاطبان هدف
                  </label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="مثال: مقطع کارشناسی ارشد"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    مهلت ثبت‌نام / اقدام
                  </label>
                  <input
                    type="text"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    placeholder="مثال: ۳۰ آبان‌ماه"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  توضیحات و راهنمای کامل
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="شرح جزئیات شرایط، تسهیلات و نحوه اقدام..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  شرایط و مدارک الزامی (هر مورد در یک سطر)
                </label>
                <textarea
                  rows={3}
                  value={formData.requirementsText}
                  onChange={(e) => setFormData({ ...formData, requirementsText: e.target.value })}
                  placeholder="مدرک هویتی معتبر&#10;معدل بالای ۱۶&#10;تاییدیه سازمان سنجش"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  لینک رسمی سامانه جهت ثبت‌نام
                </label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Public Student Consultation Request */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="text-blue-600" size={18} />
                <span>درخواست مشاوره تحصیلی و پاسخ به پرسش‌ها</span>
              </h3>
              <button onClick={() => setIsConsultModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {consultSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-black text-base text-gray-900 dark:text-white">درخواست شما با موفقیت ثبت شد</h4>
                <p className="text-xs text-gray-500">
                  کارشناسان دستیار مهاجر پس از بررسی از طریق تماس یا پیام‌رسان با شما در ارتباط خواهند بود.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitConsultation} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={consultForm.fullName}
                    onChange={(e) => setConsultForm({ ...consultForm, fullName: e.target.value })}
                    placeholder="مثال: علی رضایی"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      شماره تماس همراه *
                    </label>
                    <input
                      type="text"
                      required
                      value={consultForm.mobile}
                      onChange={(e) => setConsultForm({ ...consultForm, mobile: e.target.value })}
                      placeholder="0912..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      نوع مدرک اقامتی
                    </label>
                    <select
                      value={consultForm.documentType}
                      onChange={(e) => setConsultForm({ ...consultForm, documentType: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="کارت آمایش">کارت آمایش</option>
                      <option value="گذرنامه اقامتی / تحصیلی">گذرنامه اقامتی / تحصیلی</option>
                      <option value="برگه سرشماری">برگه سرشماری</option>
                      <option value="فاقد مدرک">فاقد مدرک</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    موضوع مورد نظر
                  </label>
                  <select
                    value={consultForm.topic}
                    onChange={(e) => setConsultForm({ ...consultForm, topic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="کنکور سراسری و کد سازمان سنجش">کنکور سراسری و کد سازمان سنجش</option>
                    <option value="سامانه سجاد و گذرنامه دانشجویی">سامانه سجاد و گذرنامه دانشجویی</option>
                    <option value="سنجش سلامت نوآموزان (سامانه سیرت)">سنجش سلامت نوآموزان (سامانه سیرت)</option>
                    <option value="ثبت‌نام مدارس و مای مدیو">ثبت‌نام مدارس و مای مدیو</option>
                    <option value="برگه حمایت تحصیلی">برگه حمایت تحصیلی</option>
                    <option value="بورسیه‌ها و تخفیف شهریه">بورسیه‌ها و تخفیف شهریه</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شرح پرسش یا مشکل شما *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={consultForm.message}
                    onChange={(e) => setConsultForm({ ...consultForm, message: e.target.value })}
                    placeholder="جزئیات پرسش، نام مدرسه یا دانشگاه و مدارک خود را بنویسید..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-slate-100"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  >
                    ارسال رایگان درخواست
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Admin Reply to Consultation */}
      {replyModalOpen && activeConsult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                پاسخ به درخواست مشاوره {activeConsult.fullName}
              </h3>
              <button onClick={() => setReplyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReply} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="text-gray-500">شماره تماس: <span className="font-mono text-gray-900 dark:text-white font-bold">{activeConsult.mobile}</span></div>
                <div className="text-gray-500">موضوع: <span className="text-gray-900 dark:text-white font-bold">{activeConsult.topic}</span></div>
                <div className="text-gray-700 dark:text-gray-300 pt-1 font-medium">{activeConsult.message}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وضعیت بررسی
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="pending">در حال بررسی</option>
                  <option value="answered">پاسخ داده شد / تکمیل شده</option>
                  <option value="rejected">رد درخواست</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  متن پاسخ کارشناس به متقاضی
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ، راهنمایی و مدارک لازم برای متقاضی..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-gray-500"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  ثبت پاسخ در سیستم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
