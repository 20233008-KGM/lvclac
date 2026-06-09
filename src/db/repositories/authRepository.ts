import type { User } from '../types'

export interface AuthRepository {
  findByUsername(username: string): Promise<User | null>
  createUser(username: string, passwordHash: string): Promise<User>
  usernameExists(username: string): Promise<boolean>
  getSession(): Promise<string | null>
  setSession(userId: string): Promise<void>
  clearSession(): Promise<void>
}
