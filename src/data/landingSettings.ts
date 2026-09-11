// Configuration and Persistence for Landing Page Bot Links, News Channels, and Admin Credentials
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface BotLinkItem {
  id: string;
  name: string;
  persianName: string;
  iconType: "telegram" | "bale" | "eitaa" | "rubika" | "whatsapp" | "soroush" | "gap";
  url: string;
  username: string;
  description: string;
  isActive: boolean;
  color: string;
}

export interface NewsChannelItem {
  id: string;
  title: string;
  platform: string;
  url: string;
  handle: string;
  description: string;
  badge: string;
}

export interface LandingConfig {
  siteTitle: string;
  siteSubtitle: string;
  announcementText: string;
  botLinks: BotLinkItem[];
  newsChannels: NewsChannelItem[];
}

export interface AdminCredentials {
  username: string;
  passwordHash: string; // Plain or simple hash for local credential check
  updatedAt?: string;
}

// Default Bot Links
export const DEFAULT_BOT_LINKS: BotLinkItem[] = [
  {
    id: "telegram",
    name: "Telegram",
    persianName: "ربات رسمی تلگرام",
    iconType: "telegram",
    url: "https://t.me/DastyarMohajer_bot",
    username: "@DastyarMohajer_bot",
    description: "پاسخگویی خودکار، استعلام آنلاین تذکره و نوبت‌دهی کنسولی در تلگرام",
    isActive: true,
    color: "from-blue-600 to-sky-500",
  },
  {
    id: "bale",
    name: "Bale",
    persianName: "بازوی پیام‌رسان بله",
    iconType: "bale",
    url: "https://ble.ir/dastyar_mohajer_bot",
    username: "@dastyar_mohajer_bot",
    description: "استعلام سریع اسناد، جستجوی نزدیک‌ترین دفاتر کفالت بدون فیلترشکن",
    isActive: true,
    color: "from-emerald-600 to-teal-500",
  },
  {
    id: "eitaa",
    name: "Eitaa",
    persianName: "ربات هوشمند ایتا",
    iconType: "eitaa",
    url: "https://eitaa.com/dastyar_mohajer_bot",
    username: "@dastyar_mohajer_bot",
    description: "پاسخ به سوالات قوانین اقامتی و راهنمای ثبت‌نام مدارس مهاجرین",
    isActive: true,
    color: "from-amber-600 to-orange-500",
  },
  {
    id: "rubika",
    name: "Rubika",
    persianName: "ربات پیام‌رسان روبیکا",
    iconType: "rubika",
    url: "https://rubika.ir/dastyar_mohajer",
    username: "@dastyar_mohajer",
    description: "دسترسی مستقیم برای کاربران روبیکا در سراسر ایران",
    isActive: true,
    color: "from-purple-600 to-violet-500",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    persianName: "پشتیبانی واتساپ",
    iconType: "whatsapp",
    url: "https://wa.me/989000000000",
    username: "+98 900 000 0000",
    description: "ارتباط مستقیم جهت پیگیری موارد خاص و پشتیبانی مراجعین",
    isActive: true,
    color: "from-green-600 to-emerald-500",
  },
];

// Default News Channels
export const DEFAULT_NEWS_CHANNELS: NewsChannelItem[] = [
  {
    id: "tg_news",
    title: "کانال تلگرام اخبار مهاجرین",
    platform: "تلگرام",
    url: "https://t.me/mohajer_news_official",
    handle: "@mohajer_news_official",
    description: "آخرین بخشنامه‌های سازمان ملی مهاجرت، طرح‌های ثبت‌نام و اطلاعیه‌های سفارت",
    badge: "اخبار فوری و رسمی",
  },
  {
    id: "eitaa_news",
    title: "کانال اطلاع‌رسانی ایتا",
    platform: "ایتا",
    url: "https://eitaa.com/mohajer_khabar",
    handle: "@mohajer_khabar",
    description: "جدول هزینه‌های خدمات کنسولی، زمان‌بندی تمدید برگه سرشماری و کارت هوشمند",
    badge: "اطلاعیه‌های اقامتی",
  },
  {
    id: "bale_news",
    title: "کانال اخبار کنسولگری در بله",
    platform: "بله",
    url: "https://ble.ir/mohajer_consular",
    handle: "@mohajer_consular",
    description: "لیست روزانه تذکره‌های چاپ‌شده، نوبت‌های تایید مدارک و پیگیری گذرنامه‌ها",
    badge: "کنسولی و تذکره",
  },
];

