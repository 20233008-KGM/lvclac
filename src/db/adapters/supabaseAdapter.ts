// Launch: unused — auth deferred
import type { AuthRepository } from '../repositories/authRepository'
import type { PreferencesRepository } from '../repositories/preferencesRepository'

const NOT_IMPLEMENTED =
  'Supabase 어댑터는 아직 구현되지 않았습니다. .env에 VITE_SUPABASE_URL을 설정한 뒤 supabaseAdapter.ts를 구현하세요.'

export function createSupabaseAuthRepository(): AuthRepository {
  return {
    async findById() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async findByUsername() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async createUser() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async usernameExists() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async getSession() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async setSession() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async clearSession() {
      throw new Error(NOT_IMPLEMENTED)
    },
  }
}

export function createSupabasePreferencesRepository(): PreferencesRepository {
  return {
    async getPreferences() {
      throw new Error(NOT_IMPLEMENTED)
    },
    async savePreferences() {
      throw new Error(NOT_IMPLEMENTED)
    },
  }
}
