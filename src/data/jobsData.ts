export interface JobPosting {
  id: string;
  title: string;
  category: "تولیدی و کارگاهی" | "خیاطی و پوشاک" | "کشاورزی و گلخانه" | "ساختمانی و فنی" | "خدماتی و رستوران" | "سایر";
  province: string;
  city: string;
  salary: string;
  hasAccommodation: boolean; // جای خواب
  hasFood: boolean; // غذا
  requiresWorkPermit: boolean; // نیازمند پروانه کار
  description: string;
  employerName: string;
  contactPhone: string;
  datePosted: string;
  status: "active" | "filled";
}

export const INITIAL_JOBS: JobPosting[] = [
  {
    id: "job-1",
    title: "استادکار خیاط و چرخکار ماهر (راسته‌دوز و میان‌دوز)",
    category: "خیاطی و پوشاک",
    province: "تهران",
    city: "تهران (بازار بزرگ / خیام)",
    salary: "۲۵ تا ۳۵ میلیون تومان (کارمزدی + تسویه هفتگی)",
    hasAccommodation: true,
    hasFood: false,
    requiresWorkPermit: true,
    description: "کارگاه تولید تریکو و شلوار اسلش با سابقه، نیازمند چرخکار ماهر آقا یا خانم. امکان اسکان در محیط تمیز و کارگری فراهم است.",
    employerName: "تولیدی برادران حیدری",
    contactPhone: "09121112233",
    datePosted: "۱۴۰۳/۰۷/۱۰",
    status: "active"
  },
  {
    id: "job-2",
    title: "کارگر ماهر گلخانه صیفی‌جات و سبزیجات هیدروپونیک",
    category: "کشاورزی و گلخانه",
    province: "البرز",
    city: "کرج (هشتگرد)",
    salary: "۱۸ تا ۲۲ میلیون تومان (ماهانه)",
    hasAccommodation: true,
    hasFood: true,
    requiresWorkPermit: true,
    description: "مجتمع گلخانه‌ای مدرن نیازمند دو نفر نیروی کار متعهد جهت امور نشاکاری، کوددهی و برداشت. اتاق مسکونی مجهز با آب، برق و گاز مهیاست.",
    employerName: "گلخانه سبز هشتگرد",
    contactPhone: "09192223344",
    datePosted: "۱۴۰۳/۰۷/۰۸",
    status: "active"
  },
  {
    id: "job-3",
    title: "نجار و مونتاژکار MDF و کلاف‌ساز مبلمان",
    category: "تولیدی و کارگاهی",
    province: "تهران",
    city: "شهرری (خاوران - سایت درودگران)",
    salary: "۲۰ تا ۲۸ میلیون تومان",
    hasAccommodation: true,
    hasFood: false,
    requiresWorkPermit: true,
    description: "کارگاه نجاری و ساخت سرویس خواب نیازمند نجار و سنباده‌زن مسلط. بیمه کارگری پس از تمدید پروانه کار، تسویه سر وقت.",
    employerName: "صنایع چوب سلطانی",
    contactPhone: "09353334455",
    datePosted: "۱۴۰۳/۰۷/۰۵",
    status: "active"
  },
  {
    id: "job-4",
    title: "آرماتوربند و قالب‌بند ساختمانی بتنی",
    category: "ساختمانی و فنی",
    province: "خراسان رضوی",
    city: "مشهد (بلوار توس)",
    salary: "روزانه ۹۰۰,۰۰۰ تا ۱,۲۰۰,۰۰۰ تومان",
    hasAccommodation: false,
    hasFood: true,
    requiresWorkPermit: true,
    description: "پروژه انبوه‌سازی مسکونی به تعدادی آرماتوربند باتجربه با کارت اشتغال مجاز نیازمند است. ناهار گرم روزانه بر عهده کارگاه است.",
    employerName: "شرکت ساختمانی افق طوس",
    contactPhone: "09154445566",
    datePosted: "۱۴۰۳/۰۷/۰۳",
    status: "active"
  },
  {
    id: "job-5",
    title: "استادکار سنگ‌بری و برشکار تراورتن و مرمریت",
    category: "تولیدی و کارگاهی",
    province: "اصفهان",
    city: "نجف‌آباد (شهرک صنعتی رضوانشهر)",
    salary: "۲۲ تا ۳۰ میلیون تومان",
    hasAccommodation: true,
    hasFood: true,
    requiresWorkPermit: true,
    description: "کارخانه فرآوری سنگ ساختمانی نیازمند قله‌بر و سنگ‌ساب حرفه‌ای. سوییت کارگری با کلیه امکانات رفاهی داخل مجموعه.",
    employerName: "سنگبری البرز اصفهان",
    contactPhone: "09135556677",
    datePosted: "۱۴۰۳/۰۷/۰۱",
    status: "active"
  },
  {
    id: "job-6",
    title: "کمک‌آشپز و سالن‌کار رستوران سنتی",
    category: "خدماتی و رستوران",
    province: "قم",
    city: "قم (محدوده حرم مطهر)",
    salary: "۱۶ تا ۲۲ میلیون تومان",
    hasAccommodation: true,
    hasFood: true,
    requiresWorkPermit: true,
    description: "رستوران سنتی معتبر جهت شیفت ظهر و شب به کمک‌آشپز افغانستانی مسلط به برنج‌کشی و امور تخته‌کاری با کارت بهداشت معتبر نیازمند است.",
    employerName: "رستوران خادم الرضا",
    contactPhone: "09126667788",
    datePosted: "۱۴۰۳/۰۶/۲۸",
    status: "active"
  }
];

export const AUTHORIZED_PROVINCES = [
  "همه استان‌ها",
  "تهران",
  "البرز",
  "خراسان رضوی",
  "اصفهان",
  "قم",
  "فارس",
  "یزد",
  "کرمان",
  "سمنان",
  "قزوین"
];

export const JOB_CATEGORIES = [
  "همه دسته‌ها",
  "تولیدی و کارگاهی",
  "خیاطی و پوشاک",
  "کشاورزی و گلخانه",
  "ساختمانی و فنی",
  "خدماتی و رستوران",
  "سایر"
];
