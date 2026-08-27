import type { Cell, Feature, SheetData } from 'write-excel-file/browser'
import type {
  AccountRecordSummary,
  AccountSnapshotRecord,
  OrderHistoryRecord,
} from '../db/accountRecords'
import type { CalculatorInputs } from '../types'

export type RecordExportKind = 'orders' | 'snapshots'
export type RecordExportFormat = 'csv' | 'xlsx'
export type RecordExportLocale = 'ko' | 'en'
export type RecordExportValue = string | number | boolean | Date | null

export interface RecordExportSlot {
  id: string
  title: string
}

export interface RecordExportTable {
  headers: string[]
  rows: RecordExportValue[][]
  widths: number[]
  sheetName: string
}

interface ExportContext {
  slotTitles: Map<string, string>
  timeZone: string
}

interface ExportColumn<RecordType> {
  header: string
  width: number
  value: (record: RecordType, context: ExportContext) => RecordExportValue
}

const labels = {
  ko: {
    recordId: '기록 ID',
    createdAtUtc: '저장 시각 (UTC)',
    createdAtLocal: '저장 시각 (현지)',
    timeZone: '시간대',
    numberSetId: '계좌 슬롯 ID',
    numberSetTitle: '계좌 슬롯 이름',
    memo: '메모',
    title: '스냅샷 제목',
    source: '생성 방식',
    sourceLocalDate: '자동 스냅샷 현지 날짜',
    positionSide: '포지션 방향',
    orderContracts: '주문 계약수',
    orderPrice: '주문 가격',
    before: '주문 전',
    after: '주문 후',
    accountEval: '계좌 평가금액',
    contracts: '보유 계약수',
    contractAmount: '계약 금액',
    currentPrice: '현재가',
    marginInputMode: '증거금 입력 방식',
    totalMarginKind: '총 증거금 성격',
    maintenanceMarginRate: '유지증거금률',
    maintenanceMargin: '입력 유지증거금',
    maintenanceMarginPerContract: '계약당 유지증거금',
    entrustedMarginRate: '위탁증거금률',
    entrustedMargin: '입력 위탁증거금',
    entrustedMarginPerContract: '계약당 위탁증거금',
    contractMultiplier: '계약승수',
    contractAmountRole: '계약 금액 역할',
    tickSize: '틱 크기',
    liquidationPrice: '청산가격',
    toleranceRate: '청산 여유율',
    toleranceDelta: '청산 여유 가격폭',
    leverageRatio: '레버리지',
    resultMaintenanceMargin: '계산 유지증거금',
    availableMargin: '주문가능 증거금',
    isAtRisk: '청산 위험',
    ordersSheet: '주문기록',
    snapshotsSheet: '계좌 스냅샷',
  },
  en: {
    recordId: 'Record ID',
    createdAtUtc: 'Saved at (UTC)',
    createdAtLocal: 'Saved at (local)',
    timeZone: 'Time zone',
    numberSetId: 'Account slot ID',
    numberSetTitle: 'Account slot name',
    memo: 'Memo',
    title: 'Snapshot title',
    source: 'Source',
    sourceLocalDate: 'Auto snapshot local date',
    positionSide: 'Position side',
    orderContracts: 'Order contracts',
    orderPrice: 'Order price',
    before: 'Before order',
    after: 'After order',
    accountEval: 'Account equity',
    contracts: 'Position contracts',
    contractAmount: 'Contract amount',
    currentPrice: 'Current price',
    marginInputMode: 'Margin input mode',
    totalMarginKind: 'Total margin kind',
    maintenanceMarginRate: 'Maintenance margin rate',
    maintenanceMargin: 'Input maintenance margin',
    maintenanceMarginPerContract: 'Maintenance margin per contract',
    entrustedMarginRate: 'Initial margin rate',
    entrustedMargin: 'Input initial margin',
    entrustedMarginPerContract: 'Initial margin per contract',
    contractMultiplier: 'Contract multiplier',
    contractAmountRole: 'Contract amount role',
    tickSize: 'Tick size',
    liquidationPrice: 'Liquidation price',
    toleranceRate: 'Liquidation buffer rate',
    toleranceDelta: 'Liquidation buffer price',
    leverageRatio: 'Leverage',
    resultMaintenanceMargin: 'Calculated maintenance margin',
    availableMargin: 'Available margin',
    isAtRisk: 'At liquidation risk',
    ordersSheet: 'Orders',
    snapshotsSheet: 'Account snapshots',
  },
} as const

