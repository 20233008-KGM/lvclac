import fs from 'node:fs'
import path from 'node:path'

const transcriptRoot = path.join(process.env.USERPROFILE, '.cursor/projects/c-Users-rlarb-code-lvclac/agent-transcripts')
const outDir = path.resolve('C:/Users/rlarb/김규민/code/lvclac/.recovery/patches')
fs.mkdirSync(outDir, { recursive: true })

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith('.jsonl')) acc.push(full)
  }
  return acc.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs)
}

let idx = 0
for (const file of walk(transcriptRoot)) {
  const session = file.split(path.sep).find((p) => /^[0-9a-f-]{36}$/.test(p)) ?? 'unknown'
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let obj
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }
    for (const part of obj.message?.content ?? []) {
      if (part.type !== 'tool_use') continue
      const input = part.input ?? {}
      const base = path.basename(input.path ?? '')
      if (!['MyPage.tsx', 'pages.css', 'BillingPanel.tsx', 'MyPage.test.tsx'].includes(base)) continue
      if (part.name === 'Write' && input.contents) {
        fs.writeFileSync(path.join(outDir, `${String(idx++).padStart(3, '0')}-${session}-${base}-WRITE`), input.contents)
      }
      if (part.name === 'StrReplace' && input.old_string && input.new_string) {
        const tag = `${String(idx++).padStart(3, '0')}-${session}-${base}`
        fs.writeFileSync(path.join(outDir, `${tag}-OLD`), input.old_string)
        fs.writeFileSync(path.join(outDir, `${tag}-NEW`), input.new_string)
      }
    }
  }
}

console.log('Extracted', idx, 'patch files to', outDir)
