import { describe, expect, it } from 'vitest'
import type {
  AccountRecordSummary,
  AccountSnapshotRecord,
  OrderHistoryRecord,
} from '../db/accountRecords'
import { sampleInputs } from '../types'
import {
  buildOrderExportTable,
  buildSnapshotExportTable,
  createRecordExportXlsxBlob,
  neutralizeSpreadsheetFormula,
  recordExportFilename,
  serializeRecordExportCsv,
  toXlsxSheetData,
  type RecordExportTable,
} from './accountRecordExport'

const summary: AccountRecordSummary = {
  liquidationPrice: 12.5,
  toleranceRate: 0,
  toleranceDelta: null,
  leverageRatio: 3.25,
  maintenanceMargin: 40,
  availableMargin: 50.125,
  isAtRisk: false,
}

const order: OrderHistoryRecord = {
  id: 'order-1',
  positionSide: 'long',
  orderContracts: 0,
  orderPrice: 123.45,
  beforeInputs: { ...sampleInputs, contracts: 0, accountEval: 123.45, marginInputMode: 'perContract' },
  afterInputs: {
    ...sampleInputs,
    positionSide: 'short',
    contracts: 1.5,
    marginInputMode: 'total',
  },
  beforeResult: summary,
  afterResult: { ...summary, isAtRisk: true },
  numberSetId: 'slot-1',
  memo: '=SUM(A1:A2), "주의"\n두 번째 줄',
  createdAt: '2026-07-21T03:04:05.678Z',
}

const snapshot: AccountSnapshotRecord = {
  id: 'snapshot-1',
  title: '장 시작 전',
  inputs: { ...sampleInputs, accountEval: 0, entrustedMargin: 12.75 },
  result: summary,
  source: 'auto',
  sourceLocalDate: '2026-07-21',
  numberSetId: null,
  memo: '@위험 확인',
  createdAt: '2026-07-21T03:04:05.678Z',
}

describe('account record export tables', () => {
  it.each(['ko', 'en'] as const)('omits internal metadata in %s exports', (locale) => {
    for (const table of [
      buildOrderExportTable([order], [], locale),
      buildSnapshotExportTable([snapshot], [], locale),
    ]) {
      expect(table.headers.join('|')).not.toMatch(/기록 ID|계좌 슬롯 ID|스냅샷 제목|자동 스냅샷 현지 날짜|Record ID|Account slot ID|Snapshot title|Auto snapshot local date/)
      expect(table.rows[0]).not.toContain('order-1')
      expect(table.rows[0]).not.toContain('snapshot-1')
      expect(table.rows[0]).not.toContain('slot-1')
    }
  })

  it('rounds exported numbers like the calculator and keeps precise input rates', () => {
    const record: AccountSnapshotRecord = {
      ...snapshot,
      inputs: {
        ...snapshot.inputs,
        accountEval: 12345.6789,
        contractAmount: 1234.5678,
        contractAmountRole: 'entryPrice',
        contractMultiplier: 1.2345,
        maintenanceMarginRate: 0.499512345,
      },
      result: {
        ...summary,
        liquidationPrice: 1234.5678,
        toleranceRate: 12.3456,
        toleranceDelta: 123.5678,
        leverageRatio: 3.4567,
        maintenanceMargin: 1234.5678,
        availableMargin: -1234.5678,
      },
    }
    const original = structuredClone(record)
    const table = buildSnapshotExportTable([record], [], 'en')
    const row = Object.fromEntries(table.headers.map((header, index) => [header, table.rows[0][index]]))
    expect(row).toMatchObject({
      'Account equity': 12346,
      'Entry price / fixed contract amount': 1235,
      'Contract value type': 'Entry price',
      'Contract multiplier': 1.23,
      'Maintenance margin rate': 0.499512345,
      'Liquidation price': 1235,
      'Liquidation buffer rate (%)': -12.35,
      'Liquidation buffer price': -124,
      Leverage: 3.46,
      'Calculated maintenance margin': 1235,
      'Available margin': -1235,
    })
    const csv = serializeRecordExportCsv(table)
    expect(csv).not.toContain('1234.5678')
    expect(csv).toContain('-12.35,-124,3.46')
    const sheet = toXlsxSheetData(table)
    expect(sheet[1][table.headers.indexOf('Leverage')]).toMatchObject({ value: 3.46, type: Number })
    expect(record).toEqual(original)
  })

  it('uses the order side for both summaries, hides exhausted buffers, and translates fixed specs', () => {
    const table = buildOrderExportTable([{
      ...order,
      positionSide: 'short',
      orderPrice: 123.6789,
      beforeInputs: { ...order.beforeInputs, contractAmountRole: 'fixedSpec' },
      beforeResult: { ...summary, toleranceRate: 2.3456, toleranceDelta: 12.5 },
      afterResult: { ...summary, toleranceRate: -2, liquidationPrice: NaN },
    }], [], 'ko')
    const value = (header: string) => table.rows[0][table.headers.indexOf(header)]
    expect(value('주문 가격')).toBe(124)
    expect(value('주문 전 · 약정값 구분')).toBe('고정 계약금액')
    expect(value('주문 전 · 청산 여유율 (%)')).toBe(2.35)
    expect(value('주문 전 · 청산 여유 가격폭')).toBe(13)
    expect(value('주문 후 · 청산 여유율 (%)')).toBeNull()
    expect(value('주문 후 · 청산가격')).toBeNull()
  })

  it('flattens user-facing order fields in a stable 52-column order with Korean headers', () => {
    const table = buildOrderExportTable([order], [{ id: 'slot-1', title: '주계좌' }], 'ko', 'Asia/Seoul')

    expect(table.headers).toHaveLength(52)
    expect(table.rows[0]).toHaveLength(table.headers.length)
    expect(table.headers.slice(0, 8)).toEqual([
      '저장 시각 (UTC)',
      '저장 시각 (현지)',
      '시간대',
      '계좌 슬롯 이름',
      '메모',
      '포지션 방향',
      '주문 계약수',
      '주문 가격',
    ])
    expect(table.headers).toContain('주문 전 · 계좌 평가금액')
    expect(table.headers).toContain('주문 후 · 청산 위험')
    expect(table.rows[0][0]).toBe('2026-07-21T03:04:05.678Z')
    expect(table.rows[0][2]).toBe('Asia/Seoul')
    expect(table.rows[0][3]).toBe('주계좌')
    expect(table.rows[0][6]).toBe(0)
    expect(table.rows[0]).toContain(null)
    expect(table.rows[0]).toContain(false)
    expect(table.rows[0]).toContain(true)
    expect(table.headers.join('|')).not.toMatch(/undo|scenario|restore/i)
  })

  it('uses English headers while retaining stable enum codes', () => {
    const table = buildOrderExportTable([order], [], 'en', 'UTC')

    expect(table.headers[0]).toBe('Saved at (UTC)')
    expect(table.headers).toContain('Before order · Margin input mode')
    expect(table.rows[0]).toContain('long')
    expect(table.rows[0]).toContain('perContract')
    expect(table.rows[0]).toContain('total')
  })

  it('exports snapshot inputs and results but no transient UI restore state', () => {
    const table = buildSnapshotExportTable([snapshot], [], 'ko', 'Asia/Seoul')

    expect(table.headers).toHaveLength(29)
    expect(table.rows[0]).toHaveLength(29)
    expect(table.headers).not.toContain('스냅샷 제목')
    expect(table.headers).toContain('생성 방식')
    expect(table.headers).toContain('계좌 평가금액')
    expect(table.headers).toContain('청산 위험')
    expect(table.rows[0]).toContain('auto')
    expect(table.rows[0]).toContain(0)
    expect(table.rows[0][3]).toBeNull()
    expect(table.headers.join('|')).not.toMatch(/undo|scenario|restore|복원/i)
  })
})

