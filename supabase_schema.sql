-- ====================================================================
-- اسکریپت ساخت جداول دیتابیس Supabase (PostgreSQL)
-- سامانه مدیریت تذکره الکترونیکی و خدمات کنسولی
-- این اسکریپت را در بخش SQL Editor در داشبورد Supabase اجرا نمایید.
-- ====================================================================

-- 1. جدول تذکره‌های چاپ‌شده (Printed Tazkiras)
CREATE TABLE IF NOT EXISTS public.printed_tazkiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    row_number INTEGER,
    full_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    father_name TEXT NOT NULL,
    province TEXT DEFAULT 'هرات',
    box_number TEXT DEFAULT 'B',
    remarks TEXT,
    status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'delivered')),
    delivered_at TIMESTAMPTZ,
    source_file TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ایجاد ایندکس‌های پرسرعت جهت جستجوی نام، تخلص، پدر، ولایت و باکس
CREATE INDEX IF NOT EXISTS idx_tazkira_names ON public.printed_tazkiras (full_name, surname);
CREATE INDEX IF NOT EXISTS idx_tazkira_father ON public.printed_tazkiras (father_name);
CREATE INDEX IF NOT EXISTS idx_tazkira_province ON public.printed_tazkiras (province);
CREATE INDEX IF NOT EXISTS idx_tazkira_box ON public.printed_tazkiras (box_number);
CREATE INDEX IF NOT EXISTS idx_tazkira_row ON public.printed_tazkiras (row_number);

-- 2. جدول درخواست‌های متقاضیان (Requests)
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT UNIQUE,
    applicant_name TEXT NOT NULL,
    phone TEXT,
    service_type TEXT,
    status TEXT DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول پیام‌ها و نظرات مراجعین (Feedbacks)
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    contact TEXT,
    message TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. تنظیمات ربات‌های پیام‌رسان (Bot Configurations)
CREATE TABLE IF NOT EXISTS public.bot_configs (
    platform TEXT PRIMARY KEY,
    token TEXT,
    enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    admin_chat_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- فعال‌سازی قوانین دسترسی (Row Level Security - RLS)
-- ====================================================================
ALTER TABLE public.printed_tazkiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;

-- سیاست‌های دسترسی امن با کلید Anon
DROP POLICY IF EXISTS "Allow anon read printed_tazkiras" ON public.printed_tazkiras;
CREATE POLICY "Allow anon read printed_tazkiras" ON public.printed_tazkiras FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert printed_tazkiras" ON public.printed_tazkiras;
CREATE POLICY "Allow anon insert printed_tazkiras" ON public.printed_tazkiras FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update printed_tazkiras" ON public.printed_tazkiras;
CREATE POLICY "Allow anon update printed_tazkiras" ON public.printed_tazkiras FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete printed_tazkiras" ON public.printed_tazkiras;
CREATE POLICY "Allow anon delete printed_tazkiras" ON public.printed_tazkiras FOR DELETE USING (true);

-- سیاست‌های جدول درخواست‌ها و بازخوردها
DROP POLICY IF EXISTS "Allow anon all requests" ON public.requests;
CREATE POLICY "Allow anon all requests" ON public.requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all feedbacks" ON public.feedbacks;
CREATE POLICY "Allow anon all feedbacks" ON public.feedbacks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all bot_configs" ON public.bot_configs;
CREATE POLICY "Allow anon all bot_configs" ON public.bot_configs FOR ALL USING (true);
