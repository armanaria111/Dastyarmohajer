import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { db } from "../firebase";

export interface ChannelLockConfig {
  enabled: boolean;
  channelName: string;
  channelUsername: string;
  channelUrl: string;
  lockMessage?: string;
  customIconUrl?: string; // Uploaded custom channel logo/icon
}

export const DEFAULT_CHANNEL_LOCKS: Record<string, ChannelLockConfig> = {
  telegram: {
    enabled: false,
    channelName: "کانال رسمی اطلاع‌رسانی مهاجرین (تلگرام)",
    channelUsername: "@mohajer_news_official",
    channelUrl: "https://t.me/mohajer_news_official",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال رسمی تلگرام الزامی است."
  },
  bale: {
    enabled: false,
    channelName: "کانال رسمی خدمات کنسولی و دفاتر کفالت (بله)",
    channelUsername: "@mohajer_consular",
    channelUrl: "https://ble.ir/mohajer_consular",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال رسمی بله الزامی است."
  },
  eitaa: {
    enabled: false,
    channelName: "کانال رسمی اخبار مهاجرین (ایتا)",
    channelUsername: "@mohajer_khabar",
    channelUrl: "https://eitaa.com/mohajer_khabar",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال رسمی ایتا الزامی است."
  },
  rubika: {
    enabled: false,
    channelName: "کانال مهاجرین در روبیکا",
    channelUsername: "@mohajer_rubika",
    channelUrl: "https://rubika.ir/mohajer_rubika",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال روبیکا الزامی است."
  },
  soroush: {
    enabled: false,
    channelName: "کانال سروش پلاس دستیار مهاجر",
    channelUsername: "@mohajer_srp",
    channelUrl: "https://splus.ir/mohajer_srp",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال سروش الزامی است."
  },
  gap: {
    enabled: false,
    channelName: "کانال گپ دستیار مهاجر",
    channelUsername: "@mohajer_gap",
    channelUrl: "https://gap.im/mohajer_gap",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال گپ الزامی است."
  },
  igap: {
    enabled: false,
    channelName: "کانال آی‌گپ دستیار مهاجر",
    channelUsername: "@mohajer_igap",
    channelUrl: "https://igap.net/mohajer_igap",
    lockMessage: "جهت استفاده از خدمات ربات، عضویت در کانال آی‌گپ الزامی است."
  }
};

const STORAGE_KEY = "dastyar_channel_locks";

export function getChannelLockConfigs(): Record<string, ChannelLockConfig> {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CHANNEL_LOCKS, ...parsed };
      }
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_CHANNEL_LOCKS;
}

export function getPlatformLockConfig(platform: string): ChannelLockConfig {
  const all = getChannelLockConfigs();
  return (
    all[platform] || {
      enabled: false,
      channelName: `کانال رسمی ${platform}`,
      channelUsername: `@mohajer_${platform}`,
      channelUrl: `https://${platform}.com`,
      lockMessage: "عضویت در کانال الزامی است."
    }
  );
}

export function saveChannelLockConfigs(configs: Record<string, ChannelLockConfig>): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    }
  } catch (e) {
    // fallback
  }

  // Sync to Firestore asynchronously
  try {
    setDoc(doc(db, "system_settings", "channel_locks"), configs, { merge: true }).catch(() => {});
  } catch (e) {
    // ignore
  }
}

export async function syncChannelLocksFromCloud(): Promise<Record<string, ChannelLockConfig>> {
  try {
    const snap = await getDoc(doc(db, "system_settings", "channel_locks"));
    if (snap.exists()) {
      const cloudData = snap.data() as Record<string, ChannelLockConfig>;
      const merged = { ...DEFAULT_CHANNEL_LOCKS, ...cloudData };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (e) {
    // silent
  }
  return getChannelLockConfigs();
}
