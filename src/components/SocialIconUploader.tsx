import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  Link2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { SocialIconDisplay, getSocialIconInfo } from './SocialIconDisplay';

export interface SocialIconUploaderProps {
  label?: string;
  customIconUrl?: string;
  iconType?: string;
  platform?: string;
  onCustomIconChange: (url: string | undefined) => void;
  onIconTypeChange?: (type: string) => void;
  suggestedPresets?: Array<{ id: string; name: string }>;
}

const PRESET_PLATFORMS = [
  { id: 'telegram', name: 'تلگرام' },
  { id: 'bale', name: 'بله' },
  { id: 'eitaa', name: 'ایتا' },
  { id: 'rubika', name: 'روبیکا' },
  { id: 'whatsapp', name: 'واتساپ' },
  { id: 'instagram', name: 'اینستاگرام' },
  { id: 'youtube', name: 'یوتیوب' },
  { id: 'soroush', name: 'سروش' },
  { id: 'gap', name: 'گپ' },
  { id: 'igap', name: 'آی‌گپ' },
  { id: 'twitter', name: 'ایکس (توییتر)' },
  { id: 'website', name: 'وب‌سایت' },
];

export const SocialIconUploader: React.FC<SocialIconUploaderProps> = ({
  label = 'آیکون یا لوگوی شبکه اجتماعی',
  customIconUrl,
  iconType = 'telegram',
  platform,
  onCustomIconChange,
  onIconTypeChange,
  suggestedPresets = PRESET_PLATFORMS,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and optimize image client-side to keep under ~25KB
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری معتبر (PNG, JPG, SVG, WebP) انتخاب فرمایید.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          onCustomIconChange(dataUrl);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        setIsProcessing(false);
        alert('خطا در خواندن فایل تصویر.');
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert('خطا در بارگذاری تصویر.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onCustomIconChange(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveIcon = () => {
    onCustomIconChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasCustom = !!(customIconUrl && customIconUrl.trim().length > 0);

  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 text-right">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <ImageIcon size={15} className="text-blue-600 dark:text-blue-400" />
          <span>{label}</span>
        </label>
        {hasCustom ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            تصویر اختصاصی آپلود شده
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            آیکون پیش‌فرض سیستم
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Preview Box */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <SocialIconDisplay
            customIconUrl={customIconUrl}
            iconType={iconType}
            platform={platform}
            className="w-14 h-14 rounded-2xl ring-2 ring-blue-500/20 shadow-md"
            iconSize={26}
          />
          <span className="text-[10px] text-slate-400 font-medium">پیش‌نمایش</span>
        </div>

        {/* Upload / Action Area */}
        <div className="flex-1 w-full space-y-2">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-3 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {isProcessing ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-blue-600" />
                  <span>در حال بهینه‌سازی و ذخیره تصویر...</span>
                </>
              ) : (
                <>
                  <Upload size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>برای آپلود لوگو کلیک کنید یا عکس را اینجا بکشید</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              فرمت‌های PNG، JPG، SVG و WebP (تغییر سایز و بهینه‌سازی خودکار)
            </p>
          </div>

          {/* Buttons: URL input & Remove */}
          <div className="flex items-center gap-2 justify-between flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Link2 size={13} />
                <span>{showUrlInput ? 'بستن ورودی لینک' : 'ورود آدرس اینترنتی (URL) عکس'}</span>
              </button>
            </div>

            {hasCustom && (
              <button
                type="button"
                onClick={handleRemoveIcon}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700"
                title="حذف تصویر آپلودی و بازگشت به حالت پیش‌فرض"
              >
                <Trash2 size={13} />
                <span>حذف آیکون اختصاصی</span>
              </button>
            )}
          </div>

          {/* URL Input Form */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-mono text-slate-900 dark:text-white"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
              >
                <Check size={13} />
                <span>ثبت لینک</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preset Platform Selector (if user wants to select a known platform icon) */}
      {onIconTypeChange && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            یا انتخاب نوع پلتفرم (آیکون سیستم):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPresets.map((preset) => {
              const isSelected = (iconType || '').toLowerCase() === preset.id.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onIconTypeChange(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check size={11} />}
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
