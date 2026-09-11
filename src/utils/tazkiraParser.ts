import * as XLSX from "xlsx";
import { TazkiraRecord } from "../data/initialTazkiras";

// Standard Afghan Provinces for fuzzy normalization
export const AFGHAN_PROVINCES = [
  "کابل", "هرات", "بلخ", "کندهار", "ننگرهار", "بامیان", "دایکندی", "غزنی", 
  "فاریاب", "سرپل", "تخار", "کندوز", "بغلان", "بدخشان", "غور", "فراه", 
  "پروان", "کاپیسا", "پنجشیر", "لغمان", "کنر", "نورستان", "لوگر", "پکتیا", 
  "پکتیکا", "خوست", "وردگ", "سمنگان", "جوزجان", "بادغیس", "هلمند", "نیمروز", 
  "ارزگان", "زابل", "کوچی"
];

// Normalize Arabic / Persian characters
export function normalizePersian(str: string): string {
  if (!str) return "";
  return str
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Zero-width spaces
    .trim();
}

/**
 * Parses Excel files (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(file: File): Promise<TazkiraRecord[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON array of arrays
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rows || rows.length === 0) {
    throw new Error("فایل اکسل خالی است یا دارای داده معتبری نمی‌باشد.");
  }

  // Find header row
  let headerIndex = -1;
  let colMap = {
    row: -1,
    name: -1,
    surname: -1,
    father: -1,
    province: -1,
    box: -1,
    remarks: -1,
  };

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    row.forEach((cell, idx) => {
      const cellText = normalizePersian(String(cell || ""));
      if (cellText.includes("ردیف") || cellText === "#" || cellText === "no") colMap.row = idx;
      else if (cellText === "نام" || cellText === "اسم" || cellText.includes("نام متقاضی")) colMap.name = idx;
      else if (cellText.includes("تخلص") || cellText.includes("فامیلی") || cellText.includes("خانوادگی")) colMap.surname = idx;
      else if (cellText.includes("پدر") || cellText.includes("ولد")) colMap.father = idx;
      else if (cellText.includes("ولایت") || cellText.includes("استان")) colMap.province = idx;
      else if (cellText.includes("باکس") || cellText.includes("box") || cellText.includes("جعبه")) colMap.box = idx;
      else if (cellText.includes("ملاحظات") || cellText.includes("تاریخ") || cellText.includes("توضیحات")) colMap.remarks = idx;
    });

    // If at least name or surname and father/box found
    if (colMap.name !== -1 || colMap.surname !== -1) {
      headerIndex = i;
      break;
    }
  }

  // Fallback defaults if no explicit header row recognized:
  // Standard format from PDF: Col 0: #, Col 1: نام, Col 2: تخلص, Col 3: نام پدر, Col 4: ولایت, Col 5: باکس, Col 6: ملاحظات
  if (headerIndex === -1) {
    headerIndex = 0;
    colMap = { row: 0, name: 1, surname: 2, father: 3, province: 4, box: 5, remarks: 6 };
  }

  const results: TazkiraRecord[] = [];
  let autoRow = 1;

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawName = colMap.name !== -1 ? String(row[colMap.name] || "").trim() : "";
    const rawSurname = colMap.surname !== -1 ? String(row[colMap.surname] || "").trim() : "";
    const rawFather = colMap.father !== -1 ? String(row[colMap.father] || "").trim() : "";
    
    // Skip empty lines
    if (!rawName && !rawSurname && !rawFather) continue;
    if (rawName === "نام" || rawSurname === "تخلص") continue;

    const rowNum = colMap.row !== -1 && Number(row[colMap.row]) ? Number(row[colMap.row]) : autoRow++;
    const rawProv = colMap.province !== -1 ? String(row[colMap.province] || "").trim() : "نامشخص";
    const rawBox = colMap.box !== -1 ? String(row[colMap.box] || "").trim() : "B";
    const rawRemarks = colMap.remarks !== -1 ? String(row[colMap.remarks] || "").trim() : "";

    results.push({
      rowNumber: rowNum,
      fullName: normalizePersian(rawName),
      surname: normalizePersian(rawSurname),
      fatherName: normalizePersian(rawFather),
      province: normalizePersian(rawProv),
      boxNumber: rawBox.toUpperCase(),
      remarks: rawRemarks || "آماده تحویل",
      status: "ready",
      sourceFile: file.name
    });
  }

  return results;
}

/**
 * Parse text lines (e.g. copied from PDF table, OCR text, or tab-delimited text)
 */
