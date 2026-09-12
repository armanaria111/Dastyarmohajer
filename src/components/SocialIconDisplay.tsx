import React from 'react';
import {
  Send,
  MessageSquare,
  MessageCircle,
  Phone,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  Bot,
  Megaphone,
  Radio,
  Share2
} from 'lucide-react';

export interface SocialIconDisplayProps {
  customIconUrl?: string;
  iconType?: string;
  platform?: string;
  className?: string;
  iconSize?: number;
  alt?: string;
  fallbackGradient?: string;
}

export const getSocialIconInfo = (typeOrPlatform?: string) => {
  const norm = (typeOrPlatform || '').toLowerCase().trim();

  if (norm.includes('telegram') || norm.includes('تلگرام')) {
    return {
      name: 'تلگرام',
      bg: 'bg-blue-500',
      gradient: 'from-blue-500 to-sky-600',
      text: 'text-white',
      icon: Send,
    };
  }
  if (norm.includes('bale') || norm.includes('بله')) {
    return {
      name: 'بله',
      bg: 'bg-emerald-600',
      gradient: 'from-emerald-600 to-teal-600',
      text: 'text-white',
      icon: MessageCircle,
    };
  }
  if (norm.includes('eitaa') || norm.includes('ایتا')) {
    return {
      name: 'ایتا',
      bg: 'bg-amber-600',
      gradient: 'from-amber-600 to-orange-600',
      text: 'text-white',
      icon: MessageSquare,
    };
  }
  if (norm.includes('rubika') || norm.includes('روبیکا')) {
    return {
      name: 'روبیکا',
      bg: 'bg-purple-600',
      gradient: 'from-purple-600 to-violet-700',
      text: 'text-white',
      icon: MessageSquare,
    };
  }
  if (norm.includes('whatsapp') || norm.includes('واتساپ')) {
    return {
      name: 'واتساپ',
      bg: 'bg-green-600',
      gradient: 'from-green-500 to-emerald-600',
      text: 'text-white',
      icon: Phone,
    };
  }
  if (norm.includes('instagram') || norm.includes('اینستاگرام')) {
    return {
      name: 'اینستاگرام',
      bg: 'bg-pink-600',
      gradient: 'from-purple-600 via-pink-600 to-amber-500',
      text: 'text-white',
      icon: Instagram,
    };
  }
  if (norm.includes('youtube') || norm.includes('یوتیوب')) {
    return {
      name: 'یوتیوب',
      bg: 'bg-red-600',
      gradient: 'from-red-600 to-rose-700',
      text: 'text-white',
      icon: Youtube,
    };
  }
  if (norm.includes('soroush') || norm.includes('سروش')) {
    return {
      name: 'سروش پلاس',
      bg: 'bg-cyan-600',
      gradient: 'from-cyan-600 to-blue-600',
      text: 'text-white',
      icon: MessageSquare,
    };
  }
  if (norm.includes('gap') || norm.includes('گپ')) {
    return {
      name: 'گپ',
      bg: 'bg-sky-600',
      gradient: 'from-sky-600 to-indigo-700',
      text: 'text-white',
      icon: MessageCircle,
    };
  }
  if (norm.includes('igap') || norm.includes('آی‌گپ') || norm.includes('ایگپ')) {
    return {
      name: 'آی‌گپ',
      bg: 'bg-indigo-600',
      gradient: 'from-indigo-600 to-blue-700',
      text: 'text-white',
      icon: MessageSquare,
    };
  }
  if (norm.includes('twitter') || norm.includes('توییتر') || norm === 'x') {
    return {
      name: 'ایکس / توییتر',
      bg: 'bg-slate-900',
      gradient: 'from-slate-900 to-black',
      text: 'text-white',
      icon: Twitter,
    };
  }
  if (norm.includes('website') || norm.includes('وب‌سایت') || norm.includes('سایت')) {
    return {
      name: 'وب‌سایت',
      bg: 'bg-blue-600',
      gradient: 'from-blue-600 to-indigo-600',
      text: 'text-white',
      icon: Globe,
    };
  }

  return {
    name: 'شبکه اجتماعی',
    bg: 'bg-slate-700',
    gradient: 'from-blue-600 to-indigo-700',
    text: 'text-white',
    icon: Share2,
  };
};

export const SocialIconDisplay: React.FC<SocialIconDisplayProps> = ({
  customIconUrl,
  iconType,
  platform,
  className = 'w-12 h-12 rounded-2xl',
  iconSize = 24,
  alt = 'آیکون شبکه اجتماعی',
  fallbackGradient,
}) => {
  const iconInfo = getSocialIconInfo(iconType || platform);
  const IconComponent = iconInfo.icon;
  const gradientClass = fallbackGradient || iconInfo.gradient;

  if (customIconUrl && customIconUrl.trim().length > 0) {
    return (
      <div
        className={`relative overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md ${className}`}
      >
        <img
          src={customIconUrl}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If image fails to load, fallback to vector icon
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-tr ${gradientClass} ${iconInfo.text} shadow-md ${className}`}
    >
      <IconComponent size={iconSize} className="shrink-0" />
    </div>
  );
};
