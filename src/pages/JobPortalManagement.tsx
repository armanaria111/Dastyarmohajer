import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Phone,
  DollarSign,
  Download,
  Trash2,
  Edit2,
  X,
  Filter,
  Check,
  Building2,
  GraduationCap,
  Save,
  RotateCcw
} from "lucide-react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { exportToCSV } from "../utils/exportUtils";

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // fallback
  }
};

export interface JobOpening {
  id: string;
  title: string;
  employer: string;
  phone: string;
  province: string;
  city: string;
  category: string;
  salary: string;
  hasAccommodation: boolean;
  status: "approved" | "pending" | "filled";
  description: string;
  createdAt: string;
}

export interface JobSeeker {
  id: string;
  name: string;
  phone: string;
  province: string;
  profession: string;
  experienceYears: number;
  education: string;
  status: "active" | "interviewing" | "hired";
  needsAccommodation: boolean;
  notes: string;
  createdAt: string;
}

const INITIAL_JOBS: JobOpening[] = [
  {
    id: "JOB-101",
    title: "چرخکار ماهر راسته دوز و زیگزال",
    employer: "تولیدی پوشاک پایتخت (آقای حسینی)",
    phone: "09121112233",
    province: "تهران",
    city: "بازار بزرگ تهران",
    category: "پوشاک و خیاطی",
    salary: "۲۰ تا ۲۸ میلیون تومان (تسویه هفتگی)",
    hasAccommodation: true,
    status: "approved",
    description: "به ۲ نفر چرخکار راسته دوز و یک نفر وسط‌کار افغانستانی با اخلاق و کاری نیازمندیم. جای خواب تمیز و مجزا موجود است.",
    createdAt: "۱۴۰۴/۰۶/۱۵"
  },
  {
    id: "JOB-102",
    title: "کارگر ساده گلخانه و امور باغبانی",
    employer: "مجموعه کشت و صنعت نگین",
    phone: "09139876543",
    province: "اصفهان",
    city: "فلاورجان",
    category: "کشاورزی و باغبانی",
    salary: "۱۴ تا ۱۶ میلیون + ناهار و شام",
    hasAccommodation: true,
    status: "approved",
    description: "۳ نفر نیروی جوان متعهد جهت کار در سالن گلخانه هیدروپونیک. اتاق مسکونی با کلیه امکانات گرمایشی و سرمایشی مهیاست.",
    createdAt: "۱۴۰۴/۰۶/۱۶"
  },
  {
    id: "JOB-103",
    title: "استادکار آرماتوربند و بتن‌ریز ساختمانی",
    employer: "شرکت پیمانکاری سازه گستر البرز",
    phone: "09355554433",
    province: "البرز",
    city: "کرج - گوهردشت",
    category: "ساختمانی و عمرانی",
    salary: "متری یا روزمزد توافقی (بالای ۲۵ میلیون)",
    hasAccommodation: false,
    status: "pending",
    description: "به یک اکیپ منظم آرماتوربند جهت اجرای فونداسیون و اسکلت بتنی پروژه مسکونی نیازمندیم.",
    createdAt: "۱۴۰۴/۰۶/۱۷"
  },
  {
    id: "JOB-104",
    title: "کمک‌آشپز و سالن‌کار رستوران سنتی",
    employer: "رستوران بام مشهد",
    phone: "09151239876",
    province: "خراسان رضوی",
    city: "مشهد - طرقبه",
    category: "رستوران و کافه",
    salary: "۱۵ تا ۱۸ میلیون + وعده غذایی",
    hasAccommodation: true,
    status: "approved",
    description: "جهت سالن‌داری و آماده‌سازی غذا، ۲ نفر نیروی آراسته و باسابقه استخدام می‌شوند.",
    createdAt: "۱۴۰۴/۰۶/۱۸"
  },
  {
    id: "JOB-105",
    title: "جوشکار CO2 و مونتاژکار اسکلت فلزی",
    employer: "کارگاه سوله سازی پارس",
    phone: "09127778899",
    province: "تهران",
    city: "پاکدشت - شهرک صنعتی عباس‌آباد",
    category: "صنعتی و کارگاهی",
    salary: "۲۲ تا ۳۰ میلیون تومان",
    hasAccommodation: true,
    status: "filled",
    description: "ظرفیت این موقعیت شغلی تکمیل گردید.",
    createdAt: "۱۴۰۴/۰۶/۱۰"
  }
];

