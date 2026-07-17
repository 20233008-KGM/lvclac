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
  const labels =
    locale === 'ko'
      ? {
          companyName: '회사',
          representative: '대표자',
          contactEmail: '문의',
          address: '주소',
          businessRegistrationNumber: '사업자등록번호',
          commerceRegistrationNumber: '통신판매업 신고번호',
        }
      : {
          companyName: 'Company',
          representative: 'Representative',
          contactEmail: 'Contact',
          address: 'Address',
          businessRegistrationNumber: 'Business registration no.',
          commerceRegistrationNumber: 'E-commerce registration no.',
        }

  return [
    { label: labels.companyName, value: operator.companyName },
    operator.representative
      ? { label: labels.representative, value: operator.representative }
      : null,
    { label: labels.contactEmail, value: operator.contactEmail },
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
  ].filter((item): item is { label: string; value: string } => item !== null)
}
