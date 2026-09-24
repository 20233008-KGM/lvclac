import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider, useLanguage } from '../../src/i18n'
import { MemoEditorWindow, MemoWorkspaceEditor } from '../../src/components/MemoEditorWindow'
import { BillingUpgrade } from '../../src/components/billing/BillingUpgrade'
import '../../src/App.css'
import '../../src/styles/pages.css'

const params = new URLSearchParams(location.search)
const initial = '가'.repeat(Number(params.get('length') ?? 0))
const state = { stored: initial, calls: [] as { value: string; previous: string }[], active: 0, maxActive: 0 }
Object.assign(window, { memoTest: state })

export function Fixture() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)
  if (params.has('billing')) return <BillingUpgrade copy={t.myPage.billing} busy={null} onCheckout={() => {}} />
  const props = {
    title: 'Test note', isPro: params.get('pro') === '1', initialMemo: initial,
    onSave: async (value: string, previous: string) => {
      state.calls.push({ value, previous })
      state.active++
      state.maxActive = Math.max(state.maxActive, state.active)
      await new Promise(resolve => setTimeout(resolve, Number(params.get('delay') ?? 0)))
      state.active--
      if (params.has('fail') && state.calls.length === 1) return 'memo_save_error'
      if (previous !== state.stored) return 'memo_conflict'
      state.stored = value
      return null
    },
  }
  return <main style={{ padding: 16, maxWidth: 900, margin: 'auto' }}>
    {open && (params.get('editor') === 'window'
      ? <MemoEditorWindow {...props} onClose={() => setOpen(false)} />
      : <MemoWorkspaceEditor {...props} />)}
  </main>
}
createRoot(document.getElementById('root')!).render(<LanguageProvider><Fixture /></LanguageProvider>)
