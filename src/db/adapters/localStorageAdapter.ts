import type { AuthRepository } from '../repositories/authRepository'
import type { PreferencesRepository } from '../repositories/preferencesRepository'
import { STORAGE_KEYS, type PreferencesMap, type Session, type User } from '../types'

function readUsers(): User[] {
  const raw = localStorage.getItem(STORAGE_KEYS.users)
  if (!raw) return []
  try {
    return JSON.parse(raw) as User[]
  } catch {
    return []
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
}

function readPrefs(): PreferencesMap {
  const raw = localStorage.getItem(STORAGE_KEYS.prefs)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as PreferencesMap
  } catch {
    return {}
  }
}

function writePrefs(prefs: PreferencesMap): void {
  localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(prefs))
}

export function createLocalStorageAuthRepository(): AuthRepository {
  return {
    async findByUsername(username) {
      const users = readUsers()
      return users.find((u) => u.username === username.trim()) ?? null
    },

    async createUser(username, passwordHash) {
      const users = readUsers()
      const user: User = {
        id: crypto.randomUUID(),
        username: username.trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      writeUsers(users)
      return user
    },

    async usernameExists(username) {
      const users = readUsers()
      return users.some((u) => u.username === username.trim())
    },

    async getSession() {
      const raw = localStorage.getItem(STORAGE_KEYS.session)
      if (!raw) return null
      try {
        const session = JSON.parse(raw) as Session
        return session.userId ?? null
      } catch {
        return null
      }
    },

    async setSession(userId) {
      const session: Session = { userId }
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
    },

    async clearSession() {
      localStorage.removeItem(STORAGE_KEYS.session)
    },
  }
}

export function createLocalStoragePreferencesRepository(): PreferencesRepository {
  return {
    async getPreferences(userId) {
      const prefs = readPrefs()
      return prefs[userId] ?? null
    },

    async savePreferences(userId, inputs) {
      const prefs = readPrefs()
      prefs[userId] = inputs
      writePrefs(prefs)
    },
  }
}

export function getLocalStorageData() {
  return {
    users: readUsers(),
    prefs: readPrefs(),
  }
}

export function clearLocalStorageData(): void {
  localStorage.removeItem(STORAGE_KEYS.users)
  localStorage.removeItem(STORAGE_KEYS.prefs)
  localStorage.removeItem(STORAGE_KEYS.session)
}
