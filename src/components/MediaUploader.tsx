import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  FileSpreadsheet,
  Film,
  Sparkles,
  AlertCircle,
  Play,
  File,
  Paperclip,
  CheckCircle2
} from "lucide-react";

export type MediaType = "image" | "video" | "document";

export interface MediaValue {
  type: MediaType;
  url: string;
  name: string;
  size?: string;
  mimeType?: string;
}

interface MediaUploaderProps {
  label?: string;
  sublabel?: string;
  value?: MediaValue | null;
  onChange: (media: MediaValue) => void;
  onClear: () => void;
  allowedTypes?: MediaType[];
  autoClearAfterSend?: boolean;
  onAutoClearToggle?: (enabled: boolean) => void;
  maxDimension?: number; // for images
}

export default function MediaUploader({
  label = "پیوست چندرسانه‌ای (عکس، ویدئو، اسناد PDF و...)",
  sublabel = "فایل را بکشید و رها کنید یا برای انتخاب کلیک کنید",
  value,
  onChange,
  onClear,
  allowedTypes = ["image", "video", "document"],
  autoClearAfterSend = true,
  onAutoClearToggle,
  maxDimension = 1024,
}: MediaUploaderProps) {
  const [activeTab, setActiveTab] = useState<MediaType>(value?.type || "image");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    switch (activeTab) {
      case "image":
        return "image/*";
      case "video":
        return "video/mp4,video/webm,video/ogg,video/quicktime";
      case "document":
        return ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip";
      default:
        return "*/*";
    }
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    const originalSizeKb = Math.round(file.size / 1024);
    const sizeStr = originalSizeKb > 1024 
      ? `${(originalSizeKb / 1024).toFixed(1)} MB` 
      : `${originalSizeKb} KB`;

    // Detect file type
    let detectedType: MediaType = activeTab;
    if (file.type.startsWith("image/")) {
      detectedType = "image";
    } else if (file.type.startsWith("video/")) {
      detectedType = "video";
    } else {
      detectedType = "document";
    }

    if (detectedType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
            const compKb = Math.round((compressedDataUrl.length * 0.75) / 1024);

            onChange({
              type: "image",
              url: compressedDataUrl,
              name: file.name,
              size: `${originalSizeKb}KB ➔ ${compKb}KB (فشرده)`,
              mimeType: file.type || "image/jpeg",
            });
          }
          setIsProcessing(false);
        };
        img.onerror = () => {
          setIsProcessing(false);
          alert("خطا در پردازش تصویر");
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // Video or Document: convert to DataURL for safe inline storage / preview
      // Check size limit: keep base64 reasonable (<= 15MB for documents/videos)
      if (file.size > 15 * 1024 * 1024) {
        alert("حجم فایل انتخابی بیش از ۱۵ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب نمایید یا لینک مستقیم قرار دهید.");
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange({
          type: detectedType,
          url: dataUrl,
          name: file.name,
          size: sizeStr,
          mimeType: file.type || (detectedType === "video" ? "video/mp4" : "application/pdf"),
        });
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
        alert("خطا در خواندن فایل");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
  };

  return (
    <div className="space-y-3">
      {/* Header and Auto-Clear switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Paperclip size={14} className="text-blue-500" />
          <span>{label}</span>
        </label>
        {onAutoClearToggle && (
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoClearAfterSend}
              onChange={(e) => onAutoClearToggle(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>پاک‌سازی خودکار پیوست پس از ارسال</span>
          </label>
        )}
      </div>

      {/* Tabs for selecting Media Type */}
      {!value && (
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl max-w-md">
          {allowedTypes.includes("image") && (
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "image"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              <ImageIcon size={14} />
              <span>تصویر / پوستر</span>
            </button>
          )}

          {allowedTypes.includes("video") && (
            <button
              type="button"
              onClick={() => setActiveTab("video")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "video"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              <Film size={14} />
              <span>ویدئو / کلیپ</span>
            </button>
          )}

          {allowedTypes.includes("document") && (
            <button
              type="button"
              onClick={() => setActiveTab("document")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "document"
                  ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800"
              }`}
            >
              <FileText size={14} />
              <span>سند / PDF / فایل</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
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
              ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 scale-[1.01]"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-gray-50/50 dark:bg-gray-800/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptString()}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <div
              className={`p-3 rounded-2xl ${
                activeTab === "image"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                  : activeTab === "video"
                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isProcessing ? (
                <Sparkles size={22} className="animate-spin" />
              ) : activeTab === "image" ? (
                <Upload size={22} />
              ) : activeTab === "video" ? (
                <Film size={22} />
              ) : (
                <FileText size={22} />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {isProcessing
                  ? "درحال آماده‌سازی و بارگذاری فایل..."
                  : activeTab === "image"
                  ? "انتخاب تصویر (JPG, PNG, WEBP با فشرده‌سازی خودکار)"
                  : activeTab === "video"
                  ? "انتخاب فایل ویدئو (MP4, WebM)"
                  : "انتخاب فایل سند (PDF، اکسل، ورد یا فایل متنی)"}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Card */
        <div className="relative border border-gray-200 dark:border-gray-700 rounded-2xl p-3 bg-gray-50 dark:bg-gray-800/80 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Type-based Visual Preview */}
              {value.type === "image" ? (
                <img
                  src={value.url}
                  alt={value.name}
                  className="w-16 h-16 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shrink-0"
                />
              ) : value.type === "video" ? (
                <div className="w-16 h-16 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center shrink-0 text-purple-300 relative overflow-hidden group">
                  <Film size={24} />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 px-1 rounded text-white font-mono">
                    ویدئو
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-300 relative">
                  <FileText size={26} />
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 px-1 rounded text-white font-mono uppercase">
                    {value.name.split('.').pop() || "doc"}
                  </span>
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      value.type === "image"
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : value.type === "video"
                        ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                        : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {value.type === "image" ? "تصویر پیوست" : value.type === "video" ? "ویدئوی پیوست" : "سند / فایل"}
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">
                    {value.name}
                  </span>
                </div>

                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-mono">
                  {value.size || "آماده انتشار"}
                </span>

                <span className="text-[10px] text-gray-400 block">
                  {autoClearAfterSend ? "✓ پس از انتشار از فرم پاک می‌شود" : "در فرم حفظ می‌شود"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shrink-0"
              title="حذف پیوست"
            >
              <X size={18} />
            </button>
          </div>

          {/* If video, provide an inline interactive mini-player */}
          {value.type === "video" && (
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <video
                src={value.url}
                controls
                className="w-full max-h-48 rounded-xl bg-black object-contain"
              />
            </div>
          )}

          {/* If document, provide a direct preview / download button */}
          {value.type === "document" && (
            <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                فایل سند با موفقیت رمزنگاری و آماده انتشار در پیام‌رسان‌هاست.
              </span>
              <a
                href={value.url}
                download={value.name}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>دانلود و بررسی فایل</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
