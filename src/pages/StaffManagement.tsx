import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Shield,
  Plus,
  Search,
  Lock,
  Mail,
  Phone,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  KeyRound,
  Download,
  Save
} from "lucide-react";
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { exportToCSV } from "../utils/exportUtils";

interface StaffMember {
  id: string;
  fullName: string;
  username: string;
  role: "superadmin" | "tazkira_operator" | "support_agent" | "job_coordinator";
  phone: string;
  isActive: boolean;
  permissions: {
    canManageBots: boolean;
    canManageTazkira: boolean;
    canManageJobs: boolean;
    canManageSupport: boolean;
    canExportExcel: boolean;
  };
  lastLogin: string;
  createdAt: string;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "STF-01",
    fullName: "آرمان آریا (مدیر کل سیستم)",
    username: "arman_admin",
    role: "superadmin",
    phone: "09121110000",
    isActive: true,
    permissions: {
      canManageBots: true,
      canManageTazkira: true,
      canManageJobs: true,
      canManageSupport: true,
      canExportExcel: true
    },
    lastLogin: "هم‌اکنون",
    createdAt: "۱۴۰۴/۰۱/۰۱"
  },
  {
    id: "STF-02",
    fullName: "حکیم کریمی (متصدی تذکره و دفاتر)",
    username: "karimi_desk",
    role: "tazkira_operator",
    phone: "09352223344",
    isActive: true,
    permissions: {
      canManageBots: false,
      canManageTazkira: true,
      canManageJobs: false,
      canManageSupport: false,
      canExportExcel: true
    },
    lastLogin: "۲ ساعت پیش",
    createdAt: "۱۴۰۴/۰۴/۱۰"
  },
  {
    id: "STF-03",
    fullName: "زهرا سادات حسینی (پشتیبان ربات‌ها)",
    username: "hosseini_sup",
    role: "support_agent",
    phone: "09195556677",
    isActive: true,
    permissions: {
      canManageBots: false,
      canManageTazkira: false,
      canManageJobs: false,
      canManageSupport: true,
      canExportExcel: false
    },
    lastLogin: "دیروز",
    createdAt: "۱۴۰۴/۰۵/۱۵"
  },
  {
    id: "STF-04",
    fullName: "فریدون نظری (مسئول کاریابی و کارگاه‌ها)",
    username: "nazari_job",
    role: "job_coordinator",
    phone: "09907778899",
    isActive: true,
    permissions: {
      canManageBots: false,
      canManageTazkira: false,
      canManageJobs: true,
      canManageSupport: false,
      canExportExcel: true
    },
    lastLogin: "۳ روز پیش",
    createdAt: "۱۴۰۴/۰۶/۰۱"
  }
];

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form state for creation
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({
    fullName: "",
    username: "",
    phone: "",
    role: "support_agent",
    isActive: true,
    permissions: {
      canManageBots: false,
      canManageTazkira: false,
      canManageJobs: false,
      canManageSupport: true,
      canExportExcel: false
    }
  });

  // Sync with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff_members"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffMember));
        setStaffList(list);
      } else {
        INITIAL_STAFF.forEach((s) => {
          setDoc(doc(db, "staff_members", s.id), s).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.includes(searchTerm) ||
      s.username.includes(searchTerm) ||
      s.phone.includes(searchTerm)
  );

  const getRoleBadge = (role: StaffMember["role"]) => {
    switch (role) {
      case "superadmin":
        return { label: "مدیر ارشد کل", color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800" };
      case "tazkira_operator":
        return { label: "متصدی تذکره و نوبت‌ها", color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800" };
      case "support_agent":
        return { label: "کارشناس پشتیبانی ربات‌ها", color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800" };
      case "job_coordinator":
        return { label: "مسئول کاریابی و کارگاه‌ها", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800" };
    }
  };

  const handleToggleActive = async (id: string) => {
    const target = staffList.find((s) => s.id === id);
    if (!target) return;
    const newActive = !target.isActive;

    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: newActive } : s))
    );
    try {
      await updateDoc(doc(db, "staff_members", id), { isActive: newActive });
    } catch {
      // fallback
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (id === "STF-01") {
      alert("حساب مدیر ارشد سیستم قابل حذف نمی‌باشد.");
      return;
    }
    if (confirm(`آیا از حذف دسترسی اپراتور «${name}» اطمینان دارید؟`)) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      try {
        await deleteDoc(doc(db, "staff_members", id));
      } catch {
        // fallback
      }
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.fullName || !newStaff.username) {
      alert("لطفاً نام و نام کاربری را مشخص نمایید.");
      return;
    }

    const id = `STF-${Date.now().toString().slice(-4)}`;
    const created: StaffMember = {
      id,
      fullName: newStaff.fullName || "",
      username: newStaff.username || "",
      role: newStaff.role as any || "support_agent",
      phone: newStaff.phone || "",
      isActive: true,
      permissions: newStaff.permissions || {
        canManageBots: false,
        canManageTazkira: false,
        canManageJobs: false,
        canManageSupport: true,
        canExportExcel: false
      },
      lastLogin: "هنوز وارد نشده",
      createdAt: new Date().toLocaleDateString("fa-IR")
    };

    setStaffList([...staffList, created]);
    setIsModalOpen(false);
    setNewStaff({
      fullName: "",
      username: "",
      phone: "",
      role: "support_agent",
      isActive: true,
      permissions: {
        canManageBots: false,
        canManageTazkira: false,
        canManageJobs: false,
        canManageSupport: true,
        canExportExcel: false
      }
    });

    try {
      await setDoc(doc(db, "staff_members", id), created);
    } catch {
      // fallback
    }
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff({
      ...staff,
      permissions: { ...staff.permissions }
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setStaffList((prev) =>
      prev.map((s) => (s.id === editingStaff.id ? editingStaff : s))
    );
    setIsEditModalOpen(false);

    try {
      await updateDoc(doc(db, "staff_members", editingStaff.id), {
        fullName: editingStaff.fullName,
        username: editingStaff.username,
        phone: editingStaff.phone,
        role: editingStaff.role,
        permissions: editingStaff.permissions
      });
    } catch {
      // fallback
    }
    setEditingStaff(null);
  };

  const handleExportCSV = () => {
    const headers = [
      "کد پرسنلی",
      "نام و نام خانوادگی",
      "نام کاربری",
      "نقش کاربری",
      "شماره تماس",
      "وضعیت حساب",
      "دسترسی ربات‌ها",
      "دسترسی تذکره",
      "دسترسی کاریابی",
      "دسترسی پشتیبانی",
      "دسترسی اکسل",
      "آخرین ورود"
    ];
    const rows = filteredStaff.map((s) => [
      s.id,
      s.fullName,
      s.username,
      getRoleBadge(s.role).label,
      s.phone,
      s.isActive ? "فعال" : "مسدود",
      s.permissions.canManageBots ? "بله" : "خیر",
      s.permissions.canManageTazkira ? "بله" : "خیر",
      s.permissions.canManageJobs ? "بله" : "خیر",
      s.permissions.canManageSupport ? "بله" : "خیر",
      s.permissions.canExportExcel ? "بله" : "خیر",
      s.lastLogin
    ]);
    exportToCSV("لیست_اپراتورها_و_سطوح_دسترسی", headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Shield className="text-blue-600 dark:text-blue-400" size={24} />
            <span>مدیریت پرسنل، اپراتورها و سطوح دسترسی (RBAC)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تعریف حساب‌های کاربری متصدیان، تفکیک اختیارات بخش تذکره، کاریابی، ربات‌ها و اعمال دسترسی امن
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus size={16} />
            <span>افزودن اپراتور جدید</span>
          </button>
        </div>
      </div>

      {/* Role summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs text-gray-400 font-bold">کل کاربران اداری</div>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">{staffList.length} نفر</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs text-gray-400 font-bold">اپراتورهای فعال</div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {staffList.filter((s) => s.isActive).length} حساب فعال
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs text-gray-400 font-bold">متصدیان تذکره و مدارک</div>
          <div className="text-xl font-black text-blue-600 mt-1">
            {staffList.filter((s) => s.permissions.canManageTazkira).length} نفر
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs text-gray-400 font-bold">کارشناسان پشتیبانی ربات</div>
          <div className="text-xl font-black text-purple-600 mt-1">
            {staffList.filter((s) => s.permissions.canManageSupport).length} نفر
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، نام کاربری یا تلفن اپراتور..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-gray-400 font-bold hidden sm:block">
          تعداد: {filteredStaff.length} مورد
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
              <tr>
                <th className="p-3.5">مشخصات اپراتور</th>
                <th className="p-3.5">نقش سازمانی</th>
                <th className="p-3.5">تلفن تماس</th>
                <th className="p-3.5">ماژول‌های مجاز</th>
                <th className="p-3.5">وضعیت حساب</th>
                <th className="p-3.5">آخرین ورود</th>
                <th className="p-3.5 text-center">عملیات (ویرایش / حذف)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200 font-medium">
              {filteredStaff.map((s) => {
                const roleBadge = getRoleBadge(s.role);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
                          {s.fullName[0]}
                        </div>
                        <div>
                          <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{s.fullName}</span>
                            {s.role === "superadmin" && (
                              <Shield size={13} className="text-purple-600 fill-purple-600" />
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            @{s.username} • کد: {s.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-black ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-gray-500 dark:text-gray-400">
                      {s.phone}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {s.permissions.canManageBots && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                            ربات‌ها
                          </span>
                        )}
                        {s.permissions.canManageTazkira && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                            تذکره
                          </span>
                        )}
                        {s.permissions.canManageJobs && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                            کاریابی
                          </span>
                        )}
                        {s.permissions.canManageSupport && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
                            پشتیبانی
                          </span>
                        )}
                        {s.permissions.canExportExcel && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            اکسل
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(s.id)}
                        disabled={s.id === "STF-01"}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors ${
                          s.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {s.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{s.isActive ? "فعال و مجاز" : "مسدود شده"}</span>
                      </button>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="text-gray-400 text-[11px]">{s.lastLogin}</div>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="ویرایش مشخصات و دسترسی‌ها"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id, s.fullName)}
                          disabled={s.id === "STF-01"}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                          title="حذف حساب اپراتور"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                <span>تعریف اپراتور و کارمند جدید</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی اپراتور *
                </label>
                <input
                  type="text"
                  required
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  placeholder="مثال: علی رضایی"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام کاربری ورود *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    placeholder="rezaei_op"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره همراه
                  </label>
                  <input
                    type="text"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نقش سازمانی
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="support_agent">کارشناس پشتیبانی ربات‌ها</option>
                  <option value="tazkira_operator">متصدی تذکره و نوبت‌ها</option>
                  <option value="job_coordinator">مسئول کاریابی و کارگاه‌ها</option>
                  <option value="superadmin">مدیر ارشد کل سیستم</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  دسترسی‌های مجاز ماژول‌ها:
                </label>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.permissions?.canManageBots}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          permissions: { ...newStaff.permissions!, canManageBots: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تنظیمات ربات‌ها و وب‌هوک</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.permissions?.canManageTazkira}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          permissions: { ...newStaff.permissions!, canManageTazkira: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>ثبت و ویرایش لیست تذکره‌های چاپ‌شده</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.permissions?.canManageJobs}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          permissions: { ...newStaff.permissions!, canManageJobs: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تایید آگهی‌های شغلی و کارجویان</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.permissions?.canManageSupport}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          permissions: { ...newStaff.permissions!, canManageSupport: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>صندوق پیام‌ها و پاسخ به تیکت‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.permissions?.canExportExcel}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          permissions: { ...newStaff.permissions!, canExportExcel: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>دریافت خروجی اکسل و گزارشات</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  افزودن حساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                <span>ویرایش اطلاعات اپراتور ({editingStaff.id})</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نام و نام خانوادگی اپراتور *
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.fullName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    نام کاربری ورود *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.username}
                    onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    شماره همراه
                  </label>
                  <input
                    type="text"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  نقش سازمانی
                </label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="support_agent">کارشناس پشتیبانی ربات‌ها</option>
                  <option value="tazkira_operator">متصدی تذکره و نوبت‌ها</option>
                  <option value="job_coordinator">مسئول کاریابی و کارگاه‌ها</option>
                  <option value="superadmin">مدیر ارشد کل سیستم</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  دسترسی‌های مجاز ماژول‌ها:
                </label>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.canManageBots}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          permissions: { ...editingStaff.permissions, canManageBots: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تنظیمات ربات‌ها و وب‌هوک</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.canManageTazkira}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          permissions: { ...editingStaff.permissions, canManageTazkira: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>ثبت و ویرایش لیست تذکره‌های چاپ‌شده</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.canManageJobs}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          permissions: { ...editingStaff.permissions, canManageJobs: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>تایید آگهی‌های شغلی و کارجویان</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.canManageSupport}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          permissions: { ...editingStaff.permissions, canManageSupport: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>صندوق پیام‌ها و پاسخ به تیکت‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.canExportExcel}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          permissions: { ...editingStaff.permissions, canExportExcel: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>دریافت خروجی اکسل و گزارشات</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-slate-100"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
