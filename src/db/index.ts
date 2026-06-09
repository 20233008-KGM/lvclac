import {
  createLocalStorageAuthRepository,
  createLocalStoragePreferencesRepository,
} from './adapters/localStorageAdapter'
import {
  createSupabaseAuthRepository,
  createSupabasePreferencesRepository,
} from './adapters/supabaseAdapter'

function useSupabase(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL)
}

export const authRepo = useSupabase()
  ? createSupabaseAuthRepository()
  : createLocalStorageAuthRepository()

export const prefsRepo = useSupabase()
  ? createSupabasePreferencesRepository()
  : createLocalStoragePreferencesRepository()
