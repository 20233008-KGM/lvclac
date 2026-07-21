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
  it('flattens every public order field in a stable 54-column order with Korean headers', () => {
    const table = buildOrderExportTable([order], [{ id: 'slot-1', title: '주계좌' }], 'ko', 'Asia/Seoul')

    expect(table.headers).toHaveLength(54)
    expect(table.rows[0]).toHaveLength(table.headers.length)
    expect(table.headers.slice(0, 10)).toEqual([
      '기록 ID',
      '저장 시각 (UTC)',
      '저장 시각 (현지)',
      '시간대',
      '계좌 슬롯 ID',
      '계좌 슬롯 이름',
      '메모',
      '포지션 방향',
      '주문 계약수',
      '주문 가격',
    ])
    expect(table.headers).toContain('주문 전 · 계좌 평가금액')
    expect(table.headers).toContain('주문 후 · 청산 위험')
    expect(table.rows[0][1]).toBe('2026-07-21T03:04:05.678Z')
    expect(table.rows[0][3]).toBe('Asia/Seoul')
    expect(table.rows[0][5]).toBe('주계좌')
    expect(table.rows[0][8]).toBe(0)
    expect(table.rows[0]).toContain(null)
    expect(table.rows[0]).toContain(false)
    expect(table.rows[0]).toContain(true)
    expect(table.headers.join('|')).not.toMatch(/undo|scenario|restore/i)
  })

  it('uses English headers while retaining stable enum codes', () => {
    const table = buildOrderExportTable([order], [], 'en', 'UTC')

    expect(table.headers[0]).toBe('Record ID')
    expect(table.headers).toContain('Before order · Margin input mode')
    expect(table.rows[0]).toContain('long')
    expect(table.rows[0]).toContain('perContract')
    expect(table.rows[0]).toContain('total')
  })

  it('exports snapshot inputs and results but no transient UI restore state', () => {
    const table = buildSnapshotExportTable([snapshot], [], 'ko', 'Asia/Seoul')

    expect(table.headers).toHaveLength(33)
    expect(table.rows[0]).toHaveLength(33)
    expect(table.headers).toContain('스냅샷 제목')
    expect(table.headers).toContain('생성 방식')
    expect(table.headers).toContain('계좌 평가금액')
    expect(table.headers).toContain('청산 위험')
    expect(table.rows[0]).toContain('auto')
    expect(table.rows[0]).toContain(0)
    expect(table.rows[0][4]).toBeNull()
    expect(table.rows[0][5]).toBeNull()
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

    expect(sheet[0][0]).toMatchObject({ value: 'Record ID', type: String, fontWeight: 'bold' })
    expect(sheet[1][2]).toMatchObject({ type: Date })
    expect(sheet[1][4]).toBeNull()
    expect(sheet[1][11]).toMatchObject({ value: 0, type: Number })
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
