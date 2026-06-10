import type { Messages } from '../types'
import { boardPath } from '../../config/boards'

export const en: Messages = {
  lang: 'en',
  htmlLang: 'en',
  siteTitle: 'Leverage Calculator',
  siteDescription:
    'Free liquidation price and margin cushion calculator for futures and leveraged positions. Enter equity and margin rates from your broker.',
  appIntro:
    'Estimate liquidation price and margin headroom for futures and leveraged positions. Enter whichever values your broker displays.',
  loading: 'Loading...',
  login: 'Log in',
  logout: 'Log out',
  close: 'Close',
  langToggleLabel: 'Language',
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
  contractsUnit: 'contracts',
  modes: { evaluate: 'Evaluate', order: 'Order' },
  sections: { instrument: 'Instrument', margin: 'Margin', account: 'Account' },
  scenarioPriceCommit: 'Enter scenario preview mode',
  scenarioPriceClear: 'Clear scenario and restore pre-scenario state',
  scenarioApplyPnl: 'Apply P&L',
  draftSave: {
    label: 'Save inputs on this device',
    hint: 'When on, your inputs are stored in this browser only and restored on your next visit. Nothing is sent to a server. Turning off deletes saved values.',
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
  fields: {
    accountEquity: {
      label: 'Account equity',
      hint: 'Your cash balance plus unrealized P&L on open positions. Matches the Account equity shown in your broker app.',
      placeholder: '10,000,000',
    },
    maintenanceMarginRate: {
      label: 'Maintenance margin rate',
      hint: 'Ratio of notional (e.g. 0.247 = 24.7%)',
      placeholder: 'e.g. 0.25',
    },
    maintenanceMargin: {
      label: 'Maintenance margin (direct)',
      hint: 'Broker-displayed amount overrides rate-based estimate',
      placeholder: '500,000',
    },
    entrustedMarginRate: {
      label: 'Initial margin rate',
      hint: 'Ratio of notional for initial margin. For fixed broker amounts, use direct input',
      placeholder: 'e.g. 0.35',
    },
    entrustedMargin: {
      label: 'Initial margin (direct)',
      hint: 'Broker-displayed amount overrides rate-based estimate',
      placeholder: '12,000',
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
      hint: 'Current reference price',
      placeholder: '35,000',
    },
    scenarioPrice: {
      label: 'Scenario price',
      hint: 'First Enter (↵) enters scenario mode; Enter again applies to mark and exits. 「Apply P&L」 does the same. del or Delete restores.',
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
      hint: 'Additional contracts to simulate',
      placeholder: '+/-0',
    },
  },
  results: {
    sheetIndex: 'Metric',
    sheetBefore: 'Before',
    sheetAfter: 'After',
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
    perContractEntrusted: 'Init. margin / contract',
    perContractMaintenance: 'Maint. margin / contract',
    toleranceLong: 'Buffer to liq. (drop %)',
    toleranceShort: 'Buffer to liq. (rise %)',
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
    title: 'Leverage Calculator',
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
    termsBody: [
      '1. Scope: These terms govern use of the Leverage Calculator ("Service") operated by Farfield Software ("we", "us").',
      '2. Nature: The Service is a free web calculator. We do not provide brokerage or investment advisory services.',
      '3. User duty: Enter values matching your trading environment and use results for reference only.',
      '4. Input storage: Calculator inputs are saved in your browser localStorage only when you turn on “Save inputs on this device.” They are not sent to a server; turning it off deletes saved values.',
      '5. Advertising: We may show third-party ads (e.g. Google AdSense) subject to their policies and cookies.',
      '6. Limitation of liability: We are not liable for losses due to outages, third-party changes, or differences from broker rules except where required by law.',
      '7. Changes: Terms may be updated on the site; continued use constitutes acceptance.',
    ],
    privacyBody: [
      '1. Data: calculator inputs (device localStorage when save is enabled); with GA4/AdSense — cookies and usage logs',
      '2. Purpose: save/restore inputs, improve service, analytics and ads',
      '3. Storage: when enabled, inputs stay on your device only; not transmitted to our servers. Disabling removes them.',
      '4. Third parties: Google Analytics / AdSense when enabled',
      '5. Your rights: turn off the save toggle or clear browser data to remove saved inputs.',
      '6. Contact: Farfield Software — see footer for contact details',
    ],
  },
  formulas: {
    backToCalculator: '← Back to calculator',
    title: 'Formula reference',
    description:
      'Formulas used by the leverage calculator. Broker and exchange rules may differ — for reference only.',
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
            name: 'Maintenance at price P',
            expression: 'M(P) = M(C₀) × P / C₀',
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
          { label: 'Leverage Calculator', href: '/' },
          { label: 'Pro', soon: true },
          { label: 'Changelog', soon: true },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Farfield Software', soon: true },
          { label: 'Contact', href: 'mailto:contact@farfield.software' },
          { label: 'Careers', soon: true },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'User guide', soon: true },
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
    backToCalculator: '← Back to calculator',
    storageNotice:
      'Each board is separate by purpose. Posts are stored in this browser only for now; they will be shared once a server backend is connected.',
    writePost: 'New post',
    postList: 'Posts',
    postTitle: 'Title',
    postTitlePlaceholder: 'Summarize your request, bug, or idea',
    postBody: 'Details',
    postBodyPlaceholder: 'Steps to reproduce, expected behavior, context, etc.',
    postAuthor: 'Name',
    postAuthorPlaceholder: 'Display name (optional)',
    submit: 'Submit',
    empty: 'No posts yet. Be the first to write one.',
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
