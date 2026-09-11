import { collection, getDocs, addDoc, doc, setDoc, Timestamp, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { getPlatformLockConfig } from "../data/channelLockSettings";

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
  ["🏢 جستجوی دفاتر کفالت", "🏛 سفارت‌ها و کنسولگری‌ها"],
  ["⭐ نظرسنجی و ثبت نظر دفتر کفالت", "🪪 اسناد و مدارک مفقودی"],
  ["🌐 سایت‌های خدماتی", "❓ سوالات متداول"],
  ["📝 ثبت درخواست آنلاین", "🔍 پیگیری وضعیت درخواست"],
  ["📢 آخرین اخبار و بخشنامه‌ها", "📞 ارتباط با پشتیبانی"]
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

  // 1. Kefalat Office Search Step
  if (state.step === "awaiting_branch_search") {
    return await handleKefalatOfficeSearch(text);
  }

  // 2. Embassy Search Step
  if (state.step === "awaiting_embassy_search") {
    return await handleEmbassySearch(text);
  }

  // 3. Tracking Code Step
  if (state.step === "awaiting_tracking_code") {
    return await handleTrackingSearch(text);
  }

  // 4. Online Booking / Registration Flow
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

  // -------------------------------------------------------------
  // Main Menu Keyword Dispatcher
  // -------------------------------------------------------------

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
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    let matches = all;
    if (!showAll) {
      matches = all.filter(e => 
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.address && e.address.toLowerCase().includes(q)) ||
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

    let result = `🏛 **اطلاعات سفارت‌ها و کنسولگری‌ها:**\n\n`;
    matches.forEach(e => {
      result += `📌 **${e.name || "سفارت / کنسولگری"}**\n`;
      result += `▫️ **آدرس:** ${e.address || "نامشخص"}\n`;
      if (e.phone) result += `▫️ **تلفن تماس:** ${formatClickablePhone(e.phone)}\n`;
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
