interface PendingOrderSave {
  generation: number
  cancelled: boolean
}

let saveGeneration = 0
let pendingSlot: PendingOrderSave | null = null
const committedIds: string[] = []

export function beginOrderHistorySave(): number {
  saveGeneration += 1
  pendingSlot = { generation: saveGeneration, cancelled: false }
  return saveGeneration
}

export function completeOrderHistorySave(
  generation: number,
  id: string,
): { deleteImmediately?: string } {
  if (!pendingSlot || pendingSlot.generation !== generation) {
    return {}
  }

  if (pendingSlot.cancelled) {
    pendingSlot = null
    return { deleteImmediately: id }
  }

  pendingSlot = null
  committedIds.push(id)
  return {}
}

export function consumeOrderHistoryUndo(): string | null {
  if (pendingSlot) {
    pendingSlot.cancelled = true
  }
  return committedIds.pop() ?? null
}

/** @internal 테스트 초기화용 */
export function resetOrderHistoryUndoSync(): void {
  saveGeneration = 0
  pendingSlot = null
  committedIds.length = 0
}