export function parseRawTextTable(text: string, defaultBox: string = "B", fileName: string = "ورود دستی/متنی"): TazkiraRecord[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: TazkiraRecord[] = [];
  let rowCounter = 1;

  for (const line of lines) {
    // Skip title or header lines
    if (line.includes("جدول توزیع") || line.includes("متقاضیان") || line.includes("بایومتریک")) continue;
    if ((line.includes("ردیف") || line.includes("شماره")) && (line.includes("نام") || line.includes("تخلص"))) continue;

    // Split by tab, pipe, semicolon, or 2+ spaces
    let rawParts: string[] = [];
    if (line.includes("\t")) {
      rawParts = line.split("\t");
    } else if (line.includes("|")) {
      rawParts = line.split("|");
    } else if (line.includes(",")) {
      rawParts = line.split(",");
    } else {
      rawParts = line.split(/\s{2,}/);
    }

    let parts = rawParts.map(p => normalizePersian(p.trim())).filter(Boolean);
    if (parts.length < 3) {
      // Try single-space split if parts < 3
      const spaceParts = line.split(/\s+/).map(p => normalizePersian(p.trim())).filter(Boolean);
      if (spaceParts.length >= 4) {
        parts = spaceParts;
      } else {
        continue;
      }
    }

    // Try intelligent semantic extraction
    let detectedRow: number | null = null;
    let detectedProvince = "";
    let detectedBox = defaultBox;
    let detectedRemarks = "";
    const remainingTextTokens: string[] = [];

    // 1. Identify date / remarks
    const dateRegex = /^\d{2,4}[-/.]\d{1,2}[-/.]\d{1,4}$/;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];

      // Check if it's a date
      if (dateRegex.test(p)) {
        detectedRemarks = p;
        continue;
      }

      // Check if it's box (e.g. "B", "A", "Box B", "A-1", "B-2")
      const boxMatch = p.match(/^(?:Box\s*|باکس\s*)?([A-Za-z0-9-]+)$/i);
      if (boxMatch && ["A", "B", "C", "D", "E", "A-1", "B-1", "B-2", "A-2"].includes(boxMatch[1].toUpperCase())) {
        detectedBox = boxMatch[1].toUpperCase();
        continue;
      }

      // Check if it's a known Afghan Province
      const matchedProvince = AFGHAN_PROVINCES.find(prov => p.includes(prov) || prov.includes(p));
      if (matchedProvince && !detectedProvince) {
        detectedProvince = matchedProvince;
        continue;
      }

      // Check if pure integer row number (and not yet found)
      if (/^\d+$/.test(p) && detectedRow === null && parseInt(p, 10) < 10000) {
        detectedRow = parseInt(p, 10);
        continue;
      }

      remainingTextTokens.push(p);
    }

    if (!detectedProvince) {
      detectedProvince = "هرات";
    }

    // Now analyze remaining tokens for: [fullName, surname, fatherName]
    let fullName = "";
    let surname = "";
    let fatherName = "";

    if (remainingTextTokens.length >= 3) {
      fullName = remainingTextTokens[0];
      surname = remainingTextTokens[1];
      // The rest of the tokens belong to fatherName (e.g. "نعمت" + "الله" -> "نعمت الله")
      fatherName = remainingTextTokens.slice(2).join(" ");
    } else if (remainingTextTokens.length === 2) {
      fullName = remainingTextTokens[0];
      surname = remainingTextTokens[1];
      fatherName = "نامشخص";
    } else if (remainingTextTokens.length === 1) {
      fullName = remainingTextTokens[0];
      surname = "جمشیدی";
      fatherName = "نامشخص";
    }

    if (fullName || surname) {
      results.push({
        rowNumber: detectedRow !== null ? detectedRow : rowCounter++,
        fullName: fullName || "متقاضی",
        surname: surname || "تذکره",
        fatherName: fatherName || "نامشخص",
        province: detectedProvince,
        boxNumber: detectedBox || defaultBox,
        remarks: detectedRemarks || "آماده توزیع",
        status: "ready",
        sourceFile: fileName
      });
    }
  }

  return results;
}

/**
 * Convert file to base64 data string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * AI-powered PDF and Image table extractor via backend Gemini endpoint
 */
export async function parsePdfWithAI(
  file: File,
  defaultBox: string = "B",
  onProgress?: (msg: string) => void
): Promise<TazkiraRecord[]> {
  onProgress?.("در حال آماده‌سازی و ارسال سند به هوش مصنوعی...");
  const base64Data = await fileToBase64(file);

  onProgress?.("در حال تحلیل جدول توزیع تذکره و استخراج مشخصات توسط هوش مصنوعی...");
  const response = await fetch("/api/tazkira/parse-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileData: base64Data,
      mimeType: file.type || "application/pdf",
      fileName: file.name,
      defaultBox: defaultBox || "B"
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "خطا در برقراری ارتباط با سرور تحلیل اسناد هوش مصنوعی");
  }

  const result = await response.json();
  if (!result.success || !Array.isArray(result.records) || result.records.length === 0) {
    throw new Error(result.message || "هیچ ردیفی در این سند استخراج نشد.");
  }

  return result.records;
}

/**
 * Parses PDF file text locally using pdfjs-dist with 2D spatial line clustering
 */
