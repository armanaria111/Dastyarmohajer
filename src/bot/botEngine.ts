import { collection, getDocs, addDoc, doc, setDoc, Timestamp, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { getPlatformLockConfig } from "../data/channelLockSettings";
import { INITIAL_TAZKIRAS, TazkiraRecord } from "../data/initialTazkiras";
import { INITIAL_JOBS } from "../data/jobsData";
import { INITIAL_EMBASSIES } from "../data/initialEmbassies";

export interface BotResponse {
  replyText: string;
  keyboard: string[][];
  sessionState?: Record<string, any>;
}

export interface BotContext {
  platform: string;
  userId: string;
  userName?: string;
  text: string;
  sessionState?: Record<string, any>;
}

export const MAIN_KEYBOARD = [
  ["📄 استعلام تذکره‌های چاپ‌شده", "🤖 مشاور هوشمند اقامتی (AI)"],
  ["⏰ یادآور انقضای مدارک (پیامک)", "💼 کاریابی و استخدام اتباع"],
  ["📅 مبدل تاریخ و سن تذکره", "🚗 آزمون آیین‌نامه رانندگی"],
  ["🏢 جستجوی دفاتر کفالت", "🏛 سفارت‌ها و کنسولگری‌ها"],
  ["💰 محاسبه‌گر هزینه‌ها و تعرفه‌ها", "📋 فرم‌ساز اسناد کنسولی"],
  ["📷 استاندارد عکس ۴×۳", "🪪 اسناد و مدارک مفقودی"],
  ["🎓 راهنمای مدارس اتباع", "🗺 مسیریابی دفاتر (نشان و بلد)"],
  ["📢 آخرین اخبار و بخشنامه‌ها", "⭐ نظرسنجی و پشتیبانی"]
];

function formatClickablePhone(phone: string): string {
  if (!phone) return "ثبت نشده";
  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  return `[📞 تماس مستقیم: ${phone}](tel:${cleanPhone})`;
}

export async function processBotMessage(ctx: BotContext): Promise<BotResponse> {
  const text = (ctx.text || "").trim();
  const state = ctx.sessionState || {};

  // Track visit / interaction & bot member in real-time
  try {
    addDoc(collection(db, "analytics"), {
      platform: ctx.platform,
      senderId: ctx.userId,
      event: "message_received",
      textPreview: text.slice(0, 50),
      timestamp: Timestamp.now()
    }).catch(() => {});

    if (ctx.userId && ctx.userId !== "unknown") {
      setDoc(doc(db, "bot_users", `${ctx.platform}_${ctx.userId}`), {
        userId: ctx.userId,
        userName: ctx.userName || "کاربر پیام‌رسان",
        platform: ctx.platform,
        lastActive: Timestamp.now(),
        joinedAt: Timestamp.now()
      }, { merge: true }).catch(() => {});
    }
  } catch (e) {
    // silent
  }

  // -------------------------------------------------------------
  // Mandatory Channel Membership Verification (قفل عضویت اجباری کانال)
  // -------------------------------------------------------------
  const lockConfig = getPlatformLockConfig(ctx.platform);
  const isForceJoinActive = lockConfig && lockConfig.enabled;
  const isUserVerified = state.channelMemberVerified === true;

  // 1. User taps "✅ بررسی و تایید عضویت"
  if (
    text === "✅ بررسی و تایید عضویت" ||
    text === "✅ تایید عضویت در کانال" ||
    text === "تایید عضویت" ||
    text === "عضو شدم" ||
    text === "بررسی مجدد"
  ) {
    return {
      replyText: `✅ **عضویت شما در «${lockConfig.channelName}» با موفقیت تایید گردید!** 🌸\n\nاکنون به تمام امکانات استعلام دفاتر کفالت، سفارت‌ها، ثبت نوبت و رهگیری اسناد دسترسی دارید.\n\n👇 لطفاً خدمت مورد نظر را از منوی زیر انتخاب نمایید:`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { ...state, channelMemberVerified: true, step: "idle" }
    };
  }

  // 2. User taps channel link button
  if (text.startsWith("📢 عضویت در کانال") || text === "لینک کانال" || text === "کانال رسمی") {
    return {
      replyText: `📢 **لینک مستقیم عضویت در کانال رسمی:**\n\n🔹 **نام کانال:** ${lockConfig.channelName}\n🔹 **شناسه کاربری:** ${lockConfig.channelUsername}\n🔗 **لینک ورود به کانال:** [برای عضویت اینجا کلیک کنید](${lockConfig.channelUrl})\n\n${lockConfig.channelUrl}\n\n👇 پس از پیوستن به کانال، لطفاً دکمه **«✅ بررسی و تایید عضویت»** را انتخاب فرمایید:`,
      keyboard: [
        [`📢 عضویت در کانال ${getPlatformName(ctx.platform)}`],
        ["✅ بررسی و تایید عضویت"]
      ],
      sessionState: { ...state, channelMemberVerified: false }
    };
  }

  // 3. If Force Join is enabled and user hasn't verified yet, lock all bot access
  if (isForceJoinActive && !isUserVerified) {
    return {
      replyText: `⚠️ **توجه: عضویت اجباری در کانال رسمی**\n\nکاربر گرامی، جهت فعال‌سازی ربات و استفاده از خدمات در پیام‌رسان **${getPlatformName(ctx.platform)}**، عضویت در کانال رسمی اطلاع‌رسانی الزامی است:\n\n📢 **نام کانال:** ${lockConfig.channelName}\n🆔 **شناسه کانال:** ${lockConfig.channelUsername}\n🔗 **لینک عضویت:** ${lockConfig.channelUrl}\n\n${lockConfig.lockMessage ? `💬 ${lockConfig.lockMessage}\n\n` : ""}👇 لطفاً ابتدا عضو کانال شده و سپس روی دکمه **«✅ بررسی و تایید عضویت»** کلیک کنید:`,
      keyboard: [
        [`📢 عضویت در کانال ${getPlatformName(ctx.platform)}`],
        ["✅ بررسی و تایید عضویت"]
      ],
      sessionState: { ...state, channelMemberVerified: false }
    };
  }

  // Reset or Start command
  if (text === "/start" || text === "شروع" || text === "منو" || text === "بازگشت به منوی اصلی" || text === "منوی اصلی") {
    return {
      replyText: `سلام! به **دستیار هوشمند خدمات مهاجرین و دفاتر کفالت** در پیام‌رسان ${getPlatformName(ctx.platform)} خوش آمدید. 🌸\n\nاز طریق منوی زیر می‌توانید نزدیک‌ترین دفاتر کفالت، سفارت‌ها، مدارک مفقودی، ثبت نظر و پیگیری نوبت‌ها را انجام دهید:`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  // -------------------------------------------------------------
  // Multi-Step Conversational State Machine
  // -------------------------------------------------------------

  // 1. Tazkira Search Step (استعلام تذکره الکترونیکی چاپ‌شده)
  if (state.step === "awaiting_tazkira_search") {
    return await handleTazkiraSearch(text);
  }

  // 2. AI Advisor Step (مشاور هوشمند اقامتی و حقوقی)
  if (state.step === "awaiting_ai_advisor_question") {
    if (text === "پرسش سوال دیگر از مشاور" || text === "سوال جدید") {
      return {
        replyText: `🤖 **مشاور هوشمند اقامتی و حقوقی:**\n\nلطفاً سوال حقوقی، اقامتی، تحصیلی یا بانکی خود را بنویسید و ارسال کنید:`,
        keyboard: [
          ["شرایط گواهینامه رانندگی مهاجرین", "افتتاح حساب بانکی و کارت عابر"],
          ["نحوه دریافت برگه تردد بین استانی", "خروج و مراجعت به افغانستان"],
          ["بازگشت به منوی اصلی"]
        ],
        sessionState: { step: "awaiting_ai_advisor_question" }
      };
    }
    return await handleAiAdvisorQuestion(text);
  }

  // 3. Fee Calculator Steps (محاسبه‌گر هزینه‌ها و تعرفه‌ها)
  if (state.step === "awaiting_fee_calc_menu") {
    return await handleFeeCalculator(text);
  }

  if (state.step === "awaiting_family_count") {
    return handleFamilyCountCalculation(text);
  }

  // 4. Consular Form Builder Steps (فرم‌ساز اسناد رسمی)
  if (state.step === "awaiting_form_type") {
    return handleFormTypeSelection(text);
  }

  if (state.step === "awaiting_form_name") {
    return {
      replyText: `نام متقاضی: **${text}** ثبت شد.\n\nاکنون **نام پدر** و **نام پدربزرگ** را ارسال فرمایید (مثال: \`محمد فرزند علی\`):`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { ...state, step: "awaiting_form_father", fullName: text }
    };
  }

  if (state.step === "awaiting_form_father") {
    return {
      replyText: `نسبت خانوادگی: **${text}** ثبت شد.\n\nاکنون **نام ولایت و ولسوالی محل سکونت/تولد** را ارسال فرمایید (مثال: \`هرات، ولسوالی گذره\` یا \`کابل\`):`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { ...state, step: "awaiting_form_province", fatherName: text }
    };
  }

  if (state.step === "awaiting_form_province") {
    return {
      replyText: `ولایت: **${text}** ثبت شد.\n\nاکنون **شماره مدرک شناسایی** (شماره تذکره، شماره پاسپورت یا کد یکتا) را ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { ...state, step: "awaiting_form_doc_num", province: text }
    };
  }

  if (state.step === "awaiting_form_doc_num") {
    return generateOfficialFormText({ ...state, docNumber: text });
  }

  // 5. Education Guide Step (راهنمای ثبت‌نام مدارس)
  if (state.step === "awaiting_education_topic") {
    return handleEducationGuide(text);
  }

  // 6. GPS Routing Step (مسیریابی دفاتر کفالت)
  if (state.step === "awaiting_gps_province") {
    return await handleGpsRouting(text);
  }

  // 7. Kefalat Office Search Step
  if (state.step === "awaiting_branch_search") {
    return await handleKefalatOfficeSearch(text);
  }

  // 8. Embassy Search Step
  if (state.step === "awaiting_embassy_search") {
    return await handleEmbassySearch(text);
  }

  // 9. Tracking Code Step
  if (state.step === "awaiting_tracking_code") {
    return await handleTrackingSearch(text);
  }

  // 10. Online Booking / Registration Flow
  if (state.step === "awaiting_reg_name") {
    return {
      replyText: `نام شما: **${text}** ثبت شد.\n\nاکنون نوع خدمت مورد نیاز خود را ارسال فرمایید (یا از گزینه‌های زیر انتخاب فرمایید):`,
      keyboard: [["نوبت کارت هوشمند و آمایش", "تمدید برگه سرشماری"], ["امور دانشجویی و تحصیلی", "بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_reg_type", applicantName: text }
    };
  }

  if (state.step === "awaiting_reg_type") {
    const applicantName = state.applicantName || "متقاضی محترم";
    const requestType = text;
    return {
      replyText: `خدمت انتخابی: **${requestType}**\n\nلطفاً **شماره تماس همراه** خود را جهت ارسال پیامک نوبت و تماس دفتر کفالت ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_reg_phone", applicantName, requestType }
    };
  }

  if (state.step === "awaiting_reg_phone") {
    const applicantName = state.applicantName || "متقاضی محترم";
    const requestType = state.requestType || "ثبت‌نام عمومی";
    const phone = text;
    const trackingCode = "TRK-" + Math.floor(100000 + Math.random() * 900000);

    try {
      await addDoc(collection(db, "requests"), {
        applicantName,
        requestType,
        phone,
        trackingCode,
        status: "pending",
        platform: ctx.platform,
        userId: ctx.userId,
        createdAt: Timestamp.now()
      });

      return {
        replyText: `✅ **درخواست نوبت شما با موفقیت در سیستم ثبت گردید!**\n\n👤 **متقاضی:** ${applicantName}\n📋 **نوع خدمت:** ${requestType}\n📱 **شماره تماس:** ${phone}\n🔑 **کد رهگیری شما:** \`${trackingCode}\`\n\n📌 لطفاً این کد را یادداشت کنید. وضعیت درخواست شما از بخش «پیگیری وضعیت درخواست» قابل استعلام است.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    } catch (err: any) {
      return {
        replyText: `متاسفانه در ثبت درخواست خطایی رخ داد: ${err.message}`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }
  }

  // 5. Feedback & Survey Flow
  if (state.step === "awaiting_feedback_office") {
    return {
      replyText: `دفتر مورد نظر: **${text}**\n\nلطفاً میزان رضایت خود از رفتار پرسنل، تکریم ارباب‌رجوع و سرعت انجام کار را با امتیاز ستاره انتخاب فرمایید:`,
      keyboard: [
        ["⭐⭐⭐⭐⭐ (عالی - ۵)", "⭐⭐⭐⭐ (خوب - ۴)"],
        ["⭐⭐⭐ (متوسط - ۳)", "⭐⭐ (ضعیف - ۲)"],
        ["⭐ (خیلی ضعیف - ۱)", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_feedback_rating", officeText: text }
    };
  }

  if (state.step === "awaiting_feedback_rating") {
    let rating = 5;
    if (text.includes("۵") || text.includes("عالی")) rating = 5;
    else if (text.includes("۴") || text.includes("خوب")) rating = 4;
    else if (text.includes("۳") || text.includes("متوسط")) rating = 3;
    else if (text.includes("۲") || text.includes("ضعیف")) rating = 2;
    else if (text.includes("۱")) rating = 1;

    return {
      replyText: `امتیاز شما: **${rating} از ۵** ثبت شد.\n\nلطفاً نظر، پیشنهاد، انتقاد یا تجربه خود درباره این دفتر کفالت را بنویسید (یا عدد **۰** را جهت ثبت بدون متن ارسال کنید):`,
      keyboard: [["ثبت بدون متن توضیحات"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_feedback_comment", officeText: state.officeText, rating }
    };
  }

  if (state.step === "awaiting_feedback_comment") {
    const comment = text === "۰" || text.includes("بدون متن") ? "" : text;
    const officeText = state.officeText || "دفتر کفالت";
    const rating = state.rating || 5;

    try {
      await addDoc(collection(db, "office_feedbacks"), {
        officeCode: officeText.replace(/[^0-9]/g, "") || officeText,
        officeName: officeText,
        rating,
        comment,
        userName: ctx.userName || `کاربر ${ctx.platform}`,
        userId: ctx.userId,
        platform: ctx.platform,
        status: "pending",
        createdAt: Timestamp.now()
      });

      return {
        replyText: `🙏 **با تشکر از مشارکت شما!**\n\nنظر و امتیاز شما برای **${officeText}** با موفقیت در سیستم مرکزی ثبت گردید و به منظور ارتقای کیفیت خدمات دفاتر کفالت توسط مدیریت بررسی خواهد شد. 🌟`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    } catch (err: any) {
      return {
        replyText: `خطا در ثبت نظر: ${err.message}`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }
  }

  // 6. Lost & Found Documents Flow
  if (state.step === "awaiting_lost_menu") {
    if (text.includes("جستجو")) {
      return {
        replyText: `🔍 **جستجوی اسناد و مدارک پیدا شده در دفاتر کفالت:**\n\nلطفاً **نام و نام خانوادگی صاحب سند** یا **شماره مدرک (کد یکتا، شماره پاسپورت یا کارت)** را ارسال فرمایید:`,
        keyboard: [["نمایش همه مدارک پیدا شده"], ["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_doc_search" }
      };
    } else if (text.includes("ثبت") || text.includes("گم")) {
      return {
        replyText: `📝 **ثبت مشخصات مدرک گم‌شده جهت اطلاع‌رسانی خودکار:**\n\nنوع مدرک خود را انتخاب یا ارسال فرمایید:`,
        keyboard: [
          ["کارت هوشمند و آمایش", "گذرنامه و پاسپورت"],
          ["برگه سرشماری", "تذکره هویتی"],
          ["کارت بانکی و شناسایی", "بازگشت به منوی اصلی"]
        ],
        sessionState: { step: "awaiting_lost_doc_type" }
      };
    }
  }

  if (state.step === "awaiting_doc_search") {
    return await handleDocSearch(text);
  }

  if (state.step === "awaiting_lost_doc_type") {
    return {
      replyText: `نوع مدرک: **${text}**\n\nلطفاً **نام و نام خانوادگی درج شده روی مدرک** را دقیقاً ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_lost_name", docType: text }
    };
  }

  if (state.step === "awaiting_lost_name") {
    return {
      replyText: `صاحب مدرک: **${text}**\n\nلطفاً **شماره اختصاصی مدرک** (کد یکتا، شماره پاسپورت، یا شماره کارت - در صورت اطلاع) را ارسال فرمایید (یا عدد **۰** اگر به خاطر ندارید):`,
      keyboard: [["شماره مدرک را نمی‌دانم"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_lost_num", docType: state.docType, ownerName: text }
    };
  }

  if (state.step === "awaiting_lost_num") {
    const docNumber = text === "۰" || text.includes("نمی‌دانم") ? "" : text;
    return {
      replyText: `شماره مدرک: **${docNumber || "ندارد"}**\n\nلطفاً **شماره تماس مستقیم** خود را ارسال کنید تا در صورت پیدا شدن مدرک یا تحویل به دفاتر کفالت فوراً با شما تماس گرفته شود:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_lost_phone", docType: state.docType, ownerName: state.ownerName, docNumber }
    };
  }

  if (state.step === "awaiting_lost_phone") {
    const contactPhone = text;
    try {
      await addDoc(collection(db, "lost_document_alerts"), {
        docType: state.docType || "سند هویتی",
        ownerName: state.ownerName || "متقاضی",
        docNumber: state.docNumber || "",
        contactPhone,
        platform: ctx.platform,
        status: "active",
        createdAt: Timestamp.now()
      });

      return {
        replyText: `✅ **مشخصات مدرک مفقودی شما در سامانه تطبیق مرکزی ثبت شد!**\n\n📋 **نوع مدرک:** ${state.docType}\n👤 **نام صاحب مدرک:** ${state.ownerName}\n🔢 **شماره مدرک:** ${state.docNumber || "ثبت نشده"}\n📞 **شماره تماس:** ${contactPhone}\n\n🔔 به محض اینکه مدرکی با این مشخصات توسط دفاتر کفالت یا شهروندان ثبت شود، سیستم فوراً با شما تماس خواهد گرفت یا در همین پیام‌رسان پیام ارسال خواهد کرد.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    } catch (err: any) {
      return {
        replyText: `خطا در ثبت مدرک گم‌شده: ${err.message}`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }
  }

  // 7. Expiry Reminder Flow
  if (state.step === "awaiting_expiry_doc_type") {
    return {
      replyText: `نوع مدرک: **${text}**\n\nلطفاً **تاریخ انقضای مدرک** خود را به صورت شمسی یا میلادی ارسال فرمایید (مثال: \`۱۴۰۳/۱۲/۲۹\` یا \`2025/03/20\`):`,
      keyboard: [["۱۴۰۳/۱۰/۳۰", "۱۴۰۳/۱۲/۲۹"], ["۱۴۰۴/۰۶/۳۱", "بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_expiry_date", docType: text }
    };
  }

  if (state.step === "awaiting_expiry_date") {
    return {
      replyText: `تاریخ انقضا: **${text}** ثبت شد.\n\nلطفاً **شماره موبایل** خود را جهت دریافت پیامک هشدار ۳۰ روز و ۱۰ روز پیش از اتمام اعتبار ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_expiry_phone", docType: state.docType, expiryDate: text }
    };
  }

  if (state.step === "awaiting_expiry_phone") {
    const phone = text;
    try {
      await addDoc(collection(db, "expiry_reminders"), {
        docType: state.docType || "مدرک اقامتی",
        expiryDate: state.expiryDate || "ثبت نشده",
        phone,
        platform: ctx.platform,
        userId: ctx.userId,
        createdAt: Timestamp.now()
      });

      return {
        replyText: `✅ **یادآور تاریخ انقضا با موفقیت فعال شد!**\n\n📋 **نوع مدرک:** ${state.docType}\n📅 **تاریخ انقضا:** ${state.expiryDate}\n📱 **شماره پیامک:** ${phone}\n\n🔔 سامانه ۳۰ روز و ۱۰ روز قبل از تاریخ انقضا، پیامک هشدار به همراه آدرس دفاتر کفالت و لیست مدارک لازم را برای شما ارسال خواهد کرد.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    } catch (err: any) {
      return {
        replyText: `خطا در ثبت یادآور: ${err.message}`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }
  }

  // 8. Date & Age Converter Flow
  if (state.step === "awaiting_date_convert_year") {
    const rawYear = text.replace(/[^0-9]/g, "");
    const yearNum = parseInt(rawYear, 10);
    if (!yearNum || isNaN(yearNum)) {
      return {
        replyText: `⚠️ لطفاً سال تولد یا تاریخ مورد نظر را به عدد وارد فرمایید (مثال: \`1380\` یا \`1365\`):`,
        keyboard: [["۱۳۸۰", "۱۳۷۵"], ["۱۳۸۵", "بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_date_convert_year" }
      };
    }

    let shamsiYear = yearNum;
    let miladiYear = yearNum + 621;
    if (yearNum > 1900) {
      miladiYear = yearNum;
      shamsiYear = yearNum - 621;
    }

    const currentShamsiYear = 1403;
    const age = currentShamsiYear - shamsiYear;
    const isAdult = age >= 18;
    const isSchoolAge = age >= 6 && age <= 18;

    return {
      replyText: `📅 **نتیجه محاسبه سن و تبدیل تاریخ تذکره:**\n\n🔹 **سال خورشیدی (هجری شمسی افغانستان):** ${shamsiYear}\n🔹 **سال میلادی معادل:** ${miladiYear}\n🔹 **سن تخمینی بر اساس تذکره:** ${age} سال\n\n📋 **بررسی ضوابط قانونی و ثبت‌نام:**\n• ${isAdult ? "✅ فرد به **سن قانونی ۱۸ سال** رسیده است (واجد شرایط اخذ پاسپورت مستقل و گواهینامه رانندگی)." : "ℹ️ فرد **زیر ۱۸ سال** است (نیازمند رضایت ولی قانونی/پدر)."}\n• ${isSchoolAge ? "🎒 در **سن مجاز تحصیل در مدارس** (ابتدایی تا متوسطه دوم) قرار دارد." : "🎒 خارج از رده سنی عمومی دبستان و دبیرستان."}`,
      keyboard: [["محاسبه تاریخ دیگر"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "idle" }
    };
  }

  // 9. Driving Quiz Flow
  if (state.step === "awaiting_driving_quiz_answer") {
    const isCorrect = text.includes("گزینه ۲") || text.includes("حق تقدم با وسیله داخل میدان") || text.includes("پاسپورت معتبر با اقامت");
    return {
      replyText: isCorrect
        ? `✅ **پاسخ شما کاملاً صحیح است!** 🌟\n\n💡 **توضیح فنی:** در تمام میادین و تقاطع‌های فاقد چراغ راهنما، حق تقدم عبور با وسیله نقلیه‌ای است که از قبل وارد حریم میدان شده و در حال گردش است.\n\nبرای تمرین ۳۰ سوال کامل و شبیه‌ساز رسمی آیین‌نامه، می‌توانید از بخش «آزمون آیین‌نامه» در صفحه سایت سامانه استفاده فرمایید.`
        : `❌ **پاسخ نادرست است.**\n\n💡 **پاسخ صحیح:** حق تقدم عبور همواره با خودرویی است که داخل میدان در حال حرکت است.\n\nجهت آمادگی کامل برای آزمون کتبی آیین‌نامه اتباع، شبیه‌ساز ۳۰ سواله آزمون را در سایت امتحان کنید.`,
      keyboard: [["سوال بعدی آزمون رانندگی"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "idle" }
    };
  }

  // 10. Job Portal Flow
  if (state.step === "awaiting_job_portal_action") {
    if (text.includes("مشاهده") || text.includes("فرصت") || text.includes("لیست")) {
      return await handleJobPortalList();
    } else if (text.includes("کارفرما") || text.includes("آگهی")) {
      return {
        replyText: `📢 **ثبت آگهی استخدام کارفرما (رایگان):**\n\nلطفاً **عنوان شغل مورد نظر** و مهارت را ارسال فرمایید (مثال: \`استادکار خیاط با جای خواب\` یا \`کارگر گلخانه\`):`,
        keyboard: [["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_job_post_title" }
      };
    } else if (text.includes("کارجو") || text.includes("رزومه")) {
      return {
        replyText: `👤 **ثبت مشخصات و تخصص کارجو:**\n\nلطفاً **مهارت اصلی و تخصص خود** را ارسال فرمایید (مثال: \`چرخکار تریکو\` یا \`جوشکار\` یا \`کارگر ساده\`):`,
        keyboard: [["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_job_seeker_skill" }
      };
    }
  }

  if (state.step === "awaiting_job_post_title") {
    return {
      replyText: `عنوان آگهی: **${text}**\n\nلطفاً **شماره تماس مستقیم کارفرما** جهت درج در آگهی را ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_job_post_phone", jobTitle: text }
    };
  }

  if (state.step === "awaiting_job_post_phone") {
    const contactPhone = text;
    try {
      await addDoc(collection(db, "job_postings"), {
        title: state.jobTitle || "فرصت شغلی مجاز",
        category: "تولیدی و کارگاهی",
        province: "تهران",
        city: "تهران و حومه",
        salary: "توافقی و قانونی",
        hasAccommodation: true,
        hasFood: false,
        requiresWorkPermit: true,
        description: `آگهی ثبت‌شده از طریق ربات پیام‌رسان ${getPlatformName(ctx.platform)}`,
        employerName: "کارفرمای محترم",
        contactPhone,
        datePosted: "امروز",
        status: "active",
        createdAt: Timestamp.now()
      });

      return {
        replyText: `✅ **آگهی استخدام شما با موفقیت ثبت و منتشر گردید!**\n\n💼 **عنوان شغل:** ${state.jobTitle}\n📞 **تلفن تماس:** ${contactPhone}\n\n📌 این آگهی بلافاصله در وب‌سایت و کلیه ربات‌های پیام‌رسان برای کارجویان نمایش داده می‌شود.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    } catch (err: any) {
      return {
        replyText: `خطا در ثبت آگهی: ${err.message}`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }
  }

  if (state.step === "awaiting_job_seeker_skill") {
    return {
      replyText: `مهارت شما: **${text}** ثبت شد.\n\nلطفاً **شماره موبایل** خود را ارسال فرمایید تا کارفرمایان بتوانند جهت همکاری با شما تماس بگیرند:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_job_seeker_phone", skill: text }
    };
  }

  if (state.step === "awaiting_job_seeker_phone") {
    const phone = text;
    try {
      await addDoc(collection(db, "job_seekers"), {
        name: ctx.userName || "کارجوی محترم",
        skill: state.skill || "مهارت فنی",
        phone,
        platform: ctx.platform,
        status: "active",
        createdAt: Timestamp.now()
      });

      return {
        replyText: `✅ **مشخصات شغلی شما در بانک کارجویان مجاز ثبت شد!**\n\n🔧 **مهارت:** ${state.skill}\n📱 **شماره تماس:** ${phone}\n\nکارفرمایان نیازمند نیروی کار در این ردیف شغلی می‌توانند مستقیماً با شما تماس حاصل فرمایند.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    } catch (err: any) {
      return {
        replyText: `خطا در ثبت اطلاعات کارجو: ${err.message}`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }
  }

  // -------------------------------------------------------------
  // Main Menu Keyword Dispatcher
  // -------------------------------------------------------------

  // 1. Tazkira Search Trigger
  if (text.includes("تذکره") || text.includes("چاپ") || text.includes("استعلام تذکره")) {
    return {
      replyText: `📄 **استعلام آنلاین تذکره‌های الکترونیکی چاپ‌شده**\n\nجهت جستجو در میان لیست‌های ارسالی به سفارت و کنسولگری‌ها، لطفاً **نام**، **نام خانوادگی** یا **نام پدر** متقاضی را ارسال فرمایید (مثال: \`احمد جمشیدی\` یا \`قاسمی\`):`,
      keyboard: [["نمایش آخرین تذکره‌های ارسالی"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_tazkira_search" }
    };
  }

  // 2. AI Advisor Trigger
  if (text.includes("مشاور") || text.includes("هوش مصنوعی") || text.includes("حقوقی") || text.includes("اقامتی")) {
    return {
      replyText: `🤖 **مشاور هوش مصنوعی اقامتی و حقوقی مهاجرین**\n\nسلام! من آماده پاسخگویی به سوالات شما در زمینه قوانین مهاجرت، گواهینامه، افتتاح حساب بانکی، کارت کارگری و مدارس هستم.\n\n👇 لطفاً سوال خود را بپرسید یا از موضوعات زیر انتخاب کنید:`,
      keyboard: [
        ["شرایط گواهینامه رانندگی مهاجرین", "افتتاح حساب بانکی و کارت عابر"],
        ["نحوه دریافت برگه تردد بین استانی", "خروج و مراجعت به افغانستان"],
        ["شرایط دریافت کارت هوشمند اتباع", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_ai_advisor_question" }
    };
  }

  // 3. Fee Calculator Trigger
  if (text.includes("محاسبه") || text.includes("تعرفه") || text.includes("هزینه") || text.includes("دلار")) {
    return {
      replyText: `💰 **محاسبه‌گر آنلاین هزینه‌ها و تعرفه‌ها**\n\nلطفاً نوع خدمت را انتخاب فرمایید تا ریز هزینه‌ها، معادل ریالی و مدارک لازم را مشاهده نمایید:`,
      keyboard: [
        ["تمدید پاسپورت ۵ ساله (۱۲۰ دلار)", "پاسپورت ۲ ساله (۲۰ دلار)"],
        ["تثبیت هویت و تذکره سفارت", "هزینه‌های دفتر کفالت و پروانه کار"],
        ["محاسبه کل هزینه‌ها برای خانواده", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_fee_calc_menu" }
    };
  }

  // 4. Consular Forms Trigger
  if (text.includes("فرم") || text.includes("وکالت") || text.includes("استشهاد") || text.includes("رضایت")) {
    return {
      replyText: `📋 **سامانه خودکار فرم‌ساز اسناد رسمی کنسولی**\n\nنوع سندی که می‌خواهید متن رسمی و استاندارد آن برای شما تنظیم شود را انتخاب فرمایید:`,
      keyboard: [
        ["فرم درخواست تثبیت هویت سفارت", "وکالت‌نامه رسمی کاری و اداری"],
        ["استشهاد محلی تایید هویت شرعی", "رضایت‌نامه سفر و خروج ولی قانونی"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_form_type" }
    };
  }

  // 5. Education Guide Trigger
  if (text.includes("مدرسه") || text.includes("مدارس") || text.includes("تحصیل") || text.includes("دانش آموز")) {
    return {
      replyText: `🎓 **راهنمای ثبت‌نام مدارس و امور تحصیلی دانش‌آموزان اتباع**\n\nلطفاً بخش مورد نظر را جهت دریافت راهنمای کامل انتخاب فرمایید:`,
      keyboard: [
        ["ثبت‌نام مدارس با آمایش و پاسپورت", "برگه حمایت تحصیلی فاقدین مدرک"],
        ["نوبت‌گیری سنجش سلامت (my.medu.ir)", "کنکور و ورود به دانشگاه‌ها"],
        ["قوانین شهریه مدارس دولتی", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_education_topic" }
    };
  }

  // 6. GPS Routing Trigger
  if (text.includes("مسیریابی") || text.includes("نشان") || text.includes("بلد") || text.includes("gps") || text.includes("نقشه")) {
    return {
      replyText: `🗺 **مسیریابی مستقیم دفاتر کفالت با برنامه‌های نشان، بلد و نقشه**\n\nلطفاً نام استان محل اقامت خود را انتخاب فرمایید:`,
      keyboard: [
        ["تهران و شهرری", "خراسان رضوی (مشهد)"],
        ["اصفهان", "فارس (شیراز)"],
        ["قم", "البرز (کرج)"],
        ["یزد و کرمان", "سایر استان‌ها"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_gps_province" }
    };
  }

  if (text.includes("کفالت") || text.includes("دفتر") || text.includes("شعب") || text.includes("محله")) {
    return {
      replyText: `🔍 **جستجوی دفاتر خدمات اقامت و اشتغال (دفاتر کفالت)**\n\nلطفاً **کد دفتر کفالت** (مثلاً: \`101\`) یا **نام استان/شهر/محله** (مثلاً: \`شهرری\`، \`تهران\`، \`گلشهر\` یا \`اصفهان\`) را ارسال فرمایید:`,
      keyboard: [["نمایش همه دفاتر کفالت"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_branch_search" }
    };
  }

  if (text.includes("نظرسنجی") || text.includes("نظر") || text.includes("امتیاز") || text.includes("بازخورد")) {
    return {
      replyText: `⭐ **سامانه نظرسنجی و ارزیابی دفاتر کفالت**\n\nلطفاً **کد دفتر کفالت** یا **نام شهر/شعبه** را جهت ثبت نظر وارد فرمایید (مثال: \`101\` یا \`دفتر شهرری\`):`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_feedback_office" }
    };
  }

  if (text.includes("مدارک") || text.includes("مفقود") || text.includes("پیدا") || text.includes("اسناد")) {
    return {
      replyText: `🪪 **سامانه اسناد و مدارک مفقودی و پیدا شده**\n\nلطفاً یکی از گزینه‌های زیر را انتخاب فرمایید:`,
      keyboard: [
        ["🔍 جستجوی مدارک پیدا شده در دفاتر"],
        ["📝 ثبت مشخصات مدرک گم‌شده‌ام"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_lost_menu" }
    };
  }

  // 11. Expiry Reminder Trigger
  if (text.includes("یادآور") || text.includes("انقضا") || text.includes("هشدار")) {
    return {
      replyText: `⏰ **سامانه یادآور تاریخ انقضای مدارک (پیامکی و بات)**\n\nبرای جلوگیری از ابطال مدرک و جریمه‌های دیرکرد، تاریخ انقضای مدرک خود را ثبت کنید تا سیستم ۳۰ روز و ۱۰ روز قبل به شما پیامک هشدار ارسال کند.\n\n👇 لطفاً نوع مدرک خود را انتخاب یا ارسال نمایید:`,
      keyboard: [
        ["کارت آمایش و هوشمند", "گذرنامه و پاسپورت"],
        ["روادید و ویزای سفر", "پروانه کار و اشتغال"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_expiry_doc_type" }
    };
  }

  // 12. Date Converter Trigger
  if (text.includes("مبدل") || text.includes("تاریخ") || text.includes("سن تذکره") || text.includes("تبدیل")) {
    return {
      replyText: `📅 **مبدل تاریخ تذکره و محاسبه سن قانونی اتباع**\n\nتبدیل تاریخ هجری شمسی افغانستان به میلادی و بررسی شرایط سنی تحصیل و سن قانونی ۱۸ سال.\n\n👇 لطفاً **سال تولد** مندرج در تذکره خود را ارسال فرمایید (مثال: \`1380\` یا \`1368\`):`,
      keyboard: [["۱۳۸۵ (۱۸ سال)", "۱۳۹۶ (کلاس اول)"], ["۱۳۸۰", "۱۳۷۰"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_date_convert_year" }
    };
  }

  // 13. Driving Quiz Trigger
  if (text.includes("آیین‌نامه") || text.includes("رانندگی") || text.includes("گواهینامه") || text.includes("تست")) {
    return {
      replyText: `🚗 **آزمون آیین‌نامه رانندگی اتباع و مهاجرین**\n\n❓ **سوال نمونه آزمون:**\nدر یک میدان فاقد چراغ راهنما، حق تقدم عبور با کدام وسیله نقلیه است؟\n\n۱) وسیله‌ای که سرعت بیشتری دارد\n۲) وسیله‌ای که از قبل در حریم میدان در حال گردش است\n۳) وسیله‌ای که قصد ورود به میدان را دارد\n۴) وسیله‌ای که چراغ راهنما زده است`,
      keyboard: [
        ["گزینه ۱ (سرعت بیشتر)", "گزینه ۲ (وسیله داخل میدان)"],
        ["گزینه ۳ (ورود به میدان)", "گزینه ۴ (چراغ راهنما)"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_driving_quiz_answer" }
    };
  }

  // 14. Biometric Photo Standardizer Trigger
  if (text.includes("عکس") || text.includes("پرسنلی") || text.includes("۴×۳") || text.includes("بیومتریک")) {
    return {
      replyText: `📷 **استانداردهای رسمی عکس پرسنلی ۴×۳ کنسولگری و دفاتر کفالت:**\n\n🔹 **ابعاد دقیق:** ۳ در ۴ سانتی‌متر (۳۰۰ DPI)\n🔹 **زمینه:** کاملاً سفید یکدست، بدون سایه و طرح\n🔹 **پوشش و چهره:** صورت تمام‌رخ، رو به دوربین، بدون عینک دودی، گوش‌ها و گردی صورت کاملاً آشکار، با حجاب اسلامی تیره برای بانوان\n🔹 **تاریخ عکس:** تهیه شده در ۶ ماه اخیر\n\n✂️ شما می‌توانید با مراجعه به **سایت دستیار مهاجر**، از ابزار آنلاین برش، تنظیم خودکار کادر و سفیدسازی پس‌زمینه عکس استفاده نمایید.`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  // 15. Job Portal Trigger
  if (text.includes("کاریابی") || text.includes("استخدام") || text.includes("شغل") || text.includes("کارفرما") || text.includes("کارجو")) {
    return {
      replyText: `💼 **سامانه کاریابی و اشتغال مجاز اتباع خارجی**\n\nاتصال مستقیم کارفرمایان و کارجویان در مشاغل مجاز، صنایع پوشاک، کارگاه‌های صنعتی، گلخانه‌ها و ساختمانی با امکان جای خواب و پروانه کار.\n\n👇 لطفاً اقدام مورد نظر را انتخاب فرمایید:`,
      keyboard: [
        ["🔍 مشاهده فرصت‌های شغلی مجاز"],
        ["📢 ثبت آگهی استخدام (کارفرما)"],
        ["👤 ثبت مشخصات و رزومه (کارجو)"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_job_portal_action" }
    };
  }

  if (text.includes("خبر") || text.includes("بخشنامه") || text.includes("اطلاعیه") || text.includes("کانال")) {
    return await handleLatestNews();
  }

  if (text.includes("سفارت")) {
    return {
      replyText: `🏛 **سفارت‌ها و کنسولگری‌ها**\n\nلطفاً نام شهر یا کشور مورد نظر را ارسال فرمایید (یا روی دکمه «نمایش همه سفارت‌ها» بزنید):`,
      keyboard: [["نمایش همه سفارت‌ها"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_embassy_search" }
    };
  }

  if (text.includes("سایت") || text.includes("سامانه")) {
    return await handleWebsitesList();
  }

  if (text.includes("سوال") || text.includes("faq")) {
    return await handleFaqsList();
  }

  if (text.includes("ثبت") || text.includes("نوبت")) {
    return {
      replyText: `📝 **ثبت آنلاین درخواست نوبت و خدمات دفاتر کفالت**\n\nلطفاً **نام و نام خانوادگی متقاضی** را ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_reg_name" }
    };
  }

  if (text.includes("پیگیری") || text.includes("کد رهگیری") || text.includes("استعلام")) {
    return {
      replyText: `🔍 **پیگیری وضعیت درخواست**\n\nلطفاً **کد رهگیری** دریافتی خود را ارسال فرمایید:`,
      keyboard: [["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_tracking_code" }
    };
  }

  if (text.includes("پشتیبانی") || text.includes("تماس") || text.includes("ارتباط")) {
    return {
      replyText: `📞 **ارتباط با پشتیبانی و راهنمایی مهاجرین:**\n\nجهت ارتباط با کارشناسان و پاسخگویی به ابهامات اداری دفاتر کفالت:\n\n${formatClickablePhone("۰۲۱۸۸۸۸۰۰۰۰")}\n\nساعات پاسخگویی: شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۰۰`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  // Fallback intelligent response
  return {
    replyText: `متوجه پیام شما نشدم. جهت استفاده از خدمات، لطفاً یکی از گزینه‌های منوی زیر را لمس نمایید:`,
    keyboard: MAIN_KEYBOARD,
    sessionState: { step: "idle" }
  };
}

// -------------------------------------------------------------
// Core Services Logic with Clickable Phone Numbers
// -------------------------------------------------------------

async function handleKefalatOfficeSearch(queryText: string): Promise<BotResponse> {
  const q = queryText.trim().toLowerCase();
  const showAll = q === "نمایش همه دفاتر کفالت" || q === "همه";

  try {
    const snap = await getDocs(collection(db, "branches"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    let matches = all;
    if (!showAll) {
      matches = all.filter(b => 
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.provinceCity && b.provinceCity.toLowerCase().includes(q)) ||
        (b.neighborhood && b.neighborhood.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q))
      );
    }

    if (matches.length === 0) {
      return {
        replyText: `❌ دفتر کفالتی با مشخصات «${queryText}» یافت نشد.\n\nمی‌توانید نام استان (مثلاً: تهران یا اصفهان) یا کد دفتر (مثلاً: 101) را ارسال کنید.`,
        keyboard: [["نمایش همه دفاتر کفالت"], ["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_branch_search" }
      };
    }

    let result = `🏢 **نتایج دفاتر کفالت (${matches.length} مورد):**\n\n`;
    matches.slice(0, 5).forEach((b, idx) => {
      result += `📍 **${b.name || `دفتر کفالت کد ${b.code || idx + 1}`}** (${b.provinceCity || "تهران"} - ${b.neighborhood || ""})\n`;
      result += `▫️ **کد دفتر:** \`${b.code || "ندارد"}\`\n`;
      result += `▫️ **آدرس:** ${b.address || "ثبت نشده"}\n`;
      if (b.phone) result += `▫️ **تلفن تماس:** ${formatClickablePhone(b.phone)}\n`;
      if (b.workingHours) result += `▫️ **ساعات کاری:** ${b.workingHours}\n`;
      if (b.locationUrl) result += `▫️ **مسیریابی:** [مشاهده روی نقشه](${b.locationUrl})\n`;
      if (b.description) result += `▫️ **خدمات:** ${b.description}\n`;
      result += `----------------------------\n`;
    });

    if (matches.length > 5) {
      result += `\n⚠️ ۵ مورد از ${matches.length} مورد نمایش داده شد. جهت دقت بیشتر کد دفتر را ارسال فرمایید.`;
    }

    return {
      replyText: result,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در بازیابی دفاتر کفالت: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

async function handleDocSearch(queryText: string): Promise<BotResponse> {
  const q = queryText.trim().toLowerCase();
  const showAll = q === "نمایش همه مدارک پیدا شده" || q === "همه";

  try {
    const snap = await getDocs(collection(db, "found_documents"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    let matches = all;
    if (!showAll) {
      matches = all.filter(d => 
        (d.ownerName && d.ownerName.toLowerCase().includes(q)) ||
        (d.docNumber && d.docNumber.toLowerCase().includes(q)) ||
        (d.holdingLocation && d.holdingLocation.toLowerCase().includes(q)) ||
        (d.docType && d.docType.toLowerCase().includes(q))
      );
    }

    if (matches.length === 0) {
      return {
        replyText: `❌ مدرک پیدا شده‌ای با مشخصات «${queryText}» در سیستم ثبت نشده است.\n\n💡 پیشنهاد می‌شود از گزینه «📝 ثبت مشخصات مدرک گم‌شده‌ام» استفاده کنید تا در صورت تحویل سند، سیستم فوراً با شما تماس بگیرد.`,
        keyboard: [["📝 ثبت مشخصات مدرک گم‌شده‌ام"], ["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_lost_menu" }
      };
    }

    let result = `🪪 **مدارک پیدا شده در دفاتر کفالت (${matches.length} مورد):**\n\n`;
    matches.slice(0, 5).forEach((d) => {
      result += `📄 **${d.docType}** - **${d.ownerName}**\n`;
      if (d.docNumber) result += `▫️ **شماره مدرک:** \`${d.docNumber}\`\n`;
      result += `▫️ **محل نگهداری:** ${d.holdingLocation} (${d.province || "تهران"})\n`;
      if (d.contactPhone) result += `▫️ **تماس جهت تحویل:** ${formatClickablePhone(d.contactPhone)}\n`;
      if (d.notes) result += `▫️ **توضیحات:** ${d.notes}\n`;
      result += `----------------------------\n`;
    });

    return {
      replyText: result,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در جستجوی مدارک: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

async function handleLatestNews(): Promise<BotResponse> {
  try {
    const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"), limit(4));
    const snap = await getDocs(q);

    if (snap.empty) {
      return {
        replyText: `📢 **آخرین اخبار و بخشنامه‌ها:**\n\nدر حال حاضر بخشنامه جدیدی ثبت نشده است. اطلاعیه‌های سازمان ملی مهاجرت و دفاتر کفالت به محض انتشار در اینجا و کانال‌های رسمی قرار خواهد گرفت.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }

    let response = `📢 **آخرین اخبار و بخشنامه‌های منتشر شده:**\n\n`;
    snap.docs.forEach((d, idx) => {
      const data = d.data();
      response += `📌 **${idx + 1}. ${data.title}**\n`;
      if (data.category) response += `🏷 دسته‌بندی: ${data.category}\n`;
      response += `${data.content}\n`;
      if (data.linkUrl) response += `🔗 [مشاهده لینک تکمیلی](${data.linkUrl})\n`;
      response += `----------------------------\n`;
    });

    return {
      replyText: response,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در دریافت اخبار: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

async function handleEmbassySearch(queryText: string): Promise<BotResponse> {
  const q = queryText.trim().toLowerCase();
  const showAll = q === "نمایش همه سفارت‌ها" || q === "همه";

  try {
    const snap = await getDocs(collection(db, "embassies"));
    let all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    if (all.length === 0) {
      all = INITIAL_EMBASSIES as any[];
    }

    let matches = all;
    if (!showAll) {
      matches = all.filter(e => 
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.address && e.address.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    if (matches.length === 0) {
      return {
        replyText: `❌ سفارت یا کنسولگری با نام «${queryText}» یافت نشد.`,
        keyboard: [["نمایش همه سفارت‌ها"], ["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_embassy_search" }
      };
    }

    let result = `🏛 **اطلاعات و لوکیشن سفارت‌ها و کنسولگری‌ها:**\n\n`;
    matches.forEach(e => {
      result += `📌 **${e.name || "سفارت / کنسولگری"}**\n`;
      result += `▫️ **آدرس:** ${e.address || "نامشخص"}\n`;
      if (e.phone) result += `▫️ **تلفن تماس:** ${formatClickablePhone(e.phone)}\n`;
      
      const loc = e.locationUrl || (e.latitude && e.longitude ? `https://maps.google.com/?q=${e.latitude},${e.longitude}` : (e.address ? `https://maps.google.com/?q=${encodeURIComponent(e.name + " " + e.address)}` : null));
      if (loc) {
        result += `▫️ 📍 **لینک لوکیشن و مسیریابی:** [مسیریابی روی نقشه](${loc})\n`;
      }

      if (e.workingHours) result += `▫️ ⏰ **ساعات کاری:** ${e.workingHours}\n`;
      if (e.website) result += `▫️ **وب‌سایت رسمی:** ${e.website}\n`;
      if (e.description) result += `▫️ **خدمات و توضیحات:** ${e.description}\n`;
      result += `----------------------------\n`;
    });

    return {
      replyText: result,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در دریافت لیست سفارت‌ها: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

async function handleWebsitesList(): Promise<BotResponse> {
  try {
    const snap = await getDocs(collection(db, "websites"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (all.length === 0) {
      return {
        replyText: `🌐 هنوز سایتی در پنل مدیریت ثبت نشده است.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }

    let result = `🌐 **سایت‌ها و سامانه‌های مهم خدمات مهاجرین:**\n\n`;
    all.forEach(w => {
      result += `🔗 **${w.name}**\n`;
      result += `▫️ آدرس سایت: ${w.url}\n`;
      if (w.description) result += `▫️ توضیحات: ${w.description}\n`;
      result += `\n`;
    });

    return {
      replyText: result,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در دریافت لیست سایت‌ها: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

async function handleFaqsList(): Promise<BotResponse> {
  try {
    const snap = await getDocs(collection(db, "faqs"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (all.length === 0) {
      return {
        replyText: `❓ در حال حاضر پرسشی در سامانه ثبت نشده است.`,
        keyboard: MAIN_KEYBOARD,
        sessionState: { step: "idle" }
      };
    }

    let result = `❓ **سوالات متداول و پاسخ‌های مهم:**\n\n`;
    all.forEach((f, idx) => {
      result += `🔹 **${idx + 1}. ${f.question}**\n`;
      result += `💡 **پاسخ:** ${f.answer}\n\n`;
    });

    return {
      replyText: result,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در دریافت سوالات متداول: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

async function handleTrackingSearch(codeText: string): Promise<BotResponse> {
  const code = codeText.trim();
  try {
    const snap = await getDocs(collection(db, "requests"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const match = all.find(r => 
      (r.trackingCode && r.trackingCode.toLowerCase() === code.toLowerCase()) ||
      r.id.toLowerCase() === code.toLowerCase() ||
      r.id.toLowerCase().startsWith(code.toLowerCase())
    );

    if (!match) {
      return {
        replyText: `❌ درخواستی با کد رهگیری «${code}» یافت نشد.\n\nلطفاً کد رهگیری خود را به درستی وارد فرمایید:`,
        keyboard: [["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_tracking_code" }
      };
    }

    let statusText = "در انتظار بررسی ⏳";
    if (match.status === "approved") statusText = "تایید شده و نوبت صادر شد ✅";
    if (match.status === "rejected") statusText = "رد شده یا نقص مدارک ❌";
    if (match.status === "in_progress") statusText = "در حال پیگیری در دفتر کفالت 🔄";

    let response = `🔍 **نتیجه پیگیری درخواست شما:**\n\n🔑 **کد رهگیری:** \`${match.trackingCode || match.id.slice(0, 8).toUpperCase()}\`\n👤 **نام متقاضی:** ${match.applicantName || "نامشخص"}\n📋 **نوع خدمت:** ${match.requestType || "ثبت‌نام عمومی"}\n📊 **وضعیت لحظه‌ای:** **${statusText}**\n`;
    if (match.adminNotes) {
      response += `📝 **توضیحات دفتر:** ${match.adminNotes}\n`;
    }

    return {
      replyText: response,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در استعلام وضعیت درخواست: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

// -------------------------------------------------------------
// New Bot Services: Tazkira, AI Advisor, Fees, Forms, Education, GPS
// -------------------------------------------------------------

// 1. Tazkira Search Service
async function handleTazkiraSearch(queryText: string): Promise<BotResponse> {
  const q = queryText.trim().replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").toLowerCase();

  if (q === "بازگشت به منوی اصلی") {
    return {
      replyText: "بازگشت به منوی اصلی سیستم:",
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  if (q === "جستجوی نام دیگر") {
    return {
      replyText: "لطفاً نام، نام خانوادگی یا نام پدر متقاضی را ارسال فرمایید:",
      keyboard: [["نمایش آخرین تذکره‌های ارسالی"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_tazkira_search" }
    };
  }

  try {
    let allRecords: TazkiraRecord[] = [...INITIAL_TAZKIRAS];
    try {
      const snap = await getDocs(collection(db, "printed_tazkiras"));
      const dbRecords = snap.docs.map(d => ({ id: d.id, ...d.data() } as TazkiraRecord));
      if (dbRecords.length > 0) {
        allRecords = [...dbRecords, ...allRecords];
      }
    } catch (_) {}

    const isShowAll = q === "نمایش آخرین تذکره‌های ارسالی" || q === "همه" || q === "لیست";
    const matches = isShowAll
      ? allRecords.slice(0, 6)
      : allRecords.filter(r => {
          const fn = (r.fullName || "").replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").toLowerCase();
          const sn = (r.surname || "").replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").toLowerCase();
          const fa = (r.fatherName || "").replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").toLowerCase();
          const pr = (r.province || "").toLowerCase();
          const bx = (r.boxNumber || "").toLowerCase();
          const row = (r.rowNumber || "").toString();
          return fn.includes(q) || sn.includes(q) || fa.includes(q) || pr.includes(q) || bx.includes(q) || row === q;
        });

    if (matches.length === 0) {
      return {
        replyText: `❌ موردی با مشخصات «${queryText}» در میان تذکره‌های آماده تحویل فعلی یافت نشد.\n\n💡 **راهنمای جستجو:**\n• نام یا نام خانوادگی را کوتاه وارد کنید (مثلاً: «جمشیدی»، «قاسمی» یا «احمد»).\n• یا نام پدر متقاضی را وارد کنید.\n• لیست‌ها به صورت دوره‌ای با رسیدن محموله‌های جدید سفارت به‌روزرسانی می‌شوند.`,
        keyboard: [["نمایش آخرین تذکره‌های ارسالی"], ["جستجوی نام دیگر"], ["بازگشت به منوی اصلی"]],
        sessionState: { step: "awaiting_tazkira_search" }
      };
    }

    let reply = `✅ **نتایج استعلام تذکره‌های الکترونیکی (${matches.length} مورد یافت شد):**\n\n`;
    matches.slice(0, 8).forEach((m, idx) => {
      reply += `📌 **مورد ${idx + 1}:**\n`;
      reply += `👤 **نام و نام خانوادگی:** ${m.fullName} ${m.surname || ""}\n`;
      reply += `👴 **نام پدر:** ${m.fatherName}\n`;
      reply += `📍 **ولایت:** ${m.province}\n`;
      reply += `📦 **شماره قطعه (باکس تحویل):** قطعه ${m.boxNumber}\n`;
      reply += `🔢 **ردیف در لیست:** ردیف ${m.rowNumber}\n`;
      if (m.remarks) reply += `🗓 **تاریخ/کد محموله:** ${m.remarks}\n`;
      reply += `🟢 **وضعیت:** آماده تحویل در بخش کنسولی سفارت\n`;
      reply += `------------------------------------\n`;
    });

    reply += `\n💡 **مدارک لازم جهت تحویل تذکره در سفارت/کنسولگری:**\n۱. اصل برگه رسید و نوبت بایومتریک\n۲. تذکره قبلی (در صورت وجود)\n۳. مدرک شناسایی عکس‌دار معتبر متقاضی یا سرپرست`;

    return {
      replyText: reply,
      keyboard: [["جستجوی نام دیگر"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_tazkira_search" }
    };
  } catch (err: any) {
    return {
      replyText: `خطا در جستجوی تذکره: ${err.message}`,
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }
}

// 2. AI Advisor Service
async function handleAiAdvisorQuestion(queryText: string): Promise<BotResponse> {
  const q = queryText.trim();

  if (q === "بازگشت به منوی اصلی") {
    return {
      replyText: "بازگشت به منوی اصلی سیستم:",
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  // Try calling AI backend endpoint if in environment with fetch
  try {
    if (typeof fetch !== "undefined") {
      const resp = await fetch("/api/ai/legal-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, topic: "general" })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.answer) {
          return {
            replyText: `🤖 **پاسخ مشاور هوشمند اقامتی:**\n\n${data.answer}\n\n⚠️ *نکته: این پاسخ بر اساس آخرین آیین‌نامه‌ها و بخشنامه‌های سازمان ملی مهاجرت و اداره کل امور اتباع ارائه شده است.*`,
            keyboard: [
              ["پرسش سوال دیگر از مشاور", "شرایط گواهینامه رانندگی مهاجرین"],
              ["افتتاح حساب بانکی و کارت عابر", "بازگشت به منوی اصلی"]
            ],
            sessionState: { step: "awaiting_ai_advisor_question" }
          };
        }
      }
    }
  } catch (_) {}

  // Fallback expert knowledge base
  let answer = "";
  const lower = q.toLowerCase();

  if (lower.includes("گواهینامه") || lower.includes("رانندگی") || lower.includes("ماشین") || lower.includes("موتور")) {
    answer = `🚗 **شرایط و مدارک دریافت گواهینامه رانندگی اتباع:**\n\n۱. **شرط مدارک هویتی:** متقاضی باید دارای گذرنامه معتبر با اقامت قانونی تمدیدشده (دانشجویی، کاری یا خانواری) باشد. با برگه سرشماری به تنهایی امکان اخذ گواهینامه وجود ندارد.\n۲. **معرفی‌نامه:** دریافت معرفی‌نامه از اداره کل امور اتباع و مهاجرین خارجی استان محل سکونت.\n۳. **کد فراگیر/یکتا:** دارا بودن کد یکتای معتبر در سامانه سهما.\n۴. **مراحل آموزشگاه:** ثبت‌نام در آموزشگاه‌های رانندگی مجاز، گذراندن کلاس‌های تئوری و عملی و قبولی در آزمون‌های آیین‌نامه و شهر.\n۵. **اعتبار:** گواهینامه صادره به صورت یک‌ساله و با تمدید اقامت قابل تمدید است.`;
  } else if (lower.includes("بانک") || lower.includes("کارت") || lower.includes("حساب") || lower.includes("عابر")) {
    answer = `💳 **راهنمای افتتاح حساب بانکی و کارت عابربانک اتباع:**\n\n۱. **بانک‌های مجاز:** بر اساس بخشنامه بانک مرکزی، بانک‌های ملی، سپه، صادرات، تجارت و ملت موظف به ارائه خدمات پایه بانکی به مهاجرین مجاز هستند.\n۲. **مدارک لازم:** اصل مدرک اقامتی معتبر (کارت آمایش معتبر، گذرنامه اقامتی، یا کارت هوشمند)، کد یکتا/فراگیر معتبر و کد پستی تاییدشده محل سکونت.\n۳. **سقف تراکنش:** سقف برداشت روزانه و کارت به کارت مطابق بخشنامه شاپرک برای مشتریان اتباع تعیین شده و کارت‌های دارای تاریخ انقضا باید به همراه مدرک هویتی تمدید شوند.\n۴. **همراه‌بانک:** فعال‌سازی همراه بانک با ثبت شماره موبایلی که به نام خود شخص ثبت شده باشد الزامی است.`;
  } else if (lower.includes("تردد") || lower.includes("سفر") || lower.includes("بین استانی") || lower.includes("برگه تردد")) {
    answer = `🛣 **نحوه دریافت برگه تردد بین استانی:**\n\n۱. **مرجع صدور:** دفاتر خدمات اقامت و اشتغال اتباع (دفاتر کفالت) یا سامانه یکپارچه سهما.\n۲. **علت موجه:** درمان پزشکی (به همراه نامه پزشک)، زیارت، امور تحصیلی و دانشگاهی، یا دعاوی اداری و قضایی.\n۳. **مدت اعتبار:** برگه‌های تردد معمولاً بین ۵ تا ۱۵ روز صادر می‌شوند.\n۴. **هشدار:** تردد به استان‌های ممنوعه برای اتباع بدون مجوز کتبی اداره اتباع غیرمجاز بوده و موجب لغو اقامت یا جریمه انتظامی می‌گردد.`;
  } else if (lower.includes("خروج") || lower.includes("مراجعت") || lower.includes("افغانستان") || lower.includes("سفر به کشور")) {
    answer = `✈️ **قوانین خروج و مراجعت به افغانستان:**\n\n۱. **گذرنامه اقامتی:** اتباع دارای گذرنامه با روادید معتبر باید به پلیس اطلاعات و امنیت مهاجرت (یا دفاتر کفالت مجری) مراجعه و مهر خروج و مراجعت دریافت دارند.\n۲. **مدت مجاز خارج از کشور:** معمولاً تا ۳ ماه اجازه اقامت در افغانستان بدون ابطال اقامت ایران داده می‌شود.\n۳. **دارندگان کارت آمایش:** خروج از کشور با کارت آمایش به منزله انصراف از پناهندگی تلقی شده مگر در طرح‌های بازگشت داوطلبانه با هماهنگی کمیساریای عالی پناهندگان.`;
  } else if (lower.includes("کارت هوشمند") || lower.includes("یکتا") || lower.includes("سهما")) {
    answer = `🪪 **طرح کارت هوشمند و کد یکتا مهاجرین:**\n\n۱. هدف کارت هوشمند، تجمیع تمام کارت‌های قبلی (آمایش، بانکی، سیم‌کارت و بیمه) در یک کارت یکپارچه است.\n۲. کلیه مراحل از طریق ثبت‌نام اولیه در سامانه سهما (irmigrationorg.ir) و مراجعه به دفتر کفالت تعیین‌شده انجام می‌شود.\n۳. ارائه کد یکتای ۱۰ رقمی برای تمام امور اداری، ثبت‌نام فرزندان در مدارس و دریافت گواهی اشتغال الزامی است.`;
  } else {
    answer = `📌 **راهنمای حقوقی و اداری در پاسخ به «${q}»:**\n\n• کلیه امور اقامتی مهاجرین در ایران تحت نظارت سازمان ملی مهاجرت و از طریق دفاتر خدمات اقامت و اشتغال (دفاتر کفالت) انجام می‌پذیرد.\n• همراه داشتن اصل مدرک معتبر هویتی و کد یکتا در تمامی مراجعات اداری ضروری است.\n• در صورت نیاز به بررسی دقیق پرونده، پیشنهاد می‌شود از بخش «جستجوی دفاتر کفالت» با نزدیک‌ترین دفتر تماس حاصل فرمایید.`;
  }

  return {
    replyText: `🤖 **پاسخ مشاور هوشمند اقامتی:**\n\n${answer}`,
    keyboard: [
      ["پرسش سوال دیگر از مشاور", "شرایط گواهینامه رانندگی مهاجرین"],
      ["افتتاح حساب بانکی و کارت عابر", "بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "awaiting_ai_advisor_question" }
  };
}

// 3. Fee Calculator Service
async function handleFeeCalculator(optionText: string): Promise<BotResponse> {
  const opt = optionText.trim();

  if (opt === "بازگشت به منوی اصلی") {
    return {
      replyText: "بازگشت به منوی اصلی سیستم:",
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  if (opt.includes("محاسبه کل هزینه‌ها برای خانواده") || opt.includes("خانواده")) {
    return {
      replyText: `👨‍👩‍👧‍👦 **محاسبه هوشمند هزینه‌ها برای کل خانوار:**\n\nلطفاً **تعداد کل اعضای خانواده** خود را به صورت عدد ارسال فرمایید (مثال: \`4\`):`,
      keyboard: [["1", "2", "3"], ["4", "5", "6"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_family_count" }
    };
  }

  if (opt.includes("۵ ساله") || opt.includes("5 ساله") || opt.includes("120")) {
    return {
      replyText: `🛂 **تعرفه صدور/تمدید پاسپورت ۵ ساله ماشین‌خوان:**\n\n• **تعرفه دلاری مصوب سفارت:** ۱۲۰ دلار آمریکا\n• **معادل تقریبی ریالی:** حدود ۱۰,۸۰۰,۰۰۰ الی ۱۱,۴۰۰,۰۰۰ تومان (با نرخ روز صرافی)\n• **هزینه خدمات دفتر کنسولی:** مصوب ریالی خدمات بایومتریک و پست\n\n📄 **مدارک لازم:**\n۱. اصل تذکره تابعیت تاییدشده (یا تذکره الکترونیک)\n۲. ۴ قطعه عکس ۴×۳ زمینه سفید جدید\n۳. کپی مدرک اقامتی ایران\n۴. تکمیل فرم مشخصات فردی`,
      keyboard: [
        ["پاسپورت ۲ ساله (۲۰ دلار)", "تثبیت هویت و تذکره سفارت"],
        ["محاسبه کل هزینه‌ها برای خانواده", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_fee_calc_menu" }
    };
  }

  if (opt.includes("۲ ساله") || opt.includes("2 ساله") || opt.includes("20")) {
    return {
      replyText: `🛂 **تعرفه تمدید پاسپورت دست‌نویس (۲ ساله):**\n\n• **تعرفه مصوب سفارت:** ۲۰ دلار آمریکا\n• **معادل تقریبی ریالی:** حدود ۱,۸۰۰,۰۰۰ الی ۱,۹۵۰,۰۰۰ تومان\n• **نکته مهم:** بر اساس مقررات ایکائو (ICAO)، تمدید پاسپورت‌های دست‌نویس رو به پایان است و اولویت با تعویض به پاسپورت ۵ ساله الکترونیک می‌باشد.`,
      keyboard: [
        ["تمدید پاسپورت ۵ ساله (۱۲۰ دلار)", "تثبیت هویت و تذکره سفارت"],
        ["محاسبه کل هزینه‌ها برای خانواده", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_fee_calc_menu" }
    };
  }

  if (opt.includes("تثبیت هویت") || opt.includes("تذکره")) {
    return {
      replyText: `🏛 **تعرفه تثبیت هویت و صدور تذکره:**\n\n• **گواهی تثبیت هویت سفارت:** ۵۰ دلار آمریکا (~۴,۵۰۰,۰۰۰ تومان)\n• **تذکره الکترونیکی:** ۱۰ دلار آمریکا (~۹۰۰,۰۰۰ تومان)\n• **تایید اسناد و وکالت‌نامه:** تعرفه از ۲۰ الی ۵۰ دلار بسته به نوع سند\n\n📄 **مدارک لازم:**\n• اصل یا رونوشت تذکره اقارب اصولی (پدر، پدربزرگ، برادر)\n• عکس پرسنلی رنگی و حضور دو نفر شاهد شرعی`,
      keyboard: [
        ["تمدید پاسپورت ۵ ساله (۱۲۰ دلار)", "هزینه‌های دفتر کفالت و پروانه کار"],
        ["محاسبه کل هزینه‌ها برای خانواده", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_fee_calc_menu" }
    };
  }

  if (opt.includes("کفالت") || opt.includes("پروانه کار") || opt.includes("کارت کار")) {
    return {
      replyText: `🏢 **تعرفه‌های مصوب دفاتر کفالت و کارت کار:**\n\n• **نوبت‌گیری و خدمات اداری دفتر کفالت:** تعرفه مصوب ریالی (حدود ۴۵۰,۰۰۰ تومان)\n• **تمدید کارت کارگری (پروانه اشتغال):** حدود ۱,۸۰۰,۰۰۰ الی ۲,۴۰۰,۰۰۰ تومان بر اساس رشته شغلی\n• **بیمه حوادث و درمان:** مطابق قرارداد شرکت بیمه‌گر طرف قرارداد\n• **هزینه صدور کارت هوشمند:** تعرفه مصوب ابلاغی سازمان ملی مهاجرت`,
      keyboard: [
        ["تمدید پاسپورت ۵ ساله (۱۲۰ دلار)", "تثبیت هویت و تذکره سفارت"],
        ["محاسبه کل هزینه‌ها برای خانواده", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_fee_calc_menu" }
    };
  }

  return {
    replyText: `لطفاً یکی از خدمات زیر را انتخاب فرمایید تا تعرفه و ریز هزینه‌ها نمایش داده شود:`,
    keyboard: [
      ["تمدید پاسپورت ۵ ساله (۱۲۰ دلار)", "پاسپورت ۲ ساله (۲۰ دلار)"],
      ["تثبیت هویت و تذکره سفارت", "هزینه‌های دفتر کفالت و پروانه کار"],
      ["محاسبه کل هزینه‌ها برای خانواده", "بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "awaiting_fee_calc_menu" }
  };
}

function handleFamilyCountCalculation(countText: string): BotResponse {
  const count = parseInt(countText.replace(/[^0-9]/g, ""), 10);

  if (isNaN(count) || count <= 0 || count > 20) {
    return {
      replyText: `لطفاً تعداد اعضای خانواده را با یک عدد معتبر (مثلاً 4) ارسال فرمایید:`,
      keyboard: [["1", "2", "3"], ["4", "5", "6"], ["بازگشت به منوی اصلی"]],
      sessionState: { step: "awaiting_family_count" }
    };
  }

  const passportPerPerson = 120; // USD
  const totalPassportUsd = count * passportPerPerson;
  const tomanRate = 92000;
  const totalPassportToman = totalPassportUsd * tomanRate;

  const kafalatPerPersonToman = 450000;
  const totalKafalatToman = count * kafalatPerPersonToman;

  const grandTotalToman = totalPassportToman + totalKafalatToman;

  const fmt = (n: number) => n.toLocaleString("fa-IR");

  const reply = `👨‍👩‍👧‍👦 **برآورد بودجه برای خانوار ${count} نفره:**\n\n` +
    `🛂 **۱. پاسپورت ۵ ساله برای ${count} نفر:**\n` +
    `• تعرفه دلاری: **${totalPassportUsd} دلار** ($${passportPerPerson} × ${count})\n` +
    `• معادل ریالی تقریبی: **${fmt(totalPassportToman)} تومان**\n\n` +
    `🏢 **۲. خدمات دفاتر کفالت و بایومتریک:**\n` +
    `• تعرفه ریالی: **${fmt(totalKafalatToman)} تومان**\n\n` +
    `📊 **جمع کل برآورد هزینه‌ها:**\n` +
    `💰 **حدود ${fmt(grandTotalToman)} تومان** (به علاوه هزینه‌های عکس، کپی و پست)\n\n` +
    `💡 **پیشنهاد مشاور:** می‌توانید هزینه‌های دلاری را پیش از مراجعه به سفارت تهیه فرمایید و فیش‌های بانکی دفاتر کفالت را از طریق پایانه‌های متصل به شتاب پرداخت نمایید.`;

  return {
    replyText: reply,
    keyboard: [
      ["تمدید پاسپورت ۵ ساله (۱۲۰ دلار)", "تثبیت هویت و تذکره سفارت"],
      ["محاسبه برای تعداد نفرات دیگر", "بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "awaiting_fee_calc_menu" }
  };
}

// 4. Consular Form Builder Service
function handleFormTypeSelection(typeText: string): BotResponse {
  const t = typeText.trim();

  if (t === "بازگشت به منوی اصلی") {
    return {
      replyText: "بازگشت به منوی اصلی سیستم:",
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  let formLabel = "فرم درخواستی";
  if (t.includes("تثبیت")) formLabel = "فرم درخواست تثبیت هویت سفارت";
  else if (t.includes("وکالت")) formLabel = "وکالت‌نامه رسمی اداری و کاری";
  else if (t.includes("استشهاد")) formLabel = "استشهاد محلی تایید هویت شرعی";
  else if (t.includes("رضایت")) formLabel = "رضایت‌نامه سفر و خروج ولی قانونی";

  return {
    replyText: `سند انتخابی: **${formLabel}**\n\nلطفاً **نام و نام خانوادگی کامل متقاضی** را ارسال فرمایید (مثال: \`محمد علی احمدی\`):`,
    keyboard: [["بازگشت به منوی اصلی"]],
    sessionState: { step: "awaiting_form_name", formType: formLabel }
  };
}

function generateOfficialFormText(state: Record<string, any>): BotResponse {
  const formType = state.formType || "سند حقوقی";
  const fullName = state.fullName || "فلان بن فلان";
  const fatherName = state.fatherName || "نامشخص";
  const province = state.province || "کابل";
  const docNumber = state.docNumber || "---";
  const todayDate = new Date().toLocaleDateString("fa-IR");

  let docBody = "";

  if (formType.includes("تثبیت")) {
    docBody = `بسم الله الرحمن الرحیم\n\nبه: بخش قنسولی محترم سفارت کبرا / جنرال قنسولگری\nموضوع: درخواست تثبیت هویت و صدور تذکره الکترونیکی\nتاریخ تنظیم: ${todayDate}\n\nاینجانب: **${fullName}**\nفرزند: **${fatherName}**\nمتولد و ساکن ولایت: **${province}**\nدارنده مدرک/کد رهگیری: **${docNumber}**\n\nمحترمانه به استحضار می‌رسانم که اینجانب جهت انجام امور اداری و دریافت تذکره الکترونیک و پاسپورت، نیازمند تثبیت هویت می‌باشم. بدین‌وسیله صحت تمامی اسناد پیوست و مشخصات فوق را تحت مسئولیت شرعی و قانونی تایید نموده و تقاضای صدور برگ تثبیت هویت را دارم.\n\nنام و امضای متقاضی: ....................\nاثر انگشت سبابه دست راست: [محل اثر انگشت]`;
  } else if (formType.includes("وکالت")) {
    docBody = `بسمه تعالی\n\n**وکالت‌نامه رسمی کاری و اداری**\nتاریخ تنظیم: ${todayDate}\n\n**موکل:** اینجانب ${fullName} فرزند ${fatherName}، اهل ولایت ${province}، به شماره مدرک ${docNumber}.\n\n**وکیل:** [نام وکیل و مشخصات کامل در این بخش درج گردد]\n\n**حدود اختیارات:**\nوکیل مرقوم مجاز است جهت مراجعه به کلیه مراجع اداری، دفاتر کفالت خدمات اقامت و اشتغال، ارگان‌های مربوط به سازمان ملی مهاجرت، اخذ مدارک، امضای اسناد و پرداخت هزینه‌های قانونی از طرف اینجانب اقدام نماید. مفاد این سند تا اتمام موضوع مورد وکالت نافذ و معتبر است.\n\nامضای موکل: ....................\nامضای وکیل: ....................`;
  } else if (formType.includes("استشهاد")) {
    docBody = `بسم الله الرحمن الرحیم\n\n**استشهاد محلی تایید هویت و تابعیت**\nتاریخ: ${todayDate}\n\nبدین‌وسیله از کلیه مومنین و مطلعین که از هویت و تابعیت اینجانب:\nآقا/خانم: **${fullName}**\nفرزند: **${fatherName}**\nاصالتاً اهل ولایت: **${province}**، شماره مدرک: **${docNumber}**\nاطلاع شرعی و عینی دارند، تقاضا می‌شود مراتب را کتباً گواهی و امضا فرمایند.\n\nگواهان شرعی:\n۱. اینجانب ................. فرزند ................. با شماره تماس ................. هویت نامبرده را تایید می‌نمایم. [امضا/اثر انگشت]\n۲. اینجانب ................. فرزند ................. با شماره تماس ................. هویت نامبرده را تایید می‌نمایم. [امضا/اثر انگشت]`;
  } else {
    docBody = `بسمه تعالی\n\n**رضایت‌نامه رسمی ولی قانونی جهت سفر و امور اداری**\nتاریخ: ${todayDate}\n\nاینجانب: **${fatherName}** (ولی/سرپرست قانونی)\nبه عنوان ولی قهری فرزندم: **${fullName}**، به شماره مدرک: **${docNumber}**، ساکن استان/ولایت: **${province}**\n\nرضایت کامل و بلاشرط خود را جهت ثبت‌نام، سفر، دریافت گذرنامه و خدمات اداری و آموزشی نامبرده اعلام می‌دارم.\n\nامضا و اثر انگشت ولی: ....................`;
  }

  const reply = `📄 **متن سند رسمی شما آماده شد:**\n\n` +
    `────────────────────\n` +
    `${docBody}\n` +
    `────────────────────\n\n` +
    `📋 **نحوه استفاده:**\n` +
    `متن فوق را کپی نموده، بر روی کاغذ پرینت فرمایید و پس از امضا و اثر انگشت به همراه مدارک پیوست به بخش کنسولی یا دفتر مربوطه ارائه فرمایید.`;

  return {
    replyText: reply,
    keyboard: [
      ["تولید فرم دیگر", "📋 فرم‌ساز اسناد کنسولی"],
      ["بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "idle" }
  };
}

// 5. Education Guide Service
function handleEducationGuide(topicText: string): BotResponse {
  const t = topicText.trim();

  if (t === "بازگشت به منوی اصلی") {
    return {
      replyText: "بازگشت به منوی اصلی سیستم:",
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  if (t.includes("آمایش") || t.includes("پاسپورت") || t.includes("مدارس با آمایش")) {
    return {
      replyText: `🎒 **ثبت‌نام مدارس دولتی با کارت آمایش و گذرنامه اقامتی:**\n\n۱. **فرآیند ثبت‌نام:** کلیه دانش‌آموزان دارای کارت آمایش معتبر یا گذرنامه با اقامت معتبر می‌توانند همانند دانش‌آموزان ایرانی در نزدیک‌ترین مدرسه محل سکونت ثبت‌نام نمایند.\n۲. **کد یکتا:** دریافت کد یکتای دانش‌آموزی از سامانه سهما (یا دفتر کفالت) پیش‌نیاز ثبت‌نام در سامانه سیدا و مای مدیو است.\n۳. **مدارک:** اصل کارت آمایش یا گذرنامه، اصل کارنامه سال قبل، برگه سنجش سلامت (برای پایه اول)، و فرم مشخصات مسکن.\n۴. **محدوده سکونت:** ثبت‌نام مطابق کروکی و آدرس کد پستی مندرج در مدرک اقامتی انجام می‌شود.`,
      keyboard: [
        ["برگه حمایت تحصیلی فاقدین مدرک", "نوبت‌گیری سنجش سلامت (my.medu.ir)"],
        ["قوانین شهریه مدارس دولتی", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_education_topic" }
    };
  }

  if (t.includes("حمایت تحصیلی") || t.includes("فاقدین مدرک") || t.includes("سرشماری")) {
    return {
      replyText: `📜 **برگه حمایت تحصیلی برای دانش‌آموزان سرشماری‌شده و فاقد مدرک:**\n\n• **فرمان رهبری:** هیچ کودک و دانش‌آموز افغانستانی حتی بدون مدرک نباید از تحصیل بازبماند.\n• **نحوه دریافت برگه:**\n۱. مراجعه به سامانه سهما (irmigrationorg.ir) یا دفتر کفالت در موعد ثبت‌نام سال تحصیلی.\n۲. اخذ نوبت صدور برگه حمایت تحصیلی و پرداخت تعرفه اداری.\n۳. انجام معاینات پزشکی و آزمایشات در مراکز بهداشت مورد تایید.\n۴. ارائه برگه نهایی صادرشده از دفتر کفالت به مدیر مدرسه دولتی.`,
      keyboard: [
        ["ثبت‌نام مدارس با آمایش و پاسپورت", "نوبت‌گیری سنجش سلامت (my.medu.ir)"],
        ["قوانین شهریه مدارس دولتی", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_education_topic" }
    };
  }

  if (t.includes("سنجش") || t.includes("my.medu.ir") || t.includes("پایه اول")) {
    return {
      replyText: `🩺 **نوبت‌گیری سنجش سلامت پایه اول ابتدایی و پیش‌دبستانی:**\n\n۱. **سامانه:** سامانه پنجره واحد خدمات الکترونیک آموزش و پرورش (\`my.medu.ir\`).\n۲. **نحوه ورود:** انتخاب گزینه «ورود والدین اتباع» و درج کد یکتای دانش‌آموز و شماره موبایل ثبت‌شده.\n۳. **مراحل سنجش:** بینایی‌سنجی، شنوایی‌سنجی، آمادگی تحصیلی و بررسی کارت واکسیناسیون در پایگاه سنجش تعیین‌شده.\n۴. **الزام:** بدون ثبت نتیجه سنجش سلامت در سامانه سیدا، ثبت‌نام قطعی پایه اول امکان‌پذیر نیست.`,
      keyboard: [
        ["ثبت‌نام مدارس با آمایش و پاسپورت", "برگه حمایت تحصیلی فاقدین مدرک"],
        ["کنکور و ورود به دانشگاه‌ها", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_education_topic" }
    };
  }

  if (t.includes("کنکور") || t.includes("دانشگاه")) {
    return {
      replyText: `🎓 **شرایط کنکور سراسری و ادامه تحصیل اتباع در دانشگاه‌ها:**\n\n۱. **کد پیگیری اتباع:** دریافت کد رهگیری ۱۲ رقمی از سایت سازمان سنجش پیش از ثبت‌نام کنکور.\n۲. **شرایط اقامتی:** داشتن گذرنامه با روادید تحصیلی برای پذیرفته‌شدگان قطعی الزامی است (تبدیل کارت آمایش به گذرنامه دانشجویی).\n۳. **انتخاب رشته:** تحصیل در رشته‌های دارای تعهد خدمت و مناطق ممنوعه تردد اتباع بر اساس دفترچه شماره ۲ کنکور محدودیت دارد.\n۴. **شهریه دانشگاه‌ها:** در دانشگاه‌های دولتی نوبت روزانه در برخی سهمیه‌ها معاف و در دانشگاه‌های آزاد، پیام نور و پردیس خودگردان مطابق مصوبات وزارت علوم محاسبه می‌شود.`,
      keyboard: [
        ["ثبت‌نام مدارس با آمایش و پاسپورت", "برگه حمایت تحصیلی فاقدین مدرک"],
        ["قوانین شهریه مدارس دولتی", "بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_education_topic" }
    };
  }

  if (t.includes("شهریه") || t.includes("بخشنامه")) {
    return {
      replyText: `💵 **بخشنامه‌های مربوط به شهریه مدارس دولتی:**\n\n• بر اساس بخشنامه رسمی وزارت آموزش و پرورش، دریافت هرگونه وجه اجباری تحت عنوان «شهریه اتباع» در مدارس دولتی ممنوع است.\n• هزینه‌های پرداختی فقط شامل بیمه دانش‌آموزی و بهای کتب درسی رسمی کشور است.\n• مبالغ مربوط به کمک به مدرسه و انجمن اولیا و مربیان کاملاً اختیاری و داوطلبانه می‌باشد.\n• در صورت تخلف یا مطالبه مبالغ غیرقانونی، امکان ثبت شکایت در سامانه بازرسی آموزش و پرورش (\`shekayat.medu.ir\`) وجود دارد.`,
      keyboard: [
        ["ثبت‌نام مدارس با آمایش و پاسپورت", "نوبت‌گیری سنجش سلامت (my.medu.ir)"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_education_topic" }
    };
  }

  return {
    replyText: `لطفاً یکی از بخش‌های زیر را جهت مشاهده راهنمای تحصیلی انتخاب فرمایید:`,
    keyboard: [
      ["ثبت‌نام مدارس با آمایش و پاسپورت", "برگه حمایت تحصیلی فاقدین مدرک"],
      ["نوبت‌گیری سنجش سلامت (my.medu.ir)", "کنکور و ورود به دانشگاه‌ها"],
      ["قوانین شهریه مدارس دولتی", "بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "awaiting_education_topic" }
  };
}

// 6. GPS Routing Service with Neshan, Balad, and Google Maps Links
const GPS_PROVINCES: Record<string, Array<{ name: string; address: string; phone: string; lat: number; lng: number }>> = {
  "تهران": [
    { name: "دفتر کفالت ۱۰۱ تهران (شهرری)", address: "شهرری، میدان معلم، خیابان زکریای رازی", phone: "۰۲۱۵۵۹۰۰۱۱۱", lat: 35.5900, lng: 51.4350 },
    { name: "دفتر کفالت ۱۰۳ ورامین", address: "ورامین، خیابان مسجد جامع، مجتمع نگین", phone: "۰۲۱۳۶۲۷۰۰۲۲", lat: 35.3242, lng: 51.6480 },
    { name: "دفتر کفالت ۱۰۵ پاکدشت", address: "پاکدشت، دوراهی یبر، بلوار شهدای قمی", phone: "۰۲۱۳۶۰۲۰۰۳۳", lat: 35.5312, lng: 51.6780 }
  ],
  "مشهد": [
    { name: "دفتر کفالت ۲۰۱ مشهد (گلشهر)", address: "مشهد، گلشهر، بلوار شهید آوینی، آوینی ۱۷", phone: "۰۵۱۳۲۵۹۰۰۴۴", lat: 36.2972, lng: 59.6067 },
    { name: "دفتر کفالت ۲۰۳ مشهد (طبرسی)", address: "مشهد، بلوار طبرسی شمالی، طبرسی ۲۸", phone: "۰۵۱۳۲۱۵۰۰۵۵", lat: 36.3120, lng: 59.6350 }
  ],
  "اصفهان": [
    { name: "دفتر کفالت ۳۰۱ اصفهان (زینبیه)", address: "اصفهان، خیابان زینبیه، جنب ایستگاه مترو", phone: "۰۳۱۳۵۵۱۰۰۶۶", lat: 32.6546, lng: 51.6680 },
    { name: "دفتر کفالت ۳۰۲ فلاورجان", address: "فلاورجان، خیابان امام خمینی، جنب فرمانداری", phone: "۰۳۱۳۷۴۲۰۰۷۷", lat: 32.5530, lng: 51.5120 }
  ],
  "فارس": [
    { name: "دفتر کفالت ۴۰۱ شیراز (محراب)", address: "شیراز، بلوار مدرس، خیابان محراب", phone: "۰۷۱۳۷۲۶۰۰۸۸", lat: 29.5918, lng: 52.5837 }
  ],
  "قم": [
    { name: "دفتر کفالت ۵۰۱ قم (پردیسان)", address: "قم، شهرک پردیسان، بلوار دانشگاه، مجتمع امیر", phone: "۰۲۵۳۲۸۰۰۰۹۹", lat: 34.6399, lng: 50.8759 }
  ],
  "البرز": [
    { name: "دفتر کفالت ۶۰۱ کرج (فردیس)", address: "کرج، فردیس، فلکه چهارم، خیابان ۴۷ جدید", phone: "۰۲۶۳۶۵۰۰۰۱۱", lat: 35.8327, lng: 50.9915 }
  ],
  "یزد": [
    { name: "دفتر کفالت ۷۰۱ یزد", address: "یزد، بلوار ۱۷ شهریور، نرسیده به میدان معلم", phone: "۰۳۵۳۷۲۵۰۰۲۲", lat: 31.8974, lng: 54.3569 }
  ],
  "کرمان": [
    { name: "دفتر کفالت ۸۰۱ کرمان", address: "کرمان، بلوار جمهوری اسلامی، نبش کوچه ۲۰", phone: "۰۳۴۳۲۴۴۰۰۳۳", lat: 30.2839, lng: 57.0788 }
  ]
};

async function handleGpsRouting(provinceQuery: string): Promise<BotResponse> {
  const p = provinceQuery.trim();

  if (p === "بازگشت به منوی اصلی") {
    return {
      replyText: "بازگشت به منوی اصلی سیستم:",
      keyboard: MAIN_KEYBOARD,
      sessionState: { step: "idle" }
    };
  }

  let matchedKey = "";
  if (p.includes("تهران") || p.includes("شهرری")) matchedKey = "تهران";
  else if (p.includes("مشهد") || p.includes("خراسان")) matchedKey = "مشهد";
  else if (p.includes("اصفهان")) matchedKey = "اصفهان";
  else if (p.includes("شیراز") || p.includes("فارس")) matchedKey = "فارس";
  else if (p.includes("قم")) matchedKey = "قم";
  else if (p.includes("البرز") || p.includes("کرج")) matchedKey = "البرز";
  else if (p.includes("یزد")) matchedKey = "یزد";
  else if (p.includes("کرمان")) matchedKey = "کرمان";

  if (!matchedKey || !GPS_PROVINCES[matchedKey]) {
    return {
      replyText: `🗺 **مسیریابی دفاتر کفالت با نشان، بلد و نقشه:**\n\nلطفاً یکی از استان‌های زیر را جهت مشاهده لیست شعب و لینک‌های مسیریابی انتخاب فرمایید:`,
      keyboard: [
        ["تهران و شهرری", "خراسان رضوی (مشهد)"],
        ["اصفهان", "فارس (شیراز)"],
        ["قم", "البرز (کرج)"],
        ["یزد و کرمان", "سایر استان‌ها"],
        ["بازگشت به منوی اصلی"]
      ],
      sessionState: { step: "awaiting_gps_province" }
    };
  }

  const offices = GPS_PROVINCES[matchedKey];
  let reply = `📍 **شعب و دفاتر کفالت فعال در استان ${matchedKey}:**\n\n`;

  offices.forEach((o, i) => {
    const neshanUrl = `https://neshan.org/maps/@${o.lat},${o.lng},16z`;
    const baladUrl = `https://balad.ir/location?latitude=${o.lat}&longitude=${o.lng}`;
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`;

    reply += `🏢 **${i + 1}. ${o.name}**\n`;
    reply += `▫️ **آدرس:** ${o.address}\n`;
    reply += `▫️ ${formatClickablePhone(o.phone)}\n`;
    reply += `▫️ 📍 **لوکیشن:** [باز کردن در نشان، بلد یا نقشه گوشی](https://maps.google.com/?q=${o.lat},${o.lng})\n`;
    reply += `------------------------------------\n`;
  });

  reply += `\n💡 با لمس لینک لوکیشن، موقعیت به صورت خودکار در مسیریاب فعال گوشی شما (نشان، بلد یا گوگل‌مپ) باز می‌شود.`;

  return {
    replyText: reply,
    keyboard: [
      ["تهران و شهرری", "خراسان رضوی (مشهد)"],
      ["اصفهان", "فارس (شیراز)"],
      ["قم", "البرز (کرج)"],
      ["بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "awaiting_gps_province" }
  };
}

function getPlatformName(platform: string): string {
  switch (platform) {
    case "soroush": return "سروش پلاس (Soroush+)";
    case "eitaa": return "ایتا (Eitaa)";
    case "bale": return "بله (Bale)";
    case "rubika": return "روبیکا (Rubika)";
    case "gap": return "گپ (Gap)";
    case "igap": return "ایگپ (iGap)";
    case "telegram": return "تلگرام (Telegram)";
    default: return "پیام‌رسان";
  }
}

async function handleJobPortalList(): Promise<BotResponse> {
  let jobs = INITIAL_JOBS;
  try {
    const snap = await getDocs(query(collection(db, "job_postings"), orderBy("createdAt", "desc"), limit(10)));
    if (!snap.empty) {
      const dbJobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      jobs = [...dbJobs, ...INITIAL_JOBS];
    }
  } catch {
    // fallback to initial
  }

  const activeJobs = jobs.slice(0, 4);
  let reply = `💼 **آخرین فرصت‌های شغلی مجاز با امکان جای خواب و پروانه کار:**\n\n`;

  activeJobs.forEach((job, idx) => {
    reply += `📌 **${idx + 1}. ${job.title}**\n`;
    reply += `🏙 **محل کار:** ${job.city} (${job.province})\n`;
    reply += `💰 **حقوق و مزایا:** ${job.salary}\n`;
    reply += `🏠 **امکانات:** ${job.hasAccommodation ? "✅ دارای جای خواب کارگری" : "بدون جای خواب"} | ${job.hasFood ? "✅ وعده غذایی" : "بدون غذا"}\n`;
    reply += `📜 **پروانه کار:** ${job.requiresWorkPermit ? "پروانه کار الزامی است" : "امکان دریافت پروانه کار"}\n`;
    reply += `👤 **کارفرما:** ${job.employerName}\n`;
    reply += `▫️ ${formatClickablePhone(job.contactPhone)}\n`;
    reply += `────────────────────\n`;
  });

  reply += `\n💡 جهت ثبت آگهی استخدام یا ثبت رزومه کارجویی، گزینه‌های زیر را لمس فرمایید:`;

  return {
    replyText: reply,
    keyboard: [
      ["📢 ثبت آگهی استخدام (کارفرما)", "👤 ثبت مشخصات و رزومه (کارجو)"],
      ["بازگشت به منوی اصلی"]
    ],
    sessionState: { step: "awaiting_job_portal_action" }
  };
}

