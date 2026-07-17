/** 리사이저/풀확장이 의미 있는 최소 뷰포트 폭 */
export const DESKTOP_MIN = 1024

export const EXPAND_SPLIT_STEP = 0.04
export const EXPAND_GAP_STEP = 48
export const MAX_EXPAND_STEPS = 5
export const GRID_HANDLE_WIDTH = 10
export const MIN_FIT_SCALE = 0.65
/** 이보다 작아지면 사이드 광고 열을 숨김 */
export const AD_MIN_VISIBLE = 64
export const MIN_EDGE_X = 0
/** measureMinCalculatorMid 실패 시 fallback */
export const MIN_CALC_MID_FALLBACK = 80
/** 결과 행 값 열 — …·짧은 숫자가 보일 최소 폭 */
export const RESULT_VALUE_MIN = 56
/** 컬럼 측정 실패 시 fallback */
export const MIN_COLUMN_FALLBACK = 120

export interface GridLayout {
  leftX: number | null
  rightX: number | null
  split: number
  manual: boolean
}

export interface Geometry {
  adW: number
  outerL: number
  innerL: number
  outerR: number
  innerR: number
  leftX0: number
  rightX0: number
}

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

/** 브라우저 줌·창 크기 변경 시 기본 레이아웃 기준 geometry를 비율로 보정 */
export function scaleGeometry(geo: Geometry, ratio: number): Geometry {
  if (ratio === 1) return geo
  const scale = (n: number) => Math.round(n * ratio * 1000) / 1000
  return {
    adW: geo.adW,
    outerL: scale(geo.outerL),
    innerL: scale(geo.innerL),
    outerR: scale(geo.outerR),
    innerR: scale(geo.innerR),
    leftX0: scale(geo.leftX0),
    rightX0: scale(geo.rightX0),
  }
}

/** 커스텀 gap 좌표를 뷰포트 폭 변화에 맞춰 보정 */
export function scaleGridLayout(layout: GridLayout, ratio: number): GridLayout {
  if (ratio === 1) return layout
  const scale = (n: number | null) =>
    n === null ? null : Math.round(n * ratio * 1000) / 1000
  return {
    ...layout,
    leftX: scale(layout.leftX),
    rightX: scale(layout.rightX),
  }
}

export function hasCustomGaps(layout: GridLayout): boolean {
  return layout.leftX !== null || layout.rightX !== null
}

export function isLayoutCustom(layout: GridLayout): boolean {
  return layout.manual || hasCustomGaps(layout) || layout.split !== 0.5
}

export interface ExpandStepResult {
  layout: GridLayout
  changed: boolean
  widened: boolean
}

export interface SideVars {
  outer: number
  inner: number
  adW: number
  hidden: boolean
}

export interface SideVarsOptions {
  /** 수동 리사이즈: 0 — 자동 확장: AD_MIN_VISIBLE(기본) */
  edgeFloor?: number
}

function horizontalPadding(el: HTMLElement): number {
  const style = getComputedStyle(el)
  return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
}

/** 줄바꿈 없이 라벨이 차지하는 실제 폭 */
export function measureNoWrapContentWidth(el: HTMLElement): number {
  if (typeof document === 'undefined') return 0

  const doc = el.ownerDocument
  const clone = el.cloneNode(true) as HTMLElement
  clone.style.position = 'absolute'
  clone.style.visibility = 'hidden'
  clone.style.pointerEvents = 'none'
  clone.style.whiteSpace = 'nowrap'
  clone.style.width = 'max-content'
  clone.style.maxWidth = 'none'
  clone.style.minWidth = 'max-content'
  clone.style.overflow = 'visible'
  doc.body.appendChild(clone)
  const width = Math.ceil(clone.getBoundingClientRect().width)
  doc.body.removeChild(clone)
  return width
}

function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function measureFieldLabelWidth(field: HTMLElement): number {
  const label = field.querySelector<HTMLElement>('.field-label-row')
  if (!label || !isVisible(label)) return 0
  return measureNoWrapContentWidth(label)
}

function measureInputControlMin(field: HTMLElement): number {
  const controls = field.querySelector<HTMLElement>('.number-stepper__controls')
  if (controls && isVisible(controls)) {
    return Math.ceil(controls.getBoundingClientRect().width)
  }
  return 0
}

function measureFieldColumnMin(field: HTMLElement): number {
  return Math.max(measureFieldLabelWidth(field), measureInputControlMin(field))
}

