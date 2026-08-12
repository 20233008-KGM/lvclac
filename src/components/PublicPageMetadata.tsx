import { useEffect } from 'react'
import { useLanguage } from '../i18n'

const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || 'https://liqguard.com').replace(
  /\/$/,
  '',
)

const PAGE_METADATA = {
  ko: {
    '/': {
      title: 'LiqGuard 선물 청산가 계산기',
      description:
        '계좌 평가금액과 증거금 정보를 바탕으로 선물 포지션의 예상 청산가, 증거금 여유와 레버리지를 계산합니다.',
    },
    '/guide': {
      title: '사용 가이드 | LiqGuard',
      description:
        'LiqGuard 선물 계산기의 필수 세팅값, 증거금 모드, 주문 시뮬레이션과 기기 내 저장 사용법을 안내합니다.',
    },
    '/formulas': {
      title: '계산 수식 | LiqGuard',
      description:
        'LiqGuard가 예상 청산가, 증거금, 레버리지와 주문 반영값을 계산할 때 사용하는 수식을 공개합니다.',
    },
    '/updates': {
      title: '업데이트 | LiqGuard',
      description: 'LiqGuard의 새로운 기능과 주요 개선 사항을 안내합니다.',
    },
    '/about': {
      title: '서비스 소개 | LiqGuard',
      description:
        '예상 청산가, 증거금 여유와 주문 이후 변화를 한 화면에서 살펴보는 LiqGuard의 제품 배경과 운영 원칙을 소개합니다.',
    },
    '/company': {
      title: '회사 소개 | LiqGuard',
      description:
        'LiqGuard를 만들고 운영하는 Farfield Software의 운영 원칙과 회사 정보를 소개합니다.',
    },
    '/contact': {
      title: '문의하기 | LiqGuard',
      description:
        'LiqGuard와 Farfield Software의 영업 관련 제안, 버그 제보 및 기타 문의 방법을 안내합니다.',
    },
    '/terms': {
      title: '이용약관 | LiqGuard',
      description: 'LiqGuard 무료 선물 계산기 이용 조건과 책임 범위를 안내합니다.',
    },
    '/privacy': {
      title: '개인정보처리방침 | LiqGuard',
      description:
        'LiqGuard의 브라우저 저장, 호스팅, 분석, 광고 및 쿠키 관련 개인정보 처리 내용을 안내합니다.',
    },
  },
  en: {
    '/': {
      title: 'LiqGuard Futures Liquidation Calculator',
      description:
        'Estimate futures liquidation price, margin headroom, and leverage from account equity and margin inputs.',
    },
    '/guide': {
      title: 'User Guide | LiqGuard',
      description:
        'Learn the minimum setup values, margin modes, order simulation, and on-device saving in LiqGuard.',
    },
    '/formulas': {
      title: 'Formula Reference | LiqGuard',
      description:
        'Review the formulas LiqGuard uses for estimated liquidation price, margin, leverage, and order previews.',
    },
    '/updates': {
      title: 'Updates | LiqGuard',
      description: 'New features and notable improvements to LiqGuard.',
    },
    '/about': {
      title: 'About | LiqGuard',
      description:
        'Learn why LiqGuard brings estimated liquidation price, margin headroom, and post-order changes into one browser-based workspace.',
    },
    '/company': {
      title: 'About Farfield Software | LiqGuard',
      description:
        'Learn about Farfield Software, the company that builds and operates LiqGuard.',
    },
    '/contact': {
      title: 'Contact | LiqGuard',
      description:
        'Contact LiqGuard and Farfield Software with business proposals, bug reports, and other inquiries.',
    },
    '/terms': {
      title: 'Terms of Use | LiqGuard',
      description: 'Terms and responsibility limits for the free LiqGuard futures calculator.',
    },
    '/privacy': {
      title: 'Privacy Policy | LiqGuard',
      description:
        'How LiqGuard handles browser storage, hosting, analytics, advertising, cookies, and privacy choices.',
    },
  },
} as const

function ensureMeta(selector: string, attributes: Record<string, string>): HTMLElement {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value))
  return element
}

export function PublicPageMetadata({ pathname }: { pathname: string }) {
  const { locale } = useLanguage()

  useEffect(() => {
    const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : '/'
    const metadata =
      PAGE_METADATA[locale][normalized as keyof (typeof PAGE_METADATA)[typeof locale]] ??
      PAGE_METADATA[locale]['/']
    const canonicalUrl = normalized === '/' ? SITE_URL : `${SITE_URL}${normalized}`

    document.title = metadata.title
    ensureMeta('meta[name="description"]', {
      name: 'description',
      content: metadata.description,
    })
    ensureMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: metadata.title,
    })
    ensureMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metadata.description,
    })
    ensureMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    })
    ensureMeta('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl,
    })
  }, [locale, pathname])

  return null
}
