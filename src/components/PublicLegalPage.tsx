import { CONTACT_EMAIL } from '../config/site'
import type { LegalPageKind } from '../config/routes'
import { useLanguage } from '../i18n'

type PublicLegalKind = Extract<LegalPageKind, 'terms' | 'privacy'>

const COPY = {
  ko: {
    home: '계산기로 돌아가기',
    terms: {
      title: '이용약관',
      effective: '시행일: 2026년 8월 7일',
      intro:
        'LiqGuard는 로그인 없이 사용하는 선물·파생상품 계산 보조 도구입니다. 아래 조건에 동의하는 경우 서비스를 이용할 수 있습니다.',
      sections: [
        ['서비스 범위', '서비스는 사용자가 입력한 값으로 예상 청산가와 관련 수치를 계산합니다. 투자자문, 주문 실행, 계좌관리 또는 수익 보장을 제공하지 않습니다.'],
        ['계산 결과', '거래소·증권사·상품별 산식과 반올림 방식이 다를 수 있으므로 실제 거래 전 공식 자료와 거래 화면을 반드시 확인해야 합니다.'],
        ['기기 내 저장', '저장 기능을 켜면 입력값이 현재 브라우저의 localStorage에만 보관됩니다. 브라우저 데이터 삭제, 기기 분실 또는 저장소 오류로 데이터가 사라질 수 있습니다.'],
        ['광고', '서비스는 무료 운영을 위해 광고 영역 또는 제3자 광고를 표시할 수 있습니다. 광고주의 상품이나 서비스는 LiqGuard가 보증하지 않습니다.'],
        ['책임 제한', '법령이 허용하는 범위에서 서비스 이용, 계산 오차, 데이터 손실 또는 투자 판단으로 발생한 손해에 대해 책임을 부담하지 않습니다.'],
        ['문의', `서비스 문의: ${CONTACT_EMAIL}`],
      ],
    },
    privacy: {
      title: '개인정보처리방침',
      effective: '시행일: 2026년 8월 7일',
      intro:
        '실배포 LiqGuard는 회원가입·로그인·클라우드 저장을 제공하지 않습니다. 계산기 입력값은 서버 계정에 저장되지 않습니다.',
      sections: [
        ['기기 내 저장', '사용자가 저장 기능을 켜면 계좌평가금액, 가격, 계약수 등 계산기 입력값이 해당 브라우저의 localStorage에 저장됩니다. 이 값은 LiqGuard 서버로 전송하지 않습니다.'],
        ['호스팅 로그', '보안과 안정적인 서비스 제공을 위해 호스팅 사업자가 접속 시각, IP 주소, 브라우저 정보 같은 기술 로그를 제한적으로 처리할 수 있습니다.'],
        ['광고와 쿠키', 'AdSense가 활성화되면 Google과 광고 파트너가 광고 제공·빈도 제한·측정을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다. 필요한 지역에는 Google 인증 동의 관리 절차를 적용합니다.'],
        ['보유 및 삭제', '기기 내 입력값은 사용자가 저장값 삭제 버튼을 누르거나 브라우저 사이트 데이터를 삭제할 때 제거됩니다. 서버 계정 데이터는 생성하지 않습니다.'],
        ['제3자 제공', 'LiqGuard는 계산기 입력값을 판매하거나 제3자에게 제공하지 않습니다. 광고가 활성화된 경우 광고 제공에 필요한 정보 처리는 Google 정책의 적용을 받습니다.'],
        ['문의', `개인정보 문의: ${CONTACT_EMAIL}`],
      ],
    },
  },
  en: {
    home: 'Back to calculator',
    terms: {
      title: 'Terms of Use',
      effective: 'Effective: August 7, 2026',
      intro:
        'LiqGuard is a sign-in-free calculation aid for futures and derivatives. You may use the service if you agree to these terms.',
      sections: [
        ['Service scope', 'The service calculates estimated liquidation prices and related figures from values you enter. It does not provide investment advice, execute orders, manage accounts, or guarantee returns.'],
        ['Calculation results', 'Exchange, broker, product, and rounding rules may differ. Always verify results against official materials and your trading screen before trading.'],
        ['Device storage', 'When enabled, saved inputs remain only in this browser localStorage. Browser-data deletion, device loss, or storage errors may remove them.'],
        ['Advertising', 'The free service may display reserved advertising areas or third-party ads. LiqGuard does not endorse advertisers or their products.'],
        ['Limitation of liability', 'To the extent permitted by law, LiqGuard is not liable for losses caused by service use, calculation differences, data loss, or investment decisions.'],
        ['Contact', `Service contact: ${CONTACT_EMAIL}`],
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      effective: 'Effective: August 7, 2026',
      intro:
        'The public LiqGuard service does not provide accounts, sign-in, or cloud storage. Calculator inputs are not stored in a server-side user account.',
      sections: [
        ['Device storage', 'If you enable saving, calculator inputs such as account value, prices, and contract counts are stored in this browser localStorage. LiqGuard does not transmit these values to its server.'],
        ['Hosting logs', 'The hosting provider may process limited technical logs such as access time, IP address, and browser information for security and reliable delivery.'],
        ['Ads and cookies', 'When AdSense is enabled, Google and advertising partners may use cookies or similar technologies for ad delivery, frequency control, and measurement. A Google-certified consent flow will be used where required.'],
        ['Retention and deletion', 'Device inputs are removed when you use the delete-saved-data control or clear this site’s browser data. No server account dataset is created.'],
        ['Third parties', 'LiqGuard does not sell calculator inputs or disclose them to third parties. When ads are enabled, data used for advertising is governed by Google’s policies.'],
        ['Contact', `Privacy contact: ${CONTACT_EMAIL}`],
      ],
    },
  },
} as const

export function PublicLegalPage({ kind }: { kind: PublicLegalKind }) {
  const { locale } = useLanguage()
  const copy = COPY[locale]
  const page = copy[kind]

  return (
    <main className="public-legal-page">
      <article className="public-legal-card">
        <header className="public-legal-header">
          <p className="public-legal-brand">Farfield Software · LiqGuard</p>
          <h1>{page.title}</h1>
          <p className="public-legal-effective">{page.effective}</p>
          <p className="public-legal-intro">{page.intro}</p>
        </header>
        <div className="public-legal-sections">
          {page.sections.map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>
        <a className="btn btn-primary public-legal-home" href="/">
          {copy.home}
        </a>
      </article>
    </main>
  )
}
