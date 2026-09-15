export interface EmbassyItem {
  id: string;
  name: string;
  country: string;
  type: "embassy" | "consulate" | "delegation";
  province: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  locationUrl: string;
  workingHours?: string;
  description: string;
  latitude?: number;
  longitude?: number;
}

export const INITIAL_EMBASSIES: EmbassyItem[] = [
  {
    id: "emb-afg-tehran",
    name: "سفارت کبرای جمهوری اسلامی افغانستان در تهران",
    country: "افغانستان",
    type: "embassy",
    province: "تهران",
    city: "تهران",
    address: "تهران، خیابان دکتر بهشتی، خیابان پاکستان، نبش کوچه چهارم، پلاک ۲",
    phone: "021-88737048",
    website: "https://iran.mfa.af",
    locationUrl: "https://maps.google.com/?q=35.7335,51.4172",
    latitude: 35.7335,
    longitude: 51.4172,
    workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه تعطیل",
    description: "انجام کلیه خدمات صدور و تمدید پاسپورت ۵ ساله ماشین‌خوان الکترونیک، تثبیت هویت، نوبت‌دهی تذکره الکترونیک، امور دانشجویی، صدور وکالت‌نامه‌های ملکی و اداری، و برگه خروج و بازگشت."
  },
  {
    id: "emb-afg-mashhad",
    name: "سرکنسولگری جمهوری اسلامی افغانستان در مشهد",
    country: "افغانستان",
    type: "consulate",
    province: "خراسان رضوی",
    city: "مشهد",
    address: "مشهد مقدس، میدان امام خمینی (ره)، خیابان پاسداران، جنب اداره کل شیلات، پلاک ۶۰",
    phone: "051-38597010",
    website: "https://mashhad.mfa.af",
    locationUrl: "https://maps.google.com/?q=36.2895,59.6015",
    latitude: 36.2895,
    longitude: 59.6015,
    workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰ | پنج‌شنبه ۸:۰۰ الی ۱۲:۰۰",
    description: "ارائه خدمات کنسولی به مهاجرین و دانشجویان مقیم استان‌های خراسان رضوی، شمالی و جنوبی؛ صدور تذکره، پاسپورت، تثبیت هویت، وکالت‌نامه رسمی و امور سجلی."
  },
  {
    id: "emb-afg-zahedan",
    name: "سرکنسولگری جمهوری اسلامی افغانستان در زاهدان",
    country: "افغانستان",
    type: "consulate",
    province: "سیستان و بلوچستان",
    city: "زاهدان",
    address: "زاهدان، خیابان خیام، نبش خیام ۲۰، پلاک ۴۲",
    phone: "054-33230400",
    website: "https://zahedan.mfa.af",
    locationUrl: "https://maps.google.com/?q=29.4963,60.8629",
    latitude: 29.4963,
    longitude: 60.8629,
    workingHours: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۴:۳۰ | پنج‌شنبه تعطیل",
    description: "امور کنسولی، تایید اسناد و اوراق هویتی برای مهاجرین و اتباع محترم مقیم استان‌های سیستان و بلوچستان، کرمان، هرمزگان و یزد."
  },
  {
    id: "emb-pak-tehran",
    name: "سفارت جمهوری اسلامی پاکستان در تهران (بخش ویزا و کنسولی)",
    country: "پاکستان",
    type: "embassy",
    province: "تهران",
    city: "تهران",
    address: "تهران، خیابان دکتر فاطمی غربی، خیابان شهید اعتمادزاده، پلاک ۱",
    phone: "021-66941488",
    website: "https://mofa.gov.pk",
    locationUrl: "https://maps.google.com/?q=35.7145,51.3855",
    latitude: 35.7145,
    longitude: 51.3855,
    workingHours: "دوشنبه تا جمعه ۹:۰۰ الی ۱۶:۰۰",
    description: "صدور انواع روادید سیاحتی، تجاری، ترانزیت مسافری و باری، و تایید مدارک و اسناد هویتی و تحصیلی."
  },
  {
    id: "emb-pak-mashhad",
    name: "سرکنسولگری جمهوری اسلامی پاکستان در مشهد",
    country: "پاکستان",
    type: "consulate",
    province: "خراسان رضوی",
    city: "مشهد",
    address: "مشهد، خیابان ارگ، خیابان شهید چمران، بین چمران ۶ و ۸",
    phone: "051-32229845",
    website: "https://mofa.gov.pk",
    locationUrl: "https://maps.google.com/?q=36.2912,59.6104",
    latitude: 36.2912,
    longitude: 59.6104,
    workingHours: "دوشنبه تا جمعه ۹:۰۰ الی ۱۵:۰۰",
    description: "ارائه خدمات روادید زیارتی، تحصیلی و بازرگانی و رسیدگی به امور اتباع و زائرین."
  },
  {
    id: "emb-pak-zahedan",
    name: "سرکنسولگری جمهوری اسلامی پاکستان در زاهدان",
    country: "پاکستان",
    type: "consulate",
    province: "سیستان و بلوچستان",
    city: "زاهدان",
    address: "زاهدان، بلوار جمهوری اسلامی، نبش بلوار دانشجو",
    phone: "054-33443312",
    website: "https://mofa.gov.pk",
    locationUrl: "https://maps.google.com/?q=29.4795,60.8492",
    latitude: 29.4795,
    longitude: 60.8492,
    workingHours: "دوشنبه تا جمعه ۹:۰۰ الی ۱۵:۰۰",
    description: "امور تردد مرزی، صدور ویزای تردد به پاکستان و تایید گواهی‌های مسافرتی."
  },
  {
    id: "emb-irq-tehran",
    name: "سفارت جمهوری عراق در تهران (بخش کنسولی)",
    country: "عراق",
    type: "embassy",
    province: "تهران",
    city: "تهران",
    address: "تهران، خیابان ولیعصر (عج)، بالاتر از میدان ولیعصر، کوچه شهید فخاری، پلاک ۲۴",
    phone: "021-88938865",
    website: "https://mofa.gov.iq",
    locationUrl: "https://maps.google.com/?q=35.7198,51.4082",
    latitude: 35.7198,
    longitude: 51.4082,
    workingHours: "یکشنبه تا پنج‌شنبه ۸:۳۰ الی ۱۵:۳۰",
    description: "صدور روادید زیارتی عتبات عالیات، ویزای اربعین، تایید مدارک ثبت ازدواج و امور اتباع و محصلین."
  },
  {
    id: "emb-irq-mashhad",
    name: "سرکنسولگری جمهوری عراق در مشهد",
    country: "عراق",
    type: "consulate",
    province: "خراسان رضوی",
    city: "مشهد",
    address: "مشهد مقدس، بلوار فردوسی، تقاطع بلوار مهدی، پلاک ۲۵",
    phone: "051-37612200",
    website: "https://mofa.gov.iq",
    locationUrl: "https://maps.google.com/?q=36.3142,59.5601",
    latitude: 36.3142,
    longitude: 59.5601,
    workingHours: "یکشنبه تا پنج‌شنبه ۸:۳۰ الی ۱۵:۰۰",
    description: "امور کنسولی، روادید زائرین و تایید مدارک حقوقی و هویتی متقاضیان در شرق کشور."
  }
];
