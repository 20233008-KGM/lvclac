export interface AccountRecordSlot {
  id: string
  title: string
}

export function createAccountRecordSlotTitles(
  slots: readonly AccountRecordSlot[],
): ReadonlyMap<string, string> {
  return new Map(
    slots
      .map((slot) => [slot.id, slot.title.trim()] as const)
      .filter(([, title]) => title.length > 0),
  )
}

export function resolveAccountRecordSlotLabel(
  numberSetId: string | null | undefined,
  slotTitles: ReadonlyMap<string, string>,
  unassignedLabel: string,
  unavailableLabel: string,
): string {
  if (!numberSetId) return unassignedLabel
  return slotTitles.get(numberSetId) ?? unavailableLabel
}
