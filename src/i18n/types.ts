import type { CalcMessageCode } from './calcMessages'

export type Locale = 'ko' | 'en'

export interface FieldCopy {
  label: string
  hint: string
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
  optional: string
  input: string
  result: string
  long: string
  short: string
  position: string
  contractsUnit: string
  modes: { evaluate: string; order: string }
  fields: {
    accountEquity: FieldCopy
    maintenanceMarginRate: FieldCopy
    maintenanceMargin: FieldCopy
    entrustedMarginRate: FieldCopy
    contracts: FieldCopy
    contractAmount: FieldCopy
    currentPrice: FieldCopy
    contractMultiplier: FieldCopy
    orderContracts: FieldCopy
  }
  results: Record<string, string>
  calcMessages: Record<CalcMessageCode, string>
  auth: Record<string, string>
  legal: {
    bannerShort: string
    modalTitle: string
    modalIntro: string
    sections: { title: string; body: string }[]
    acknowledge: string
    confirmButton: string
    termsLink: string
    privacyLink: string
    termsTitle: string
    privacyTitle: string
    back: string
    termsBody: string[]
    privacyBody: string[]
  }
  footer: { tagline: string; copyright: string }
  ads: Record<string, string>
}
