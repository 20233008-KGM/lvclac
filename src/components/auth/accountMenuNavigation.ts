export interface AccountMenuNavigationEvent {
  button: number
  defaultPrevented: boolean
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  preventDefault: () => void
}

export function onAccountMenuNavigate(
  event: AccountMenuNavigationEvent,
  navigate: () => void,
): void {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
  ) return
  event.preventDefault()
  navigate()
}
