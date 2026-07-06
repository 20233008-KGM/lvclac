/**
 * Node http(req/res) ↔ 결제 핸들러 사이의 얇은 어댑터.
 * Vercel Function(api/stripe/*)과 Vite dev 미들웨어에서 공용으로 쓴다.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_BODY_BYTES = 1_000_000

/**
 * JSON 본문을 안전하게 읽는다.
 * Vercel Node 런타임은 본문을 미리 파싱해 `req.body`에 담고 스트림을 소비하므로,
 * 이미 파싱된 body가 있으면 그것을 쓰고, 없으면(Vite dev) 스트림을 읽는다.
 */
export function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const pre = (req as { body?: unknown }).body
  if (pre && typeof pre === 'object') {
    return Promise.resolve(pre as Record<string, unknown>)
  }
  if (typeof pre === 'string' && pre) {
    try {
      const parsed = JSON.parse(pre)
      return Promise.resolve(parsed && typeof parsed === 'object' ? parsed : {})
    } catch {
      return Promise.resolve({})
    }
  }
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > MAX_BODY_BYTES) reject(new Error('payload_too_large'))
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        const parsed = JSON.parse(raw)
        resolve(parsed && typeof parsed === 'object' ? parsed : {})
      } catch {
        reject(new Error('invalid_json'))
      }
    })
    req.on('error', reject)
  })
}

/** 원문(raw) 본문을 Buffer로 읽는다. Stripe 서명 검증에는 파싱 전 원문이 필요하다. */
export function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += buf.length
      if (size > MAX_BODY_BYTES) return reject(new Error('payload_too_large'))
      chunks.push(buf)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

/** 단일 헤더 값을 소문자 키로 조회. */
export function headerValue(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

/** Authorization: Bearer <token> 에서 토큰만 추출. */
export function bearerToken(req: IncomingMessage): string | null {
  const auth = headerValue(req, 'authorization')
  if (!auth) return null
  const match = /^Bearer\s+(.+)$/i.exec(auth)
  return match ? match[1].trim() : null
}

/** 요청에서 origin(스킴+호스트)을 추론. redirect base의 fallback으로 쓴다. */
export function requestOrigin(req: IncomingMessage): string | null {
  const origin = headerValue(req, 'origin')
  if (origin) return origin
  const host = headerValue(req, 'host')
  if (!host) return null
  const proto = headerValue(req, 'x-forwarded-proto') || 'https'
  return `${proto}://${host}`
}
