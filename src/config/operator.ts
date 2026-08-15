import { CONTACT_EMAIL } from './site'

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export interface PublicOperatorInfo {
  brandName: string
  companyName: string
  productName: string
  legalName?: string
  legalNameDisplayName?: Partial<Record<'ko' | 'en', string>>
  representative?: string
  representativeDisplayName?: Partial<Record<'ko' | 'en', string>>
  address?: string
  addressDisplayName?: Partial<Record<'ko' | 'en', string>>
  businessRegistrationNumber?: string
  commerceRegistrationNumber?: string
  privacyOfficer?: string
  privacyOfficerDisplayName?: Partial<Record<'ko' | 'en', string>>
  contactEmail: string
}

export const PUBLIC_OPERATOR_INFO: PublicOperatorInfo = {
  brandName: 'Farfield Software',
  companyName: 'Farfield Software Inc.',
  productName: 'LiqGuard',
  legalName: optional(import.meta.env.VITE_PUBLIC_OPERATOR_LEGAL_NAME),
  legalNameDisplayName: {
    ko: '주식회사 파필드소프트웨어',
    en: 'Farfield Software Inc.',
  },
  representative: optional(import.meta.env.VITE_PUBLIC_OPERATOR_REPRESENTATIVE),
  representativeDisplayName: {
    ko: '김규민',
    en: 'Gyumin Kim',
  },
  address: optional(import.meta.env.VITE_PUBLIC_OPERATOR_ADDRESS),
  addressDisplayName: {
    en: 'Unit 201-154, Gallery House Commercial Building, 755-27, Gobong-ro, Paju-si, Gyeonggi-do 10911, Republic of Korea',
  },
  businessRegistrationNumber: optional(
    import.meta.env.VITE_PUBLIC_OPERATOR_BUSINESS_REGISTRATION_NUMBER,
  ),
  commerceRegistrationNumber: optional(
    import.meta.env.VITE_PUBLIC_OPERATOR_COMMERCE_REGISTRATION_NUMBER,
  ),
  privacyOfficer: optional(import.meta.env.VITE_PUBLIC_OPERATOR_PRIVACY_OFFICER),
  privacyOfficerDisplayName: {
    ko: '김규민',
    en: 'Gyumin Kim',
  },
  contactEmail: CONTACT_EMAIL,
}

export function publicOperatorDisplayName(
  locale?: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): string {
  return (
    (locale ? operator.legalNameDisplayName?.[locale] : undefined) ??
    operator.legalName ??
    operator.brandName
  )
}

export function publicRepresentativeDisplayName(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): string | undefined {
  return operator.representativeDisplayName?.[locale] ?? operator.representative
}

export function publicAddressDisplayName(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): string | undefined {
  return operator.addressDisplayName?.[locale] ?? operator.address
}

export function publicPrivacyOfficerDisplayName(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): string | undefined {
  return operator.privacyOfficerDisplayName?.[locale] ?? operator.privacyOfficer
}

export function publicOperatorDetails(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): { label: string; value: string }[] {
  const labels =
    locale === 'ko'
      ? {
          legalName: '운영 주체',
          representative: '대표자',
          address: '주소',
          businessRegistrationNumber: '사업자등록번호',
          commerceRegistrationNumber: '통신판매업 신고번호',
          privacyOfficer: '개인정보 보호책임자',
          contactEmail: '문의',
        }
      : {
          legalName: 'Operator',
          representative: 'Representative',
          address: 'Address',
          businessRegistrationNumber: 'Business registration no.',
          commerceRegistrationNumber: 'E-commerce registration no.',
          privacyOfficer: 'Privacy officer',
          contactEmail: 'Contact',
        }

  const legalName = publicOperatorDisplayName(locale, operator)
  const representative = publicRepresentativeDisplayName(locale, operator)
  const address = publicAddressDisplayName(locale, operator)
  const privacyOfficer = publicPrivacyOfficerDisplayName(locale, operator)

  return [
    legalName
      ? { label: labels.legalName, value: legalName }
      : null,
    representative
      ? { label: labels.representative, value: representative }
      : null,
    address ? { label: labels.address, value: address } : null,
    operator.businessRegistrationNumber
      ? {
          label: labels.businessRegistrationNumber,
          value: operator.businessRegistrationNumber,
        }
      : null,
    operator.commerceRegistrationNumber
      ? {
          label: labels.commerceRegistrationNumber,
          value: operator.commerceRegistrationNumber,
        }
      : null,
    privacyOfficer
      ? { label: labels.privacyOfficer, value: privacyOfficer }
      : null,
    { label: labels.contactEmail, value: operator.contactEmail },
  ].filter((item): item is { label: string; value: string } => item !== null)
}

export function publicFooterOperatorDetails(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): { label: string; value: string }[] {
  const representative = publicRepresentativeDisplayName(locale, operator)
  const address = publicAddressDisplayName(locale, operator)
  const copy =
    locale === 'ko'
      ? {
          labels: {
            companyName: '회사',
            representative: '대표자',
            contactEmail: '문의',
            address: '주소',
            businessRegistrationNumber: '사업자등록번호',
            commerceRegistrationNumber: '통신판매업 신고번호',
          },
        }
      : {
          labels: {
            companyName: 'Company',
            representative: 'Representative',
            contactEmail: 'Contact',
            address: 'Address',
            businessRegistrationNumber: 'Business registration no.',
            commerceRegistrationNumber: 'E-commerce registration no.',
          },
        }

  return [
    { label: copy.labels.companyName, value: operator.companyName },
    representative
      ? {
          label: copy.labels.representative,
          value: representative,
        }
      : null,
    { label: copy.labels.contactEmail, value: operator.contactEmail },
    address
      ? { label: copy.labels.address, value: address }
      : null,
    operator.businessRegistrationNumber
      ? {
          label: copy.labels.businessRegistrationNumber,
          value: operator.businessRegistrationNumber,
        }
      : null,
    operator.commerceRegistrationNumber
      ? {
          label: copy.labels.commerceRegistrationNumber,
          value: operator.commerceRegistrationNumber,
        }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null)
}