function gridGapPx(el: HTMLElement): number {
  const gap = parseFloat(getComputedStyle(el).columnGap)
  return Number.isFinite(gap) ? gap : 16
}

/** 2열 그리드 — 열별 최대 min 합 + 열 사이 gap */
export function sumGridColumnMins(columnMins: number[], gap: number): number {
  const occupied = columnMins.filter((w) => w > 0)
  if (occupied.length === 0) return 0
  return occupied.reduce((sum, w) => sum + w, 0) + gap * (occupied.length - 1)
}

export function measureFieldGridMin(section: HTMLElement, columnCount: number): number {
  const fields = [...section.querySelectorAll<HTMLElement>(':scope > .field')].filter(isVisible)
  if (fields.length === 0) return 0

  const gap = gridGapPx(section)
  let sectionMin = 0

  for (let row = 0; row < fields.length; row += columnCount) {
    const rowFields = fields.slice(row, row + columnCount)
    const colMins = rowFields.map((field) => measureFieldColumnMin(field))
    sectionMin = Math.max(sectionMin, sumGridColumnMins(colMins, gap))
  }

  return sectionMin
}

function measureFullWidthRowMin(section: HTMLElement): number {
  let max = 0
  const selectors = [
    ':scope > .field-section-title',
    ':scope > .field-section-head',
    ':scope > .field-section-footer',
    ':scope > .side-toggle',
    ':scope > .mode-toggle',
  ]
  for (const selector of selectors) {
    section.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (!isVisible(el)) return
      max = Math.max(max, measureNoWrapContentWidth(el))
    })
  }
  return max
}

function measureInputSectionMin(section: HTMLElement): number {
  const fullRow = measureFullWidthRowMin(section)
  const gridCols = section.classList.contains('field-section--position') ? 0 : 2
  const gridMin = gridCols > 0 ? measureFieldGridMin(section, gridCols) : 0
  return Math.max(fullRow, gridMin)
}

/** 입력 패널 — 섹션별 2열 라벨 min 합 + 패널 좌우 패딩 */
export function measureMinInputColumn(container: HTMLElement): number {
  const inputPanel = container.querySelector<HTMLElement>('.input-panel')
  if (!inputPanel) return MIN_COLUMN_FALLBACK

  let sectionMax = 0
  inputPanel.querySelectorAll<HTMLElement>('.field-section').forEach((section) => {
    sectionMax = Math.max(sectionMax, measureInputSectionMin(section))
  })

  return Math.ceil(horizontalPadding(inputPanel) + sectionMax)
}

function measureResultRowMainMin(main: HTMLElement): number {
  const label = main.querySelector<HTMLElement>('.result-row-label')
  const labelW = label && isVisible(label) ? measureNoWrapContentWidth(label) : 0
  return labelW + gridGapPx(main) + RESULT_VALUE_MIN
}

function measureResultOrderFieldsMin(fields: HTMLElement): number {
  let total = 0
  let count = 0
  fields.querySelectorAll<HTMLElement>('.result-order-field').forEach((field) => {
    if (field.classList.contains('result-order-field--commit')) {
      total += Math.ceil(field.getBoundingClientRect().width) || 22
      return
    }
    const label = field.querySelector<HTMLElement>('.field-label-row')
    const labelW = label && isVisible(label) ? measureNoWrapContentWidth(label) : 0
    const control = field.querySelector<HTMLElement>('.number-stepper__controls')
    const controlW =
      control && isVisible(control) ? Math.ceil(control.getBoundingClientRect().width) : 0
    total += Math.max(labelW, controlW, RESULT_VALUE_MIN)
    count += 1
  })

  const gap = parseFloat(getComputedStyle(fields).gap) || 8
  if (count > 1) total += gap * (count - 1)
  return total
}

function measureResultSheetMin(table: HTMLElement): number {
  const headers = [...table.querySelectorAll<HTMLElement>('thead th')].filter(isVisible)
  if (headers.length === 0) return 0
  const headerSum = headers.reduce((sum, th) => sum + measureNoWrapContentWidth(th), 0)
  const row = table.querySelector<HTMLElement>('tbody tr')
  const rowPad = row ? horizontalPadding(row) : 32
  return rowPad + headerSum
}

