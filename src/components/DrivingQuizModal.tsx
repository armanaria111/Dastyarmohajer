import React, { useState, useEffect } from "react";
import {
  Car,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: "تابلوها" | "حق تقدم" | "فنی" | "مقررات عمومی";
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "در برخورد با تابلوی «رعایت حق تقدم» راننده موظف است چه اقدامی انجام دهد؟",
    options: [
      "توقف کامل نماید و پس از ۵ ثانیه حرکت کند.",
      "سرعت خود را کاهش داده و در صورت لزوم توقف نماید تا وسایل نقلیه راه اصلی عبور کنند.",
      "با همان سرعت و احتیاط به راه خود ادامه دهد.",
      "بوق زده و با سرعت عبور کند."
    ],
    correctIndex: 1,
    explanation: "تابلوی رعایت حق تقدم به این معناست که باید سرعت را کم کرده و به خودروهای راه اصلی اولویت عبور داد.",
    category: "تابلوها"
  },
  {
    id: 2,
    question: "حداکثر سرعت مجاز در خیابان‌های شریانی اصلی درون شهر چند کیلومتر بر ساعت است؟",
    options: ["۵۰ کیلومتر", "۶۰ کیلومتر", "۸۰ کیلومتر", "۱۰۰ کیلومتر"],
    correctIndex: 1,
    explanation: "حداکثر سرعت در معابر شریانی اصلی ۶۰ کیلومتر در ساعت و در شریانی فرعی ۵۰ کیلومتر است مگر آنکه تابلو چیز دیگری نشان دهد.",
    category: "مقررات عمومی"
  },
  {
    id: 3,
    question: "در یک تقاطع هم‌عرض بدون علامت و چراغ، حق تقدم با کدام وسیله است؟",
    options: [
      "وسیله‌ای که به سمت چپ گردش می‌کند.",
      "وسیله‌ای که سرعت بیشتری دارد.",
      "وسیله‌ای که در سمت راست وسیله دیگر قرار دارد.",
      "وسیله‌ای که ابعاد بزرگتری دارد."
    ],
    correctIndex: 2,
    explanation: "در تقاطع‌های هم‌عرض بدون تابلو، رعایت حق تقدم دست راست الزامی است.",
    category: "حق تقدم"
  },
  {
    id: 4,
    question: "خط ممتد طولی در وسط راه چه معنایی دارد؟",
    options: [
      "سبقت و گردش به چپ بر روی آن اکیداً ممنوع است.",
      "سبقت با احتیاط مجاز است.",
      "فقط خودروهای امدادی می‌توانند عبور کنند.",
      "نشانه اتمام محدوده سرعت مجاز است."
    ],
    correctIndex: 0,
    explanation: "خط ممتد مانند یک دیوار فرضی است و عبور از روی آن و سبقت ممنوع و خلاف قانون است.",
    category: "مقررات عمومی"
  },
  {
    id: 5,
    question: "میزان باد لاستیک‌ها باید در چه زمانی اندازه‌گیری شود؟",
    options: [
      "بلافاصله پس از رانندگی در بزرگراه",
      "زمانی که لاستیک‌ها کاملاً خنک و سرد هستند",
      "در وسط روز و زیر تابش آفتاب",
      "فقط در زمان پنچرگیری"
    ],
    correctIndex: 1,
    explanation: "فشار باد تایرها همیشه باید زمانی بررسی شود که خودرو حرکت نکرده و لاستیک‌ها سرد باشند.",
    category: "فنی"
  },
  {
    id: 6,
    question: "کدام گروه از اتباع خارجی مجاز به دریافت گواهینامه رانندگی در ایران هستند؟",
    options: [
      "تمام افراد حتی افراد غیرمجاز",
      "اتباع دارای اقامت قانونی معتبر، کارت آمایش دارای مجوز، گذرنامه اقامتی، دانشجویان و طلاب رسمی",
      "صرفاً کسانی که گواهینامه کشور خود را داشته باشند",
      "هیچ کدام از اتباع مجاز نیستند"
    ],
    correctIndex: 1,
    explanation: "اتباع خارجی دارای کارت آمایش معتبر، گذرنامه اقامتی دانشجویی یا تجاری معتبر پس از اخذ معرفی‌نامه از اداره امور اتباع می‌توانند در آموزشگاه‌های رانندگی ثبت‌نام کنند.",
    category: "مقررات عمومی"
  },
  {
    id: 7,
    question: "مفهوم رنگ زرد در علائم راهنمایی و رانندگی چیست؟",
    options: [
      "علامت راهنما و مسیر گردشگری",
      "هشدارهای عمومی و احتیاط و لزوم توجه به خطرات احتمالی",
      "دستورات اکید و ممنوعیت‌ها",
      "خدمات و جایگاه‌های سوخت"
    ],
    correctIndex: 1,
    explanation: "رنگ زرد در تابلوها هشدارهای عمومی و نیاز به احتیاط بیشتر را نشان می‌دهد.",
    category: "تابلوها"
  },
  {
    id: 8,
    question: "در هنگام ترمزگیری شدید، سیستم ترمز ضد قفل (ABS) چه کمکی به راننده می‌کند؟",
    options: [
      "باعث قفل شدن سریع چرخ‌ها می‌شود.",
      "از قفل شدن چرخ‌ها جلوگیری کرده و امکان هدایت و فرمان‌پذیری خودرو را حفظ می‌کند.",
      "بنزین کمتری مصرف می‌کند.",
      "موجب افزایش شتاب خودرو می‌گردد."
    ],
    correctIndex: 1,
    explanation: "ترمز ABS با جلوگیری از قفل شدن چرخ‌ها، امکان کنترل فرمان خودرو را حین ترمز شدید فراهم می‌سازد.",
    category: "فنی"
  }
];

