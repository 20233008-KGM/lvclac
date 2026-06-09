import { getLocalStorageData, clearLocalStorageData } from './adapters/localStorageAdapter'

/**
 * DB 연결 후 일회성 마이그레이션용 유틸.
 * supabaseAdapter 구현 완료 후 이 함수 내부에 insert 로직을 추가하세요.
 */
export async function migrateLocalToSupabase(): Promise<{
  usersMigrated: number
  prefsMigrated: number
}> {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL이 설정되지 않았습니다.')
  }

  const { users, prefs } = getLocalStorageData()

  // TODO: Supabase 클라이언트로 users, prefs insert 구현
  console.info('[migrate] users:', users.length, 'prefs:', Object.keys(prefs).length)

  // 마이그레이션 성공 후 localStorage 정리 (구현 완료 시 주석 해제)
  // clearLocalStorageData()

  return {
    usersMigrated: users.length,
    prefsMigrated: Object.keys(prefs).length,
  }
}

export { clearLocalStorageData }
