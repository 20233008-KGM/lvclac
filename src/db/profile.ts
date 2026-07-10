import { supabase } from './supabaseClient'

/** 앱에서 다루는 로그인 사용자. Supabase auth 세션 + profiles 테이블에서 조합. */
export interface AuthUser {
  id: string
  email: string
  nickname: string
  autoSaveOrderHistory: boolean
  isAdmin: boolean
}

/** profiles.nickname 조회. 없으면 null. */
export async function fetchNickname(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('nickname, auto_save_order_history')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[profile] fetchNickname failed:', error.message)
    return null
  }
  return data?.nickname ?? null
}

/** 최초 로그인 직후 auth trigger가 늦거나 누락되어도 profiles row를 보정한다. */
export async function ensureProfile(
  userId: string,
  email: string,
  fallbackNickname: string,
): Promise<{ nickname: string; autoSaveOrderHistory: boolean }> {
  const fallback = fallbackNickname.trim() || email.split('@')[0] || '사용자'
  if (!supabase) return { nickname: fallback, autoSaveOrderHistory: true }

  const existing = await supabase
    .from('profiles')
    .select('nickname, auto_save_order_history')
    .eq('id', userId)
    .maybeSingle()

  if (existing.error) {
    console.error('[profile] ensureProfile select failed:', existing.error.message)
  }

  const currentNickname = existing.data?.nickname?.trim()
  if (currentNickname) {
    await supabase.from('profiles').update({ email }).eq('id', userId)
    return {
      nickname: currentNickname,
      autoSaveOrderHistory: existing.data?.auto_save_order_history ?? true,
    }
  }

  const { data } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, nickname: fallback }, { onConflict: 'id' })
    .select('nickname, auto_save_order_history')
    .maybeSingle()

  return {
    nickname: data?.nickname?.trim() || fallback,
    autoSaveOrderHistory: data?.auto_save_order_history ?? true,
  }
}

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

/** profiles.nickname upsert. */
export async function saveNickname(
  userId: string,
  nickname: string,
  email?: string,
): Promise<void> {
  if (!supabase) return
  await supabase
    .from('profiles')
    .upsert({ id: userId, email, nickname: nickname.trim() }, { onConflict: 'id' })
}

/** profiles.auto_save_order_history 갱신. 실패 시 에러 메시지, 성공 시 null. */
export async function saveAutoSaveOrderHistory(
  userId: string,
  enabled: boolean,
): Promise<string | null> {
  if (!supabase) return 'supabase_not_configured'
  const { error } = await supabase
    .from('profiles')
    .update({ auto_save_order_history: enabled })
    .eq('id', userId)
  if (error) {
    console.error('[profile] saveAutoSaveOrderHistory failed:', error.message)
    return error.message
  }
  return null
}