describe('CSV export', () => {
  it('writes a UTF-8 BOM, RFC 4180 quoting, Korean, empty values, and formula protection', () => {
    const table: RecordExportTable = {
      headers: ['이름', '메모', '빈 값', '숫자', '불리언'],
      rows: [['홍길동', '=1+1, "인용"\n다음 줄', null, 0, false]],
      widths: [10, 30, 10, 10, 10],
      sheetName: '테스트',
    }
    const csv = serializeRecordExportCsv(table)

    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('홍길동')
    expect(csv).toContain('"\'=1+1, ""인용""\n다음 줄"')
    expect(csv).toContain('줄",,0,false\r\n')
    expect(csv).toContain(',0,false\r\n')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A1)', '  =hidden', '\tformula'])(
    'neutralizes formula-like user text: %s',
    (value) => expect(neutralizeSpreadsheetFormula(value)).toBe(`'${value}`),
  )

  it('keeps non-formula enum and prose values unchanged', () => {
    expect(neutralizeSpreadsheetFormula('long')).toBe('long')
    expect(neutralizeSpreadsheetFormula('일반 메모')).toBe('일반 메모')
  })
})

describe('Excel export', () => {
  it('preserves header, number, date, boolean, and empty cell types', () => {
    const table = buildSnapshotExportTable([snapshot], [], 'en', 'UTC')
    const sheet = toXlsxSheetData(table)

    expect(sheet[0][0]).toMatchObject({ value: 'Saved at (UTC)', type: String, fontWeight: 'bold' })
    expect(sheet[1][1]).toMatchObject({ type: Date })
    expect(sheet[1][3]).toBeNull()
    expect(sheet[1][7]).toMatchObject({ value: 0, type: Number })
    expect(sheet[1].at(-1)).toMatchObject({ value: false, type: Boolean })
  })

  it('creates a real XLSX zip blob', async () => {
    const table = buildOrderExportTable([order], [], 'ko', 'Asia/Seoul')
    const blob = await createRecordExportXlsxBlob(table)
    const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer())

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(Array.from(signature)).toEqual([0x50, 0x4b, 0x03, 0x04])
    expect(blob.size).toBeGreaterThan(1_000)
  })
})

describe('export filenames', () => {
  it('uses the fixed kind and local timestamp format', () => {
    const now = new Date(2026, 6, 21, 9, 8, 7)
    expect(recordExportFilename('orders', 'csv', now)).toBe('liqguard-orders-20260721-090807.csv')
    expect(recordExportFilename('snapshots', 'xlsx', now)).toBe(
      'liqguard-snapshots-20260721-090807.xlsx',
    )
  })
})
