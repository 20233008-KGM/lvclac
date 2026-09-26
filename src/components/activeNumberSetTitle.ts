const GENERATED_NUMBER_SET_TITLE = /^(?:숫자세트|Number set)\s+\d+$/

export function isUserNamedNumberSetTitle(title: string): boolean {
  const normalizedTitle = title.trim()
  return normalizedTitle !== ''
    && normalizedTitle !== '기본 세트'
    && normalizedTitle !== 'Default set'
    && !GENERATED_NUMBER_SET_TITLE.test(normalizedTitle)
}
