import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// This project intentionally has no jsdom. RecordsExportModal renders through a
// document.body portal, so modal structure and state wiring follow the existing
// source-contract convention used by the other portal modal tests.
const source = readFileSync(resolve('src/components/RecordsExportModal.tsx'), 'utf8')

describe('RecordsExportModal', () => {
  it('exposes a labelled, described, busy-aware modal dialog', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby={titleId}')
    expect(source).toContain('aria-describedby={descriptionId}')
    expect(source).toContain('aria-busy={busy}')
  })

  it('defaults to orders, the current slot filter, a blank start date, and UI locale', () => {
    expect(source).toContain("useState<RecordExportKind>('orders')")
    expect(source).toContain('useState(() => filterToValue(initialFilter))')
    expect(source).toContain("const [startDate, setStartDate] = useState('')")
    expect(source).toContain('useState(initialEndDate ?? \'\')')
    expect(source).toContain('useState<RecordExportLocale>(locale)')
  })

  it('offers order/snapshot, slot, date, Korean/English, CSV, and Excel controls', () => {
    expect(source).toContain('value="orders"')
    expect(source).toContain('value="snapshots"')
    expect(source).toContain('value="unassigned"')
    expect(source).toContain('type="date"')
    expect(source).toContain('value="ko"')
    expect(source).toContain('value="en"')
    expect(source).toContain("runExport('csv')")
    expect(source).toContain("runExport('xlsx')")
  })

  it('blocks invalid ranges and maps empty, success, and retryable failure states', () => {
    expect(source).toContain('startDate > endDate')
    expect(source).toContain('copy.exportInvalidRange')
    expect(source).toContain("result.reason === 'empty' ? copy.exportEmpty : copy.exportError")
    expect(source).toContain("type: 'success'")
    expect(source).toContain("setBusyFormat(null)")
  })

  it('keeps the modal open after success and locks all controls while generating', () => {
    const successBranch = source.slice(source.indexOf('if (result.ok)'), source.indexOf('} else {'))
    expect(successBranch).not.toContain('onClose')
    expect(source.match(/disabled={busy}/g)?.length).toBeGreaterThanOrEqual(8)
  })

  it('restores focus and closes through X, overlay, or Escape when idle', () => {
    expect(source).toContain('useModalFocusRestore()')
    expect(source).toContain("event.key === 'Escape' && !busy")
    expect(source).toContain('event.target === event.currentTarget')
    expect(source).toContain('onClick={onClose}')
    expect(source).toContain('document.body.style.overflow')
  })
})
