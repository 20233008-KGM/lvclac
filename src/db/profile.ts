import { supabase } from './supabaseClient'

/** 앱에서 다루는 로그인 사용자. Supabase auth 세션 + profiles 테이블에서 조합. */
export interface AuthUser {
  id: string
  email: string
  nickname: string
}

/** profiles.nickname 조회. 없으면 null. */
export async function fetchNickname(userId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data?.nickname ?? null
}

/** 최초 로그인 직후 auth trigger가 늦거나 누락되어도 profiles row를 보정한다. */
export async function ensureProfile(
  userId: string,
  email: string,
  fallbackNickname: string,
): Promise<string> {
  const fallback = fallbackNickname.trim() || email.split('@')[0] || '사용자'
  if (!supabase) return fallback

  const existing = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .maybeSingle()

  const currentNickname = existing.data?.nickname?.trim()
  if (currentNickname) {
    await supabase.from('profiles').update({ email }).eq('id', userId)
    return currentNickname
  }

  const { data } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, nickname: fallback }, { onConflict: 'id' })
    .select('nickname')
    .maybeSingle()

  return data?.nickname?.trim() || fallback
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
