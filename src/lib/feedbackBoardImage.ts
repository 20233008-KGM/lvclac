import type { BoardPostAttachment } from './feedbackBoardStorage'

export const MAX_BOARD_ATTACHMENTS = 3
export const MAX_ATTACHMENT_BYTES = 1024 * 1024

const ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

export type AttachmentError = 'invalid_type' | 'too_large' | 'too_many'

export function validateImageFile(file: File): AttachmentError | null {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) return 'invalid_type'
  if (file.size > MAX_ATTACHMENT_BYTES) return 'too_large'
  return null
}

export async function readImageAttachment(
  file: File,
): Promise<{ ok: true; attachment: BoardPostAttachment } | { ok: false; error: AttachmentError }> {
  const error = validateImageFile(file)
  if (error) return { ok: false, error }

  const dataUrl = await readFileAsDataUrl(file)
  return {
    ok: true,
    attachment: {
      name: file.name,
      dataUrl,
      mimeType: file.type,
    },
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
