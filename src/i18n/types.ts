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
  siteTitleTooltip: {
    ariaLabel: string
    overviewTitle: string
    overviewBody: string
    usageTitle: string
    usageBody: string
    footnote: string
  }
  appIntro: string
  loading: string
  login: string
  logout: string
  close: string
  langToggleLabel: string
  howToUse: {
    button: string
    ariaLabel: string
    beginnerTab: string
    experiencedTab: string
    beginnerBody: string
    experiencedBody: string
    guideLink: string
  }
  optional: string
  fieldTooltipLabel: string
  tooltipGuideLink: string
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
  inputMaxDigitsWarning: string
  contractsUnit: string
  leverageUnit: string
  modes: { evaluate: string; order: string }
  sections: { instrument: string; margin: string; account: string }
  scenarioPriceCommit: string
  scenarioPriceClear: string
  scenarioApplyPnl: string
  /** 손익 반영 버튼 표시용 짧은 라벨 */
  scenarioApplyPnlShort: string
  orderScenarioCommit: string
  orderScenarioClear: string
  orderScenarioApply: string
  orderScenarioSectionTitle: string
  orderScenarioChip: string
  orderScenarioFieldContracts: string
  orderScenarioFieldPrice: string
  orderScenarioHint: string
  useCurrentPrice: string
  /** 주문가 inline 현재가 버튼 표시 (1글자) */
  useCurrentPriceShort: string
  /** 주문가 inline 현재가 버튼 aria/title */
  useCurrentPriceTitle: string
  clearAllInputs: string
  clearAllInputsHint: string
  clearAllInputsHintLabel: string
  clearAllInputsModalTitle: string
  clearAllInputsModalBody: string
  clearAllInputsConfirm: string
  accountSettingGuard: {
    title: string
    body: string
    confirm: string
    cancel: string
  }
  draftSave: {
    label: string
    cloudLabel: string
    hint: string
    cloudHint: string
    offHint: string
    storageModeLabel: string
    localMode: string
    cloudMode: string
    noSaveMode: string
    cleared: string
    enableModalTitle: string
    cloudEnableModalTitle: string
    enableModalBody: string[]
    cloudEnableModalBody: string[]
    enableConfirm: string
    skipModalLabel: string
    showGuideAgain: string
    clearedModalTitle: string
    deleteConfirmTitle: string
    deleteConfirmBody: string
    cloudDeleteConfirmBody: string
    deleteConfirm: string
    deleteCancel: string
    confirm: string
    statusLoading: string
    statusSaving: string
    statusSavedLocal: string
    statusSavedCloud: string
    statusError: string
    migrateLocalToCloud: string
    migrateSuccess: string
    migrateError: string
  }
  accountRecords: {
    title: string
    orderHistoryTab: string
    snapshotsTab: string
    loginRequired: string
    privacyNote: string
    loading: string
    loadError: string
    retry: string
    delete: string
    saveSnapshot: string
    savingSnapshot: string
    orderHistoryEmpty: string
    snapshotsEmpty: string
    snapshotSaved: string
    snapshotSaveError: string
    orderSaved: string
    orderSaveError: string
    deleteError: string
    orderSimulationLabel: string
    before: string
    after: string
    contracts: string
    price: string
    side: string
    createdAt: string
    summaryLiquidation: string
    summaryLeverage: string
    summaryMaintenance: string
    summaryAvailable: string
    atRisk: string
    noValue: string
  }
  myPage: {
    title: string
    subtitle: string
    backToCalculator: string
    loginTitle: string
    loginBody: string
    loginAction: string
    configuredWarning: string
    profileTitle: string
    emailLabel: string
    nicknameLabel: string
    nicknamePlaceholder: string
    nicknameHelp: string
    saveNickname: string
    savingNickname: string
    nicknameSaved: string
    nicknameError: string
    nicknameRequired: string
    linkedLoginTitle: string
    linkedLoginBody: string
    emailProvider: string
    googleProvider: string
    providerLinked: string
    providerNotLinked: string
    linkGoogleAction: string
    unlinkGoogleAction: string
    linkingInProgress: string
    unlinkingInProgress: string
    googleUnlinked: string
    lastIdentityNote: string
    primaryTag: string
    storageTitle: string
    storageBody: string
    cloudInputTitle: string
    cloudInputReady: string
    cloudInputEmpty: string
    storageLoading: string
    snapshotsTitle: string
    orderHistoryTitle: string
    recordsCount: string
    recordsEmpty: string
    storageError: string
    planTitle: string
    planStatusLabel: string
    planStatusValue: string
    planBody: string
    billing: {
      /** 상태 배지 라벨 */
      statusFree: string
      statusPro: string
      statusTrial: string
      statusPastDue: string
      statusCanceled: string
      /** Free 안내 */
      freeHeadline: string
      freeBody: string
      /** 플랜 카드 */
      monthlyName: string
      monthlyPrice: string
      yearlyName: string
      yearlyPrice: string
      yearlyNote: string
      /** 결제 진행 버튼/문구 */
      choosePlan: string
      redirecting: string
      /** Pro 이용 중 */
      proHeadline: string
      proBody: string
      renewsOn: string
      manageAction: string
      /** 안내/오류 */
      notConfigured: string
      checkoutError: string
      checkoutCanceled: string
      checkoutSuccess: string
      taxNote: string
    }
    privacyTitle: string
    privacyBody: string
    localStorageNote: string
    cloudStorageNote: string
    deleteAccountTitle: string
    deleteAccountBody: string
    contactSupport: string
    supportTitle: string
    supportBody: string
    suggestionsLink: string
    emailLink: string
    signOut: string
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
    /** 증거금 입력 방식 토글 ? 툴팁 본문 */
    tooltip: string
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
  guide: {
    title: string
    description: string
    sections: { title: string; paragraphs: string[]; items?: string[] }[]
    footnote: string
  }
  about: {
    company: string
    title: string
    tagline: string
    lead: string
    sections: { title: string; paragraphs: string[] }[]
    backToHome: string
  }
  boards: {
    portalCompany: string
    storageNotice: string
    writePost: string
    postList: string
    localPostListDesc: string
    submitSuccess: string
    postTitle: string
    postTitlePlaceholder: string
    postBody: string
    postBodyPlaceholder: string
    postAuthor: string
    postAuthorPlaceholder: string
    postContact: string
    postContactPlaceholder: string
    postAttachments: string
    postAttachmentsHint: string
    addAttachment: string
    removeAttachment: string
    attachmentInvalidType: string
    attachmentTooLarge: string
    attachmentTooMany: string
    submit: string
    anonymous: string
    items: Record<
      BoardId,
      { title: string; description: string; footerLabel: string }
    >
  }
  ads: Record<string, string>
}
