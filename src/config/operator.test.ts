import { describe, expect, it } from 'vitest'
import {
  publicFooterOperatorDetails,
  publicRepresentativeDisplayName,
  type PublicOperatorInfo,
} from './operator'

const operator: PublicOperatorInfo = {
  brandName: 'Farfield Software',
  companyName: 'Farfield Software Inc.',
  productName: 'LiqGuard',
  legalName: '주식회사 파필드소프트웨어',
  representative: '김아무개',
  address: '서울특별시 강남구 테헤란로 123',
  businessRegistrationNumber: '123-45-67890',
  commerceRegistrationNumber: '2026-서울강남-0123',
  privacyOfficer: '김아무개',
  contactEmail: 'contact@farfield.software',
}

describe('publicFooterOperatorDetails', () => {
  it('uses the English company name in both locales and omits the privacy officer', () => {
    expect(publicFooterOperatorDetails('ko', operator)).toEqual([
      { label: '회사', value: 'Farfield Software Inc.' },
      { label: '대표자', value: '김아무개' },
      { label: '문의', value: 'contact@farfield.software' },
      { label: '주소', value: '서울특별시 강남구 테헤란로 123' },
      { label: '사업자등록번호', value: '123-45-67890' },
      { label: '통신판매업 신고번호', value: '2026-서울강남-0123' },
    ])

    expect(publicFooterOperatorDetails('en', operator)).toEqual([
      { label: 'Company', value: 'Farfield Software Inc.' },
      { label: 'Representative', value: '김아무개' },
      { label: 'Contact', value: 'contact@farfield.software' },
      { label: 'Address', value: '서울특별시 강남구 테헤란로 123' },
      { label: 'Business registration no.', value: '123-45-67890' },
      {
        label: 'E-commerce registration no.',
        value: '2026-서울강남-0123',
      },
    ])
  })

  it('fills all six grid cells with localized placeholders until company details are configured', () => {
    const pendingOperator: PublicOperatorInfo = {
      brandName: 'Farfield Software',
      companyName: 'Farfield Software Inc.',
      productName: 'LiqGuard',
      contactEmail: 'contact@farfield.software',
    }

    expect(publicFooterOperatorDetails('ko', pendingOperator)).toEqual([
      { label: '회사', value: 'Farfield Software Inc.' },
      { label: '대표자', value: '김아무개' },
      { label: '문의', value: 'contact@farfield.software' },
      { label: '주소', value: '서울특별시 강남구 테헤란로 123' },
      { label: '사업자등록번호', value: '123-45-67890' },
      { label: '통신판매업 신고번호', value: '2026-서울강남-0123' },
    ])

    expect(publicFooterOperatorDetails('en', pendingOperator)).toEqual([
      { label: 'Company', value: 'Farfield Software Inc.' },
      { label: 'Representative', value: 'Jane Doe' },
      { label: 'Contact', value: 'contact@farfield.software' },
      { label: 'Address', value: '123 Teheran-ro, Gangnam-gu, Seoul' },
      { label: 'Business registration no.', value: '123-45-67890' },
      {
        label: 'E-commerce registration no.',
        value: '2026-Seoul-Gangnam-0123',
      },
    ])
  })

  it('uses a localized public representative name when legal details are still pending', () => {
    const pendingOperator: PublicOperatorInfo = {
      brandName: 'Farfield Software',
      companyName: 'Farfield Software Inc.',
      productName: 'LiqGuard',
      representativeDisplayName: {
        ko: '김규민',
        en: 'Gyumin Kim',
      },
      contactEmail: 'contact@farfield.software',
    }

    expect(publicRepresentativeDisplayName('ko', pendingOperator)).toBe('김규민')
    expect(publicRepresentativeDisplayName('en', pendingOperator)).toBe('Gyumin Kim')
    expect(publicFooterOperatorDetails('ko', pendingOperator)[1]).toEqual({
      label: '대표자',
      value: '김규민',
    })
    expect(publicFooterOperatorDetails('en', pendingOperator)[1]).toEqual({
      label: 'Representative',
      value: 'Gyumin Kim',
    })
  })
})
