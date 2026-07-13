import type { BoardId } from '../config/boards'
import type { CalcMessageCode } from './calcMessages'

export type Locale = 'ko' | 'en'

/** 용어 프리셋 식별자. 'default'는 미선택(현재 국내선물 어휘), 나머지는 상품군별. */
export const PRESET_IDS = ['default', 'index', 'stock', 'commodity', 'fx', 'cfd'] as const
export type PresetId = (typeof PRESET_IDS)[number]

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
  calculatorHistory: {
    buttonLabel: string
    menuTitle: string
    undoSection: string
    redoSection: string
    empty: string
    diff: {
      accountEval: string
      currentPrice: string
      contracts: string
      orderPreview: string
      orderApply: string
      scenarioPreview: string
      scenarioApply: string
      multiple: string
      generic: string
    }
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
    skipModalLabel: string
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
    statusError: string
    migrateLocalToCloud: string
    migrateSuccess: string
    migrateError: string
    copyHint: string
    copySuccess: string
    copyError: string
    helpHint: string
    helpHintLabel: string
    numberSetPickerLabel: string
    numberSetMenuTitle: string
    numberSetAdd: string
    numberSetManage: string
    numberSetActive: string
    numberSetLimitReached: string
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
    summaryAccountEquity: string
    summaryLiquidationBuffer: string
    summaryLeverage: string
    summaryMaintenance: string
    summaryAvailable: string
    atRisk: string
    noValue: string
    savedModalTitle: string
    savedModalGoToRecords: string
    bulkDeleteOrders: string
    bulkDeleteSnapshots: string
    bulkDeleteBusy: string
    bulkDeleteConfirmOrders: string
    bulkDeleteConfirmSnapshots: string
    bulkDeleteConfirmButton: string
    bulkDeleteCancel: string
    bulkDeleteError: string
    loadMore: string
    loadOlderRecords: string
    loadingMore: string
    loadMoreError: string
    timelineEmpty: string
    shownCount: string
    bulkDeleteConfirmOrdersWithCount: string
    bulkDeleteConfirmSnapshotsWithCount: string
    recordsArchiveTitle: string
    recordsArchiveDescription: string
    archiveOrderContracts: string
    archiveOrderPrice: string
    detail: string
    selectRecord: string
    selectedCount: string
    selectAllShown: string
    deleteSelected: string
    clearSelection: string
    bulkDeleteConfirmSelectedWithCount: string
    contextMenuLabel: string
    contextViewDetail: string
    contextSelect: string
    contextDeselect: string
    contextDeleteSelected: string
    moreActions: string
    slotFilterLabel: string
    slotFilterAll: string
    slotFilterUnassigned: string
    slotFilterAria: string
  }
  myPage: {
    title: string
    subtitle: string
    backToCalculator: string
    loginTitle: string
    loginBody: string
    loginAction: string
    loginHeadline: string
    loginPanelTitle: string
    loginPanelBody: string
    loginEmailAction: string
    loginTerms: string
    googleContinue: string
    loginBenefitSetsTitle: string
    loginBenefitSetsBody: string
    loginBenefitRecordsTitle: string
    loginBenefitRecordsBody: string
    loginBenefitProTitle: string
    loginBenefitProBody: string
    configuredWarning: string
    profileTitle: string
    emailLabel: string
    nicknameLabel: string
    nicknamePlaceholder: string
    nicknameHelp: string
    editNickname: string
    cancelEdit: string
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
    setPasswordAction: string
    settingPasswordInProgress: string
    passwordSetSuccess: string
    setPasswordEmailHelp: string
    setPasswordNoEmail: string
    savePassword: string
    passwordLabel: string
    passwordRule: string
    passwordConfirmationLabel: string
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
    recordsSummaryTitle: string
    latestSnapshotTitle: string
    latestSnapshotEmpty: string
    recentOrdersTitle: string
    recentOrdersEmpty: string
    recordsArchiveLink: string
    storageError: string
    autoSaveOrderHistoryLabel: string
    autoSaveOrderHistoryHint: string
    autoSaveOrderHistoryError: string
    autoSnapshotTitle: string
    autoSnapshotBody: string
    autoSnapshotDefaultLabel: string
    autoSnapshotLabelLabel: string
    autoSnapshotLabelPlaceholder: string
    autoSnapshotTimeZoneLabel: string
    autoSnapshotTimeOfDayLabel: string
    autoSnapshotProRequired: string
    autoSnapshotCloudRequired: string
    autoSnapshotSave: string
    autoSnapshotSaving: string
    autoSnapshotDisable: string
    autoSnapshotSaved: string
    autoSnapshotDisabled: string
    autoSnapshotError: string
    autoSnapshotNextRun: string
    autoSnapshotLastRun: string
    autoSnapshotRegionLabel: string
    autoSnapshotTimeZoneSearchPlaceholder: string
    autoSnapshotSlotToggleLabel: string
    autoSnapshotSlotCountNote: string
    toggleUseLabel: string
    navLabel: string
    navAccount: string
    navData: string
    navPlanPreferences: string
    navSupport: string
    preferencesTitle: string
    glossaryPresetTitle: string
    glossaryPresetBody: string
    regionTitle: string
    regionBody: string
    regionPlaceholder: string
    accountSettingGuardToggleLabel: string
    accountSettingGuardToggleHint: string
    numberSetsTitle: string
    numberSetsBody: string
    numberSetsLimitNote: string
    numberSetsLocalTitle: string
    numberSetsCloudTitle: string
    addLocalNumberSet: string
    addCloudNumberSet: string
    renameNumberSet: string
    deleteNumberSet: string
    selectNumberSet: string
    activeNumberSet: string
    numberSetNamePlaceholder: string
    numberSetDetails: string
    numberSetDetailEquity: string
    numberSetDetailPrice: string
    numberSetDetailLeverage: string
    numberSetDetailLiquidation: string
    numberSetDetailOpen: string
    numberSetDetailInputsHeading: string
    numberSetDetailResultsHeading: string
    numberSetDetailPositionLabel: string
    numberSetDetailClose: string
    numberSetLimitReached: string
    numberSetLoginRequired: string
    numberSetError: string
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
      /** Free 마이페이지 Free vs Pro 비교 카드 (embedded && !isPro) */
      compareHeadPrice: string
      compareSubtitle: string
      compareFreeName: string
      compareCurrentTag: string
      comparePriceFree: string
      compareProName: string
      compareProPrice: string
      compareProSub: string
      freeFeaturesIncluded: string[]
      freeFeaturesExcluded: string[]
      proFeatures: string[]
      currentPlanAction: string
      proCta: string
      /** 구독 결제 전용 페이지(/billing) */
      page: {
        /** 헤더 */
        backToCalculator: string
        pageTitle: string
        pageSubtitle: string
        statusLabel: string
        /** 플랜 선택 패널 */
        planSelectTitle: string
        /** 월간 카드 */
        monthlyCode: string
        monthlyAmount: string
        perMonth: string
        monthlyDesc: string
        /** 연간 카드 */
        yearlyBadge: string
        yearlyCode: string
        yearlyAmount: string
        perYear: string
        yearlyStrike: string
        yearlyDesc: string
        /** Pro 혜택 목록 */
        benefitsTitle: string
        benefitsTitleActive: string
        benefits: readonly string[]
        /** 구독 관리(Pro) */
        manageTitle: string
        proPlanName: string
        activeBadge: string
        portalAction: string
        receiptsAction: string
        paymentMethodAction: string
        cancelNote: string
        cancelAction: string
        /** 결제 실패 배너 */
        failedTitle: string
        failedBody: string
        retryAction: string
        /** 결제 완료 */
        successTitle: string
        successBody: string
        summaryPlan: string
        summaryNextBilling: string
        summaryPending: string
        goToCalculator: string
        viewSubscription: string
      }
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
    suggestionsDesc: string
    emailLink: string
    emailDesc: string
    adminFeedbackLink: string
    adminFeedbackDesc: string
    signOut: string
  }
  adminFeedback: {
    title: string
    description: string
    accessDeniedTitle: string
    accessDeniedBody: string
    loginRequiredTitle: string
    loginRequiredBody: string
    boardFilter: string
    statusFilter: string
    allBoards: string
    allStatuses: string
    loading: string
    loadError: string
    retry: string
    empty: string
    author: string
    contact: string
    createdAt: string
    status: string
    updateError: string
    statusLabels: Record<import('../db/feedbackPosts').FeedbackStatus, string>
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
  /** 총액 모드 주문 시뮬 시 증거금 성격(비례/고정) 확인 모달 */
  marginKindAsk: {
    title: string
    body: string
    question: string
    proportional: string
    proportionalHint: string
    fixed: string
    fixedHint: string
    skipLabel: string
  }
  /** 용어 프리셋 선택기(상단 상시 셀렉터·마이페이지 공용) 카피 */
  glossaryPreset: {
    label: string
    options: Record<PresetId, string>
  }
  /** 첫 진입 환영 온보딩 플로우 카피 */
  welcome: {
    stepLabel: string
    next: string
    back: string
    start: string
    skip: string
    greetingTitle: string
    greetingBody: string
    regionTitle: string
    regionBody: string
    regions: Record<'KR' | 'US' | 'EU' | 'JP' | 'OTHER', string>
    instrumentTitle: string
    instrumentBody: string
    marginTitle: string
    marginBody: string
    stageTitle: string
    stageBody: string
    stageFirst: string
    stageFirstDesc: string
    stageNone: string
    stageNoneDesc: string
    stageHasPosition: string
    stageHasPositionDesc: string
    usageTitle: string
    usageFirstBody: string[]
    usageNoneBody: string[]
    usageHasPositionBody: string[]
    guideLink: string
    mathLink: string
    saveTitle: string
    saveBody: string
    saveYes: string
    saveYesDesc: string
    saveNo: string
    saveNoDesc: string
    disclaimerStepTitle: string
    disclaimerStepBody: string
  }
  /** 계산기 필드 인디케이터(거래 상태별 '이 칸부터') 코치 배너 카피 */
  fieldHint: {
    dismiss: string
    firstTrade: string
    noPosition: string
    hasPosition: string
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
    loginRequiredTitle: string
    loginRequiredBody: string
    loginAction: string
    writePost: string
    postList: string
    localPostListDesc: string
    myPostListDesc: string
    submitSuccess: string
    submitError: string
    submitting: string
    loading: string
    loadError: string
    retry: string
    postsEmpty: string
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
