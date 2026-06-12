import {
  createLocalStorageAuthRepository,
  createLocalStoragePreferencesRepository,
} from './adapters/localStorageAdapter'
import {
  createSupabaseAuthRepository,
  createSupabasePreferencesRepository,
} from './adapters/supabaseAdapter'

/** 어댑터 구현 완료 후 VITE_SUPABASE_ENABLED=true 와 URL을 함께 설정하세요. */
function isSupabaseEnabled(): boolean {
  return (
    import.meta.env.VITE_SUPABASE_ENABLED === 'true' &&
    Boolean(import.meta.env.VITE_SUPABASE_URL)
  )
}

export const authRepo = isSupabaseEnabled()
  ? createSupabaseAuthRepository()
  : createLocalStorageAuthRepository()

export const prefsRepo = isSupabaseEnabled()
  ? createSupabasePreferencesRepository()
  : createLocalStoragePreferencesRepository()
