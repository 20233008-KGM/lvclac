export interface CloudStartupPreferenceInput {
  hasDevicePreference: boolean
  saveEnabled: boolean
  storageMode: 'local' | 'cloud'
  hasCloudSet: boolean
}

/**
 * A cloud set opens automatically only when this browser already chose cloud,
 * or when the browser has no prior save choice at all.
 */
export function shouldOpenCloudAtStartup({
  hasDevicePreference,
  saveEnabled,
  storageMode,
  hasCloudSet,
}: CloudStartupPreferenceInput): boolean {
  if (!hasCloudSet) return false
  if (!hasDevicePreference) return true
  return saveEnabled && storageMode === 'cloud'
}

export function resolveActiveCloudNumberSet<T extends { id: string }>(
  sets: T[],
  serverActiveId: string | null,
  localFallbackId: string | null,
): T | null {
  return (
    sets.find((set) => set.id === serverActiveId)
    ?? sets.find((set) => set.id === localFallbackId)
    ?? sets[0]
    ?? null
  )
}
