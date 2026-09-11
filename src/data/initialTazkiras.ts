// Extracted from the user's provided official distribution table:
// "جدول توزیع تذکره الکترونیکی متقاضیان که قبلاً پروسه ثبت نام و بایومتریک را در کشور ایران انجام داده اند"

export interface TazkiraRecord {
  id?: string;
  rowNumber: number;
  fullName: string;
  surname: string;
  fatherName: string;
  province: string;
  boxNumber: string;
  remarks: string;
  status: "ready" | "delivered";
  deliveredAt?: string;
  sourceFile?: string;
}

export const INITIAL_TAZKIRAS: TazkiraRecord[] = [
  // Page 1 - Box B
  { rowNumber: 1, fullName: "احمد", surname: "جمشیدی", fatherName: "نعمت الله", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 2, fullName: "درسا", surname: "جمشیدی", fatherName: "امید", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 3, fullName: "دنیا", surname: "جمشیدی", fatherName: "امید", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 4, fullName: "عبدالله", surname: "جمشیدی", fatherName: "ذبیح الله", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 5, fullName: "هواگل", surname: "جمشیدی", fatherName: "شیرمحمد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 6, fullName: "امیرحسین", surname: "جمشیدی", fatherName: "حسن", province: "فاریاب", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 7, fullName: "امیرحمزه", surname: "جمشیدی", fatherName: "حسن", province: "فاریاب", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 8, fullName: "امیرعلی", surname: "جمشیدی", fatherName: "امید", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 9, fullName: "مهدی", surname: "جمشیدی", fatherName: "محمد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 10, fullName: "غنچه", surname: "جمشیدی", fatherName: "حسن", province: "فاریاب", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 11, fullName: "لیلا", surname: "جمشیدی", fatherName: "محمد یونس", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 12, fullName: "عیدی گل", surname: "جمشیدی", fatherName: "محمدگل", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 13, fullName: "معصومه", surname: "جمشیدی", fatherName: "امیر", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 14, fullName: "بی بی", surname: "جمشیدی", fatherName: "ملافقیر", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 15, fullName: "افسانه", surname: "جمشیدی", fatherName: "غلام نبی", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 16, fullName: "شکیلا", surname: "جمشیدی", fatherName: "میرزا احمد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 17, fullName: "وکیل احمد", surname: "جمشیدی", fatherName: "رستم", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 18, fullName: "عبدالرسول", surname: "جمشیدی", fatherName: "عبدالمومن", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 19, fullName: "علی احسان", surname: "قاسمی", fatherName: "حسن", province: "غزنی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 20, fullName: "علی", surname: "قاسمی", fatherName: "حسن", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 21, fullName: "حسن", surname: "قاسمی", fatherName: "رضاداد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 22, fullName: "فاطمه", surname: "قاسمی", fatherName: "خداداد", province: "دایکندی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 23, fullName: "هدیه", surname: "قاسمی", fatherName: "رمضان", province: "بلخ", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 24, fullName: "رمضان", surname: "قاسمی", fatherName: "علیداد", province: "بلخ", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 25, fullName: "هانیه", surname: "قاسمی", fatherName: "رمضان", province: "بلخ", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 26, fullName: "نازنین زهرا", surname: "قاسمی", fatherName: "رمضان", province: "بلخ", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 27, fullName: "فاطمه", surname: "قاسمی", fatherName: "رمضان", province: "بلخ", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 28, fullName: "شیما", surname: "قاسمی", fatherName: "علی محمد", province: "بامیان", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 29, fullName: "سارینا", surname: "قاسمی", fatherName: "سلیم", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 30, fullName: "امیرحسین", surname: "قاسمی", fatherName: "غلام رضا", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 31, fullName: "ساناز", surname: "قاسمی", fatherName: "سلیم", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 32, fullName: "سارا", surname: "قاسمی", fatherName: "سلیم", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 33, fullName: "جواد", surname: "قاسمی", fatherName: "عزیزالله", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 34, fullName: "یاسمین", surname: "قاسمی", fatherName: "جواد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 35, fullName: "بی بی رقیه", surname: "قاسمی", fatherName: "سید حسن", province: "کابل", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 36, fullName: "طاهره", surname: "قاسمی", fatherName: "رضا", province: "غور", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 37, fullName: "محمد رضا", surname: "قاسمی", fatherName: "حسین علی", province: "بامیان", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 38, fullName: "علیرضا", surname: "قاسمی", fatherName: "حسین علی", province: "بامیان", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 39, fullName: "حسین علی", surname: "قاسمی", fatherName: "علی محمد", province: "بامیان", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 40, fullName: "مسعود", surname: "قاسمی", fatherName: "نوراحمد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 41, fullName: "نورالله", surname: "قاسمی", fatherName: "سیدغلام", province: "کوچی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 42, fullName: "قاسم", surname: "قاسمی", fatherName: "عید محمد", province: "سرپل", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 43, fullName: "عاطفه", surname: "قاسمی", fatherName: "قاسم", province: "سرپل", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 44, fullName: "صدیقه", surname: "قاسمی", fatherName: "حسن", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 45, fullName: "ادریس", surname: "قاسمی", fatherName: "عبدالقادر", province: "کوچی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 46, fullName: "آقامحمد", surname: "قاسمی", fatherName: "قاسم", province: "کوچی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 47, fullName: "بنیامین", surname: "قاسمی", fatherName: "آقامحمد", province: "کوچی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 48, fullName: "فاطمه", surname: "قاسمی", fatherName: "حسین", province: "دایکندی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 49, fullName: "کریمه", surname: "قاسمی", fatherName: "سلطان محمد", province: "وردگ", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 50, fullName: "فاطمه", surname: "قاسمی", fatherName: "غلام حسین", province: "بامیان", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  
  // Page 2 - Box B (Amiri & Heidari)
  { rowNumber: 51, fullName: "معصومه", surname: "امیری", fatherName: "محمد حنیف", province: "دایکندی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 52, fullName: "حامد", surname: "امیری", fatherName: "محمد اسحق", province: "کندوز", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 53, fullName: "نرگس", surname: "امیری", fatherName: "تیمور", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 54, fullName: "ابوالفضل", surname: "امیری", fatherName: "صمد", province: "کابل", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 55, fullName: "بی بی", surname: "امیری", fatherName: "حاجی محمد", province: "سرپل", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 56, fullName: "سکینه", surname: "امیری", fatherName: "خداداد", province: "بغلان", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 57, fullName: "شیلا", surname: "امیری", fatherName: "خلیل", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 58, fullName: "مرجان", surname: "امیری", fatherName: "آدم خان", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 59, fullName: "بس بی بی", surname: "امیری", fatherName: "علی جمعه", province: "کندهار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 60, fullName: "کامله", surname: "امیری", fatherName: "آدم خان", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 61, fullName: "سکینه", surname: "امیری", fatherName: "سید لطیف", province: "غزنی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 62, fullName: "مصطفی", surname: "امیری", fatherName: "آدم خان", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 63, fullName: "نادر", surname: "امیری", fatherName: "آدم خان", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 64, fullName: "کاظم", surname: "امیری", fatherName: "آدم خان", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 65, fullName: "آدم خان", surname: "امیری", fatherName: "سید خان", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 73, fullName: "خلیل", surname: "امیری", fatherName: "شیر احمد", province: "هرات", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 74, fullName: "بسم الله", surname: "امیری", fatherName: "امیرالدین", province: "فراه", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 96, fullName: "معصومه", surname: "حیدری", fatherName: "اکبر", province: "دایکندی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 98, fullName: "محمد جاوید", surname: "حیدری", fatherName: "محمد زاهد", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 104, fullName: "محمد فرید", surname: "حیدری", fatherName: "محمد زاهد", province: "تخار", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 109, fullName: "زینب", surname: "حیدری", fatherName: "غلام حیدر", province: "دایکندی", boxNumber: "B", remarks: "19-06-1405", status: "ready" },
  
  // Page 9 & 10 - Box A (Alizay & Yousefi)
  { rowNumber: 1, fullName: "شاه محمد", surname: "علیزی", fatherName: "بصیر", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 2, fullName: "مرضیه", surname: "علیزی", fatherName: "محمد ابراهیم", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 3, fullName: "نظیراحمد", surname: "علیزی", fatherName: "محمد سرور", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 4, fullName: "ابراهیم", surname: "علیزی", fatherName: "نظیراحمد", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 5, fullName: "فریبا", surname: "علیزی", fatherName: "عبدالله", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 10, fullName: "امیرمحمد", surname: "علیزی", fatherName: "ناصر", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 11, fullName: "ناصر", surname: "علیزی", fatherName: "محمد", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 19, fullName: "پروانه", surname: "علیزی", fatherName: "عبدالفتاح", province: "هرات", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 28, fullName: "زهرا", surname: "علیزی", fatherName: "نقیب الله", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 33, fullName: "محمد صادق", surname: "علیزی", fatherName: "علی احمد", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 62, fullName: "لیلما", surname: "یوسفی", fatherName: "عباس علی", province: "هرات", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 64, fullName: "محمد صالح", surname: "یوسفی", fatherName: "عبدالقیوم", province: "هرات", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 68, fullName: "محمد رضا", surname: "یوسفی", fatherName: "سیدکریم", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 71, fullName: "حامد", surname: "یوسفی", fatherName: "محمد علم", province: "دایکندی", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 85, fullName: "زهرا", surname: "یوسفی", fatherName: "ابراهیم", province: "فراه", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 101, fullName: "محمد رضا", surname: "یوسفی", fatherName: "محمد حنیف", province: "کندهار", boxNumber: "A", remarks: "19-06-1405", status: "ready" },
  
  // Page 16, 17, 18 - Box A-1 (Tajik & Hosseini)
  { rowNumber: 1, fullName: "احمد رشاد", surname: "تاجیک", fatherName: "احمد الله", province: "کابل", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 2, fullName: "رحمان", surname: "تاجیک", fatherName: "سبحان", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 3, fullName: "جلیل الرحمن", surname: "تاجیک", fatherName: "حبیب الرحمن", province: "پروان", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 5, fullName: "مهدی", surname: "تاجیک", fatherName: "جمعه", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 6, fullName: "علیرضا", surname: "تاجیک", fatherName: "جمعه", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 7, fullName: "نجیبه", surname: "تاجیک", fatherName: "محمد شاه", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 8, fullName: "بهاره", surname: "تاجیک", fatherName: "جمعه", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 10, fullName: "فیض الله", surname: "تاجیک", fatherName: "باله بای", province: "کندوز", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 13, fullName: "احمد الله", surname: "تاجیک", fatherName: "بخش الله", province: "کابل", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 14, fullName: "امید", surname: "تاجیک", fatherName: "عبدالرحمن", province: "هرات", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 20, fullName: "آزیتا", surname: "تاجیک", fatherName: "غلام رسول", province: "هرات", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 24, fullName: "فاطمه", surname: "تاجیک", fatherName: "محمد رسول", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 25, fullName: "زهرا", surname: "تاجیک", fatherName: "احمد", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 36, fullName: "محمد رضا", surname: "تاجیک", fatherName: "غلام نبی", province: "فراه", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 44, fullName: "محمد جواد", surname: "تاجیک", fatherName: "افضل", province: "بغلان", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 52, fullName: "سلیمان", surname: "تاجیک", fatherName: "حسام الدین", province: "هرات", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 53, fullName: "ثنا سادات", surname: "حسینی", fatherName: "سید جواد", province: "بامیان", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 56, fullName: "یوسف", surname: "حسینی", fatherName: "محمد", province: "بامیان", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 64, fullName: "سید عرفان", surname: "حسینی", fatherName: "سید ظاهر", province: "دایکندی", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 79, fullName: "سید اسدالله", surname: "حسینی", fatherName: "سید احمد", province: "سرپل", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 86, fullName: "سید محمد صادق", surname: "حسینی", fatherName: "سید اسدالله", province: "سرپل", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 93, fullName: "محمد قیاس", surname: "حسینی", fatherName: "فواد احمد", province: "کندهار", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" },
  { rowNumber: 101, fullName: "سید رسول", surname: "حسینی", fatherName: "محمد اسحق", province: "بامیان", boxNumber: "A-1", remarks: "19-06-1405", status: "ready" }
];
