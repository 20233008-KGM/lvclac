import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** URL과 anon key가 모두 설정돼 있어야 Supabase 인증이 활성화됩니다. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * 설정이 없으면 null. 소비 측에서 `isSupabaseConfigured`로 분기하거나
 * null 체크 후 사용하세요.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
