import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  DollarSign,
  Home,
  Utensils,
  ShieldCheck,
  Phone,
  PlusCircle,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronLeft
} from "lucide-react";
import { INITIAL_JOBS, JobPosting, AUTHORIZED_PROVINCES, JOB_CATEGORIES } from "../data/jobsData";
import { collection, addDoc, getDocs, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface JobPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobPortalModal({ isOpen, onClose }: JobPortalModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "post" | "seeker" | "rules">("search");
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("همه استان‌ها");
  const [selectedCategory, setSelectedCategory] = useState("همه دسته‌ها");
  const [filterAccommodation, setFilterAccommodation] = useState(false);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState<JobPosting["category"]>("تولیدی و کارگاهی");
  const [jobProvince, setJobProvince] = useState("تهران");
  const [jobCity, setJobCity] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobHasAccom, setJobHasAccom] = useState(false);
  const [jobHasFood, setJobHasFood] = useState(false);
  const [jobDesc, setJobDesc] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [employerPhone, setEmployerPhone] = useState("");
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobSubmitSuccess, setJobSubmitSuccess] = useState(false);

  // Job Seeker Form State
  const [seekerName, setSeekerName] = useState("");
  const [seekerSkill, setSeekerSkill] = useState("");
  const [seekerProvince, setSeekerProvince] = useState("تهران");
  const [seekerDocType, setSeekerDocType] = useState("کارت آمایش / هوشمند");
  const [seekerPhone, setSeekerPhone] = useState("");
  const [seekerExperience, setSeekerExperience] = useState("");
  const [seekerNeedsAccom, setSeekerNeedsAccom] = useState(false);
  const [isSubmittingSeeker, setIsSubmittingSeeker] = useState(false);
  const [seekerSubmitSuccess, setSeekerSubmitSuccess] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Load any submitted jobs from Firestore
  useEffect(() => {
    if (!isOpen) return;
    const fetchCloudJobs = async () => {
      try {
        const q = query(collection(db, "job_postings"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const cloudJobs: JobPosting[] = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          } as JobPosting));
          setJobs([...cloudJobs, ...INITIAL_JOBS]);
        }
      } catch {
        // use initial
      }
    };
    fetchCloudJobs();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredJobs = jobs.filter((job) => {
    const matchKeyword =
      !searchKeyword ||
      job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      job.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      job.city.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchProvince =
      selectedProvince === "همه استان‌ها" || job.province === selectedProvince;

    const matchCategory =
      selectedCategory === "همه دسته‌ها" || job.category === selectedCategory;

    const matchAccom = !filterAccommodation || job.hasAccommodation;

    return matchKeyword && matchProvince && matchCategory && matchAccom;
  });

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobCity || !employerPhone) return;
    setIsSubmittingJob(true);

    const newJob: JobPosting = {
      id: `job-${Date.now()}`,
      title: jobTitle,
      category: jobCategory,
      province: jobProvince,
      city: jobCity,
      salary: jobSalary || "توافقی",
      hasAccommodation: jobHasAccom,
      hasFood: jobHasFood,
      requiresWorkPermit: true,
      description: jobDesc,
      employerName: employerName || "کارفرما",
      contactPhone: employerPhone,
      datePosted: "امروز",
      status: "active"
    };

    try {
      await addDoc(collection(db, "job_postings"), {
        ...newJob,
        createdAt: Timestamp.now()
      });
    } catch {
      // Local state fallback
    }

    setJobs((prev) => [newJob, ...prev]);
    setIsSubmittingJob(false);
    setJobSubmitSuccess(true);
    setJobTitle("");
    setJobCity("");
    setJobDesc("");
    setEmployerPhone("");
    setTimeout(() => {
      setJobSubmitSuccess(false);
      setActiveTab("search");
    }, 2000);
  };

  const handleSubmitSeeker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seekerName || !seekerPhone || !seekerSkill) return;
    setIsSubmittingSeeker(true);

    try {
      await addDoc(collection(db, "job_seekers"), {
        name: seekerName,
        skill: seekerSkill,
        province: seekerProvince,
        docType: seekerDocType,
        phone: seekerPhone,
        experience: seekerExperience,
        needsAccommodation: seekerNeedsAccom,
        status: "active",
        createdAt: Timestamp.now()
      });
    } catch {
      // ignore
    }

    setIsSubmittingSeeker(false);
    setSeekerSubmitSuccess(true);
    setSeekerName("");
    setSeekerPhone("");
    setSeekerSkill("");
    setTimeout(() => {
      setSeekerSubmitSuccess(false);
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>سامانه کاریابی و استخدام مجاز اتباع و مهاجرین</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  با پروانه کار
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اتصال مستقیم کارفرمایان و کارجویان مهاجر در مشاغل مجاز، کارگاه‌ها و پروژه‌ها
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-xs"
            title="بستن پنجره (Esc)"
          >
            <X size={16} />
            <span className="hidden sm:inline">بستن (Esc)</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 gap-2 sm:gap-4 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "search"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Search size={15} />
            <span>فرصت‌های شغلی ({filteredJobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("post")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "post"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <PlusCircle size={15} />
            <span>ثبت آگهی استخدام (کارفرما)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("seeker")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "seeker"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <UserCheck size={15} />
            <span>آماده به کار / ثبت رزومه (کارجو)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "rules"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck size={15} />
            <span>قوانین پروانه کار و مشاغل مجاز</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Search and Browse Jobs */}
          {activeTab === "search" && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="عنوان شغل، تخصص یا مهارت (مثال: خیاط، نجار، جوشکار، گلخانه)..."
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <Search size={16} className="absolute right-3.5 top-3 text-slate-400" />
                  </div>

                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {AUTHORIZED_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {JOB_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={filterAccommodation}
                      onChange={(e) => setFilterAccommodation(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <Home size={14} className="text-amber-500" />
                    <span>فقط فرصت‌های دارای جای خواب / اسکان کارگری</span>
                  </label>

                  <span className="text-[11px]">
                    نمایش <strong>{filteredJobs.length}</strong> فرصت شغلی فعال
                  </span>
                </div>
              </div>

              {/* Jobs List */}
              {filteredJobs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-sm">موردی با شرایط انتخابی شما یافت نشد.</p>
                  <p className="text-xs mt-1">لطفاً فیلتر استان یا دسته شغلی را تغییر دهید یا دکمه جستجو را پاک کنید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {job.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {job.datePosted}
                          </span>
                        </div>

                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                          {job.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {job.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-rose-500" />
                            <span>{job.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                            <DollarSign size={14} />
                            <span>{job.salary}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {job.hasAccommodation && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                              <Home size={11} />
                              <span>جای خواب دارد</span>
                            </span>
                          )}
                          {job.hasFood && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                              <Utensils size={11} />
                              <span>غذا دارد</span>
                            </span>
                          )}
                          {job.requiresWorkPermit && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              <ShieldCheck size={11} />
                              <span>پروانه کار</span>
                            </span>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-bold">
                            {job.employerName}
                          </span>
                          <a
                            href={`tel:${job.contactPhone}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                          >
                            <Phone size={13} />
                            <span>تماس: {job.contactPhone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Post Job for Employers */}
          {activeTab === "post" && (
            <form onSubmit={handleSubmitJob} className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-bold">کارفرمای محترم؛ خوش آمدید!</p>
                <p>
                  کلیه آگهی‌ها به صورت رایگان در سامانه وب و ربات‌های تلگرام، بله و ایتا نمایش داده می‌شوند. استخدام اتباع خارجی مستلزم داشتن پروانه کار معتبر صادره از دفاتر کفالت است.
                </p>
              </div>

              {jobSubmitSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>آگهی استخدام با موفقیت ثبت شد و بلافاصله منتشر گردید!</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">عنوان آگهی شغلی *</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مثال: کارگر ماهر گلخانه با جای خواب / استادکار چرخکار تریکو"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">دسته شغلی *</label>
                  <select
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    {JOB_CATEGORIES.filter((c) => c !== "همه دسته‌ها").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">استان *</label>
                  <select
                    value={jobProvince}
                    onChange={(e) => setJobProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    {AUTHORIZED_PROVINCES.filter((p) => p !== "همه استان‌ها").map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">شهر و محدوده کارگاه *</label>
                  <input
                    type="text"
                    required
                    value={jobCity}
                    onChange={(e) => setJobCity(e.target.value)}
                    placeholder="مثال: پاکدشت، شهرک صنعتی خاوران، یا توس مشهد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">حقوق و دستمزد پیشنهادی</label>
                  <input
                    type="text"
                    value={jobSalary}
                    onChange={(e) => setJobSalary(e.target.value)}
                    placeholder="مثال: ۲۲ میلیون ماهانه یا توافقی"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={jobHasAccom}
                    onChange={(e) => setJobHasAccom(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>دارای جای خواب / اتاق مسکونی کارگری</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={jobHasFood}
                    onChange={(e) => setJobHasFood(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>دارای وعده غذایی (ناهار / صبحانه)</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">توضیحات و شرایط کار</label>
                <textarea
                  rows={3}
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="شرح وظایف، ساعت کاری، تسویه حساب و نحوه همکاری..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نام کارفرما یا کارگاه</label>
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="مثال: تولیدی پیراهن ایرانیان"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">شماره تماس مستقیم *</label>
                  <input
                    type="tel"
                    required
                    value={employerPhone}
                    onChange={(e) => setEmployerPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingJob}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PlusCircle size={16} />
                <span>{isSubmittingJob ? "در حال ثبت آگهی..." : "ثبت و انتشار رایگان آگهی شغلی"}</span>
              </button>
            </form>
          )}

          {/* TAB 3: Job Seeker Form */}
          {activeTab === "seeker" && (
            <form onSubmit={handleSubmitSeeker} className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-bold">کارجوی گرامی؛ مشخصات شغلی خود را ثبت کنید</p>
                <p>
                  با ثبت مهارت و رزومه خود، کارفرمایان متقاضی نیروی کار در شهر شما می‌توانند مستقیماً با شما تماس بگیرند.
                </p>
              </div>

              {seekerSubmitSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>مشخصات شغلی شما با موفقیت در بانک کارجویان مجاز ثبت شد!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={seekerName}
                    onChange={(e) => setSeekerName(e.target.value)}
                    placeholder="مثال: نصیر احمدی"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مهارت و تخصص اصلی *</label>
                  <input
                    type="text"
                    required
                    value={seekerSkill}
                    onChange={(e) => setSeekerSkill(e.target.value)}
                    placeholder="مثال: چرخکار ماهر، جوشکار برق، نجار MDF، کارگر ساده"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">استان محل سکونت *</label>
                  <select
                    value={seekerProvince}
                    onChange={(e) => setSeekerProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    {AUTHORIZED_PROVINCES.filter((p) => p !== "همه استان‌ها").map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع مدرک اقامتی *</label>
                  <select
                    value={seekerDocType}
                    onChange={(e) => setSeekerDocType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="کارت هوشمند / آمایش">کارت هوشمند / آمایش</option>
                    <option value="گذرنامه با روادید معتبر">گذرنامه با روادید معتبر</option>
                    <option value="برگه سرشماری / تردد">برگه سرشماری / تردد</option>
                    <option value="فاقد مدرک">فاقد مدرک</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">سابقه کار و تجربه</label>
                  <input
                    type="text"
                    value={seekerExperience}
                    onChange={(e) => setSeekerExperience(e.target.value)}
                    placeholder="مثال: ۵ سال سابقه کار در کارگاه پوشاک"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">شماره موبایل جهت تماس کارفرما *</label>
                  <input
                    type="tel"
                    required
                    value={seekerPhone}
                    onChange={(e) => setSeekerPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={seekerNeedsAccom}
                  onChange={(e) => setSeekerNeedsAccom(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>نیازمند جای خواب / اسکان کارگاهی هستم</span>
              </label>

              <button
                type="submit"
                disabled={isSubmittingSeeker}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserCheck size={16} />
                <span>{isSubmittingSeeker ? "در حال ثبت اطلاعات..." : "ثبت در سامانه معرفی کارجویان"}</span>
              </button>
            </form>
          )}

          {/* TAB 4: Rules & Regulations */}
          {activeTab === "rules" && (
            <div className="max-w-3xl mx-auto space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <h4 className="font-black text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>بخشنامه‌های قانونی اشتغال و پروانه کار اتباع خارجی</span>
                </h4>
                <p>
                  طبق ماده ۱۲۰ قانون کار جمهوری اسلامی ایران، اشتغال به کار اتباع بیگانه مشروط به داشتن روادید ورود با حق کار مشخص و اخذ پروانه کار از وزارت تعاون، کار و رفاه اجتماعی (از طریق دفاتر کفالت) است.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>دسته‌های شغلی مجاز اتباع در ایران</span>
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <li>کوره‌پزخانه‌ها و تولید آجر و سفال</li>
                    <li>صنایع چوب، نجاری و مبلمان‌سازی</li>
                    <li>سنگ‌بری و کارخانجات فرآوری سنگ ساختمانی</li>
                    <li>کارهای ساختمانی (آرماتوربندی، بنایی، گچ‌کاری)</li>
                    <li>کشاورزی، باغبانی و کشت گلخانه‌ای</li>
                    <li>تولیدی پوشاک، خیاطی و کفش‌دوزی</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <AlertCircle size={15} className="text-amber-500" />
                    <span>نکات مهم برای کارفرمایان و کارگران</span>
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <li>به کارگیری تبعه فاقد پروانه کار شامل جریمه روزانه کارفرما می‌شود.</li>
                    <li>تمدید کارت کارگری سالانه همگام با تمدید کارت آمایش در دفاتر کفالت انجام می‌شود.</li>
                    <li>حوادث ناشی از کار مشمول بیمه حوادث و غرامت سازمان تأمین اجتماعی است.</li>
                    <li>اشتغال در مشاغل اغذیه‌فروشی نیازمند کارت بهداشت معتبر می‌باشد.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Standardized Close Button */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500">
            سامانه دستیار مهاجر • کلیه خدمات کاریابی و معرفی رایگان است
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
}
