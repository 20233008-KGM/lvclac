export function shouldStartSnapshotSchedule(
  scheduleEnabled: boolean,
  nextSlotEnabled: boolean,
): boolean {
  return nextSlotEnabled && !scheduleEnabled
}

export function isLastEnabledSnapshotSlot(
  currentEnabledSlotCount: number,
  targetCurrentlyEnabled: boolean,
): boolean {
  return targetCurrentlyEnabled && currentEnabledSlotCount <= 1
}