/** 결과 패널 — 2열·페어·주문 필드 등 레이아웃별 라벨 min 합 + 패널 패딩 */
export function measureMinResultColumn(container: HTMLElement): number {
  const resultCol = container.querySelector<HTMLElement>('.result-column')
  if (!resultCol) return MIN_COLUMN_FALLBACK

  const panel = resultCol.querySelector<HTMLElement>('.result-panel')
  const panelPad = horizontalPadding(panel ?? resultCol)

  let contentMin = 0

  resultCol.querySelectorAll<HTMLElement>('.result-hero-label').forEach((label) => {
    if (!isVisible(label)) return
    contentMin = Math.max(contentMin, measureNoWrapContentWidth(label))
  })

  resultCol.querySelectorAll<HTMLElement>('.result-row-pair').forEach((pair) => {
    let pairMin = 0
    pair.querySelectorAll<HTMLElement>('.result-row-main').forEach((main) => {
      pairMin += measureResultRowMainMin(main)
    })
    pairMin += gridGapPx(pair)
    const row = pair.querySelector<HTMLElement>('.result-row')
    const rowPad = row ? horizontalPadding(row) : 0
    contentMin = Math.max(contentMin, rowPad + pairMin)
  })

  resultCol.querySelectorAll<HTMLElement>('.result-row').forEach((row) => {
    if (row.closest('.result-row-pair')) return
    const main = row.querySelector<HTMLElement>('.result-row-main')
    if (!main) return
    contentMin = Math.max(contentMin, horizontalPadding(row) + measureResultRowMainMin(main))
  })

  resultCol.querySelectorAll<HTMLElement>('.result-order-fields').forEach((fields) => {
    contentMin = Math.max(contentMin, measureResultOrderFieldsMin(fields))
  })

  resultCol.querySelectorAll<HTMLElement>('.result-sheet').forEach((table) => {
    contentMin = Math.max(contentMin, measureResultSheetMin(table))
  })

  return Math.ceil(panelPad + contentMin)
}

export function measureMinColumnWidths(container: HTMLElement): {
  inputMin: number
  resultMin: number
} {
  return {
    inputMin: measureMinInputColumn(container),
    resultMin: measureMinResultColumn(container),
  }
}

/** 중앙 리사이저 split 허용 범위 — 좌·우 라벨 최소 폭 기준 */
export function computeSplitBounds(
  mid: number,
  inputMin: number,
  resultMin: number,
): { minSplit: number; maxSplit: number } {
  if (mid <= 0) return { minSplit: 0.5, maxSplit: 0.5 }

  let minSplit = clamp(inputMin / mid, 0.1, 0.9)
  let maxSplit = clamp(1 - resultMin / mid, 0.1, 0.9)

  if (minSplit > maxSplit) {
    const balanced = clamp((inputMin + mid - resultMin) / (2 * mid), 0.1, 0.9)
    minSplit = balanced
    maxSplit = balanced
  }

  return { minSplit, maxSplit }
}

/** mid·열 최소 폭 기준으로 split 보정 — 좌·우 핸들 드래그 후에도 열별 min 유지 */
export function clampSplitForColumnMins(
  split: number,
  mid: number,
  inputMin: number,
  resultMin: number,
): number {
  const { minSplit, maxSplit } = computeSplitBounds(mid, inputMin, resultMin)
  return clamp(split, minSplit, maxSplit)
}

/**
 * 번역·용어 변경으로 열 최소 폭이 커졌을 때 현재 사용자 레이아웃을 최소한으로 확장한다.
 * 문구가 짧아진 경우에는 사용자가 만든 폭을 다시 줄이지 않는다.
 */
