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
  representative?: string
  representativeDisplayName?: Partial<Record<'ko' | 'en', string>>
  address?: string
  businessRegistrationNumber?: string
  commerceRegistrationNumber?: string
  privacyOfficer?: string
  contactEmail: string
}

export const PUBLIC_OPERATOR_INFO: PublicOperatorInfo = {
  brandName: 'Farfield Software',
  companyName: 'Farfield Software Inc.',
  productName: 'LiqGuard',
  legalName: optional(import.meta.env.VITE_PUBLIC_OPERATOR_LEGAL_NAME),
  representative: optional(import.meta.env.VITE_PUBLIC_OPERATOR_REPRESENTATIVE),
  representativeDisplayName: {
    ko: '김규민',
    en: 'Gyumin Kim',
  },
  address: optional(import.meta.env.VITE_PUBLIC_OPERATOR_ADDRESS),
  businessRegistrationNumber: optional(
    import.meta.env.VITE_PUBLIC_OPERATOR_BUSINESS_REGISTRATION_NUMBER,
  ),
  commerceRegistrationNumber: optional(
    import.meta.env.VITE_PUBLIC_OPERATOR_COMMERCE_REGISTRATION_NUMBER,
  ),
  privacyOfficer: optional(import.meta.env.VITE_PUBLIC_OPERATOR_PRIVACY_OFFICER),
  contactEmail: CONTACT_EMAIL,
}

export function publicOperatorDisplayName(
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): string {
  return operator.legalName ?? operator.brandName
}

export function publicRepresentativeDisplayName(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): string | undefined {
  return operator.representative ?? operator.representativeDisplayName?.[locale]
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

  return [
    operator.legalName
      ? { label: labels.legalName, value: operator.legalName }
      : null,
    operator.representative
      ? { label: labels.representative, value: operator.representative }
      : null,
    operator.address ? { label: labels.address, value: operator.address } : null,
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
    operator.privacyOfficer
      ? { label: labels.privacyOfficer, value: operator.privacyOfficer }
      : null,
    { label: labels.contactEmail, value: operator.contactEmail },
  ].filter((item): item is { label: string; value: string } => item !== null)
}

export function publicFooterOperatorDetails(
  locale: 'ko' | 'en',
  operator: PublicOperatorInfo = PUBLIC_OPERATOR_INFO,
): { label: string; value: string }[] {
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
          placeholders: {
            representative: '김아무개',
            address: '서울특별시 강남구 테헤란로 123',
            businessRegistrationNumber: '123-45-67890',
            commerceRegistrationNumber: '2026-서울강남-0123',
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
          placeholders: {
            representative: 'Jane Doe',
            address: '123 Teheran-ro, Gangnam-gu, Seoul',
            businessRegistrationNumber: '123-45-67890',
            commerceRegistrationNumber: '2026-Seoul-Gangnam-0123',
          },
        }

  return [
    { label: copy.labels.companyName, value: operator.companyName },
    {
      label: copy.labels.representative,
      value:
        publicRepresentativeDisplayName(locale, operator) ??
        copy.placeholders.representative,
    },
    { label: copy.labels.contactEmail, value: operator.contactEmail },
    {
      label: copy.labels.address,
      value: operator.address ?? copy.placeholders.address,
    },
    {
      label: copy.labels.businessRegistrationNumber,
      value:
        operator.businessRegistrationNumber ??
        copy.placeholders.businessRegistrationNumber,
    },
    {
      label: copy.labels.commerceRegistrationNumber,
      value:
        operator.commerceRegistrationNumber ??
        copy.placeholders.commerceRegistrationNumber,
    },
  ]
}