const INITIAL_SEEKERS: JobSeeker[] = [
  {
    id: "SEEK-501",
    name: "نجیب‌الله انوری",
    phone: "09301112233",
    province: "تهران",
    profession: "چرخکار و اتوکار پوشاک",
    experienceYears: 6,
    education: "دیپلم",
    status: "active",
    needsAccommodation: true,
    notes: "تسلط کامل بر چرخ‌های صنعتی راسته و زیگزال، سابقه کار در کارگاه‌های پوشاک تهرانپارس و جمهوری.",
    createdAt: "۱۴۰۴/۰۶/۱۴"
  },
  {
    id: "SEEK-502",
    name: "سید بشیر حسینی",
    phone: "09194445566",
    province: "البرز",
    profession: "سیم‌کش ساختمان و برق‌کار صنعتی",
    experienceYears: 8,
    education: "فوق دیپلم فنی",
    status: "interviewing",
    needsAccommodation: false,
    notes: "دارای گواهی مهارت فنی و حرفه‌ای، مجری لوله‌کشی و سیم‌کشی بیش از ۱۰ پروژه ساختمانی.",
    createdAt: "۱۴۰۴/۰۶/۱۵"
  },
  {
    id: "SEEK-503",
    name: "محمدعیسی فدایی",
    phone: "09153332211",
    province: "خراسان رضوی",
    profession: "گچ‌کار و سفیدکار ماهر",
    experienceYears: 10,
    education: "سیکل",
    status: "active",
    needsAccommodation: true,
    notes: "استادکار گچ‌کاری، ابزارزنی و نورمخفی، همراه با دو کارگر وردست آماده کار پروژه‌ای.",
    createdAt: "۱۴۰۴/۰۶/۱۶"
  },
  {
    id: "SEEK-504",
    name: "احمد شفیق کریمی",
    phone: "09367778899",
    province: "اصفهان",
    profession: "تراشکار و قالب‌ساز فلزی",
    experienceYears: 4,
    education: "دیپلم فنی",
    status: "hired",
    needsAccommodation: false,
    notes: "مشغول به کار در شهرک صنعتی مورچه‌خورت اصفهان شد.",
    createdAt: "۱۴۰۴/۰۶/۱۰"
  }
];

