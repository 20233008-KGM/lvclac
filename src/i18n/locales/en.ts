import type { Messages } from '../types'
import { boardPath } from '../../config/boards'
import { CONTACT_EMAIL, SUPPORT_URL } from '../../config/site'

export const en: Messages = {
  lang: 'en',
  htmlLang: 'en',
  siteTitle: 'Futures Calculator',
  siteDescription:
    'Free liquidation price and margin cushion calculator for futures and leveraged positions. Roll equity forward each day with Scenario price—no need to retype everything.',
  siteTitleTooltip: {
    ariaLabel: 'About this tool',
    overviewTitle: 'Overview',
    overviewBody:
      ' Free calculator for liquidation price and margin headroom on futures and leveraged positions.',
    usageTitle: 'How to use',
    usageBody:
      ' Enter equity and margin rates from your broker to check liquidation risk, or adjust order size and price to preview your account after a fill. Roll equity forward each morning with Scenario price: Enter → Enter.',
    footnote: 'Does not account for multiple open positions or cross-margin accounts.',
  },
  appIntro:
    'Instantly estimate liquidation price and margin headroom for a single-instrument position. Each day, enter the new mark in Scenario price and press Enter twice to roll unrealized P&L into equity. For first-time setup, a single HTS screen snapshot is most accurate.',
  loading: 'Loading...',
  login: 'Log in',
  logout: 'Log out',
  close: 'Close',
  langToggleLabel: 'Language',
  howToUse: {
    button: 'How?',
    ariaLabel: 'How to use this calculator',
    beginnerTitle: 'New to futures?',
    beginnerBody:
      ' Enter account equity plus maintenance and initial margin rates, then adjust order size and price in the Order section below to preview your account right after a fill. When only the mark changed, Scenario price can update equity without retyping everything. On first setup, copy equity and mark from one HTS screen; in volatile markets, use a snapshot.',
    experiencedTitle: 'Already trading?',
    experiencedBody:
      ' Set up account, instrument, and margin once. Each morning, enter today’s mark in Scenario price and press Enter → Enter to roll P&L into equity—no need to retype equity. Turn on “Save inputs on this device” to keep your baseline. For first setup, use a quiet market or a single HTS screen snapshot.',
    footnote: 'Assumes one open instrument per account.',
    guideLink: 'Read full guide',
  },
  optional: '(optional)',
  fieldTooltipLabel: 'Field definition',
  input: 'Inputs',
  result: 'Results',
  long: 'Long',
  short: 'Short',
  position: 'Position',
  modeLabel: 'Mode',
  orderBlocked: 'Order blocked',
  stepUp: 'Increase by 1',
  stepDown: 'Decrease by 1',
  resizeColumns: 'Resize columns',
  resetLayout: 'Reset width',
  inputMaxDigitsWarning: 'Integers are limited to 16 digits.',
  contractsUnit: 'contracts',
  modes: { evaluate: 'Evaluate', order: 'Order' },
  sections: { instrument: 'Instrument', margin: 'Margin', account: 'Account' },
  scenarioPriceCommit: 'Enter scenario preview mode',
  scenarioPriceClear: 'Esc — exit scenario mode and restore pre-scenario state',
  scenarioApplyPnl: 'Apply P&L',
  scenarioApplyPnlShort: 'Apply',
  orderScenarioCommit: 'Enter order scenario preview',
  orderScenarioClear: 'Esc — exit order scenario and restore',
  orderScenarioApply: 'Apply to account',
  orderScenarioSectionTitle: 'Order',
  orderScenarioChip: '{contracts} · {price} · preview',
  orderScenarioFieldContracts: 'Order size',
  orderScenarioFieldPrice: 'Order price',
  orderScenarioHint:
    'Enter both order size and price, then press ↵ to simulate.\n\n· ↵ — reflect order in results (preview)\n· ✓ — apply to account and held contracts (not a second order)\n· Esc — cancel simulation\n· Ctrl+Z — undo apply and return to preview',
  clearAllInputs: 'Clear all',
  clearAllInputsHint: 'Press Delete to clear only the focused input field.',
  clearAllInputsHintLabel: 'Clear shortcut help',
  clearAllInputsModalTitle: 'Clear all inputs',
  clearAllInputsModalBody: 'This will clear all entered values. Continue?',
  clearAllInputsConfirm: 'Clear',
  draftSave: {
    label: 'Save inputs on this device',
    hint: 'When on, your inputs are stored in this browser only and restored on your next visit. Nothing is sent to a server. Turning off deletes saved values. Keeps yesterday’s baseline so you can update only the mark via Scenario price the next day.',
    cleared: 'Saved data has been removed.',
    enableModalTitle: 'Save inputs on this device',
    enableModalBody: [
      'When you turn on "Save inputs on this device," values you enter in the calculator (account equity, margin rates, number of contracts, etc.) may be stored in your browser\'s local storage (localStorage) on your device.',
      'This feature is provided for convenience only; we do not transmit or store this information on our servers.',
      'When you turn saving off, stored inputs on that device are deleted.',
      'However, if others use the same device, or if malware, browser extensions, or an insecure environment is present, stored values may be exposed. We do not guarantee the security of your device environment; you should decide whether to store sensitive information.',
    ],
    enableConfirm: 'Agree and save',
    skipModalLabel: "Don't show this again",
    showGuideAgain: 'Show save notice again',
    clearedModalTitle: 'Save disabled',
    confirm: 'OK',
  },
  marginMode: {
    label: 'Margin input method',
    rate: 'Rate',
    perContract: 'Per',
    total: 'Total',
    rateHint: 'Enter margin as a ratio of notional (domestic futures).',
    perContractHint:
      'Enter a fixed margin per contract. Total = per-contract × contracts (overseas futures).',
    totalHint: 'Enter the total margin shown in your broker app as-is.',
  },
  fields: {
    accountEquity: {
      label: 'Account equity',
      hint: 'Cash balance plus unrealized P&L. Matches Account equity in your broker app.\n\nDaily updates: when size and margin are unchanged, roll equity with Scenario price.\n\nFirst-time setup: enter the value from the same HTS screen and moment as the mark. In fast markets, figures can drift slightly between fields—prefer a calm period or a single-screen snapshot.',
      placeholder: '10,000,000',
    },
    maintenanceMarginRate: {
      label: 'Maintenance margin rate',
      hint: 'Ratio of notional (e.g. 0.247 = 24.7%)',
      placeholder: 'e.g. 0.25',
    },
    maintenanceMargin: {
      label: 'Maintenance margin (total)',
      hint: 'Total maintenance margin from your broker. Scaled by contracts',
      placeholder: '500,000',
    },
    maintenanceMarginPerContract: {
      label: 'Maintenance margin (per contract)',
      hint: 'Fixed maintenance margin per contract; constant across price (overseas)',
      placeholder: '1,000',
    },
    entrustedMarginRate: {
      label: 'Initial margin rate',
      hint: 'Ratio of notional for initial margin. For fixed amounts, use per-contract or total',
      placeholder: 'e.g. 0.35',
    },
    entrustedMargin: {
      label: 'Initial margin (total)',
      hint: 'Total initial margin from your broker. Scaled by contracts',
      placeholder: '12,000',
    },
    entrustedMarginPerContract: {
      label: 'Initial margin (per contract)',
      hint: 'Fixed initial margin per contract (overseas)',
      placeholder: '6,000',
    },
    contracts: {
      label: 'Open contracts',
      hint: 'Current position size',
      placeholder: '2',
    },
    contractAmount: {
      label: 'Notional per contract',
      hint: 'Broker-displayed per-contract notional',
      placeholder: '250,000',
    },
    currentPrice: {
      label: 'Mark price',
      hint: 'Reference mark.\n\n※ Changing this alone does not update equity—use Scenario price to roll unrealized P&L.\n\nFirst-time setup: use the mark from the same HTS screen and moment as equity. In volatile markets, enter from a snapshot or when the market is calmer.',
      placeholder: '35,000',
    },
    scenarioPrice: {
      label: 'Scenario price',
      hint: 'Preview account state at a new price, or roll equity forward each day without retyping.\n\nShortcuts\n· Enter (↵) — scenario preview\n· Enter (↵) — apply P&L (updates mark and equity)\n· Esc — exit and restore\n· Ctrl+Z — undo apply\n\n💡 Daily: broker mark → Enter → Enter (contracts and margin unchanged)\n\n※ First setup: equity and mark from one HTS screen snapshot are most accurate.',
      placeholder: 'Target price',
    },
    tickSize: {
      label: 'Tick size',
      hint: 'Enables steppers on mark and scenario prices.',
      placeholder: '1',
    },
    contractMultiplier: {
      label: 'Contract multiplier',
      hint: 'Size factor for notional calc. Defaults to 1 if blank',
      placeholder: '1',
    },
    orderContracts: {
      label: 'Order size (contracts)',
      hint: 'Additional contracts to simulate at fill. + expands the position, − reduces it.',
      placeholder: '+/-0',
    },
    orderPrice: {
      label: 'Order price',
      hint: 'Assumed fill price for the simulated order.',
      placeholder: 'Order price',
    },
  },
  useCurrentPrice: 'Mark',
  useCurrentPriceShort: 'M',
  useCurrentPriceTitle: 'Fill with mark price',
  results: {
    sheetIndex: 'Metric',
    sheetBefore: 'Before',
    sheetAfter: 'After',
    precisionWarning:
      'Caution: a computed value exceeded safe integer precision. Trailing digits in the results may be inaccurate.',
    liquidationPrice: 'Liq. price',
    maxBuyableLong: 'Addl. buy limit',
    maxBuyableShort: 'Addl. sell limit',
    leverage: 'Leverage',
    leverageRatio: 'Leverage',
    leverageSub: 'Notional ÷ equity',
    maintenanceMargin: 'Maint. margin',
    contractNotional: 'Notional',
    entrustedMargin: 'Init. margin',
    availableMargin: 'Avail. margin',
    availableMarginSub: 'Equity − init. margin',
    maintenanceExcess: 'Maint. cushion',
    maintenanceExcessSub: 'Equity − maint. margin',
    perContractEntrusted: 'Init./ctr',
    perContractEntrustedTitle: 'Initial margin per contract',
    perContractMaintenance: 'Maint./ctr',
    perContractMaintenanceTitle: 'Maintenance margin per contract',
    toleranceLong: 'Liq. buffer',
    toleranceShort: 'Liq. buffer',
    tolerancePercent: 'Liq. buffer (%)',
    toleranceDeltaLong: 'Liq. dist.',
    toleranceDeltaShort: 'Liq. dist.',
    beforeLiquidation: 'Liq. price (before)',
    afterLiquidation: 'Liq. price (after)',
    liquidationDelta: 'Liq. price change',
    beforeTolerance: 'Before order',
    afterTolerance: 'After order',
    afterMaintenance: 'Maintenance (after)',
    afterEntrusted: 'Initial margin (after)',
    afterAvailable: 'Excess margin (after)',
    beforeLeverage: 'Leverage (before)',
    afterLeverage: 'Leverage (after)',
  },
  leverageUnit: 'x',
  calcMessages: {
    contracts_zero: 'Enter the number of contracts.',
    multiplier_zero: 'Contract multiplier cannot be zero.',
    order_contracts_zero: 'Enter order size in contracts.',
    maintenance_exceeds_equity:
      'Maintenance margin exceeds account equity. You are already in liquidation risk.',
    maintenance_rate_exceeds_entrusted: 'Maintenance rate exceeds initial margin rate.',
    no_available_margin: 'No avail. margin. (Equity − init. margin)',
    cannot_calc_per_contract_entrusted: 'Cannot compute initial margin per contract.',
    order_exceeds_max_buyable:
      'Order size exceeds the add-on buy limit for your available margin. This order cannot be filled at the current account level.',
    order_exceeds_max_sellable:
      'Order size exceeds the add-on sell limit for your available margin. This order cannot be filled at the current account level.',
    order_exceeds_position: 'Cannot sell more contracts than your open position.',
    at_risk: 'Liquidation risk',
  },
  auth: {
    title: 'Futures Calculator',
    modalTitle: 'Log in',
    subtitle: 'Sign in to save your calculator inputs automatically.',
    tabLogin: 'Log in',
    tabRegister: 'Sign up',
    username: 'Username',
    password: 'Password',
    submitLogin: 'Log in',
    submitRegister: 'Sign up',
    usernameTaken: 'Username is already taken.',
    invalidCredentials: 'Invalid username or password.',
  },
  legal: {
    bannerShort:
      'For reference only — not investment advice. You are solely responsible for trading decisions.',
    resultMismatchWarning:
      'Displayed results may not match actual liquidation prices or margin call timing.',
    contentNoticeLabel: 'Investment risk and calculation limitations',
    modalTitle: 'Before you continue',
    modalIntro:
      'Please read the following. Leveraged and futures trading can result in losses exceeding your deposit.',
    sections: [
      {
        title: 'Purpose',
        body: 'This tool estimates liquidation prices and margin levels for leveraged positions. It is not investment advice, a recommendation, or legal/tax guidance.',
      },
      {
        title: 'Limitations',
        body: 'Brokers and exchanges use different rounding, fees, and margin rules. We do not guarantee accuracy or completeness.',
      },
      {
        title: 'Your responsibility',
        body: 'You are solely responsible for all trading decisions. Always verify against your broker’s official figures and terms before trading.',
      },
      {
        title: 'Disclaimer',
        body: 'To the extent permitted by law, the operator is not liable for losses arising from use of or reliance on this service.',
      },
    ],
    acknowledge:
      'I have read the above and will use this tool for reference only.',
    confirmButton: 'Agree and continue',
    dismissButton: 'OK',
    skipModalLabel: "Don't show this again",
    showModalAgain: 'View service notice again',
    termsLink: 'Terms of use',
    privacyLink: 'Privacy policy',
    termsTitle: 'Terms of use',
    privacyTitle: 'Privacy policy',
    back: 'Back',
    termsEffectiveDate: 'Effective: June 11, 2025',
    termsIntro:
      'These terms govern use of the Futures Calculator (“Service”) provided by Farfield Software (“Company”) and set out the rights and obligations between the Company and users.',
    termsArticles: [
      {
        title: 'Article 1 (Purpose)',
        body: 'These terms define the conditions, procedures, and rights and obligations of the Company and users in connection with the Service.',
      },
      {
        title: 'Article 2 (Nature of the Service)',
        body: 'The Service is a free web calculator that estimates liquidation prices, margin requirements, and related figures for futures and leveraged positions. The Company does not conduct brokerage, investment advisory, or agency services and does not provide investment recommendations.',
      },
      {
        title: 'Article 3 (User obligations)',
        body: 'Users must enter values that match their trading environment and use results for reference only. Users bear full responsibility for all investment decisions and their outcomes.',
      },
      {
        title: 'Article 4 (Stored inputs)',
        body: 'Calculator inputs and certain display settings (such as panel widths) are stored in the browser on your device only when you enable the save feature. This information is not sent to our servers; disabling the feature deletes stored values on that device.',
      },
      {
        title: 'Article 5 (Advertising)',
        body: 'The Company may display third-party advertising (e.g. Google AdSense) to operate the Service. When ads are shown, the policies and cookies of those providers may apply.',
      },
      {
        title: 'Article 6 (Limitation of liability)',
        body: 'Except in cases of willful misconduct or gross negligence, the Company is not liable for damages arising from force majeure, system failures, changes to third-party services, or differences between our formulas and broker or exchange rules.',
      },
      {
        title: 'Article 7 (Numeric precision)',
        body: 'The Service computes using standard IEEE 754 double-precision floating point. Values beyond 16 integer digits or above 2⁵³ (about 9×10¹⁵) may lose trailing-digit accuracy. Inputs are limited to 16 integer digits; treat displayed results as reliable to about 15–16 significant figures. Formula definitions are available on the “Formulas” page.',
      },
      {
        title: 'Article 8 (Changes)',
        body: 'The Company may amend these terms when necessary and will post updates on the Service. Continued use after changes constitutes acceptance of the revised terms.',
      },
    ],
    privacyEffectiveDate: 'Effective: June 11, 2025',
    privacyIntro:
      'Farfield Software (“Company”) processes information as described below in connection with the Futures Calculator.',
    privacyArticles: [
      {
        title: '1. Information collected',
        body: 'Calculator inputs and display settings (such as panel widths) are stored in your browser only when you enable saving. When Google Analytics or AdSense is configured, cookies and access logs may be collected automatically.',
      },
      {
        title: '2. Purposes',
        body: 'Saving and restoring inputs, improving the Service, usage analytics, and serving and measuring advertising.',
      },
      {
        title: '3. Retention and processing',
        body: 'When saving is enabled, inputs remain on your device and are not transmitted to Company servers. Disabling the feature deletes stored values on that device.',
      },
      {
        title: '4. Third parties',
        body: 'When analytics or advertising services such as Google Analytics or AdSense are used, information may be sent to those providers under their policies.',
      },
      {
        title: '5. Your rights',
        body: 'You may remove stored inputs by turning off the save feature or clearing browser data.',
      },
      {
        title: '6. Contact',
        body: 'For privacy inquiries, use the contact details shown in the site footer.',
      },
    ],
  },
  guide: {
    title: 'User guide',
    description:
      'How to fill inputs, use order and scenario preview, a daily mark-to-market routine, and keyboard shortcuts.\nEnter numbers exactly as shown in your broker app.',
    sections: [
      {
        title: 'Getting started',
        paragraphs: [
          'Enter account equity, margin, and mark price in the left input panel.',
          'The right results panel shows liquidation price, margin buffer, and leverage.',
          'Do not add currency symbols (₩, $). Use one consistent unit per account, matching your broker display.',
          'Copy equity and mark from the same broker screen in quick succession. In fast markets, equity can shift between fields and cause a small mismatch. For first-time setup, prefer a quiet period or enter from a single-screen snapshot.',
        ],
      },
      {
        title: 'Recommended input order',
        paragraphs: ['Fill fields in this order for the smoothest workflow:'],
        items: [
          'Instrument — mark first, then equity immediately (same HTS screen / snapshot)',
          'Account — open contracts',
          'Margin — pick the mode that matches your HTS (rate, per-contract, or total), then enter maintenance and initial margin',
          'Instrument (optional) — notional, multiplier, tick size',
        ],
      },
      {
        title: 'Margin input modes',
        paragraphs: [
          'Domestic futures often use rate mode; many international contracts use per-contract fixed margin.',
          'Use total mode when your HTS shows aggregate margin only.',
          'If you enter both a rate and a direct amount, the direct amount takes precedence.',
        ],
      },
      {
        title: 'Order simulation',
        paragraphs: [
          'In the Order section at the bottom of the results panel, adjust order size and price to preview liquidation, margin, and leverage right after a fill.',
        ],
        items: [
          'Enter — enter order preview',
          'Enter again — apply fill (updates contracts and equity)',
          'Esc — cancel preview',
        ],
      },
      {
        title: 'Daily mark-to-market',
        paragraphs: [
          'Set contracts, margin, and instrument specs once, and turn on “Save inputs on this device.”',
          'Each morning, enter today’s broker mark in Scenario price and press Enter → Enter. Mark and account equity update with rolled P&L.',
          'After the first Enter, compare results with your broker. If they match, press Enter again to confirm. If not, press Esc or Ctrl+Z to undo.',
          'This routine assumes your initial equity and mark are already aligned. On first setup, use a quiet market or a single HTS screen snapshot for both numbers.',
        ],
        items: [
          'Position size and instrument unchanged',
          'No deposits, withdrawals, fees, or realized P&L',
          'Only price movement (e.g. overnight gap) needs rolling',
        ],
      },
      {
        title: 'Scenario price',
        paragraphs: [
          'The core tool for the daily routine above. Enter a scenario price and press Enter to preview results at that price while keeping stored mark and equity unchanged.',
          'When tick size is set, use ▲▼ or drag the field vertically to step by ticks.',
        ],
        items: [
          'Enter — roll P&L into mark and equity',
          'Esc or Delete — exit and clear the input',
          'Ctrl+Z — undo P&L roll',
        ],
      },
      {
        title: 'Is the layout uncomfortable?',
        paragraphs: [
          'If column widths feel wrong or numbers look clipped, drag the panel borders (resizers) to adjust.',
          'Resizers appear on desktop (wide screens) only. Use the ⟲ button in the header to reset widths.',
        ],
      },
      {
        title: 'Saving inputs',
        paragraphs: [
          'With “Save inputs” on, values stay in this browser only and are not sent to a server.',
          'Turning it off deletes saved values.',
          'Pairs well with “Daily mark-to-market”: keep yesterday’s contracts and margin, then roll only the mark via Scenario price.',
        ],
      },
    ],
    footnote:
      'Assumes one instrument and one position. Multiple symbols, cross margin, and fees are not modeled; figures may differ from your broker HTS.',
  },
  about: {
    company: 'Farfield Software',
    title: 'About us',
    tagline: 'The best experience—for a few',
    lead:
      'Farfield Software builds software that a smaller group of people use for a long time—not tools everyone tries once.',
    sections: [
      {
        title: 'What we do',
        paragraphs: [
          'We design and ship productivity tools for real workflows. Accuracy and responsiveness matter more than long feature lists.',
        ],
      },
      {
        title: 'How we work',
        paragraphs: [
          'We do not build for everyone. We focus on a small audience and tailor the experience deeply for them.',
          'We care more that existing users get better than that more people sign up. Before adding features, we make what exists more precise and faster.',
        ],
      },
      {
        title: 'What’s next',
        paragraphs: [
          'We are a small team building software that fits the people who need it.',
          'Dev requests, bug reports, and suggestions are always welcome.',
        ],
      },
    ],
    backToHome: '← Calculator',
  },
  formulas: {
    backToCalculator: '← Back to calculator',
    title: 'Formula reference',
    description:
      'Formulas used by the futures liquidation calculator. Broker and exchange rules may differ — for reference only.',
    disclaimer:
      'Direct maintenance or entrusted margin inputs override rate-based values. Liquidation timing and rounding vary by broker.',
    symbolTitle: 'Symbols',
    symbols: [
      { symbol: 'E₀', meaning: 'Account equity (current assets)' },
      { symbol: 'C₀', meaning: 'Current price' },
      { symbol: 'P', meaning: 'Price after move (unknown when solving for liquidation)' },
      { symbol: 'N', meaning: 'Open contracts' },
      { symbol: 'M', meaning: 'Contract multiplier (default 1)' },
      { symbol: 'Q', meaning: 'Total sensitivity = N × M (P&L per one price unit)' },
      { symbol: 'R', meaning: 'Maintenance margin rate (decimal, e.g. 0.247)' },
      { symbol: 'Rₑ', meaning: 'Initial / entrusted margin rate' },
    ],
    sections: [
      {
        title: 'Notional & margin',
        intro: 'Contract amount and multiplier size notional. Q for liquidation is separate.',
        entries: [
          {
            name: 'Position notional',
            expression: 'Notional = N × contract amount × M',
          },
          {
            name: 'Maintenance margin (rate)',
            expression: 'Maintenance = notional × R',
            description: 'Direct HTS amount takes precedence when provided.',
          },
          {
            name: 'Entrusted margin (rate)',
            expression: 'Entrusted = notional × Rₑ',
          },
          {
            name: 'Available margin',
            expression: 'Available = E₀ − entrusted margin',
          },
          {
            name: 'Per-contract margin',
            expression: 'Per contract = position margin ÷ N',
          },
        ],
      },
      {
        title: 'Liquidation — common',
        intro: 'Liquidation occurs when equity at price P equals maintenance at P.',
        entries: [
          {
            name: 'Q (total sensitivity)',
            expression: 'Q = N × M',
            description: 'e.g. N=58, M=10 → Q=580. If M=1, Q=N.',
          },
          {
            name: 'Maintenance at current price',
            expression: 'M(C₀) = C₀ × Q × R',
            description: 'Or direct HTS maintenance (scaled by contracts).',
          },
          {
            name: 'Maintenance at price P (rate / total)',
            expression: 'M(P) = M(C₀) × P / C₀',
          },
          {
            name: 'Fixed margin per contract (overseas)',
            expression: 'Maintenance = per-contract amount × N (constant, price-independent)',
            description:
              'Overseas fixed per-contract margin does not move with price, so M(P) is a constant rather than proportional to P.',
          },
        ],
      },
      {
        title: 'Liquidation — long',
        entries: [
          { name: 'Equity at P', expression: 'Equity(P) = E₀ + (P − C₀) × Q' },
          { name: 'Liquidation condition', expression: 'Equity(P) = M(P)' },
          { name: 'Liquidation price', expression: 'P = (C₀×Q − E₀) / (Q − M(C₀)/C₀)' },
          {
            name: 'Summary (rate form)',
            expression: 'P = (C₀×Q − E₀) / (Q×(1 − R))',
            description: 'Equivalent when M(C₀)=C₀×Q×R.',
          },
          {
            name: 'Fixed per-contract margin (long)',
            expression: 'P = C₀ + (Mfix − E₀) / Q',
            description: 'With fixed maintenance the price-proportional term drops out.',
          },
        ],
      },
      {
        title: 'Liquidation — short',
        entries: [
          { name: 'Equity at P', expression: 'Equity(P) = E₀ − (P − C₀) × Q' },
          { name: 'Liquidation condition', expression: 'Equity(P) = M(P)' },
          { name: 'Liquidation price', expression: 'P = (E₀ + C₀×Q) / (Q + M(C₀)/C₀)' },
          {
            name: 'Summary (rate form)',
            expression: 'P = (E₀ + C₀×Q) / (Q×(1 + R))',
          },
          {
            name: 'Fixed per-contract margin (short)',
            expression: 'P = C₀ + (E₀ − Mfix) / Q',
          },
        ],
        notes: [
          'For the same E₀ and Q, short upside buffer (%) < long downside buffer (%) — not symmetric.',
        ],
      },
      {
        title: 'Buffer, leverage & add-on limit',
        entries: [
          {
            name: 'Long — buffer to liquidation (%)',
            expression: '((C₀ − P) / C₀) × 100',
          },
          {
            name: 'Short — buffer to liquidation (%)',
            expression: '((P − C₀) / C₀) × 100',
          },
          {
            name: 'Price move to liquidation',
            expression: 'Long: C₀ − P  /  Short: P − C₀',
          },
          { name: 'Leverage', expression: 'Leverage = notional ÷ E₀' },
          {
            name: 'Add-on buy / sell limit',
            expression: 'floor((E₀ − entrusted) / per-contract entrusted)',
            description: 'Same margin math for long adds and short adds.',
          },
          {
            name: 'Order fill P&L (at mark)',
            expression: 'Long: (C₀ − order price) × Q  /  Short: (order price − C₀) × Q',
            description:
              'Q = order size × contract multiplier. Applied to post-order equity, liquidation, and leverage. Blank order price = mark.',
          },
        ],
      },
    ],
  },
  footer: {
    navAriaLabel: 'Footer navigation',
    disclaimer:
      'Investing involves the risk of loss, including loss exceeding your deposit. All investment decisions and responsibility rest solely with you.',
    tagline: 'Futures trading margin & margin call calculator',
    copyright: '© 2026 Farfield Software. All rights reserved.',
    soon: 'Coming soon',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Futures Calculator', href: '/' },
          { label: 'Pro', soon: true },
          { label: 'Changelog', soon: true },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'Farfield Software', href: '/about' },
          { label: 'Contact', href: `mailto:${CONTACT_EMAIL}` },
          { label: 'Support', href: SUPPORT_URL },
          { label: 'Careers', soon: true },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'User guide', href: '/guide' },
          { label: 'API docs', soon: true },
          { label: 'Status page', soon: true },
        ],
      },
      {
        title: 'Feedback',
        links: [
          { label: 'Dev request', href: boardPath('dev-request') },
          { label: 'Bug report', href: boardPath('bugs') },
          { label: 'Suggestion', href: boardPath('suggestions') },
        ],
      },
    ],
  },
  boards: {
    portalCompany: 'Farfield Software',
    storageNotice:
      'Submissions are temporarily saved on this device only until sent to Farfield Software. Other users’ posts are not visible here.',
    writePost: 'New post',
    postList: 'Saved on this device',
    localPostListDesc:
      'This is not a public board. Only submissions from this browser are listed below.',
    submitSuccess: 'Submitted and saved on this device.',
    postTitle: 'Title',
    postTitlePlaceholder: 'Summarize your request, bug, or idea',
    postBody: 'Details',
    postBodyPlaceholder: 'Steps to reproduce, expected behavior, context, etc.',
    postAuthor: 'Name',
    postAuthorPlaceholder: 'Display name (optional)',
    postContact: 'Contact',
    postContactPlaceholder: 'Email, phone, messenger ID, etc.',
    postAttachments: 'Screenshots',
    postAttachmentsHint: 'PNG, JPG, WebP, GIF · up to 3 files, 1 MB each',
    addAttachment: 'Add image',
    removeAttachment: 'Remove',
    attachmentInvalidType: 'Only PNG, JPG, WebP, and GIF images are allowed.',
    attachmentTooLarge: 'Each image must be 1 MB or smaller.',
    attachmentTooMany: 'You can attach up to 3 screenshots.',
    submit: 'Submit',
    anonymous: 'Anonymous',
    items: {
      'dev-request': {
        title: 'Dev request',
        footerLabel: 'Dev request',
        description:
          'Describe software or features you would like Farfield Software to build.',
      },
      bugs: {
        title: 'Bug report',
        footerLabel: 'Bug report',
        description:
          'Report UI bugs, broken inputs, wrong calculations, formula logic issues, and similar problems.',
      },
      suggestions: {
        title: 'Suggestion',
        footerLabel: 'Suggestion',
        description: 'Share ideas for UI, features, and usability improvements.',
      },
    },
  },
  ads: {
    leftTop: 'Left sidebar ad',
    leftBottom: 'Left sidebar ad',
    top: 'Top banner ad',
    bottom: 'Bottom banner ad',
    rightTop: 'Right sidebar ad',
    rightBottom: 'Right sidebar ad',
    generic: 'Advertisement',
  },
}
