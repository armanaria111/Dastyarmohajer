import React, { useState, useEffect } from "react";
import {
  Calculator,
  X,
  DollarSign,
  Users,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface FeeItem {
  id: string;
  category: "consulate" | "kafalat" | "police";
  title: string;
  usdPrice: number;
  tomanPrice: number;
  description: string;
  requiredDocs: string[];
}

const DEFAULT_SERVICES: FeeItem[] = [
  {
    id: "passport-5yr",
    category: "consulate",
    title: "صدور و تمدید پاسپورت الکترونیک (۵ ساله)",
    usdPrice: 120,
    tomanPrice: 0,
    description: "مخصوص کلیه دارندگان تذکره تایید شده و واجدین شرایط",
    requiredDocs: [
      "اصل و کپی تذکره تایید شده وزارت خارجه یا الکترونیک",
      "۴ قطعه عکس ۴×۴ با زمینه سفید",
      "پاسپورت قبلی (در صورت وجود)",
      "برگه نوبت سامانه کنسولی سفارت"
    ]
  },
  {
    id: "passport-2yr",
    category: "consulate",
    title: "تمدید پاسپورت (۲ ساله دانشجویی / ویژه)",
    usdPrice: 50,
    tomanPrice: 0,
    description: "تمدید اعتبار پاسپورت برای متقاضیان مجاز یا دانشجویان",
    requiredDocs: [
      "اصل پاسپورت",
      "گواهی اشتغال به تحصیل یا کارت دانشجویی معتبر",
      "۲ قطعه عکس جدید"
    ]
  },
  {
    id: "identity-verify",
    category: "consulate",
    title: "تثبیت هویت در کنسولگری / سفارت",
    usdPrice: 30,
    tomanPrice: 0,
    description: "جهت احراز هویت افراد فاقد تذکره تایید شده برای صدور پاسپورت",
    requiredDocs: [
      "تذکره اقارب اصولی (پدر، برادر، عمو یا پدربزرگ)",
      "استشهادیه محلی با امضای ۲ نفر شاهد مقیم",
      "۴ قطعه عکس متقاضی و کپی مدارک شناسایی شاهدان"
    ]
  },
  {
    id: "tazkira-electronic",
    category: "consulate",
    title: "صدور تذکره الکترونیکی",
    usdPrice: 15,
    tomanPrice: 0,
    description: "هزینه پردازش بایومتریک و چاپ تذکره رسمی",
    requiredDocs: [
      "فرم تکمیل شده مشخصات فردی",
      "کپی تذکره پدر یا برادر",
      "گواهی تولد برای متولدین ایران"
    ]
  },
  {
    id: "kafalat-service",
    category: "kafalat",
    title: "خدمات اداری و نوبت‌دهی دفتر کفالت (هر نفر)",
    usdPrice: 0,
    tomanPrice: 185000,
    description: "شامل پذیرش، تصویربرداری، انگشت‌نگاری و استعلام سیستمی",
    requiredDocs: [
      "کارت آمایش یا برگه سرشماری معتبر",
      "مدارک هویتی سرپرست و اعضای خانوار",
      "فیش واریزی تعرفه مصوب"
    ]
  },
  {
    id: "work-card",
    category: "kafalat",
    title: "تمدید پروانه کارگری (کارت کار اتباع)",
    usdPrice: 0,
    tomanPrice: 950000,
    description: "پروانه اشتغال قانونی یکساله اداره کل تعاون، کار و رفاه اجتماعی",
    requiredDocs: [
      "کارت آمایش یا برگه اقامت معتبر",
      "معرفی‌نامه کارفرما یا تعهدنامه خوداشتغالی",
      "گواهی بیمه حوادث کارگری"
    ]
  },
  {
    id: "visa-exit-reentry",
    category: "police",
    title: "روادید خروج و مراجعت (پلیس مهاجرت ناجا)",
    usdPrice: 0,
    tomanPrice: 650000,
    description: "جهت سفر موقت به افغانستان و بازگشت قانونی به ایران",
    requiredDocs: [
      "اصل پاسپورت دارای اقامت معتبر حداقل ۳ ماه",
      "معرفی‌نامه معتبر از اداره امور اتباع و مهاجرین",
      "رضایت‌نامه سرپرست برای افراد تحت تکفل"
    ]
  },
  {
    id: "residence-renewal",
    category: "police",
    title: "تمدید اقامت یک ساله (پلیس اطلاعات و امنیت)",
    usdPrice: 0,
    tomanPrice: 1200000,
    description: "تمدید روادید و برچسب اقامت دانشجویی، کاری یا خانواری",
    requiredDocs: [
      "اصل گذرنامه دارای اعتبار کافی",
      "نامه رسمی تمدید از سازمان متبوع (دانشگاه، کارفرما)",
      "برگه عدم سوء پیشینه در صورت درخواست"
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeeCalculatorModal({ isOpen, onClose }: Props) {
  const [dollarRate, setDollarRate] = useState<number>(88000); // Toman per USD
  const [familyMembers, setFamilyMembers] = useState<number>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    "passport-5yr",
    "kafalat-service"
  ]);
  const [activeCategory, setActiveCategory] = useState<"all" | "consulate" | "kafalat" | "police">("all");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((s) => s !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const filteredServices = DEFAULT_SERVICES.filter(
    (s) => activeCategory === "all" || s.category === activeCategory
  );

  // Calculations
  let totalUsdSingle = 0;
  let totalTomanSingle = 0;

  DEFAULT_SERVICES.forEach((service) => {
    if (selectedServiceIds.includes(service.id)) {
      totalUsdSingle += service.usdPrice;
      totalTomanSingle += service.tomanPrice;
    }
  });

  const totalUsdFamily = totalUsdSingle * familyMembers;
  const totalTomanFamily = totalTomanSingle * familyMembers;
  const grandTotalToman = totalTomanFamily + totalUsdFamily * dollarRate;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Calculator size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                محاسبه‌گر آنلاین هزینه‌ها و تعرفه‌ها
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                برآورد دقیق هزینه‌های تمدید پاسپورت، اقامت، نوبت دفاتر کفالت و تثبیت هویت سفارت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white flex items-center gap-1.5 font-black text-xs sm:text-sm shrink-0 border border-white/25 shadow-sm"
            title="بستن پنجره"
          >
            <X size={18} />
            <span>بستن</span>
          </button>
        </div>

        {/* Setting Inputs (Dollar Rate & Family Members) */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
              <span>نرخ دلار مبنا (تومان):</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">امکان ویرایش دستی</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={dollarRate}
                onChange={(e) => setDollarRate(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-sm font-bold text-gray-900 dark:text-white pl-12"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 font-sans text-xs">تومان</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
              <span>تعداد افراد خانوار / متقاضیان:</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {familyMembers} نفر
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={familyMembers}
                onChange={(e) => setFamilyMembers(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg font-bold font-mono text-xs">
                {familyMembers}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-6 pt-4 flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeCategory === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            همه خدمات
          </button>
          <button
            onClick={() => setActiveCategory("consulate")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeCategory === "consulate"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            سفارت و کنسولگری (دلاری)
          </button>
          <button
            onClick={() => setActiveCategory("kafalat")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeCategory === "kafalat"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            دفاتر کفالت و اشتغال
          </button>
          <button
            onClick={() => setActiveCategory("police")}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeCategory === "police"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            پلیس مهاجرت و روادید
          </button>
        </div>

        {/* Services Selection Grid */}
        <div className="p-6 max-h-96 overflow-y-auto space-y-3">
          {filteredServices.map((item) => {
            const isSelected = selectedServiceIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleService(item.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-blue-50/60 dark:bg-blue-900/20 border-blue-500 shadow-xs"
                    : "bg-white dark:bg-gray-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-700"
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={14} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.requiredDocs.map((doc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px]"
                        >
                          • {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-left shrink-0 pr-8 sm:pr-0">
                  {item.usdPrice > 0 && (
                    <div className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      ${item.usdPrice} دلار
                      <span className="text-[10px] text-gray-400 block font-sans">
                        ≈ {(item.usdPrice * dollarRate).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  )}
                  {item.tomanPrice > 0 && (
                    <div className="font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {item.tomanPrice.toLocaleString("fa-IR")} تومان
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary Footer */}
        <div className="p-6 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">
              جمع کل هزینه‌ها برای {familyMembers} نفر:
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {grandTotalToman.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-slate-300">تومان</span>
              {totalUsdFamily > 0 && (
                <span className="text-xs text-slate-400 font-mono mr-2">
                  (شامل ${totalUsdFamily} دلار سفارت)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold transition-all text-slate-200"
            >
              چاپ ریز هزینه‌ها
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5"
            >
              <X size={16} />
              <span>بستن پنجره</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
