import React from "react";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  withText?: boolean;
  alt?: string;
}

export default function Logo({
  size = "md",
  className = "",
  withText = false,
  alt = "دستیار مهاجر"
}: LogoProps) {
  const sizeMap = {
    xs: "w-7 h-7",
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-md flex items-center justify-center shrink-0 p-0.5`}
      >
        <img
          src="/logo.png"
          alt={alt}
          className="w-full h-full object-contain rounded-xl"
          loading="eager"
        />
      </div>

      {withText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1 font-black text-sm sm:text-base leading-tight">
            <span className="text-amber-400">دستیار</span>
            <span className="text-teal-400">مهاجر</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">سامانه خدمات کنسولی و دفاتر</span>
        </div>
      )}
    </div>
  );
}
