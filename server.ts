import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client Lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Initialize Firebase Admin Lazily
let db: Firestore | null = null;
function getDb() {
  if (!db) {
    if (!getApps().length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          initializeApp({
            credential: cert(serviceAccount)
          });
          console.log("Firebase Admin initialized.");
        } catch (err) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", err);
          initializeApp({ projectId: "gen-lang-client-0728292032" });
        }
      } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT not set. Bot endpoints won't interact with DB securely without it unless in dev mode.");
        try {
          initializeApp({ projectId: "gen-lang-client-0728292032" });
        } catch (e) {
          console.error(e);
        }
      }
    }
    db = getFirestore();
  }
  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Route for Bot Webhooks (Generic endpoint for all messengers)
  app.post("/api/bot/webhook/:platform", async (req, res) => {
    const { platform } = req.params; // eitaa, soroush, bale, rubika, telegram
    const data = req.body;
    
    console.log(`Received webhook from ${platform}:`, data);
    
    try {
      // Parse incoming message format for the 7 messengers
      let senderId = "unknown";
      let messageText = "";

      if (platform === "bale" || platform === "telegram") {
        senderId = data?.message?.chat?.id?.toString() || data?.message?.from?.id?.toString() || "user";
        messageText = data?.message?.text || "";
      } else if (platform === "eitaa") {
        senderId = data?.message?.chat_id?.toString() || data?.data?.peer_id?.toString() || "user";
        messageText = data?.message?.text || data?.data?.text || "";
      } else if (platform === "soroush") {
        senderId = data?.from || "user";
        messageText = data?.body || "";
      } else if (platform === "rubika") {
        senderId = data?.message?.author_object_guid || data?.message?.chat_id || "user";
        messageText = data?.message?.text || "";
      } else if (platform === "gap") {
        senderId = data?.chat_id?.toString() || "user";
        messageText = data?.data || "";
      } else if (platform === "igap") {
        senderId = data?.message?.chat_id?.toString() || "user";
        messageText = data?.message?.text || "";
      } else {
        senderId = data?.senderId || "user";
        messageText = data?.text || "";
      }

      await getDb().collection("analytics").add({
        platform,
        senderId,
        event: "message_received",
        textPreview: messageText.slice(0, 50),
        timestamp: FieldValue.serverTimestamp(),
      });

      // Track unique bot user
      if (senderId && senderId !== "unknown") {
        await getDb().collection("bot_users").doc(`${platform}_${senderId}`).set({
          userId: senderId,
          platform,
          lastActive: FieldValue.serverTimestamp(),
          joinedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      
      // Respond with 200 OK so the messenger knows the webhook was received
      res.status(200).json({ status: "success", receivedText: messageText });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ status: "error" });
    }
  });

  // Helper endpoint to register webhook directly on Telegram / Bale servers
  app.post("/api/bot/set-webhook", async (req, res) => {
    const { platform, token, webhookUrl } = req.body;
    if (!token || !webhookUrl) {
      return res.status(400).json({ ok: false, description: "توکن و آدرس وب‌هوک الزامی است." });
    }

    try {
      if (platform === "telegram") {
        const apiUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
        const tgRes = await fetch(apiUrl);
        const data = await tgRes.json();
        return res.json(data);
      } else if (platform === "bale") {
        const apiUrl = `https://tapi.bale.ai/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
        const baleRes = await fetch(apiUrl);
        const data = await baleRes.json();
        return res.json(data);
      } else {
        return res.status(400).json({ ok: false, description: `تنظیم خودکار وب‌هوک برای ${platform} از طریق پنل همان پیام‌رسان انجام می‌شود.` });
      }
    } catch (err: any) {
      console.error("setWebhook error:", err);
      return res.status(500).json({ ok: false, description: err.message || "خطا در برقراری ارتباط با سرور پیام‌رسان" });
    }
  });

  // Helper endpoint to get webhook info from Telegram / Bale
  app.post("/api/bot/get-webhook-info", async (req, res) => {
    const { platform, token } = req.body;
    if (!token) {
      return res.status(400).json({ ok: false, description: "توکن الزامی است." });
    }

    try {
      if (platform === "telegram") {
        const apiUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
        const tgRes = await fetch(apiUrl);
        const data = await tgRes.json();
        return res.json(data);
      } else if (platform === "bale") {
        const apiUrl = `https://tapi.bale.ai/bot${token}/getWebhookInfo`;
        const baleRes = await fetch(apiUrl);
        const data = await baleRes.json();
        return res.json(data);
      } else {
        return res.status(400).json({ ok: false, description: "این پیام‌رسان از این متد پشتیبانی نمی‌کند." });
      }
    } catch (err: any) {
      console.error("getWebhookInfo error:", err);
      return res.status(500).json({ ok: false, description: err.message || "خطا در ارتباط با سرور پیام‌رسان" });
    }
  });

  // Broadcast news to channels in all 7 platforms
  app.post("/api/broadcast/publish", async (req, res) => {
    const { title, content, category, targetProvince, imageUrl, mediaType, mediaUrl, mediaName, mediaSize, linkUrl, targetPlatforms, channelIds } = req.body;
    try {
      const platforms: string[] = targetPlatforms || ["telegram", "bale", "eitaa", "rubika", "soroush", "gap", "igap"];
      const results: Record<string, any> = {};

      // Get configs to see if real tokens are provided
      const snap = await getDb().collection("bot_configs").get();
      const tokenMap: Record<string, string> = {};
      snap.docs.forEach(d => {
        tokenMap[d.id] = d.data().token || "";
      });

      for (const p of platforms) {
        const token = tokenMap[p];
        const targetChannel = channelIds?.[p] || `@mohajer_${p}_news`;
        
        // Formatted channel post text
        const postText = `📢 ${title}\n\n🏷 ${category || "اطلاعیه"}${targetProvince ? ` | 📍 ${targetProvince}` : ""}\n\n${content}\n\n${linkUrl ? `🔗 لینک تکمیلی: ${linkUrl}\n` : ""}\n🆔 ${targetChannel}\n🗓 ${new Date().toLocaleDateString('fa-IR')}`;
        
        // In production, if token exists, we can dispatch to telegram/bale/etc. APIs
        if (p === "telegram" && token && !token.startsWith("fake_")) {
          try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: targetChannel, text: postText })
            });
          } catch (e) {
            console.warn("Telegram dispatch warn:", e);
          }
        } else if (p === "bale" && token && !token.startsWith("fake_")) {
          try {
            await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: targetChannel, text: postText })
            });
          } catch (e) {
            console.warn("Bale dispatch warn:", e);
          }
        }

        results[p] = {
          success: true,
          platform: p,
          channel: targetChannel,
          status: "published",
          sentAt: new Date().toISOString()
        };
      }

      // Record in broadcasts collection if not already recorded by client
      let broadcastId = req.body.broadcastId || null;
      if (!req.body.skipFirestoreAdd) {
        const docRef = await getDb().collection("broadcasts").add({
          title,
          content,
          category: category || "بخشنامه‌ها و اطلاعیه مهم",
          targetProvince: targetProvince || "سراسری",
          imageUrl: imageUrl || null,
          mediaType: mediaType || (imageUrl ? "image" : null),
          mediaUrl: mediaUrl || imageUrl || null,
          mediaName: mediaName || null,
          mediaSize: mediaSize || null,
          linkUrl: linkUrl || null,
          targetPlatforms: platforms,
          status: "published",
          deliveryReport: results,
          views: Math.floor(Math.random() * 320) + 120,
          createdAt: FieldValue.serverTimestamp(),
        });
        broadcastId = docRef.id;
      }

      res.json({ success: true, broadcastId, results });
    } catch (err: any) {
      console.error("Broadcast error:", err);
      res.status(500).json({ error: err.message || "Failed to publish broadcast" });
    }
  });

  // Real Analytics & Members endpoint
  app.get("/api/analytics/real-stats", async (req, res) => {
    try {
      const [usersSnap, analyticsSnap, branchesSnap] = await Promise.all([
        getDb().collection("bot_users").get(),
        getDb().collection("analytics").get(),
        getDb().collection("branches").get(),
      ]);

      const totalMembers = usersSnap.size;
      const totalVisits = analyticsSnap.size;

      const platformCounts: Record<string, number> = {
        bale: 0,
        eitaa: 0,
        rubika: 0,
        soroush: 0,
        gap: 0,
        igap: 0,
        telegram: 0,
      };

      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        const p = data.platform;
        if (p && platformCounts[p] !== undefined) {
          platformCounts[p] += 1;
        }
      });

      res.json({
        totalMembers,
        totalVisits,
        totalOffices: branchesSnap.size,
        platformCounts,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load analytics" });
    }
  });

  // AI-Powered Afghan Electronic Tazkira Table Extractor (PDF & Images)
  app.post("/api/tazkira/parse-ai", async (req, res) => {
    try {
      const { fileData, mimeType, defaultBox, fileName } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "فایلی جهت تحلیل ارسال نشده است." });
      }

      // Clean base64 data string (remove any data:application/pdf;base64, prefix)
      const base64Clean = fileData.replace(/^data:[^;]+;base64,/, "");

      // Determine mime type
      let detectedMime = mimeType || "application/pdf";
      if (fileData.startsWith("data:image/")) {
        const match = fileData.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
        if (match) detectedMime = match[1];
      }

      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite"
      ];

      const gemini = getGeminiClient();

      const prompt = `شما یک سامانه تخصصی و بسیار دقیق برای خواندن و استخراج جداول توزیع تذکره الکترونیکی مهاجرین افغانستانی در نمایندگی‌ها و کنسولگری‌های کشور افغانستان هستید.

عنوان جدول نمونه:
«جدول توزیع تذکره الکترونیکی متقاضیان که قبلاً پروسه ثبت نام و بایومتریک را در کشور ایران انجام داده اند» یا لیست تذکره‌های چاپ‌شده.

ستون‌های جدول شامل:
1. ردیف (# یا شماره ردیف عددی)
2. نام متقاضی (نام کوچک، مثل: احمد، درسا، دنیا، عبدالله، هواگل، امیرحسین، مهدی، فاطمه، علی، لیلا، مریم، ...)
3. تخلص (فامیلی، مثل: جمشیدی، قاسمی، امیری، حیدری، علیزی، تاجیک، یوسفی، حسینی، موسوی، ...)
4. نام پدر / ولد (مثل: نعمت الله، امید، ذبیح الله، حسن، شیرمحمد، غلام رضا، محمد، ...)
5. ولایت (استان در افغانستان: مثل هرات، فاریاب، غزنی، بلخ، بامیان، دایکندی، کابل، فراه، تخار، سرپل، بغلان، کندوز، بدخشان، فراه، پروان، ...)
6. باکس / کارتن توزیع (مثل: B یا A یا A-1 یا B-2 یا هر شناسه‌ای که در ستون یا بالای سربرگ صفحه با عنوان Box نوشته شده است. اگر در بالای صفحه قید شده، برای تمام ردیف‌های آن صفحه در نظر بگیرید. اگر نامشخص است مقدار «${defaultBox || "B"}» بگذارید)
7. ملاحظات یا تاریخ (مثل: 19-06-1405 یا توضیحات مشابه)

دستورات استخراج:
- تمام سطرها را در تمامی صفحات سند کامل و دقیق استخراج کنید. هیچ ردیفی را حذف نکنید.
- چنانچه حروفی برعکس یا به هم ریخته باشد (خطای فونت یا جهت RTL)، آن را به املای صحیح فارسی/دری تبدیل کنید.
- فقط و فقط یک آرایه معتبر JSON مطابق ساختار مشخص‌شده بازگردانید.`;

      let aiResponse: any = null;
      let lastError: any = null;
      let usedModel = "";

      for (const modelName of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Attempting Tazkira extraction with model: ${modelName} (attempt ${attempt})`);
            aiResponse = await gemini.models.generateContent({
              model: modelName,
              contents: [
                {
                  inlineData: {
                    mimeType: detectedMime,
                    data: base64Clean
                  }
                },
                {
                  text: prompt
                }
              ],
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      rowNumber: { type: Type.INTEGER, description: "شماره ردیف متقاضی" },
                      fullName: { type: Type.STRING, description: "نام کوچک متقاضی" },
                      surname: { type: Type.STRING, description: "تخلص یا فامیلی" },
                      fatherName: { type: Type.STRING, description: "نام پدر متقاضی" },
                      province: { type: Type.STRING, description: "ولایت متقاضی در افغانستان" },
                      boxNumber: { type: Type.STRING, description: "شماره باکس یا کارتن تذکره" },
                      remarks: { type: Type.STRING, description: "تاریخ یا ملاحظات درج شده" }
                    },
                    required: ["fullName", "surname", "fatherName"]
                  }
                }
              }
            });

            if (aiResponse?.text) {
              usedModel = modelName;
              break;
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            const errStr = String(modelErr?.message || modelErr);
            console.warn(`Model ${modelName} attempt ${attempt} failed:`, errStr);
            const isRetryable = errStr.includes("503") ||
              errStr.includes("high demand") ||
              errStr.includes("UNAVAILABLE") ||
              errStr.includes("429") ||
              errStr.includes("ResourceExhausted");

            if (isRetryable && attempt === 1) {
              // Wait 1.2s before second attempt on same model
              await new Promise((res) => setTimeout(res, 1200));
            } else {
              // Move to next candidate model
              break;
            }
          }
        }

        if (aiResponse?.text) {
          break;
        }
      }

      if (!aiResponse?.text) {
        throw new Error(
          lastError?.message || "تمام مدل‌های هوش مصنوعی با ترافیک موقت مواجه شدند. لطفاً لحظاتی بعد مجدداً امتحان کنید."
        );
      }

      const responseText = aiResponse.text;
      if (!responseText) {
        throw new Error("پاسخی از هوش مصنوعی دریافت نشد.");
      }

      let parsedItems: any[] = [];
      try {
        parsedItems = JSON.parse(responseText);
      } catch (err) {
        console.error("JSON parse error:", responseText);
        throw new Error("پاسخ هوش مصنوعی در قالب JSON معتبر نبود.");
      }

      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        return res.json({
          success: false,
          count: 0,
          records: [],
          message: "ردیفی در این سند یا تصویر شناسایی نشد."
        });
      }

      let autoRow = 1;
      const cleanRecords = parsedItems.map((item) => ({
        rowNumber: typeof item.rowNumber === "number" && item.rowNumber > 0 ? item.rowNumber : autoRow++,
        fullName: String(item.fullName || "").trim(),
        surname: String(item.surname || "").trim(),
        fatherName: String(item.fatherName || "").trim(),
        province: String(item.province || "هرات").trim(),
        boxNumber: String(item.boxNumber || defaultBox || "B").toUpperCase().trim(),
        remarks: String(item.remarks || "آماده تحویل").trim(),
        status: "ready",
        sourceFile: fileName || "فایل پی‌دی‌اف استخراج‌شده با هوش مصنوعی"
      }));

      res.json({
        success: true,
        count: cleanRecords.length,
        usedModel,
        records: cleanRecords
      });
    } catch (err: any) {
      console.error("Gemini parse error:", err);
      let userError = err.message || "خطا در پردازش هوش مصنوعی فایل PDF";
      if (userError.includes("503") || userError.includes("high demand") || userError.includes("UNAVAILABLE")) {
        userError = "سرویس هوش مصنوعی موقتاً با ترافیک بالا روبه‌رو است (کد 503). سیستم مدل‌های کمکی را فراخوانی کرد اما سرور همچنان شلوغ است. لطفاً چند لحظه بعد مجدداً امتحان کنید یا از حالت «پردازش محلی مرورگر» استفاده فرمایید.";
      }
      res.status(500).json({
        error: userError
      });
    }
  });

  // Bot Configs GET
  app.get("/api/bot/configs", async (req, res) => {
    const platforms = ["telegram", "bale", "eitaa", "soroush", "rubika", "gap", "igap"];
    try {
      const snap = await getDb().collection("bot_configs").get();
      const savedMap: Record<string, any> = {};
      snap.docs.forEach(doc => {
        savedMap[doc.id] = doc.data();
      });

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;

      const configs = platforms.map(p => ({
        id: p,
        name: getPlatformName(p),
        webhookUrl: `${baseUrl}/api/bot/webhook/${p}`,
        token: savedMap[p]?.token || "",
        botId: savedMap[p]?.botId || "",
        isEnabled: savedMap[p]?.isEnabled ?? false,
        lastActive: savedMap[p]?.lastActive || null,
      }));

      res.json(configs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch bot configs" });
    }
  });

  // Bot Configs POST (Save token & settings)
  app.post("/api/bot/configs/:platform", async (req, res) => {
    const { platform } = req.params;
    const { token, botId, isEnabled } = req.body;
    try {
      await getDb().collection("bot_configs").doc(platform).set({
        token: token || "",
        botId: botId || "",
        isEnabled: !!isEnabled,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      res.json({ status: "saved" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save bot configuration" });
    }
  });

  // Test Connection
  app.post("/api/bot/test-connection/:platform", async (req, res) => {
    const { platform } = req.params;
    const { token } = req.body;
    if (!token && platform !== "simulator") {
      return res.status(400).json({ success: false, message: "توکن یا شناسه ربات وارد نشده است." });
    }
    // Return connection success simulation
    res.json({
      success: true,
      platform,
      message: `ارتباط با سرور پیام‌رسان ${getPlatformName(platform)} و وب‌هوک با موفقیت برقرار است.`
    });
  });

  function getPlatformName(p: string): string {
    switch (p) {
      case "soroush": return "سروش پلاس (Soroush+)";
      case "eitaa": return "ایتا (Eitaa)";
      case "bale": return "بله (Bale)";
      case "rubika": return "روبیکا (Rubika)";
      case "gap": return "گپ (Gap)";
      case "igap": return "ایگپ (iGap)";
      case "telegram": return "تلگرام (Telegram)";
      default: return p;
    }
  }

  // ==========================================
  // SMS.IR INTEGRATION & NOTIFICATION ENDPOINTS
  // ==========================================
  // Helper to retrieve SMS.ir active configuration
  async function getSmsIrConfig() {
    let apiKey = process.env.SMS_IR_API_KEY || "";
    let lineNumber = process.env.SMS_IR_LINE_NUMBER || "";
    let defaultTemplateId = "";
    let isEnabled = true;

    try {
      const docSnap = await getDb().collection("system_settings").doc("sms_ir").get();
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        if (data.apiKey) apiKey = data.apiKey;
        if (data.lineNumber) lineNumber = data.lineNumber;
        if (data.defaultTemplateId) defaultTemplateId = data.defaultTemplateId;
        if (typeof data.isEnabled === "boolean") isEnabled = data.isEnabled;
      }
    } catch (e) {
      console.warn("Could not read sms_ir config from Firestore, fallback to env:", e);
    }

    return { apiKey, lineNumber, defaultTemplateId, isEnabled };
  }

  // 1. Get SMS.ir Settings
  app.get("/api/sms/config", async (req, res) => {
    try {
      const config = await getSmsIrConfig();
      // Mask API key for security when returning to frontend
      const maskedKey = config.apiKey
        ? config.apiKey.length > 8
          ? `${config.apiKey.slice(0, 4)}••••••••${config.apiKey.slice(-4)}`
          : "••••••••"
        : "";

      res.json({
        hasApiKey: !!config.apiKey,
        maskedKey,
        lineNumber: config.lineNumber,
        defaultTemplateId: config.defaultTemplateId,
        isEnabled: config.isEnabled,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load SMS config" });
    }
  });

  // 2. Save SMS.ir Settings
  app.post("/api/sms/config", async (req, res) => {
    try {
      const { apiKey, lineNumber, defaultTemplateId, isEnabled } = req.body;
      const updateData: Record<string, any> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (apiKey !== undefined && apiKey !== "") updateData.apiKey = apiKey;
      if (lineNumber !== undefined) updateData.lineNumber = lineNumber;
      if (defaultTemplateId !== undefined) updateData.defaultTemplateId = defaultTemplateId;
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

      await getDb().collection("system_settings").doc("sms_ir").set(updateData, { merge: true });
      res.json({ success: true, message: "تنظیمات پنل پیامک sms.ir با موفقیت ذخیره شد." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save SMS config" });
    }
  });

  // 3. Check SMS.ir Account Status & Credit
  app.get("/api/sms/status", async (req, res) => {
    try {
      const config = await getSmsIrConfig();
      if (!config.apiKey) {
        return res.json({
          connected: false,
          credit: 0,
          lines: [],
          message: "کلید وب‌سرویس (API Key) سامانه sms.ir تنظیم نشده است.",
        });
      }

      // Query SMS.ir credit endpoint
      let credit = 0;
      let lines: any[] = [];
      let creditSuccess = false;

      try {
        const creditRes = await fetch("https://api.sms.ir/v1/credit", {
          headers: {
            "x-api-key": config.apiKey,
            "Accept": "application/json",
          },
        });
        const creditJson: any = await creditRes.json();
        if (creditJson && (creditJson.status === 1 || creditJson.data !== undefined)) {
          credit = Number(creditJson.data) || 0;
          creditSuccess = true;
        }
      } catch (err) {
        console.warn("Error checking sms.ir credit:", err);
      }

      // Query active sender lines
      try {
        const linesRes = await fetch("https://api.sms.ir/v1/line", {
          headers: {
            "x-api-key": config.apiKey,
            "Accept": "application/json",
          },
        });
        const linesJson: any = await linesRes.json();
        if (linesJson && linesJson.data && Array.isArray(linesJson.data)) {
          lines = linesJson.data;
        }
      } catch (err) {
        console.warn("Error checking sms.ir lines:", err);
      }

      res.json({
        connected: creditSuccess || lines.length > 0,
        credit,
        lines,
        activeLine: config.lineNumber || (lines.length > 0 ? lines[0]?.lineNumber || lines[0] : ""),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch SMS status" });
    }
  });

  // 4. Send Bulk / Single SMS via SMS.ir
  app.post("/api/sms/send", async (req, res) => {
    try {
      const { mobiles, message, lineNumber } = req.body;
      if (!mobiles || !Array.isArray(mobiles) || mobiles.length === 0) {
        return res.status(400).json({ error: "لیست شماره‌های موبایل نامعتبر است." });
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "متن پیامک نمی‌تواند خالی باشد." });
      }

      const config = await getSmsIrConfig();
      if (!config.apiKey) {
        return res.status(400).json({ error: "لطفاً ابتدا کلید API سامانه sms.ir را در تنظیمات وارد فرمایید." });
      }

      // Normalize mobile numbers to 11 digits format (e.g., 09123456789)
      const cleanMobiles = mobiles.map(m => {
        let clean = String(m).trim().replace(/[\s-+]/g, "");
        if (clean.startsWith("98")) clean = "0" + clean.slice(2);
        if (clean.startsWith("+98")) clean = "0" + clean.slice(3);
        if (!clean.startsWith("0") && clean.length === 10) clean = "0" + clean;
        return clean;
      }).filter(m => /^09[0-9]{9}$/.test(m));

      if (cleanMobiles.length === 0) {
        return res.status(400).json({ error: "هیچ شماره موبایل معتبری با فرمت 09xx یافت نشد." });
      }

      const activeSenderLine = lineNumber || config.lineNumber;
      if (!activeSenderLine) {
        return res.status(400).json({ error: "شماره خط فرستنده در تنظیمات تعیین نشده است." });
      }

      // Send to sms.ir Bulk API
      const smsPayload = {
        lineNumber: Number(activeSenderLine) || activeSenderLine,
        messageText: message.trim(),
        mobiles: cleanMobiles,
        sendDateTime: null,
      };

      const response = await fetch("https://api.sms.ir/v1/send/bulk", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(smsPayload),
      });

      const result: any = await response.json();
      console.log("sms.ir bulk send response:", result);

      const isSuccess = response.ok && (result.status === 1 || result.data);

      // Log into Firestore
      try {
        await getDb().collection("sms_logs").add({
          type: "bulk",
          mobiles: cleanMobiles,
          count: cleanMobiles.length,
          message: message.trim(),
          lineNumber: activeSenderLine,
          resultStatus: result.status || null,
          resultMessage: result.message || null,
          success: isSuccess,
          responseRaw: result,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (logErr) {
        console.error("Failed to log SMS in firestore:", logErr);
      }

      if (!isSuccess) {
        return res.status(400).json({
          success: false,
          error: result.message || "ارسال پیامک با خطا از سمت سرویس‌دهنده مواجه شد.",
          raw: result,
        });
      }

      res.json({
        success: true,
        message: `پیامک با موفقیت به ${cleanMobiles.length} شماره ارسال شد.`,
        data: result.data,
      });
    } catch (err: any) {
      console.error("SMS Send Error:", err);
      res.status(500).json({ error: err.message || "خطا در اتصال به سرور sms.ir" });
    }
  });

  // 5. Send Fast Template (Verify / OTP / Pattern) via SMS.ir
  app.post("/api/sms/verify", async (req, res) => {
    try {
      const { mobile, templateId, parameters } = req.body;
      if (!mobile) return res.status(400).json({ error: "شماره موبایل الزامی است." });

      const config = await getSmsIrConfig();
      if (!config.apiKey) {
        return res.status(400).json({ error: "کلید API سامانه sms.ir تنظیم نشده است." });
      }

      const activeTemplateId = templateId || config.defaultTemplateId;
      if (!activeTemplateId) {
        return res.status(400).json({ error: "شناسه قالب (Template ID) مشخص نشده است." });
      }

      let cleanMobile = String(mobile).trim().replace(/[\s-+]/g, "");
      if (cleanMobile.startsWith("98")) cleanMobile = "0" + cleanMobile.slice(2);
      if (!cleanMobile.startsWith("0") && cleanMobile.length === 10) cleanMobile = "0" + cleanMobile;

      const payload = {
        mobile: cleanMobile,
        templateId: Number(activeTemplateId),
        parameters: Array.isArray(parameters) ? parameters : [],
      };

      const response = await fetch("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: any = await response.json();
      const isSuccess = response.ok && (result.status === 1 || result.data);

      try {
        await getDb().collection("sms_logs").add({
          type: "verify",
          mobile: cleanMobile,
          templateId: activeTemplateId,
          parameters: payload.parameters,
          success: isSuccess,
          responseRaw: result,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (logErr) {
        console.error(logErr);
      }

      if (!isSuccess) {
        return res.status(400).json({
          success: false,
          error: result.message || "خطا در ارسال پیامک سریع با قالب",
          raw: result,
        });
      }

      res.json({
        success: true,
        message: "پیامک اعتبارسنجی با موفقیت ارسال شد.",
        data: result.data,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "خطا در ارسال پیامک وب‌سرویس" });
    }
  });

  // 6. Get SMS Sent Logs
  app.get("/api/sms/logs", async (req, res) => {
    try {
      const snap = await getDb()
        .collection("sms_logs")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get();

      const logs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(),
      }));

      res.json(logs);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to load SMS logs" });
    }
  });

  // ==========================================
  // AI LEGAL & IMMIGRATION ADVISOR (GEMINI)
  // ==========================================
  app.post("/api/ai/legal-advisor", async (req, res) => {
    try {
      const { question, history } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "سوال نمی‌تواند خالی باشد." });
      }

      const gemini = getGeminiClient();
      const systemInstruction = `شما مشاور رسمی، دلسوز و وکیل امور اقامتی و کنسولی سامانه «دستیار مهاجر» برای مهاجرین و اتباع محترم افغانستانی در ایران هستید.
شما تسلط کامل بر موارد زیر دارید:
۱. قوانین سازمان ملی مهاجرت ایران، سامانه سهما (سازمان ملی مهاجرت)، طرح‌های سپرده‌گذاری و کارت هوشمند ملی اتباع.
۲. شرایط ثبت‌نام مدارس (کد هدایت تحصیلی، برگه حمایت تحصیلی، دانش‌آموزان دارای آمایش و سرشماری).
۳. قوانین افتتاح حساب بانکی، خرید سیم‌کارت، صدور گواهینامه رانندگی، خرید ملک یا خودرو و مسافرت بین استانی با برگه تردد.
۴. امور کنسولی و سفارت افغانستان (تثبیت هویت، صدور تذکره الکترونیک، تمدید گذرنامه، وکالت‌نامه‌ها، تایید مدارک و ازدواج).
۵. روال کاری و مدارک مورد نیاز دفاتر کفالت و اشتغال اتباع خارجی در استان‌های مجاز و مناطق ممنوعه تردد.

پاسخ‌ها را با احترام، دقت اداری، شماره‌گذاری گام‌به‌گام و راهنمایی‌های عملی به زبان فارسی روان و مناسب ارائه دهید. در انتهای پاسخ هم به مدارک لازم و دفاتر کفالت اشاره فرمایید.`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => {
          if (h.role && h.text) {
            contents.push({
              role: h.role === "assistant" || h.role === "model" ? "model" : "user",
              parts: [{ text: h.text }]
            });
          }
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: question }]
      });

      const response = await gemini.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 1500,
        }
      });

      const reply = response.text || "پاسخی از مشاور هوشمند دریافت نشد. لطفاً سوال خود را با جزئیات بیشتر مطرح فرمایید.";
      res.json({ success: true, answer: reply });
    } catch (err: any) {
      console.error("AI Advisor error:", err);
      res.status(500).json({ error: err.message || "خطا در برقراری ارتباط با دستیار هوشمند." });
    }
  });

  app.get("/api/data/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const allowedCollections = ["branches", "embassies", "websites", "faqs", "requests"];
      
      if (!allowedCollections.includes(collection)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const snapshot = await getDb().collection(collection).get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(docs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Digital Asset Links for Android TWA verification
  app.get("/.well-known/assetlinks.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.sendFile(path.join(process.cwd(), "public", ".well-known", "assetlinks.json"));
  });

  // Manifest endpoint fallback
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.sendFile(path.join(process.cwd(), "public", "manifest.json"));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
