import { safeStorage } from '../utils/safeStorage';

export interface AppDownloadConfig {
  directApkUrl?: string;
  bazaarUrl?: string;
  myketUrl?: string;
  googlePlayUrl?: string;
  appVersion: string;
  fileSizeMb: string;
  showDirectApkButton: boolean;
  packageId: string;
  sha256Fingerprint: string;
}

export const DEFAULT_APP_DOWNLOAD_CONFIG: AppDownloadConfig = {
  directApkUrl: '',
  bazaarUrl: '',
  myketUrl: '',
  googlePlayUrl: '',
  appVersion: '1.2.0',
  fileSizeMb: '2.8',
  showDirectApkButton: false,
  packageId: 'com.mohajer.assistant',
  sha256Fingerprint: '14:6D:E9:7D:0F:52:AB:FC:A7:EC:48:7B:64:CA:0E:CF:06:5D:2D:BE:0C:08:7A:B4:73:27:0D:37:A6:61:94:E9',
};

const STORAGE_KEY = 'mohajer_app_download_config';

export function getAppDownloadConfig(): AppDownloadConfig {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_DOWNLOAD_CONFIG;
    return { ...DEFAULT_APP_DOWNLOAD_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_DOWNLOAD_CONFIG;
  }
}

export function saveAppDownloadConfig(config: AppDownloadConfig): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save app download config', err);
  }
}
