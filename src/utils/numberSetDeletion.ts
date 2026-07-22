export interface NumberSetDeletionTransition<T> {
  nextSets: T[]
  activeDeleted: boolean
  nextActiveId: string | null
}

export function resolveNumberSetDeletionTransition<T extends { id: string }>(
  sets: readonly T[],
  activeId: string | null,
  deletedId: string,
): NumberSetDeletionTransition<T> {
  const nextSets = sets.filter((set) => set.id !== deletedId)
  const activeDeleted = activeId === deletedId
  return {
    nextSets,
    activeDeleted,
    nextActiveId: activeDeleted ? nextSets[0]?.id ?? null : activeId,
  }
}
