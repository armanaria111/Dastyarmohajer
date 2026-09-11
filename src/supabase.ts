import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TazkiraRecord } from './data/initialTazkiras';

// Retrieve Supabase credentials from Vite environment or localStorage for user convenience
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('app_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('app_supabase_key') || '' : '';

  return {
    url: localUrl.trim() || envUrl.trim(),
    anonKey: localKey.trim() || envKey.trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_supabase_url', url.trim());
    localStorage.setItem('app_supabase_key', anonKey.trim());
  }
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('app_supabase_url');
    localStorage.removeItem('app_supabase_key');
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  if (supabaseInstance && currentUrl === url && currentKey === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Database Operations for Tazkira Records (Supabase)
// -------------------------------------------------------------

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; count?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'مشخصات اتصال Supabase (URL یا Anon Key) وارد نشده است.',
    };
  }

  try {
    const { data, count, error } = await client
      .from('printed_tazkiras')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'اتصال به پروژه برقرار شد اما جدول printed_tazkiras در دیتابیس یافت نشد. لطفاً اسکریپت SQL را در Supabase اجرا نمایید.',
        };
      }
      return {
        success: false,
        message: `خطای Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'اتصال به پایگاه داده Supabase با موفقیت برقرار است.',
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطای ارتباط شبکه: ${err.message || String(err)}`,
    };
  }
}

export async function fetchTazkirasFromSupabase(): Promise<TazkiraRecord[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');

  const { data, error } = await client
    .from('printed_tazkiras')
    .select('*')
    .order('row_number', { ascending: true })
    .limit(5000);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: String(row.id),
    rowNumber: Number(row.row_number || 0),
    fullName: row.full_name || '',
    surname: row.surname || '',
    fatherName: row.father_name || '',
    province: row.province || '',
    boxNumber: row.box_number || '',
    remarks: row.remarks || '',
    status: (row.status === 'delivered' ? 'delivered' : 'ready') as 'ready' | 'delivered',
    deliveredAt: row.delivered_at || undefined,
    sourceFile: row.source_file || undefined,
  }));
}

export async function insertTazkirasToSupabase(records: TazkiraRecord[]): Promise<number> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');

  const payload = records.map((r) => ({
    row_number: r.rowNumber,
    full_name: r.fullName,
    surname: r.surname,
    father_name: r.fatherName,
    province: r.province,
    box_number: r.boxNumber,
    remarks: r.remarks,
    status: r.status,
    source_file: r.sourceFile || 'بارگذاری مستقیم',
  }));

  // Chunk in batches of 500
  let totalInserted = 0;
  const chunkSize = 500;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await client.from('printed_tazkiras').insert(chunk);
    if (error) throw error;
    totalInserted += chunk.length;
  }

  return totalInserted;
}

export async function updateTazkiraInSupabase(id: string, updates: Partial<TazkiraRecord>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');

  const dbUpdates: Record<string, any> = {};
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.surname !== undefined) dbUpdates.surname = updates.surname;
  if (updates.fatherName !== undefined) dbUpdates.father_name = updates.fatherName;
  if (updates.province !== undefined) dbUpdates.province = updates.province;
  if (updates.boxNumber !== undefined) dbUpdates.box_number = updates.boxNumber;
  if (updates.remarks !== undefined) dbUpdates.remarks = updates.remarks;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.deliveredAt !== undefined) dbUpdates.delivered_at = updates.deliveredAt;

  const { error } = await client
    .from('printed_tazkiras')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function deleteTazkiraFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured');

  const { error } = await client
    .from('printed_tazkiras')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