export function reconcileLayoutForColumnMins(
  layout: GridLayout,
  geo: Geometry,
  viewportWidth: number,
  inputMin: number,
  resultMin: number,
  handleWidth = GRID_HANDLE_WIDTH,
): GridLayout {
  const safeViewportWidth = Math.max(0, viewportWidth)
  const safeInputMin = Math.max(0, inputMin)
  const safeResultMin = Math.max(0, resultMin)
  const handleTotal = Math.max(0, handleWidth) * 3
  const requiredMid = Math.ceil(handleTotal + safeInputMin + safeResultMin)

  const resolvedLeftX = Math.max(MIN_EDGE_X, layout.leftX ?? geo.leftX0)
  const resolvedRightX = Math.max(MIN_EDGE_X, layout.rightX ?? geo.rightX0)
  let leftX = resolvedLeftX
  let rightX = resolvedRightX

  const currentMid = Math.max(0, safeViewportWidth - leftX - rightX)
  let remainingDeficit = Math.min(
    Math.max(0, requiredMid - currentMid),
    leftX + rightX,
  )

  // 계산기 중심을 최대한 유지하면서 양쪽 여백을 같은 양부터 줄인다.
  const sharedReduction = Math.min(remainingDeficit / 2, leftX, rightX)
  leftX -= sharedReduction
  rightX -= sharedReduction
  remainingDeficit -= sharedReduction * 2

  // 한쪽 여백이 먼저 소진되면 다른 쪽이 남은 부족분을 맡는다.
  const leftReduction = Math.min(leftX, remainingDeficit)
  leftX -= leftReduction
  remainingDeficit -= leftReduction

  const rightReduction = Math.min(rightX, remainingDeficit)
  rightX -= rightReduction

  const widened = leftX !== resolvedLeftX || rightX !== resolvedRightX
  const columnMid = Math.max(0, safeViewportWidth - leftX - rightX - handleTotal)
  const split = clampSplitForColumnMins(
    layout.split,
    columnMid,
    safeInputMin,
    safeResultMin,
  )

  const nextLeftX = widened ? leftX : layout.leftX
  const nextRightX = widened ? rightX : layout.rightX
  if (
    nextLeftX === layout.leftX &&
    nextRightX === layout.rightX &&
    split === layout.split
  ) {
    return layout
  }

  return { ...layout, leftX: nextLeftX, rightX: nextRightX, split }
}

/** calc-grid 중간 영역(입력+결과+핸들) 최소 px — 라벨 nowrap 기준 */
export function measureMinCalculatorMid(container: HTMLElement): number {
  const handleW =
    parseFloat(getComputedStyle(container).getPropertyValue('--calc-handle-w')) || 10
  const handleTotal = handleW * 3
  const { inputMin, resultMin } = measureMinColumnWidths(container)
  return Math.ceil(handleTotal + inputMin + resultMin)
}

/** 한쪽 가장자리 거리 x → outer/inner gap, 광고 열 폭, 숨김 여부 */
export function sideVars(
  x: number,
  adW0: number,
  outer0: number,
  options?: SideVarsOptions,
): SideVars {
  const edgeFloor = options?.edgeFloor ?? AD_MIN_VISIBLE
  const cx = Math.max(0, x)

  if (edgeFloor <= 0) {
    if (cx <= AD_MIN_VISIBLE) {
      return { outer: cx, inner: 0, adW: 0, hidden: true }
    }
    if (cx <= adW0) {
      return { outer: 0, inner: 0, adW: cx, hidden: false }
    }
    const inner = Math.max(0, cx - adW0 - outer0)
    const outer = clamp(cx - adW0, 0, outer0)
    return { outer, inner, adW: adW0, hidden: false }
  }

  if (cx <= AD_MIN_VISIBLE) {
    // 광고만 숨기고, 계산기 가장자리는 AD_MIN_VISIBLE 위치에 고정
    return { outer: AD_MIN_VISIBLE, inner: 0, adW: 0, hidden: true }
  }
  if (cx <= adW0) {
    return { outer: 0, inner: 0, adW: cx, hidden: false }
  }
  const inner = Math.max(0, cx - adW0 - outer0)
  const outer = clamp(cx - adW0, 0, outer0)
  return { outer, inner, adW: adW0, hidden: false }
}

