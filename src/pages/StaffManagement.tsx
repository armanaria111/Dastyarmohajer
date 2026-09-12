import React, { useState } from "react";
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
  Download
} from "lucide-react";
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

  // Form state
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

  const handleToggleActive = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleDeleteStaff = (id: string) => {
    if (id === "STF-01") {
      alert("حساب مدیر ارشد سیستم قابل حذف نمی‌باشد.");
      return;
    }
    if (confirm("آیا از حذف دسترسی این اپراتور اطمینان دارید؟")) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.fullName || !newStaff.username) {
      alert("لطفاً نام و نام کاربری را مشخص نمایید.");
      return;
    }

    const created: StaffMember = {
      id: `STF-${Date.now().toString().slice(-4)}`,
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
      createdAt: "امروز"
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Shield className="text-blue-600 dark:text-blue-400" size={24} />
            <span>مدیریت اپراتورها و سطوح دسترسی کارمندان (Staff & Roles)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            تعریف پرسنل دفاتر، تعیین دسترسی به استعلام تذکره، کاریابی، پاسخگویی به ربات‌ها و گزارش‌گیری
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            <span>خروجی اکسل پرسنل</span>
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، نام کاربری یا تلفن اپراتور..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-black">
              <tr>
                <th className="p-3.5">مشخصات اپراتور</th>
                <th className="p-3.5">نقش سیستمی</th>
                <th className="p-3.5">شماره تماس</th>
                <th className="p-3.5">دسترسی‌های فعال</th>
                <th className="p-3.5">وضعیت حساب</th>
                <th className="p-3.5">آخرین ورود</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200 font-medium">
              {filteredStaff.map((s) => {
                const badge = getRoleBadge(s.role);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCheck size={16} className="text-blue-500" />
                        <span>{s.fullName}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        نام کاربری: <b className="text-gray-600 dark:text-gray-300">{s.username}</b>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-black ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono text-[11px]">{s.phone}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {s.permissions.canManageBots && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
                            ربات‌ها
                          </span>
                        )}
                        {s.permissions.canManageTazkira && (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            تذکره
                          </span>
                        )}
                        {s.permissions.canManageJobs && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            کاریابی
                          </span>
                        )}
                        {s.permissions.canManageSupport && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            پشتیبانی
                          </span>
                        )}
                        {s.permissions.canExportExcel && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
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
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        disabled={s.id === "STF-01"}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                        title="حذف حساب اپراتور"
                      >
                        <Trash2 size={16} />
                      </button>
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
                    شماره تماس
                  </label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="0912..."
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
                  <option value="superadmin">مدیر ارشد (دسترسی نامحدود)</option>
                </select>
              </div>

              {/* Granular permissions checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">دسترسی‌های مجاز:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
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
                      className="rounded text-blue-600"
                    />
                    <span>استعلام تذکره</span>
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
                      className="rounded text-blue-600"
                    />
                    <span>کاریابی و کارجویان</span>
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
                      className="rounded text-blue-600"
                    />
                    <span>پاسخگویی به ربات</span>
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
                      className="rounded text-blue-600"
                    />
                    <span>خروجی اکسل</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl text-gray-600 dark:text-gray-400 hover:bg-slate-100 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md"
                >
                  ثبت اپراتور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
