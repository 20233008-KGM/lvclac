import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const repo = path.resolve('C:/Users/rlarb/김규민/code/lvclac')
const patchDir = path.join(repo, '.recovery/patches')
const baseCommit = 'f57e621'
const maxPatchIndex = 98 // exclude 97fff0df redesign (099+)

const filePaths = {
  'MyPage.tsx': 'src/components/MyPage.tsx',
  'pages.css': 'src/styles/pages.css',
  'BillingPanel.tsx': 'src/components/billing/BillingPanel.tsx',
  'MyPage.test.tsx': 'src/components/MyPage.test.tsx',
}

function gitShow(commit, relPath) {
  return execSync(`git -C "${repo}" show ${commit}:${relPath.replace(/\\/g, '/')}`, { encoding: 'utf8' })
}

const patches = fs
  .readdirSync(patchDir)
  .filter((name) => /^\d{3}-/.test(name))
  .sort()
  .map((name) => {
    const idx = Number(name.slice(0, 3))
    const m = name.match(/^\d{3}-([^-]+(?:-[^-]+)*?)-(MyPage\.tsx|pages\.css|BillingPanel\.tsx|MyPage\.test\.tsx)-(OLD|NEW|WRITE)$/)
    if (!m) return null
    return {
      idx,
      session: m[1],
      file: m[2],
      kind: m[3],
      path: path.join(patchDir, name),
    }
  })
  .filter(Boolean)
  .filter((p) => p.idx <= maxPatchIndex)

const contents = {}
for (const [base, rel] of Object.entries(filePaths)) {
  contents[base] = gitShow(baseCommit, rel)
}

const grouped = new Map()
for (const p of patches) {
  if (!grouped.has(p.idx)) grouped.set(p.idx, [])
  grouped.get(p.idx).push(p)
}

let applied = 0
let failed = 0
for (const idx of [...grouped.keys()].sort((a, b) => a - b)) {
  const group = grouped.get(idx)
  const write = group.find((p) => p.kind === 'WRITE')
  const oldP = group.find((p) => p.kind === 'OLD')
  const newP = group.find((p) => p.kind === 'NEW')
  const base = write?.file ?? oldP?.file
  if (!base) continue

  if (write) {
    contents[base] = fs.readFileSync(write.path, 'utf8')
    applied++
    continue
  }

  const oldStr = fs.readFileSync(oldP.path, 'utf8')
  const newStr = fs.readFileSync(newP.path, 'utf8')
  if (contents[base].includes(oldStr)) {
    contents[base] = contents[base].replace(oldStr, newStr)
    applied++
  } else {
    failed++
  }
}

const outDir = path.join(repo, '.recovery/final')
fs.mkdirSync(outDir, { recursive: true })
for (const [base, text] of Object.entries(contents)) {
  fs.writeFileSync(path.join(outDir, base), text)
}

console.log(`Applied ${applied}, failed ${failed}`)
for (const base of Object.keys(filePaths)) {
  const text = contents[base]
  console.log(`${base}: ${text.length} chars`)
  for (const marker of ['my-page-nav', 'my-page-body', 'my-page-settings-list', 'recordsSummaryPanel', 'AccountRecordsSummary', 'my-page-support-channel', 'embedded']) {
    if (text.includes(marker)) console.log(`  + ${marker}`)
  }
}