// -------------------------------------------------------------
// Admin Credentials Management
// -------------------------------------------------------------
const STORAGE_KEY_ADMIN = "custom_admin_creds";
const STORAGE_KEY_LANDING = "landing_page_config";

export function getStoredAdminCredentials(): { username: string; password: string } {
  if (typeof window === "undefined") {
    return { username: "admin", password: "admin" };
  }
  const raw = localStorage.getItem(STORAGE_KEY_ADMIN);
  if (!raw) {
    return { username: "admin", password: "admin" };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      username: parsed.username || "admin",
      password: parsed.password || "admin",
    };
  } catch {
    return { username: "admin", password: "admin" };
  }
}

export function saveAdminCredentials(username: string, password: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEY_ADMIN,
      JSON.stringify({
        username: username.trim(),
        password: password.trim(),
        updatedAt: new Date().toISOString(),
      })
    );
  }

  // Also sync to Firestore (async, non-blocking)
  try {
    const ref = doc(db, "system_settings", "admin_account");
    setDoc(ref, {
      username: username.trim(),
      password: password.trim(),
      updatedAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  } catch {
    // Ignore offline errors
  }
}

// -------------------------------------------------------------
// Landing Page Configuration Management
// -------------------------------------------------------------

export function getLandingConfig(): LandingConfig {
  const defaultConfig: LandingConfig = {
    siteTitle: "سامانه جامع دستیار مهاجر",
    siteSubtitle: "راهنمای هوشمند خدمات کنسولی، دفاتر کفالت و استعلام آنلاین تذکره",
    announcementText: "لیست جدید تذکره‌های چاپ‌شده منتهی به شهریور ماه در سامانه بارگذاری و قابل جستجو گردید.",
    botLinks: DEFAULT_BOT_LINKS,
    newsChannels: DEFAULT_NEWS_CHANNELS,
  };

  if (typeof window === "undefined") {
    return defaultConfig;
  }

  const raw = localStorage.getItem(STORAGE_KEY_LANDING);
  if (!raw) {
    return defaultConfig;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
      botLinks: Array.isArray(parsed.botLinks) && parsed.botLinks.length > 0 ? parsed.botLinks : DEFAULT_BOT_LINKS,
      newsChannels: Array.isArray(parsed.newsChannels) && parsed.newsChannels.length > 0 ? parsed.newsChannels : DEFAULT_NEWS_CHANNELS,
    };
  } catch {
    return defaultConfig;
  }
}

export function saveLandingConfig(config: LandingConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_LANDING, JSON.stringify(config));
  }

  // Also sync to Firestore
  try {
    const ref = doc(db, "system_settings", "landing_page");
    setDoc(ref, config, { merge: true }).catch(() => {});
  } catch {
    // Ignore offline errors
  }
}

// Async loader to fetch fresh config from Firestore if available
export async function syncLandingConfigFromCloud(): Promise<LandingConfig> {
  const local = getLandingConfig();
  try {
    const ref = doc(db, "system_settings", "landing_page");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as LandingConfig;
      saveLandingConfig(data);
      return data;
    }
  } catch {
    // Return local if network is unavailable
  }
  return local;
}

export async function syncAdminCredsFromCloud(): Promise<{ username: string; password: string }> {
  const local = getStoredAdminCredentials();
  try {
    const ref = doc(db, "system_settings", "admin_account");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data.username && data.password) {
        saveAdminCredentials(data.username, data.password);
        return { username: data.username, password: data.password };
      }
    }
  } catch {
    // Return local
  }
  return local;
}
