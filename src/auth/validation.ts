// Launch: unused — auth deferred
const MAX_USERNAME_LENGTH = 32

export function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (!trimmed) return '아이디를 입력해 주세요.'
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return `아이디는 ${MAX_USERNAME_LENGTH}자 이하로 입력해 주세요.`
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 7) return '비밀번호는 7자 이상이어야 합니다.'
  return null
}