type ExportLabels = (typeof labels)[RecordExportLocale]

function prefixed(prefix: string, label: string): string {
  return `${prefix} · ${label}`
}

function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null
}

function commonColumns<RecordType extends { id: string; createdAt: string; numberSetId?: string | null; memo?: string | null }>(
  copy: ExportLabels,
): ExportColumn<RecordType>[] {
  return [
    { header: copy.recordId, width: 36, value: (record) => record.id },
    { header: copy.createdAtUtc, width: 24, value: (record) => new Date(record.createdAt).toISOString() },
    {
      header: copy.createdAtLocal,
      width: 21,
      value: (record) => toLocalExcelDate(record.createdAt),
    },
    { header: copy.timeZone, width: 22, value: (_record, context) => context.timeZone },
    { header: copy.numberSetId, width: 36, value: (record) => nullable(record.numberSetId) },
    {
      header: copy.numberSetTitle,
      width: 22,
      value: (record, context) =>
        record.numberSetId ? (context.slotTitles.get(record.numberSetId) ?? null) : null,
    },
    { header: copy.memo, width: 36, value: (record) => nullable(record.memo) },
  ]
}

function inputColumns<RecordType>(
  copy: ExportLabels,
  prefix: string,
  inputsOf: (record: RecordType) => CalculatorInputs,
): ExportColumn<RecordType>[] {
  const column = (
    header: string,
    width: number,
    value: (inputs: CalculatorInputs) => RecordExportValue,
  ): ExportColumn<RecordType> => ({
    header: prefixed(prefix, header),
    width,
    value: (record) => value(inputsOf(record)),
  })

  return [
    column(copy.accountEval, 18, (inputs) => nullable(inputs.accountEval)),
    column(copy.contracts, 16, (inputs) => nullable(inputs.contracts)),
    column(copy.contractAmount, 18, (inputs) => nullable(inputs.contractAmount)),
    column(copy.currentPrice, 16, (inputs) => nullable(inputs.currentPrice)),
    column(copy.marginInputMode, 20, (inputs) => nullable(inputs.marginInputMode)),
    column(copy.totalMarginKind, 20, (inputs) => nullable(inputs.totalMarginKind)),
    column(copy.maintenanceMarginRate, 20, (inputs) => nullable(inputs.maintenanceMarginRate)),
    column(copy.maintenanceMargin, 20, (inputs) => nullable(inputs.maintenanceMargin)),
    column(copy.maintenanceMarginPerContract, 24, (inputs) => nullable(inputs.maintenanceMarginPerContract)),
    column(copy.entrustedMarginRate, 20, (inputs) => nullable(inputs.entrustedMarginRate)),
    column(copy.entrustedMargin, 20, (inputs) => nullable(inputs.entrustedMargin)),
    column(copy.entrustedMarginPerContract, 24, (inputs) => nullable(inputs.entrustedMarginPerContract)),
    column(copy.contractMultiplier, 18, (inputs) => nullable(inputs.contractMultiplier)),
    column(copy.contractAmountRole, 20, (inputs) => nullable(inputs.contractAmountRole)),
    column(copy.tickSize, 14, (inputs) => nullable(inputs.tickSize)),
  ]
}