export default function JobPortalManagement() {
  const [activeTab, setActiveTab] = useState<"jobs" | "seekers">("jobs");
  const [jobs, setJobs] = useState<JobOpening[]>(INITIAL_JOBS);
  const [seekers, setSeekers] = useState<JobSeeker[]>(INITIAL_SEEKERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [accommodationFilter, setAccommodationFilter] = useState("all");

  // New Job Modal
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newJob, setNewJob] = useState<Partial<JobOpening>>({
    title: "",
    employer: "",
    phone: "",
    province: "تهران",
    city: "",
    category: "پوشاک و خیاطی",
    salary: "",
    hasAccommodation: true,
    status: "approved",
    description: ""
  });

  // Edit Job Modal
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);

  // New Seeker Modal
  const [isNewSeekerModalOpen, setIsNewSeekerModalOpen] = useState(false);
  const [newSeeker, setNewSeeker] = useState<Partial<JobSeeker>>({
    name: "",
    phone: "",
    province: "تهران",
    profession: "",
    experienceYears: 2,
    education: "دیپلم",
    status: "active",
    needsAccommodation: false,
    notes: ""
  });

  // Edit Seeker Modal
  const [isEditSeekerModalOpen, setIsEditSeekerModalOpen] = useState(false);
  const [editingSeeker, setEditingSeeker] = useState<JobSeeker | null>(null);

  // Sync with Firestore
  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, "jobs"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobOpening));
        setJobs(list);
      } else {
        // Seed initial jobs if empty
        INITIAL_JOBS.forEach((j) => {
          setDoc(doc(db, "jobs", j.id), j).catch(() => {});
        });
      }
    });

    const unsubSeekers = onSnapshot(collection(db, "job_seekers"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobSeeker));
        setSeekers(list);
      } else {
        // Seed initial seekers if empty
        INITIAL_SEEKERS.forEach((s) => {
          setDoc(doc(db, "job_seekers", s.id), s).catch(() => {});
        });
      }
    });

    return () => {
      unsubJobs();
      unsubSeekers();
    };
  }, []);

  // Filtered Jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      (j.title || "").includes(searchTerm) ||
      (j.employer || "").includes(searchTerm) ||
      (j.description || "").includes(searchTerm) ||
      (j.phone || "").includes(searchTerm);
    const matchesProvince = selectedProvince === "all" || j.province === selectedProvince;
    const matchesCategory = selectedCategory === "all" || j.category === selectedCategory;
    const matchesAcc =
      accommodationFilter === "all"
        ? true
        : accommodationFilter === "yes"
        ? j.hasAccommodation
        : !j.hasAccommodation;
    return matchesSearch && matchesProvince && matchesCategory && matchesAcc;
  });

  // Filtered Seekers
  const filteredSeekers = seekers.filter((s) => {
    const matchesSearch =
      (s.name || "").includes(searchTerm) ||
      (s.profession || "").includes(searchTerm) ||
      (s.phone || "").includes(searchTerm) ||
      (s.notes || "").includes(searchTerm);
    const matchesProvince = selectedProvince === "all" || s.province === selectedProvince;
    return matchesSearch && matchesProvince;
  });

  // Actions for Jobs
  const handleToggleJobStatus = async (id: string, status: "approved" | "pending" | "filled") => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    try {
      await updateDoc(doc(db, "jobs", id), { status });
    } catch {
      // fallback
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (confirm(`آیا از حذف آگهی شغلی «${title}» اطمینان دارید؟`)) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
      try {
        await deleteDoc(doc(db, "jobs", id));
      } catch {
        // fallback
      }
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.phone) {
      alert("لطفاً عنوان شغلی و شماره تماس کارفرما را وارد فرمایید.");
      return;
    }
    const id = `JOB-${Date.now().toString().slice(-4)}`;
    const created: JobOpening = {
      id,
      title: newJob.title || "",
      employer: newJob.employer || "کارفرمای معتبر",
      phone: newJob.phone || "",
      province: newJob.province || "تهران",
      city: newJob.city || "مرکز استان",
      category: newJob.category || "متفرقه",
      salary: newJob.salary || "توافقی",
      hasAccommodation: Boolean(newJob.hasAccommodation),
      status: "approved",
      description: newJob.description || "",
      createdAt: new Date().toLocaleDateString("fa-IR")
    };

    setJobs([created, ...jobs]);
    setIsNewJobModalOpen(false);
    setNewJob({
      title: "",
      employer: "",
      phone: "",
      province: "تهران",
      city: "",
      category: "پوشاک و خیاطی",
      salary: "",
      hasAccommodation: true,
      status: "approved",
      description: ""
    });

    try {
      await setDoc(doc(db, "jobs", id), created);
    } catch {
      // fallback
    }
  };

  const handleOpenEditJob = (job: JobOpening) => {
    setEditingJob({ ...job });
    setIsEditJobModalOpen(true);
  };

  const handleSaveEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    const updated = jobs.map((j) => (j.id === editingJob.id ? editingJob : j));
    setJobs(updated);
    safeSetItem("admin_jobs", JSON.stringify(updated));
    setIsEditJobModalOpen(false);

    try {
      await setDoc(doc(db, "jobs", editingJob.id), editingJob, { merge: true });
    } catch {
      // fallback
    }
    setEditingJob(null);
  };

  // Actions for Seekers
  const handleToggleSeekerStatus = async (id: string, status: "active" | "interviewing" | "hired") => {
    setSeekers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await updateDoc(doc(db, "job_seekers", id), { status });
    } catch {
      // fallback
    }
  };

  const handleDeleteSeeker = async (id: string, name: string) => {
    if (confirm(`آیا از حذف مشخصات کارجو «${name}» اطمینان دارید؟`)) {
      setSeekers((prev) => prev.filter((s) => s.id !== id));
      try {
        await deleteDoc(doc(db, "job_seekers", id));
      } catch {
        // fallback
      }
    }
  };

  const handleCreateSeeker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeeker.name || !newSeeker.phone || !newSeeker.profession) {
      alert("لطفاً نام، شماره تماس و تخصص کارجو را وارد فرمایید.");
      return;
    }
    const id = `SEEK-${Date.now().toString().slice(-4)}`;
    const created: JobSeeker = {
      id,
      name: newSeeker.name || "",
      phone: newSeeker.phone || "",
      province: newSeeker.province || "تهران",
      profession: newSeeker.profession || "",
      experienceYears: Number(newSeeker.experienceYears) || 0,
      education: newSeeker.education || "دیپلم",
      status: "active",
      needsAccommodation: Boolean(newSeeker.needsAccommodation),
      notes: newSeeker.notes || "",
      createdAt: new Date().toLocaleDateString("fa-IR")
    };

    setSeekers([created, ...seekers]);
    setIsNewSeekerModalOpen(false);
    setNewSeeker({
      name: "",
      phone: "",
      province: "تهران",
      profession: "",
      experienceYears: 2,
      education: "دیپلم",
      status: "active",
      needsAccommodation: false,
      notes: ""
    });

    try {
      await setDoc(doc(db, "job_seekers", id), created);
    } catch {
      // fallback
    }
  };

  const handleOpenEditSeeker = (seeker: JobSeeker) => {
    setEditingSeeker({ ...seeker });
    setIsEditSeekerModalOpen(true);
  };

  const handleSaveEditSeeker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeeker) return;

    const updated = seekers.map((s) => (s.id === editingSeeker.id ? editingSeeker : s));
    setSeekers(updated);
    safeSetItem("admin_job_seekers", JSON.stringify(updated));
    setIsEditSeekerModalOpen(false);

    try {
      await setDoc(doc(db, "job_seekers", editingSeeker.id), editingSeeker, { merge: true });
    } catch {
      // fallback
    }
    setEditingSeeker(null);
  };

  // Export to Excel / CSV
  const handleExportJobs = () => {
    const headers = [
      "کد آگهی",
      "عنوان شغل",
      "نام کارفرما",
      "شماره تماس",
      "استان",
      "شهر",
      "رسته شغلی",
      "حقوق پیشنهادی",
      "جای خواب",
      "وضعیت",
      "تاریخ ثبت"
    ];
    const rows = filteredJobs.map((j) => [
      j.id,
      j.title,
      j.employer,
      j.phone,
      j.province,
      j.city,
      j.category,
      j.salary,
      j.hasAccommodation ? "دارد" : "ندارد",
      j.status === "approved" ? "تایید شده" : j.status === "pending" ? "در انتظار تایید" : "تکمیل ظرفیت",
      j.createdAt
    ]);
    exportToCSV("لیست_فرصت_های_شغلی_اتباع", headers, rows);
  };

  const handleExportSeekers = () => {
    const headers = [
      "کد کارجو",
      "نام و نام خانوادگی",
      "شماره تماس",
      "استان",
      "تخصص و حرفه",
      "سابقه کار (سال)",
      "مدرک تحصیلی",
      "نیاز به جای خواب",
      "وضعیت اشتغال",
      "توضیحات و مهارت‌ها",
      "تاریخ ثبت"
    ];
    const rows = filteredSeekers.map((s) => [
      s.id,
      s.name,
      s.phone,
      s.province,
      s.profession,
      s.experienceYears,
      s.education,
      s.needsAccommodation ? "دارد" : "خیر",
      s.status === "active" ? "آماده به کار" : s.status === "interviewing" ? "در حال مصاحبه" : "شاغل شده",
      s.notes,
      s.createdAt
    ]);
    exportToCSV("بانک_کارجویان_اتباع", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="text-blue-600 dark:text-blue-400" size={24} />
            <span>مدیریت کاریابی و بانک کارجویان مهاجرین</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            بررسی، تایید، افزودن و ویرایش آگهی‌های کارفرمایان و بانک رزومه کارجویان اتباع در سامانه
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={activeTab === "jobs" ? handleExportJobs : handleExportSeekers}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی اکسل (CSV)</span>
          </button>

          {activeTab === "jobs" ? (
            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Plus size={16} />
              <span>ثبت آگهی شغلی جدید</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewSeekerModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Plus size={16} />
              <span>ثبت کارجوی جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "jobs"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Briefcase size={16} />
          <span>فرصت‌های شغلی کارفرمایان ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("seekers")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "seekers"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users size={16} />
          <span>بانک کارجویان و متقاضیان کار ({seekers.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 shadow-xs">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === "jobs" ? "جستجو در عنوان، کارفرما یا شماره..." : "جستجو در نام کارجو، مهارت یا تلفن..."}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه استان‌ها</option>
            <option value="تهران">تهران</option>
            <option value="اصفهان">اصفهان</option>
            <option value="خراسان رضوی">خراسان رضوی</option>
            <option value="البرز">البرز</option>
            <option value="فارس">فارس</option>
            <option value="یزد">یزد</option>
            <option value="قم">قم</option>
            <option value="مرکزی">مرکزی</option>
          </select>
        </div>

        {activeTab === "jobs" && (
          <>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه رسته‌های شغلی</option>
                <option value="پوشاک و خیاطی">پوشاک و خیاطی</option>
                <option value="ساختمانی و عمرانی">ساختمانی و عمرانی</option>
                <option value="کشاورزی و باغبانی">کشاورزی و باغبانی</option>
                <option value="رستوران و کافه">رستوران و کافه</option>
                <option value="صنعتی و کارگاهی">صنعتی و کارگاهی</option>
                <option value="خدمات و نظافت">خدمات و نظافت</option>
              </select>
            </div>

            <div>
              <select
                value={accommodationFilter}
                onChange={(e) => setAccommodationFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جای خواب: همه موارد</option>
                <option value="yes">فقط با جای خواب</option>
                <option value="no">بدون جای خواب</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Main Content: Jobs Section */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {/* Mobile & Tablet Card View for Jobs */}
          <div className="block lg:hidden space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                هیچ فرصت شغلی مطابق فیلتر یافت نشد.
              </div>
            ) : (
              filteredJobs.map((j) => (
                <div
                  key={`card_${j.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-sm text-gray-900 dark:text-white">{j.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {j.employer} • <span className="font-mono">{j.id}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                      {j.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                    {j.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-gray-400 text-[10px] block">استان و شهر:</span>
                      <span className="font-bold">{j.province} - {j.city}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">میزان حقوق:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{j.salary}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">شماره تماس:</span>
                      <span className="font-mono font-bold" dir="ltr">{j.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">امکانات اقامتی:</span>
                      <span>{j.hasAccommodation ? "دارای جای خواب" : "بدون جای خواب"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditJob(j)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Edit2 size={13} />
                      <span>ویرایش آگهی شغلی</span>
                    </button>

                    <select
                      value={j.status}
                      onChange={(e) => handleToggleJobStatus(j.id, e.target.value as any)}
                      className="py-1.5 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700"
                    >
                      <option value="approved">تایید شده</option>
                      <option value="pending">در انتظار</option>
                      <option value="filled">منقضی</option>
                    </select>

                    <button
                      onClick={() => handleDeleteJob(j.id, j.title)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                      title="حذف آگهی"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table for Jobs */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
                  <tr>
                    <th className="p-3.5">کد و عنوان شغل</th>
                    <th className="p-3.5">کارفرما و تلفن</th>
                    <th className="p-3.5">استان و شهر</th>
                    <th className="p-3.5">رسته و حقوق</th>
                    <th className="p-3.5">امکانات</th>
                    <th className="p-3.5">وضعیت</th>
                    <th className="p-3.5 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200 font-medium">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        هیچ فرصت شغلی مطابق فیلتر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((j) => (
                      <tr
                        key={j.id}
                        onDoubleClick={() => handleOpenEditJob(j)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                        title="برای ویرایش دوبار کلیک کنید"
                      >
                        <td className="p-3.5">
                          <div className="font-black text-sm text-gray-900 dark:text-white">{j.title}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{j.id} • ثبت: {j.createdAt}</div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 max-w-md">
                            {j.description}
                          </p>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold">{j.employer}</div>
                          <div className="text-gray-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone size={12} className="text-blue-500" />
                            <span>{j.phone}</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-bold">
                            <MapPin size={12} className="text-rose-500" />
                            <span>{j.province}</span>
                          </div>
                          <div className="text-gray-400 text-[11px] mt-0.5">{j.city}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                            {j.category}
                          </span>
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-[11px]">
                            {j.salary}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {j.hasAccommodation ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black flex items-center gap-1 w-fit">
                              <Home size={11} />
                              <span>دارای جای خواب</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">بدون جای خواب</span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={j.status}
                            onChange={(e) => handleToggleJobStatus(j.id, e.target.value as any)}
                            className={`text-xs font-black px-2.5 py-1 rounded-xl border transition-colors ${
                              j.status === "approved"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-300 dark:border-emerald-800"
                                : j.status === "pending"
                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-300 dark:border-amber-800"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <option value="approved">تایید شده و فعال</option>
                            <option value="pending">در انتظار تایید</option>
                            <option value="filled">تکمیل ظرفیت / منقضی</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditJob(j);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-black text-xs inline-flex items-center gap-1.5 transition-all border border-blue-200 dark:border-blue-700 shadow-xs"
                              title="ویرایش آگهی شغلی"
                            >
                              <Edit2 size={13} />
                              <span>ویرایش آگهی</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(j.id, j.title);
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="حذف آگهی"
                            >
                              <Trash2 size={15} />
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
        </div>
      )}

      {/* Main Content: Seekers Section */}
      {activeTab === "seekers" && (
        <div className="space-y-4">
          {/* Mobile & Tablet Card View for Seekers */}
          <div className="block lg:hidden space-y-3">
            {filteredSeekers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                هیچ کارجویی مطابق فیلتر یافت نشد.
              </div>
            ) : (
              filteredSeekers.map((s) => (
                <div
                  key={`card_seeker_${s.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-sm text-gray-900 dark:text-white">{s.name}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                        {s.profession} • {s.experienceYears} سال سابقه
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                      {s.education}
                    </span>
                  </div>

                  {s.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {s.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-gray-400 text-[10px] block">استان سکونت:</span>
                      <span className="font-bold">{s.province}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">شماره تماس:</span>
                      <span className="font-mono font-bold" dir="ltr">{s.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">اسکان:</span>
                      <span>{s.needsAccommodation ? "نیازمند خوابگاه" : "دارای محل سکونت"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">وضعیت:</span>
                      <span className="font-bold">
                        {s.status === "active" ? "آماده به کار" : s.status === "interviewing" ? "در حال مصاحبه" : "شاغل شده"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditSeeker(s)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Edit2 size={13} />
                      <span>ویرایش مشخصات کارجو</span>
                    </button>

                    <select
                      value={s.status}
                      onChange={(e) => handleToggleSeekerStatus(s.id, e.target.value as any)}
                      className="py-1.5 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700"
                    >
                      <option value="active">آماده به کار</option>
                      <option value="interviewing">مصاحبه</option>
                      <option value="hired">شاغل شده</option>
                    </select>

                    <button
                      onClick={() => handleDeleteSeeker(s.id, s.name)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                      title="حذف کارجو"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table for Seekers */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
                  <tr>
                    <th className="p-3.5">مشخصات کارجو</th>
                    <th className="p-3.5">تخصص و سابقه</th>
                    <th className="p-3.5">شماره تماس</th>
                    <th className="p-3.5">استان و اسکان</th>
                    <th className="p-3.5">مهارت‌ها و توضیحات</th>
                    <th className="p-3.5">وضعیت کارجو</th>
                    <th className="p-3.5 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200 font-medium">
                  {filteredSeekers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        هیچ کارجویی مطابق فیلتر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredSeekers.map((s) => (
                      <tr
                        key={s.id}
                        onDoubleClick={() => handleOpenEditSeeker(s)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                        title="برای ویرایش دوبار کلیک کنید"
                      >
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-black text-sm text-gray-900 dark:text-white">{s.name}</div>
                          <div className="text-[11px] text-gray-400">{s.id} • ثبت: {s.createdAt}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-gray-900 dark:text-white">{s.profession}</div>
                          <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <GraduationCap size={12} className="text-purple-500" />
                            <span>{s.experienceYears} سال سابقه • مدرک: {s.education}</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono text-gray-700 dark:text-gray-300 font-bold flex items-center gap-1">
                            <Phone size={12} className="text-blue-500" />
                            <span>{s.phone}</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold flex items-center gap-1">
                            <MapPin size={12} className="text-rose-500" />
                            <span>{s.province}</span>
                          </div>
                          <div className="text-[11px] mt-0.5">
                            {s.needsAccommodation ? (
                              <span className="text-amber-600 dark:text-amber-400">نیازمند جای خواب</span>
                            ) : (
                              <span className="text-gray-400">بدون نیاز به اسکان</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 max-w-sm">
                            {s.notes}
                          </p>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={s.status}
                            onChange={(e) => handleToggleSeekerStatus(s.id, e.target.value as any)}
                            className={`text-xs font-black px-2.5 py-1 rounded-xl border transition-colors ${
                              s.status === "active"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-300 dark:border-emerald-800"
                                : s.status === "interviewing"
                                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 border-blue-300 dark:border-blue-800"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            <option value="active">آماده به کار (آزاد)</option>
                            <option value="interviewing">معرفی به کارفرما</option>
                            <option value="hired">شاغل شده و مشغول</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditSeeker(s);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-black text-xs inline-flex items-center gap-1.5 transition-all border border-blue-200 dark:border-blue-700 shadow-xs"
                              title="ویرایش مشخصات کارجو"
                            >
                              <Edit2 size={13} />
                              <span>ویرایش کارجو</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSeeker(s.id, s.name);
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="حذف مشخصات"
                            >
                              <Trash2 size={15} />
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
        </div>
      )}

      {/* New Job Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                <span>ثبت فرصت شغلی جدید (کارفرما)</span>
              </h3>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  عنوان آگهی شغلی *
                </label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="مثال: چرخکار ماهر راسته دوز..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام کارفرما / کارگاه
                  </label>
                  <input
                    type="text"
                    value={newJob.employer}
                    onChange={(e) => setNewJob({ ...newJob, employer: e.target.value })}
                    placeholder="تولیدی برادران..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تلفن تماس کارفرما *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJob.phone}
                    onChange={(e) => setNewJob({ ...newJob, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان</label>
                  <select
                    value={newJob.province}
                    onChange={(e) => setNewJob({ ...newJob, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="تهران">تهران</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="البرز">البرز</option>
                    <option value="فارس">فارس</option>
                    <option value="یزد">یزد</option>
                    <option value="قم">قم</option>
                    <option value="مرکزی">مرکزی</option>
                    <option value="سایر استان‌ها">سایر استان‌ها</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شهر / منطقه</label>
                  <input
                    type="text"
                    value={newJob.city}
                    onChange={(e) => setNewJob({ ...newJob, city: e.target.value })}
                    placeholder="مثال: شهرک صنعتی شمس‌آباد"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">رسته شغلی</label>
                  <select
                    value={newJob.category}
                    onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="پوشاک و خیاطی">پوشاک و خیاطی</option>
                    <option value="ساختمانی و عمرانی">ساختمانی و عمرانی</option>
                    <option value="کشاورزی و باغبانی">کشاورزی و باغبانی</option>
                    <option value="رستوران و کافه">رستوران و کافه</option>
                    <option value="صنعتی و کارگاهی">صنعتی و کارگاهی</option>
                    <option value="خدمات و نظافت">خدمات و نظافت</option>
                    <option value="متفرقه">سایر رسته‌ها</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">میزان حقوق</label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="مثال: ۱۸ تا ۲۲ میلیون تومان"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <input
                  type="checkbox"
                  id="hasAccommodation"
                  checked={newJob.hasAccommodation}
                  onChange={(e) => setNewJob({ ...newJob, hasAccommodation: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasAccommodation" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  این موقعیت شغلی دارای محل اسکان / جای خواب می‌باشد
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  توضیحات و شرایط کار
                </label>
                <textarea
                  rows={3}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="شرایط سنی، تسویه حساب، غذا، بیمه و..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>ثبت و انتشار آگهی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {isEditJobModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                <span>ویرایش فرصت شغلی ({editingJob.id})</span>
              </h3>
              <button
                onClick={() => setIsEditJobModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditJob} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  عنوان آگهی شغلی *
                </label>
                <input
                  type="text"
                  required
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام کارفرما / کارگاه
                  </label>
                  <input
                    type="text"
                    value={editingJob.employer}
                    onChange={(e) => setEditingJob({ ...editingJob, employer: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تلفن تماس کارفرما *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingJob.phone}
                    onChange={(e) => setEditingJob({ ...editingJob, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان</label>
                  <select
                    value={editingJob.province}
                    onChange={(e) => setEditingJob({ ...editingJob, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="تهران">تهران</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="البرز">البرز</option>
                    <option value="فارس">فارس</option>
                    <option value="یزد">یزد</option>
                    <option value="قم">قم</option>
                    <option value="مرکزی">مرکزی</option>
                    <option value="سایر استان‌ها">سایر استان‌ها</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">شهر / منطقه</label>
                  <input
                    type="text"
                    value={editingJob.city}
                    onChange={(e) => setEditingJob({ ...editingJob, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">رسته شغلی</label>
                  <select
                    value={editingJob.category}
                    onChange={(e) => setEditingJob({ ...editingJob, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="پوشاک و خیاطی">پوشاک و خیاطی</option>
                    <option value="ساختمانی و عمرانی">ساختمانی و عمرانی</option>
                    <option value="کشاورزی و باغبانی">کشاورزی و باغبانی</option>
                    <option value="رستوران و کافه">رستوران و کافه</option>
                    <option value="صنعتی و کارگاهی">صنعتی و کارگاهی</option>
                    <option value="خدمات و نظافت">خدمات و نظافت</option>
                    <option value="متفرقه">سایر رسته‌ها</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">میزان حقوق</label>
                  <input
                    type="text"
                    value={editingJob.salary}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">وضعیت آگهی</label>
                  <select
                    value={editingJob.status}
                    onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="approved">تایید شده و فعال</option>
                    <option value="pending">در انتظار تایید</option>
                    <option value="filled">تکمیل ظرفیت / منقضی</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mt-4">
                  <input
                    type="checkbox"
                    id="editHasAcc"
                    checked={editingJob.hasAccommodation}
                    onChange={(e) => setEditingJob({ ...editingJob, hasAccommodation: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="editHasAcc" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    دارای جای خواب
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  توضیحات و شرایط کار
                </label>
                <textarea
                  rows={3}
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditJobModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>ذخیره تغییرات آگهی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Seeker Modal */}
      {isNewSeekerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-emerald-500" />
                <span>ثبت کارجوی جدید در بانک رزومه</span>
              </h3>
              <button
                onClick={() => setIsNewSeekerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSeeker} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی کارجو *
                </label>
                <input
                  type="text"
                  required
                  value={newSeeker.name}
                  onChange={(e) => setNewSeeker({ ...newSeeker, name: e.target.value })}
                  placeholder="مثال: نجیب‌الله انوری"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس مستقیم *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSeeker.phone}
                    onChange={(e) => setNewSeeker({ ...newSeeker, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان سکونت</label>
                  <select
                    value={newSeeker.province}
                    onChange={(e) => setNewSeeker({ ...newSeeker, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="تهران">تهران</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="البرز">البرز</option>
                    <option value="فارس">فارس</option>
                    <option value="یزد">یزد</option>
                    <option value="قم">قم</option>
                    <option value="مرکزی">مرکزی</option>
                    <option value="سایر استان‌ها">سایر استان‌ها</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تخصص و حرفه اصلی *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSeeker.profession}
                    onChange={(e) => setNewSeeker({ ...newSeeker, profession: e.target.value })}
                    placeholder="مثال: چرخکار ماهر، بنا، آشپز..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سابقه کار (سال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newSeeker.experienceYears}
                    onChange={(e) => setNewSeeker({ ...newSeeker, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    مدرک تحصیلی
                  </label>
                  <select
                    value={newSeeker.education}
                    onChange={(e) => setNewSeeker({ ...newSeeker, education: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="زیر دیپلم / سیکل">زیر دیپلم / سیکل</option>
                    <option value="دیپلم">دیپلم</option>
                    <option value="فوق دیپلم فنی">فوق دیپلم فنی</option>
                    <option value="لیسانس">لیسانس</option>
                    <option value="استادکار تجربی">استادکار تجربی (بدون مدرک)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mt-4">
                  <input
                    type="checkbox"
                    id="newNeedsAcc"
                    checked={newSeeker.needsAccommodation}
                    onChange={(e) => setNewSeeker({ ...newSeeker, needsAccommodation: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="newNeedsAcc" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    نیازمند جای خواب و اسکان
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  مهارت‌ها، سوابق قبلی و توضیحات تکمیلی
                </label>
                <textarea
                  rows={3}
                  value={newSeeker.notes}
                  onChange={(e) => setNewSeeker({ ...newSeeker, notes: e.target.value })}
                  placeholder="سابقه در کارگاه‌های قبلی، مدارک مهارتی، وضعیت اقامتی و..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewSeekerModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>ثبت کارجو در سیستم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Seeker Modal */}
      {isEditSeekerModalOpen && editingSeeker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-500" />
                <span>ویرایش اطلاعات کارجو ({editingSeeker.id})</span>
              </h3>
              <button
                onClick={() => setIsEditSeekerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSeeker} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی کارجو *
                </label>
                <input
                  type="text"
                  required
                  value={editingSeeker.name}
                  onChange={(e) => setEditingSeeker({ ...editingSeeker, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس مستقیم *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSeeker.phone}
                    onChange={(e) => setEditingSeeker({ ...editingSeeker, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">استان سکونت</label>
                  <select
                    value={editingSeeker.province}
                    onChange={(e) => setEditingSeeker({ ...editingSeeker, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="تهران">تهران</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="البرز">البرز</option>
                    <option value="فارس">فارس</option>
                    <option value="یزد">یزد</option>
                    <option value="قم">قم</option>
                    <option value="مرکزی">مرکزی</option>
                    <option value="سایر استان‌ها">سایر استان‌ها</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    تخصص و حرفه اصلی *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSeeker.profession}
                    onChange={(e) => setEditingSeeker({ ...editingSeeker, profession: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سابقه کار (سال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editingSeeker.experienceYears}
                    onChange={(e) => setEditingSeeker({ ...editingSeeker, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    مدرک تحصیلی
                  </label>
                  <select
                    value={editingSeeker.education}
                    onChange={(e) => setEditingSeeker({ ...editingSeeker, education: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="زیر دیپلم / سیکل">زیر دیپلم / سیکل</option>
                    <option value="دیپلم">دیپلم</option>
                    <option value="فوق دیپلم فنی">فوق دیپلم فنی</option>
                    <option value="لیسانس">لیسانس</option>
                    <option value="استادکار تجربی">استادکار تجربی (بدون مدرک)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    وضعیت کارجو
                  </label>
                  <select
                    value={editingSeeker.status}
                    onChange={(e) => setEditingSeeker({ ...editingSeeker, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">آماده به کار (آزاد)</option>
                    <option value="interviewing">معرفی به کارفرما</option>
                    <option value="hired">شاغل شده و مشغول</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <input
                  type="checkbox"
                  id="editNeedsAcc"
                  checked={editingSeeker.needsAccommodation}
                  onChange={(e) => setEditingSeeker({ ...editingSeeker, needsAccommodation: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editNeedsAcc" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  نیازمند جای خواب و اسکان
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  مهارت‌ها، سوابق قبلی و توضیحات تکمیلی
                </label>
                <textarea
                  rows={3}
                  value={editingSeeker.notes}
                  onChange={(e) => setEditingSeeker({ ...editingSeeker, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditSeekerModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>ذخیره تغییرات کارجو</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
