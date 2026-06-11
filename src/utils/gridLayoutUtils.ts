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

/** calc-grid 중간 영역(입력+결과+핸들) 최소 px — DOM chrome 기준 */
export function measureMinCalculatorMid(container: HTMLElement): number {
  const handleW =
    parseFloat(getComputedStyle(container).getPropertyValue('--calc-handle-w')) || 10
  const handleTotal = handleW * 3

  let inputMin = 0
  const inputPanel = container.querySelector<HTMLElement>('.input-panel')
  if (inputPanel) {
    const controls = inputPanel.querySelector<HTMLElement>('.number-stepper__controls')
    const controlsW = controls?.getBoundingClientRect().width ?? 0
    inputMin = horizontalPadding(inputPanel) + controlsW + 8
  }

  let resultMin = 0
  const resultCol = container.querySelector<HTMLElement>('.result-column')
  if (resultCol) {
    const fontSize = parseFloat(getComputedStyle(resultCol).fontSize) || 14
    resultMin = horizontalPadding(resultCol) + fontSize * 1.5
  }

  const leftColMin = Math.max(inputMin, 32)
  const rightColMin = Math.max(resultMin, 32)
  return Math.ceil(handleTotal + leftColMin + rightColMin)
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