export async function parsePdfFileLocally(file: File, defaultBox: string = "B"): Promise<TazkiraRecord[]> {
  try {
    const pdfjs = await import("pdfjs-dist");

    // Attempt to set worker safely
    try {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      }
    } catch (e) {
      console.warn("Could not set workerSrc:", e);
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    let allExtractedLines: string[] = [];
    let detectedBoxOnPage = defaultBox;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Check if page header mentions Box (e.g. "Box B" or "باکس A" or "Box A-1")
      const pageRawText = textContent.items.map((it: any) => it.str || "").join(" ");
      const boxMatch = pageRawText.match(/(?:Box|باکس|box)\s*([A-Za-z0-9-]+)/i);
      if (boxMatch && boxMatch[1]) {
        detectedBoxOnPage = boxMatch[1].toUpperCase();
      }

      // Group items by vertical Y coordinate with 4px tolerance
      const yMap: { y: number; items: { x: number; text: string }[] }[] = [];
      const yTolerance = 5;

      for (const item of (textContent.items as any[])) {
        const text = (item.str || "").trim();
        if (!text) continue;

        const x = item.transform ? item.transform[4] : 0;
        const y = item.transform ? item.transform[5] : 0;

        let foundGroup = yMap.find(g => Math.abs(g.y - y) <= yTolerance);
        if (!foundGroup) {
          foundGroup = { y, items: [] };
          yMap.push(foundGroup);
        }
        foundGroup.items.push({ x, text });
      }

      // Sort lines top to bottom (higher Y in PDF is higher on page)
      yMap.sort((a, b) => b.y - a.y);

      for (const group of yMap) {
        // Sort items in this row from right to left (RTL: higher X comes first)
        group.items.sort((a, b) => b.x - a.x);

        // Intelligently group text chunks within the same table cell (gap < 24 points)
        const clusteredCells: string[] = [];
        let currentCell = "";
        let prevX = -999999;

        for (const it of group.items) {
          if (prevX === -999999) {
            currentCell = it.text;
            prevX = it.x;
          } else {
            const gap = Math.abs(prevX - it.x);
            if (gap < 24) {
              // Same cell word part (e.g. "نعمت" + "الله" -> "نعمت الله")
              currentCell = currentCell + " " + it.text;
            } else {
              clusteredCells.push(currentCell.trim());
              currentCell = it.text;
            }
            prevX = it.x;
          }
        }
        if (currentCell.trim()) {
          clusteredCells.push(currentCell.trim());
        }

        const rowText = clusteredCells.join("\t");
        if (rowText.trim()) {
          allExtractedLines.push(rowText);
        }
      }
    }

    if (allExtractedLines.length === 0) {
      throw new Error("متن قابل تفکیکی در فایل PDF یافت نشد. ممکن است فایل تصویری یا اسکن‌شده باشد.");
    }

    // Process extracted lines
    const parsed = parseRawTextTable(allExtractedLines.join("\n"), detectedBoxOnPage, file.name);
    return parsed;
  } catch (err: any) {
    console.warn("Local PDF extraction failed:", err);
    throw new Error(err.message || "خطا در استخراج محلی PDF");
  }
}

/**
 * High-level PDF parsing entry point with automatic AI prioritization and fallback
 */
export async function parsePdfFile(
  file: File,
  defaultBox: string = "B",
  onProgress?: (msg: string) => void
): Promise<TazkiraRecord[]> {
  // Always try AI first as official consulate documents are often complex/scanned tables
  try {
    return await parsePdfWithAI(file, defaultBox, onProgress);
  } catch (aiErr: any) {
    console.warn("AI extraction encountered error, attempting local spatial parser:", aiErr);
    onProgress?.("هوش مصنوعی در دسترس نبود، در حال تلاش برای استخراج مستقیم محلی...");
    try {
      const localResult = await parsePdfFileLocally(file, defaultBox);
      if (localResult.length > 0) return localResult;
    } catch (localErr) {
      console.warn("Local parser also failed:", localErr);
    }
    // Re-throw the informative AI error if both failed
    throw new Error(aiErr.message || "امکان خواندن خودکار فایل PDF وجود نداشت.");
  }
}

/**
 * Export current list to Excel (.xlsx)
 */
export function exportTazkirasToExcel(items: TazkiraRecord[], filename: string = "لیست_تذکره_های_چاپ_شده.xlsx") {
  const exportData = items.map(item => ({
    "ردیف": item.rowNumber,
    "نام متقاضی": item.fullName,
    "تخلص": item.surname,
    "نام پدر": item.fatherName,
    "ولایت": item.province,
    "شماره باکس توزیع": item.boxNumber,
    "ملاحظات / تاریخ": item.remarks,
    "وضعیت": item.status === "delivered" ? "تحویل داده شده" : "آماده تحویل در کنسولگری"
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "تذکره‌های چاپ‌شده");
  XLSX.writeFile(workbook, filename);
}