export default function DrivingQuizModal({ isOpen, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSubmitted]);

  if (!isOpen) return null;

  const currentQ = QUESTIONS[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: index
    });
  };

  const calculateScore = () => {
    let correct = 0;
    QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const score = calculateScore();
  const isPassed = score >= Math.ceil(QUESTIONS.length * 0.85); // 85% passing grade

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setTimeLeft(1200);
  };

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
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Car size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                شبیه‌ساز و آزمون آنلاین آیین‌نامه رانندگی
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                بانک رسمی سوالات استاندارد راهنمایی و رانندگی، حق تقدم و تابلوها ویژه متقاضیان گواهینامه
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

        {/* Test Control & Timer Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">سوال:</span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono">
              {currentIndex + 1} از {QUESTIONS.length}
            </span>
            <span className="hidden sm:inline px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-[10px] text-gray-700 dark:text-gray-300">
              {currentQ.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono font-black">
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {!isSubmitted ? (
              <button
                onClick={() => setIsSubmitted(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs"
              >
                ثبت و تصحیح آزمون
              </button>
            ) : (
              <button
                onClick={handleRestart}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <RotateCcw size={14} />
                <span>آزمون مجدد</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700 dark:text-gray-300">
          {/* Result Card if submitted */}
          {isSubmitted && (
            <div
              className={`p-5 rounded-2xl border ${
                isPassed
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center shrink-0">
                  <Award size={28} />
                </div>
                <div>
                  <h4 className="font-black text-base">
                    {isPassed ? "تبریک! شما در آزمون قبول شدید 🎉" : "متاسفانه مردود شدید! تلاش مجدد فرمایید"}
                  </h4>
                  <p className="text-xs mt-1">
                    تعداد پاسخ‌های صحیح: <b>{score}</b> از <b>{QUESTIONS.length}</b> (حد نصاب قبولی: حداقل ۸۵٪)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
              سوال شماره {currentIndex + 1}:
            </span>
            <h4 className="font-black text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h4>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              const isCorrect = currentQ.correctIndex === idx;

              let optionStyle =
                "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 hover:border-blue-400";
              if (isSelected && !isSubmitted) {
                optionStyle = "bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-900 dark:text-blue-100 font-bold";
              }
              if (isSubmitted) {
                if (isCorrect) {
                  optionStyle = "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-100 font-bold";
                } else if (isSelected && !isCorrect) {
                  optionStyle = "bg-rose-50 dark:bg-rose-950/50 border-rose-600 text-rose-900 dark:text-rose-100";
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {option}
                    </span>
                  </div>

                  {isSubmitted && isCorrect && (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <XCircle size={18} className="text-rose-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isSubmitted && (
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-1">
              <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                <Info size={14} /> تحلیل و پاسخ تشریحی:
              </span>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Pagination Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronRight size={16} />
              <span>سوال قبلی</span>
            </button>

            {/* Quick question dots */}
            <div className="hidden sm:flex items-center gap-1">
              {QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all ${
                    currentIndex === idx
                      ? "bg-blue-600 text-white"
                      : selectedAnswers[q.id] !== undefined
                      ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700"
                      : "bg-slate-100 dark:bg-slate-800 text-gray-500"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(QUESTIONS.length - 1, prev + 1))}
              disabled={currentIndex === QUESTIONS.length - 1}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center gap-1 disabled:opacity-40"
            >
              <span>سوال بعدی</span>
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
          >
            <X size={16} />
            <span>بستن پنجره</span>
          </button>
        </div>
      </div>
    </div>
  );
}