function summaryColumns<RecordType>(
  copy: ExportLabels,
  prefix: string,
  summaryOf: (record: RecordType) => AccountRecordSummary,
): ExportColumn<RecordType>[] {
  const column = (
    header: string,
    width: number,
    value: (summary: AccountRecordSummary) => RecordExportValue,
  ): ExportColumn<RecordType> => ({
    header: prefixed(prefix, header),
    width,
    value: (record) => value(summaryOf(record)),
  })

  return [
    column(copy.liquidationPrice, 18, (summary) => nullable(summary.liquidationPrice)),
    column(copy.toleranceRate, 18, (summary) => nullable(summary.toleranceRate)),
    column(copy.toleranceDelta, 20, (summary) => nullable(summary.toleranceDelta)),
    column(copy.leverageRatio, 16, (summary) => nullable(summary.leverageRatio)),
    column(copy.resultMaintenanceMargin, 22, (summary) => nullable(summary.maintenanceMargin)),
    column(copy.availableMargin, 20, (summary) => nullable(summary.availableMargin)),
    column(copy.isAtRisk, 14, (summary) => summary.isAtRisk),
  ]
}

function tableFromColumns<RecordType>(
  records: RecordType[],
  columns: ExportColumn<RecordType>[],
  slots: RecordExportSlot[],
  timeZone: string,
  sheetName: string,
): RecordExportTable {
  const context: ExportContext = {
    slotTitles: new Map(slots.map((slot) => [slot.id, slot.title])),
    timeZone,
  }
  return {
    headers: columns.map((column) => column.header),
    rows: records.map((record) => columns.map((column) => column.value(record, context))),
    widths: columns.map((column) => column.width),
    sheetName,
  }
}

export function resolveExportTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function toLocalExcelDate(value: string): Date {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
}

export function buildOrderExportTable(
  records: OrderHistoryRecord[],
  slots: RecordExportSlot[],
  locale: RecordExportLocale,
  timeZone = resolveExportTimeZone(),
): RecordExportTable {
  const copy = labels[locale]
  const columns: ExportColumn<OrderHistoryRecord>[] = [
    ...commonColumns<OrderHistoryRecord>(copy),
    { header: copy.positionSide, width: 16, value: (record) => record.positionSide },
    { header: copy.orderContracts, width: 16, value: (record) => record.orderContracts },
    { header: copy.orderPrice, width: 16, value: (record) => record.orderPrice },
    ...inputColumns<OrderHistoryRecord>(copy, copy.before, (record) => record.beforeInputs),
    ...summaryColumns<OrderHistoryRecord>(copy, copy.before, (record) => record.beforeResult),
    ...inputColumns<OrderHistoryRecord>(copy, copy.after, (record) => record.afterInputs),
    ...summaryColumns<OrderHistoryRecord>(copy, copy.after, (record) => record.afterResult),
  ]
  return tableFromColumns(records, columns, slots, timeZone, copy.ordersSheet)
}

export function buildSnapshotExportTable(
  records: AccountSnapshotRecord[],
  slots: RecordExportSlot[],
  locale: RecordExportLocale,
  timeZone = resolveExportTimeZone(),
): RecordExportTable {
  const copy = labels[locale]
  const columns: ExportColumn<AccountSnapshotRecord>[] = [
    ...commonColumns<AccountSnapshotRecord>(copy),
    { header: copy.title, width: 24, value: (record) => record.title },
    { header: copy.source, width: 14, value: (record) => record.source ?? 'manual' },
    { header: copy.sourceLocalDate, width: 22, value: (record) => nullable(record.sourceLocalDate) },
    { header: copy.positionSide, width: 16, value: (record) => record.inputs.positionSide },
    ...inputColumns<AccountSnapshotRecord>(copy, '', (record) => record.inputs).map((column) => ({
      ...column,
      header: column.header.replace(/^ · /, ''),
    })),
    ...summaryColumns<AccountSnapshotRecord>(copy, '', (record) => record.result).map((column) => ({
      ...column,
      header: column.header.replace(/^ · /, ''),
    })),
  ]
  return tableFromColumns(records, columns, slots, timeZone, copy.snapshotsSheet)
}

