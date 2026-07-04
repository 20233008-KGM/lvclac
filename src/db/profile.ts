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

/** profiles.nickname upsert. */
export async function saveNickname(userId: string, nickname: string): Promise<void> {
  if (!supabase) return
  await supabase.from('profiles').upsert({ id: userId, nickname: nickname.trim() })
}
