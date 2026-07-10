// Launch: unused — auth deferred
// @deprecated Legacy prototype helper. Do not use for account authentication.
// Production accounts must use Supabase Auth password hashing and storage.
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const data = encoder.encode(
    Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('') + ':' + password,
  )
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHash] = stored.split(':')
  if (!saltHex || !expectedHash) return false
  const encoder = new TextEncoder()
  const data = encoder.encode(saltHex + ':' + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex === expectedHash
}
