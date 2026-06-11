import type { BoardId } from '../config/boards'
import type { CalcMessageCode } from './calcMessages'

export type Locale = 'ko' | 'en'

export interface FieldCopy {
  label: string
  hint: string
  placeholder: string
}

export interface FormulaEntry {
  name: string
  expression: string
  description?: string
}

export interface FormulaSection {
  title: string
  intro?: string
  entries: FormulaEntry[]
  notes?: string[]
}

export interface Messages {
  lang: Locale
  htmlLang: string
  siteTitle: string
  siteDescription: string
  appIntro: string
  loading: string
  login: string
  logout: string
  close: string
  langToggleLabel: string
  howToUse: {
    button: string
    ariaLabel: string
    beginnerTitle: string
    beginnerBody: string
    experiencedTitle: string
    experiencedBody: string
    footnote: string
  }
  optional: string
  fieldTooltipLabel: string
  input: string
  result: string
  long: string
  short: string
  position: string
  modeLabel: string
  orderBlocked: string
  stepUp: string
  stepDown: string
  resizeColumns: string
  resetLayout: string
  contractsUnit: string
  leverageUnit: string
  modes: { evaluate: string; order: string }
  sections: { instrument: string; margin: string; account: string }
  scenarioPriceCommit: string
  scenarioPriceClear: string
  scenarioApplyPnl: string
  /** 손익 반영 버튼 표시용 짧은 라벨 */
  scenarioApplyPnlShort: string
  useCurrentPrice: string
  draftSave: {
    label: string
    hint: string
    cleared: string
    enableModalTitle: string
    enableModalBody: string[]
    enableConfirm: string
    skipModalLabel: string
    showGuideAgain: string
    clearedModalTitle: string
    confirm: string
  }
  marginMode: {
    /** 토글 그룹 접근성 라벨 */
    label: string
    rate: string
    perContract: string
    total: string
    /** 모드별 설명 (툴팁/보조 안내용) */
    rateHint: string
    perContractHint: string
    totalHint: string
  }
  fields: {
    accountEquity: FieldCopy
    maintenanceMarginRate: FieldCopy
    maintenanceMargin: FieldCopy
    maintenanceMarginPerContract: FieldCopy
    entrustedMarginRate: FieldCopy
    entrustedMargin: FieldCopy
    entrustedMarginPerContract: FieldCopy
    contracts: FieldCopy
    contractAmount: FieldCopy
    currentPrice: FieldCopy
    scenarioPrice: FieldCopy
    tickSize: FieldCopy
    contractMultiplier: FieldCopy
    orderContracts: FieldCopy
    orderPrice: FieldCopy
  }
  results: Record<string, string>
  calcMessages: Record<CalcMessageCode, string>
  auth: Record<string, string>
  legal: {
    bannerShort: string
    modalTitle: string
    modalIntro: string
    sections: { title: string; body: string }[]
    resultMismatchWarning: string
    contentNoticeLabel: string
    acknowledge: string
    confirmButton: string
    dismissButton: string
    skipModalLabel: string
    showModalAgain: string
    termsLink: string
    privacyLink: string
    termsTitle: string
    privacyTitle: string
    back: string
    termsEffectiveDate: string
    termsIntro: string
    termsArticles: { title: string; body: string }[]
    privacyEffectiveDate: string
    privacyIntro: string
    privacyArticles: { title: string; body: string }[]
  }
  footer: {
    navAriaLabel: string
    tagline: string
    copyright: string
    disclaimer: string
    soon: string
    columns: { title: string; links: { label: string; href?: string; soon?: boolean }[] }[]
  }
  formulas: {
    backToCalculator: string
    title: string
    description: string
    disclaimer: string
    symbolTitle: string
    symbols: { symbol: string; meaning: string }[]
    sections: FormulaSection[]
  }
  boards: {
    backToCalculator: string
    storageNotice: string
    writePost: string
    postList: string
    postTitle: string
    postTitlePlaceholder: string
    postBody: string
    postBodyPlaceholder: string
    postAuthor: string
    postAuthorPlaceholder: string
    submit: string
    empty: string
    anonymous: string
    items: Record<
      BoardId,
      { title: string; description: string; footerLabel: string }
    >
  }
  ads: Record<string, string>
}
