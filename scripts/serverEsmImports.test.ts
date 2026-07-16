import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Vercel Node 함수(api/**)는 "type": "module"(ESM)로 실행되며, Vercel은 TS를
 * 파일 단위로만 컴파일한다(번들링 없음). 따라서 서버 import 그래프의 상대 import에
 * `.js` 확장자가 없으면 배포 후 ERR_MODULE_NOT_FOUND로 함수가 통째로 죽는다
 * (2026-07-14 프로덕션 전면 장애 원인). 이 테스트는 api/ 진입점에서 도달 가능한
 * 모든 상대 import가 확장자를 갖는지 검사해 재발을 막는다.
 */

const ROOT = resolve(__dirname, '..')

function listTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listTsFiles(full)
    return full.endsWith('.ts') ? [full] : []
  })
}

const SPECIFIER_RE = /(?:from\s+|^import\s+)['"](\.[^'"]*)['"]/gm

function relativeSpecifiers(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(SPECIFIER_RE)].map((m) => m[1])
}

/** `./foo.js` 스펙을 실제 소스 파일(`./foo.ts` 등)로 되돌려 그래프 순회를 잇는다. */
function resolveSource(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec)
  const candidates = spec.endsWith('.js')
    ? [base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx'), base]
    : [base + '.ts', base + '.tsx', join(base, 'index.ts')]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

describe('public-lite 서버 표면', () => {
  it('실배포 브랜치에는 billing/cron API 진입점이 없다', () => {
    const queue = listTsFiles(join(ROOT, 'api'))
    const visited = new Set<string>()
    const violations: string[] = []

    while (queue.length > 0) {
      const file = queue.pop() as string
      if (visited.has(file)) continue
      visited.add(file)

      for (const spec of relativeSpecifiers(file)) {
        if (!/\.(js|mjs|cjs|json)$/.test(spec)) {
          violations.push(`${file.slice(ROOT.length + 1)} → '${spec}'`)
        }
        const next = resolveSource(file, spec)
        if (next && !visited.has(next)) queue.push(next)
      }
    }

    expect(visited.size).toBe(0)
    expect(violations, '상대 import에 .js 확장자를 붙여야 Vercel ESM 런타임에서 살아남는다').toEqual([])
  })
})
