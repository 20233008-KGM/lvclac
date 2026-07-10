// emails/supabase/*.html 을 Supabase Auth 이메일 템플릿으로 올린다.
//
//   node scripts/push-email-templates.mjs --backup   현재 설정을 백업만
//   node scripts/push-email-templates.mjs            백업 후 업로드
//
// SUPABASE_ACCESS_TOKEN 환경변수 필요 (대시보드 > Account > Access Tokens).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const emailsDir = join(root, 'emails', 'supabase')

const PROJECT_REF = 'yszjblzmzipshwtylqxa'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN 이 없습니다.')
  process.exit(1)
}

/** 템플릿 파일명 → 관리 API 필드 접두어 */
const MAPPING = {
  'confirm-signup': 'confirmation',
  recovery: 'recovery',
  'magic-link': 'magic_link',
  'email-change': 'email_change',
}

const api = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function getConfig() {
  const res = await fetch(api, { headers })
  if (!res.ok) throw new Error(`GET 실패 ${res.status}: ${await res.text()}`)
  return res.json()
}

const current = await getConfig()
const mailerKeys = Object.fromEntries(
  Object.entries(current).filter(([k]) => k.startsWith('mailer_')),
)
// 백업은 최초 1회만. 재실행 시 덮어쓰면 방금 올린 값이 "원본"으로 굳어버린다.
mkdirSync(join(root, 'emails', 'backup'), { recursive: true })
const backupPath = join(root, 'emails', 'backup', 'auth-config-before.json')
if (existsSync(backupPath)) {
  console.log(`백업 건너뜀 (이미 존재): ${backupPath}`)
} else {
  writeFileSync(backupPath, JSON.stringify(mailerKeys, null, 2) + '\n', 'utf8')
  console.log(`백업 저장: ${backupPath} (${Object.keys(mailerKeys).length}개 필드)`)
}

if (process.argv.includes('--backup')) process.exit(0)

const subjects = JSON.parse(readFileSync(join(emailsDir, 'subjects.json'), 'utf8'))
const payload = {}
for (const [file, key] of Object.entries(MAPPING)) {
  payload[`mailer_subjects_${key}`] = subjects[file]
  payload[`mailer_templates_${key}_content`] = readFileSync(
    join(emailsDir, `${file}.html`),
    'utf8',
  )
}

const res = await fetch(api, { method: 'PATCH', headers, body: JSON.stringify(payload) })
const resText = await res.text()
if (!res.ok) throw new Error(`PATCH 실패 ${res.status}: ${resText}`)
// PATCH 직후의 GET은 옛 값을 돌려줄 때가 있다. PATCH 응답 본문으로 검증한다.
const after = JSON.parse(resText)
for (const key of Object.values(MAPPING)) {
  const body = after[`mailer_templates_${key}_content`] ?? ''
  const ok = body.includes('.Data.language')
  console.log(`${ok ? '✓' : '✗'} ${key}: 제목="${after[`mailer_subjects_${key}`]}"`)
}