export function neutralizeSpreadsheetFormula(value: string): string {
  if (/^[\t\r]/.test(value) || /^\s*[=+\-@]/.test(value)) return `'${value}`
  return value
}

function formatLocalDate(value: Date): string {
  return value.toISOString().slice(0, 19).replace('T', ' ')
}

function csvCell(value: RecordExportValue): string {
  if (value == null) return ''
  const raw =
    value instanceof Date
      ? formatLocalDate(value)
      : typeof value === 'boolean'
        ? value
          ? 'true'
          : 'false'
        : typeof value === 'string'
          ? neutralizeSpreadsheetFormula(value)
          : String(value)
  return /[",\r\n]|^\s|\s$/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

export function serializeRecordExportCsv(table: RecordExportTable): string {
  return `\uFEFF${[table.headers, ...table.rows]
    .map((row) => row.map((value) => csvCell(value)).join(','))
    .join('\r\n')}\r\n`
}

function headerCell(value: string): Cell {
  return {
    value,
    type: String,
    fontWeight: 'bold',
    textColor: '#F4F7FF',
    backgroundColor: '#33405E',
    align: 'center',
    alignVertical: 'center',
    wrap: true,
    height: 34,
  }
}

function dataCell(value: RecordExportValue): Cell {
  if (value == null) return null
  if (value instanceof Date) return { value, type: Date, format: 'yyyy-mm-dd hh:mm:ss' }
  if (typeof value === 'number') return { value, type: Number, format: '0.###############' }
  if (typeof value === 'boolean') return { value, type: Boolean }
  return { value, type: String, wrap: true }
}

export function toXlsxSheetData(table: RecordExportTable): SheetData {
  return [
    table.headers.map(headerCell),
    ...table.rows.map((row) => row.map(dataCell)),
  ]
}

export async function createRecordExportXlsxBlob(table: RecordExportTable): Promise<Blob> {
  const [{ default: writeExcelFile }, utility] = await Promise.all([
    import('write-excel-file/browser'),
    import('write-excel-file/utility'),
  ])
  const filterReference = `A1:${utility.getCellAddress(table.rows.length, table.headers.length - 1)}`
  const autoFilterFeature: Feature<File | Blob | ArrayBuffer> = {
    files: {
      transform: {
        'xl/worksheets/sheet{id}.xml': {
          transform(content) {
            const order = utility.getOrderOfSiblings('xl/worksheets/sheet{id}.xml', 'worksheet')
            if (!order) return content
            return utility.insertElementMarkupAccordingToOrderOfSiblings(
              content,
              utility.getSelfClosingTagMarkup('autoFilter', { ref: filterReference }),
              order,
              'worksheet',
            )
          },
        },
      },
    },
  }

  return writeExcelFile(
    toXlsxSheetData(table),
    {
      sheet: table.sheetName,
      columns: table.widths.map((width) => ({ width })),
      stickyRowsCount: 1,
      dateFormat: 'yyyy-mm-dd hh:mm:ss',
      orientation: 'landscape',
    },
    { features: [autoFilterFeature] },
  ).toBlob()
}

export function recordExportFilename(
  kind: RecordExportKind,
  format: RecordExportFormat,
  now = new Date(),
): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  return `liqguard-${kind}-${stamp}.${format}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.hidden = true
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function downloadRecordExport(
  table: RecordExportTable,
  kind: RecordExportKind,
  format: RecordExportFormat,
): Promise<string> {
  const filename = recordExportFilename(kind, format)
  const blob =
    format === 'csv'
      ? new Blob([serializeRecordExportCsv(table)], { type: 'text/csv;charset=utf-8' })
      : await createRecordExportXlsxBlob(table)
  downloadBlob(blob, filename)
  return filename
}
