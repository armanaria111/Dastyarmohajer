import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  label?: string;
  sublabel?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
  autoClearAfterSend?: boolean;
  onAutoClearToggle?: (enabled: boolean) => void;
  maxDimension?: number; // e.g. 1024
}

export default function ImageUploader({
  label = "آپلود تصویر / پوستر",
  sublabel = "فایل را بکشید و رها کنید یا کلیک کنید (کم‌حجم‌سازی خودکار)",
  value,
  onChange,
  onClear,
  autoClearAfterSend = true,
  onAutoClearToggle,
  maxDimension = 1024,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndSet = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("لطفاً فقط فایل تصویری (JPG, PNG, WEBP) انتخاب نمایید.");
      return;
    }

    setIsCompressing(true);
    const originalSizeKb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress as JPEG 0.75 to save space
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          const compressedSizeKb = Math.round((compressedDataUrl.length * 0.75) / 1024);

          setFileInfo({
            name: file.name,
            size: `${originalSizeKb}KB ➔ ${compressedSizeKb}KB (بهینه‌شده)`,
          });
          onChange(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        setIsCompressing(false);
        alert("خطا در بارگذاری تصویر");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      compressAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      compressAndSet(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {onAutoClearToggle && (
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoClearAfterSend}
              onChange={(e) => onAutoClearToggle(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>پاک‌سازی خودکار بعد از ارسال (صرفه‌جویی فضا)</span>
          </label>
        )}
      </div>

      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-gray-50/50 dark:bg-gray-800/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-1.5 py-2">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              {isCompressing ? <Sparkles size={20} className="animate-spin" /> : <Upload size={20} />}
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {isCompressing ? "درحال فشرده‌سازی و بهینه‌سازی تصویر..." : sublabel}
            </p>
            <p className="text-[10px] text-gray-400">
              فرمت‌های مجاز: JPG, PNG, WEBP (حجم به صورت خودکار بهینه می‌شود)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative border border-gray-200 dark:border-gray-700 rounded-2xl p-2.5 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={value}
              alt="پوستر پیوست شده"
              className="w-14 h-14 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block truncate">
                {fileInfo?.name || "تصویر پیوست شده"}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono">
                {fileInfo?.size || "آماده ارسال"}
              </span>
              <span className="text-[10px] text-gray-400 block">
                {autoClearAfterSend ? "✓ پس از انتشار از حافظه موقت پاک می‌شود" : "در فرم باقی می‌ماند"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="حذف تصویر"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