/** 오버플로우 픽셀·그리드 폭으로 필요한 확장을 한 번에 계산 (단계별 RAF 없이 적용) */
export function computeExpandLayout(
  layout: GridLayout,
  geo: Geometry,
  inputOverflow: number,
  resultOverflow: number,
  midWidth: number,
): ExpandStepResult {
  if (layout.manual) return { layout, changed: false, widened: false }
  if (inputOverflow <= 0 && resultOverflow <= 0) {
    return { layout, changed: false, widened: false }
  }

  const minSplit = 0.15
  const maxSplit = 0.85
  const bothOverflow = inputOverflow > 0 && resultOverflow > 0

  let split = layout.split
  let leftX = layout.leftX ?? geo.leftX0
  let rightX = layout.rightX ?? geo.rightX0
  let widened = false
  let budget = MAX_EXPAND_STEPS

  if (!bothOverflow && budget > 0 && midWidth > 0) {
    const pixelsPerStep = midWidth * EXPAND_SPLIT_STEP

    if (inputOverflow > 0 && split < maxSplit) {
      const steps = Math.min(
        budget,
        Math.ceil(inputOverflow / pixelsPerStep),
        Math.ceil((maxSplit - split) / EXPAND_SPLIT_STEP),
      )
      if (steps > 0) {
        split = clamp(split + steps * EXPAND_SPLIT_STEP, minSplit, maxSplit)
        budget -= steps
      }
    } else if (resultOverflow > 0 && split > minSplit) {
      const steps = Math.min(
        budget,
        Math.ceil(resultOverflow / pixelsPerStep),
        Math.ceil((split - minSplit) / EXPAND_SPLIT_STEP),
      )
      if (steps > 0) {
        split = clamp(split - steps * EXPAND_SPLIT_STEP, minSplit, maxSplit)
        budget -= steps
      }
    }
  }

  let remInput = inputOverflow
  let remResult = resultOverflow
  if (!bothOverflow && midWidth > 0) {
    if (inputOverflow > 0) {
      remInput = Math.max(0, inputOverflow - (split - layout.split) * midWidth)
    }
    if (resultOverflow > 0) {
      remResult = Math.max(0, resultOverflow - (layout.split - split) * midWidth)
    }
  }

  const needsGap = bothOverflow || remInput > 0 || remResult > 0
  if (needsGap && budget > 0) {
    const overflowForGap = bothOverflow
      ? Math.max(inputOverflow, resultOverflow)
      : Math.max(remInput, remResult)
    const gapSteps = Math.min(
      budget,
      Math.max(1, Math.ceil(overflowForGap / (EXPAND_GAP_STEP * 2))),
    )

    for (let i = 0; i < gapSteps; i++) {
      const nextLeft = clamp(leftX - EXPAND_GAP_STEP, AD_MIN_VISIBLE, geo.leftX0)
      const nextRight = clamp(rightX - EXPAND_GAP_STEP, AD_MIN_VISIBLE, geo.rightX0)
      if (nextLeft === leftX && nextRight === rightX) break
      if (nextLeft < leftX || nextRight < rightX) widened = true
      leftX = nextLeft
      rightX = nextRight
    }
  }

  const origLeftX = layout.leftX ?? geo.leftX0
  const origRightX = layout.rightX ?? geo.rightX0
  const changed = split !== layout.split || leftX !== origLeftX || rightX !== origRightX

  return {
    layout: changed ? { ...layout, split, leftX, rightX } : layout,
    changed,
    widened,
  }
}

/** 한 단계 레이아웃 확장 — split 우선, 이후 좌우 가장자리 밀기 */
export function computeExpandStep(
  layout: GridLayout,
  geo: Geometry,
  inputOverflow: number,
  resultOverflow: number,
): ExpandStepResult {
  if (layout.manual) return { layout, changed: false, widened: false }
  if (inputOverflow <= 0 && resultOverflow <= 0) {
    return { layout, changed: false, widened: false }
  }

  const minSplit = 0.15
  const maxSplit = 0.85
  const bothOverflow = inputOverflow > 0 && resultOverflow > 0

  if (!bothOverflow && inputOverflow > 0 && layout.split < maxSplit) {
    const split = clamp(layout.split + EXPAND_SPLIT_STEP, minSplit, maxSplit)
    if (split !== layout.split) {
      return { layout: { ...layout, split }, changed: true, widened: false }
    }
  }

  if (!bothOverflow && resultOverflow > 0 && layout.split > minSplit) {
    const split = clamp(layout.split - EXPAND_SPLIT_STEP, minSplit, maxSplit)
    if (split !== layout.split) {
      return { layout: { ...layout, split }, changed: true, widened: false }
    }
  }

  const leftX = layout.leftX ?? geo.leftX0
  const rightX = layout.rightX ?? geo.rightX0
  const nextLeft = clamp(leftX - EXPAND_GAP_STEP, AD_MIN_VISIBLE, geo.leftX0)
  const nextRight = clamp(rightX - EXPAND_GAP_STEP, AD_MIN_VISIBLE, geo.rightX0)

  if (nextLeft === leftX && nextRight === rightX) {
    return { layout, changed: false, widened: false }
  }

  return {
    layout: {
      ...layout,
      leftX: nextLeft,
      rightX: nextRight,
    },
    changed: true,
    widened: nextLeft < leftX || nextRight < rightX,
  }
}
