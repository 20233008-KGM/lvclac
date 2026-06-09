// Launch: unused — auth deferred
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { validatePassword, validateUsername } from '../auth/validation'
import { authRepo, prefsRepo } from '../db'
import { hashPassword, verifyPassword } from '../db/hash'
import type { User } from '../db/types'
import { normalizeStoredRate } from '../utils/inputFormat'
import { defaultInputs, type CalculatorInputs } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  inputs: CalculatorInputs
  updateInputs: (patch: Partial<CalculatorInputs>) => void
  login: (username: string, password: string) => Promise<string | null>
  register: (username: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  checkUsername: (username: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mergeInputs(prefs: Partial<CalculatorInputs>): CalculatorInputs {
  const legacy = prefs as Partial<CalculatorInputs> & {
    additionalContracts?: number
    priceMultiplier?: number
    maintenanceMargin?: number
  }
  return {
    ...defaultInputs,
    ...prefs,
    mode: prefs.mode ?? 'evaluate',
    positionSide: prefs.positionSide ?? 'long',
    maintenanceMarginRate: normalizeStoredRate(prefs.maintenanceMarginRate),
    maintenanceMargin: prefs.maintenanceMargin ?? legacy.maintenanceMargin,
    entrustedMarginRate: normalizeStoredRate(prefs.entrustedMarginRate),
    contractMultiplier:
      prefs.contractMultiplier ??
      (typeof legacy.priceMultiplier === 'number' ? legacy.priceMultiplier : undefined),
    orderContracts:
      prefs.orderContracts ??
      (typeof legacy.additionalContracts === 'number' ? legacy.additionalContracts : undefined),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs)

  useEffect(() => {
    async function restoreSession() {
      try {
        const userId = await authRepo.getSession()
        if (!userId) return
        const found = await authRepo.findById(userId)
        if (!found) {
          await authRepo.clearSession()
          return
        }
        setUser(found)
        const prefs = await prefsRepo.getPreferences(userId)
        if (prefs) setInputs(mergeInputs(prefs))
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const checkUsername = useCallback(async (username: string) => {
    const err = validateUsername(username)
    if (err) return false
    return !(await authRepo.usernameExists(username))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const userErr = validateUsername(username)
    if (userErr) return userErr
    const pwErr = validatePassword(password)
    if (pwErr) return pwErr

    const found = await authRepo.findByUsername(username)
    if (!found) return 'invalid_credentials'

    const valid = await verifyPassword(password, found.passwordHash)
    if (!valid) return 'invalid_credentials'

    await authRepo.setSession(found.id)
    setUser(found)
    const prefs = await prefsRepo.getPreferences(found.id)
    setInputs(prefs ? mergeInputs(prefs) : defaultInputs)
    return null
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const userErr = validateUsername(username)
    if (userErr) return userErr
    const pwErr = validatePassword(password)
    if (pwErr) return pwErr

    if (await authRepo.usernameExists(username)) {
      return 'username_taken'
    }

    const passwordHash = await hashPassword(password)
    const newUser = await authRepo.createUser(username, passwordHash)
    await authRepo.setSession(newUser.id)
    setUser(newUser)
    setInputs(defaultInputs)
    return null
  }, [])

  const logout = useCallback(async () => {
    await authRepo.clearSession()
    setUser(null)
    setInputs(defaultInputs)
  }, [])

  const updateInputs = useCallback((patch: Partial<CalculatorInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, inputs, updateInputs, login, register, logout, checkUsername }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
