import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  Upload,
  ZoomIn,
  RotateCw,
  Sun,
  Download,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoStandardizerModal({ isOpen, onClose }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [aspectMode, setAspectMode] = useState<"4x3" | "4x4">("4x3");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadSingle = () => {
    if (!imageSrc) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Standard 4x3 at 300 DPI: 600 x 800 px (or 4x4: 600 x 600 px)
    const targetWidth = 600;
    const targetHeight = aspectMode === "4x3" ? 800 : 600;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw centered
      const aspect = img.width / img.height;
      let drawW = targetWidth;
      let drawH = targetWidth / aspect;
      if (drawH < targetHeight) {
        drawH = targetHeight;
        drawW = targetHeight * aspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const link = document.createElement("a");
      link.download = `photo-${aspectMode}-consular.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    };
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
        className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-800 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">
                استانداردساز و برش‌گر آنلاین عکس پرسنلی ۴×۳
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 line-clamp-1 sm:line-clamp-none">
                تنظیم ابعاد استاندارد پاسپورت و مدارک کفالت، زمینه سفید و انطباق با خطوط بیومتریک کنسولی
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700 dark:text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Preview & Frame (7 cols) */}
            <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 min-h-[350px]">
              {imageSrc ? (
                <div className="relative overflow-hidden border-4 border-white shadow-xl rounded-xl bg-white flex items-center justify-center">
                  <div
                    className={`relative overflow-hidden bg-white ${
                      aspectMode === "4x3" ? "w-[240px] h-[320px]" : "w-[280px] h-[280px]"
                    }`}
                  >
                    <img
                      src={imageSrc}
                      alt="Uploaded"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-75"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`
                      }}
                    />

                    {/* Biometric Guidelines Overlay */}
                    {showGuidelines && (
                      <div className="absolute inset-0 pointer-events-none border border-emerald-500/40">
                        {/* Center vertical */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-dashed border-emerald-400/60" />
                        {/* Eye line (approx 45% from top) */}
                        <div className="absolute left-0 right-0 top-[42%] border-t border-dashed border-emerald-500">
                          <span className="absolute right-1 -top-4 text-[9px] bg-emerald-600 text-white px-1 rounded font-bold">
                            خط چشم‌ها
                          </span>
                        </div>
                        {/* Chin line (approx 78% from top) */}
                        <div className="absolute left-0 right-0 top-[78%] border-t border-dashed border-emerald-500">
                          <span className="absolute right-1 -top-4 text-[9px] bg-emerald-600 text-white px-1 rounded font-bold">
                            خط چانه
                          </span>
                        </div>
                        {/* Head oval silhouette guide */}
                        <div className="absolute top-[12%] left-[18%] right-[18%] bottom-[22%] border-2 border-emerald-400/50 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-sm h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <Upload size={28} />
                  </div>
                  <h4 className="font-black text-sm text-gray-800 dark:text-gray-200">
                    انتخاب یا انداختن عکس پرسنلی
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    تصویر سلفی یا عکس قبلی خود را بارگذاری کنید تا زمینه سفید و ابعاد دقیق اعمال شود
                  </p>
                  <span className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs">
                    انتخاب فایل از دستگاه
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Right Controls (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>تنظیمات و کادربندی</span>
                </h4>

                {/* Aspect ratio */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    سایز استاندارد:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAspectMode("4x3")}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        aspectMode === "4x3"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      ۴×۳ (پاسپورت و کفالت)
                    </button>
                    <button
                      onClick={() => setAspectMode("4x4")}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        aspectMode === "4x4"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      مربع (ویزای آنلاین)
                    </button>
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 mb-1">
                    <span className="flex items-center gap-1">
                      <ZoomIn size={14} /> بزرگ‌نمایی:
                    </span>
                    <span className="font-mono">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Sun size={14} /> روشنایی چهره:
                    </span>
                    <span className="font-mono">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Rotate Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <RotateCw size={14} />
                    <span>چرخش ۹۰ درجه</span>
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                    <input
                      type="checkbox"
                      checked={showGuidelines}
                      onChange={(e) => setShowGuidelines(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>خطوط راهنما</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <button
                    onClick={handleDownloadSingle}
                    disabled={!imageSrc}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={16} />
                    <span>دانلود تک عکس استاندارد</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs transition-all text-center"
                  >
                    {imageSrc ? "تعویض تصویر" : "آپلود تصویر"}
                  </button>
                </div>
              </div>

              {/* Requirement Notes */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info size={14} /> قوانین عکس سفارت و دفاتر کفالت:
                </div>
                <p>• تمام‌رخ و نگاه مستقیم به لنز دوربین بدون عینک آفتابی یا کلاه</p>
                <p>• چهره باید بین ۷۰ تا ۸۰ درصد کادر عمودی عکس را بپوشاند</p>
                <p>• زمینه کاملاً سفید یکدست، بدون سایه شدید در پشت سر</p>
              </div>
            </div>
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
