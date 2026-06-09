// Launch: unused — auth deferred
import type { CalculatorInputs } from '../types'

export interface User {
  id: string
  username: string
  passwordHash: string
  createdAt: string
}

export interface Session {
  userId: string
}

export const STORAGE_KEYS = {
  users: 'leverage_users',
  prefs: 'leverage_prefs',
  session: 'leverage_session',
} as const

export type PreferencesMap = Record<string, CalculatorInputs>
