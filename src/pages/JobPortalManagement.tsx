import React, { useState } from "react";
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
  GraduationCap
} from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

interface JobOpening {
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

interface JobSeeker {
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
    city: "مشهد - بلوار وکیل‌آباد",
    category: "رستوران و کافه",
    salary: "۱۶ تا ۱۸ میلیون + بیمه",
    hasAccommodation: false,
    status: "filled",
    description: "نیروی آراسته و منظم جهت سالن‌داری و ظرفشویی در شیفت عصر و شب.",
    createdAt: "۱۴۰۴/۰۶/۱۲"
  }
];

const INITIAL_SEEKERS: JobSeeker[] = [
  {
    id: "SEEKER-201",
    name: "احمد نوری",
    phone: "09391118877",
    province: "تهران",
    profession: "خیاط و راسته دوز",
    experienceYears: 6,
    education: "دیپلم",
    status: "active",
    needsAccommodation: true,
    notes: "دارای کارت آمایش مرحله ۱۸ معتبر. مسلط به چرخ‌های صنعتی و الگو.",
    createdAt: "۱۴۰۴/۰۶/۱۴"
  },
  {
    id: "SEEKER-202",
    name: "عبدالرحیم محمدی",
    phone: "09187766554",
    province: "قم",
    profession: "گچ‌کار و سفیدکار ساختمان",
    experienceYears: 10,
    education: "ابتدایی",
    status: "interviewing",
    needsAccommodation: true,
    notes: "سرپرست یک اکیپ ۳ نفره گچ‌کاری و ابزار زنی ماهر.",
    createdAt: "۱۴۰۴/۰۶/۱۵"
  },
  {
    id: "SEEKER-203",
    name: "محمدامین صادقی",
    phone: "09904433221",
    province: "یزد",
    profession: "کارگر کوره‌پزخانه و کاشی‌کاری",
    experienceYears: 4,
    education: "سیکل",
    status: "hired",
    needsAccommodation: false,
    notes: "مشغول به کار در کارخانه کاشی با تاییدیه دفتر کفالت.",
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

  // Modal for new job
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

  // Filtered Jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.includes(searchTerm) ||
      j.employer.includes(searchTerm) ||
      j.description.includes(searchTerm) ||
      j.phone.includes(searchTerm);
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
      s.name.includes(searchTerm) ||
      s.profession.includes(searchTerm) ||
      s.phone.includes(searchTerm) ||
      s.notes.includes(searchTerm);
    const matchesProvince = selectedProvince === "all" || s.province === selectedProvince;
    return matchesSearch && matchesProvince;
  });

  // Actions for Jobs
  const handleToggleJobStatus = (id: string, status: "approved" | "pending" | "filled") => {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, status } : j)));
  };

  const handleDeleteJob = (id: string) => {
    if (confirm("آیا از حذف این آگهی شغلی اطمینان دارید؟")) {
      setJobs(jobs.filter((j) => j.id !== id));
    }
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.phone) {
      alert("لطفاً عنوان شغلی و شماره تماس کارفرما را وارد فرمایید.");
      return;
    }
    const created: JobOpening = {
      id: `JOB-${Date.now().toString().slice(-4)}`,
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
      createdAt: "امروز"
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
  };

  // Actions for Seekers
  const handleToggleSeekerStatus = (id: string, status: "active" | "interviewing" | "hired") => {
    setSeekers(seekers.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleDeleteSeeker = (id: string) => {
    if (confirm("آیا از حذف مشخصات این کارجو اطمینان دارید؟")) {
      setSeekers(seekers.filter((s) => s.id !== id));
    }
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
            بررسی و تایید آگهی‌های کارفرمایان، بانک رزومه کارجویان و اتصال مستقیم نیروهای کار به کارگاه‌ها
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

          {activeTab === "jobs" && (
            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Plus size={16} />
              <span>ثبت آگهی جدید</span>
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
              ? "bg-blue-600 text-white shadow-md"
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

      {/* Main Content: Jobs Table */}
      {activeTab === "jobs" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
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
                  <th className="p-3.5 text-center">عملیات</th>
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
                    <tr key={j.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
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
                        <button
                          onClick={() => handleDeleteJob(j.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="حذف آگهی"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content: Seekers Table */}
      {activeTab === "seekers" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
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
                  <th className="p-3.5 text-center">عملیات</th>
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
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-black text-sm text-gray-900 dark:text-white">{s.name}</div>
                        <div className="text-[11px] text-gray-400">{s.id} • ثبت: {s.createdAt}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{s.profession}</div>
                        <div className="text-gray-400 text-[11px] mt-0.5">{s.experienceYears} سال سابقه کار • {s.education}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono text-gray-800 dark:text-gray-200 font-bold flex items-center gap-1">
                          <Phone size={12} className="text-blue-500" />
                          <span>{s.phone}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold">{s.province}</div>
                        <div className="text-[10px] mt-0.5">
                          {s.needsAccommodation ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">نیازمند جای خواب</span>
                          ) : (
                            <span className="text-gray-400">دارای مسکن شخصی</span>
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
                        <button
                          onClick={() => handleDeleteSeeker(s.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="حذف مشخصات"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  عنوان شغل / مهارت درخواستی *
                </label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="مثال: چرخکار راسته دوز، کارگر ساده، قالب‌بند"
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
                    placeholder="مثال: کارگاه تولیدی حسینی"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره تماس کارفرما *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newJob.phone}
                    onChange={(e) => setNewJob({ ...newJob, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    استان محل کار
                  </label>
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
                    <option value="قم">قم</option>
                    <option value="یزد">یزد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شهر یا منطقه
                  </label>
                  <input
                    type="text"
                    value={newJob.city}
                    onChange={(e) => setNewJob({ ...newJob, city: e.target.value })}
                    placeholder="مثال: چهاردانگه، شورآباد"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    رسته شغلی
                  </label>
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
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    حقوق پیشنهادی
                  </label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="مثال: ۱۸ تا ۲۲ میلیون تومان"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newJob.hasAccommodation}
                    onChange={(e) => setNewJob({ ...newJob, hasAccommodation: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    دارای جای خواب / سوئیت مسکونی برای نیرو
                  </span>
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
                  placeholder="شرایط سنی، تسویه حساب، مدارک شناسایی مورد نیاز..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition-all"
                >
                  ثبت و انتشار در سامانه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
