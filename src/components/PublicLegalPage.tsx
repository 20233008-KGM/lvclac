import {
  PUBLIC_OPERATOR_INFO,
  publicOperatorDetails,
  publicOperatorDisplayName,
} from '../config/operator'
import type { LegalPageKind } from '../config/routes'
import { PRIVACY_PATH, TERMS_PATH } from '../config/routes'
import { useLanguage, type Locale } from '../i18n'
import { BackToCalculatorLink, PublicInfoShell } from './PublicInfoShell'

type PublicLegalKind = LegalPageKind

interface LegalTable {
  headers: string[]
  rows: string[][]
}

interface LegalSection {
  title: string
  paragraphs?: string[]
  table?: LegalTable
  links?: { label: string; href: string }[]
}

interface LegalDocument {
  title: string
  effective: string
  intro: string
  sections: LegalSection[]
}

function operatorSection(locale: Locale): LegalSection {
  return {
    title: locale === 'ko' ? '운영자 정보' : 'Operator information',
    table: {
      headers:
        locale === 'ko' ? ['항목', '내용'] : ['Item', 'Details'],
      rows: publicOperatorDetails(locale).map((detail) => [detail.label, detail.value]),
    },
  }
}

// eslint-disable-next-line react-refresh/only-export-components -- Legal documents are exported for deterministic bilingual content tests.
export function buildDocuments(locale: Locale): Record<PublicLegalKind, LegalDocument> {
  const operatorName = publicOperatorDisplayName()
  const email = PUBLIC_OPERATOR_INFO.contactEmail

  if (locale === 'ko') {
    return {
      terms: {
        title: '이용약관',
        effective: '시행일: 2026년 8월 11일',
        intro:
          '본 약관은 LiqGuard 무료 기능과 Paddle 승인 후 판매되는 Pro 구독 및 관련 공개 정보 페이지의 이용 조건을 정합니다.',
        sections: [
          operatorSection(locale),
          {
            title: '1. 서비스의 성격과 범위',
            paragraphs: [
              'LiqGuard는 사용자가 입력한 계좌 평가금액, 가격, 계약수와 증거금 정보를 바탕으로 예상 청산가, 증거금 여유, 레버리지와 주문 시뮬레이션 값을 계산하는 보조 도구입니다.',
              '서비스는 금융투자상품에 대한 투자자문, 주문 실행, 계좌관리, 거래 권유 또는 수익 보장을 제공하지 않습니다.',
            ],
          },
          {
            title: '2. 계산 결과의 확인',
            paragraphs: [
              '거래소, 증권사, 브로커, 상품과 계좌별로 증거금 산식, 수수료, 반올림, 강제청산 시점과 위험관리 정책이 다를 수 있습니다.',
              '이용자는 실제 거래 전에 거래소·증권사 공식 자료와 본인의 거래 화면에서 결과를 다시 확인해야 하며, 최종 거래 판단과 책임은 이용자에게 있습니다.',
            ],
          },
          {
            title: '3. 저장 및 계정 기능',
            paragraphs: [
              '이용자가 이 기기 저장을 선택하면 계산기 입력값이 현재 브라우저의 localStorage에 저장됩니다. 로그인 후 클라우드 저장이나 기록 기능을 선택하면 입력값, 숫자세트, 주문 시뮬레이션 기록과 계좌 스냅샷이 이용자 계정에 연결된 서버 데이터베이스에 저장될 수 있습니다.',
              '공용 기기, 브라우저 확장 프로그램, 악성 프로그램, 기기 분실, 브라우저 데이터 삭제 또는 저장소 오류로 데이터가 노출되거나 사라질 수 있습니다. 중요한 계좌 정보의 별도 보관 수단으로 사용해서는 안 됩니다.',
            ],
          },
          {
            title: '4. 광고·분석 및 외부 서비스',
            paragraphs: [
              '무료 서비스 운영과 품질 개선을 위해 Vercel Web Analytics, Google Analytics 4 및 Google AdSense를 사용할 수 있습니다.',
              '광고주의 상품·서비스와 외부 링크는 각 제공자가 책임지며, LiqGuard가 해당 상품·서비스의 품질이나 적합성을 보증하지 않습니다.',
            ],
          },
          {
            title: '5. Pro 구독과 결제',
            paragraphs: [
              'Pro 구독 판매는 Paddle Live 계정과 liqguard.com 도메인 승인이 완료되고 결제 기능이 활성화된 뒤 시작됩니다.',
              '판매가 시작되면 Paddle은 Merchant of Record로서 결제 처리, 관련 세금, 송장과 영수증, 구독 결제 지원, 취소 및 적격 환불을 담당합니다. 월간·연간 구독은 이용자가 취소할 때까지 각 결제 주기마다 자동 갱신됩니다.',
              '플랜별 가격과 제공 기능은 요금제 페이지에 표시하며, 환불과 취소 절차는 환불 정책을 따릅니다.',
            ],
          },
          {
            title: '6. 지식재산권',
            paragraphs: [
              '서비스의 프로그램, 화면 구성, 문서와 자체 작성 콘텐츠에 관한 권리는 관련 법령 또는 별도 라이선스에 따라 운영자에게 귀속됩니다.',
              '이용자는 개인적인 계산과 검토 목적으로 서비스를 사용할 수 있으나, 서비스 전체를 복제·재판매하거나 출처를 오인하게 해서는 안 됩니다.',
            ],
          },
          {
            title: '7. 서비스 변경과 중단',
            paragraphs: [
              '운영자는 정확성, 보안, 법령 또는 운영상 필요에 따라 서비스와 계산 방식을 변경하거나 일시 중단할 수 있습니다. 중요한 변경은 가능한 범위에서 서비스에 안내합니다.',
            ],
          },
          {
            title: '8. 책임 제한',
            paragraphs: [
              '법령이 허용하는 범위에서 운영자는 서비스 이용, 계산 차이, 저장 데이터 손실, 외부 서비스 장애 또는 투자 판단으로 발생한 직접·간접 손해와 기회 손실에 책임을 부담하지 않습니다.',
              '운영자의 고의 또는 중대한 과실로 인한 책임까지 배제하는 의미는 아닙니다.',
            ],
          },
          {
            title: '9. 준거법과 분쟁',
            paragraphs: [
              `본 약관은 대한민국 법령을 따릅니다. 서비스 관련 문의 또는 분쟁은 먼저 ${email}로 협의를 요청할 수 있으며, 해결되지 않는 경우 관계 법령이 정한 관할 법원 또는 분쟁조정 절차를 따릅니다.`,
            ],
          },
          {
            title: '10. 약관 변경',
            paragraphs: [
              '약관이 변경되면 시행일과 주요 변경 내용을 이 페이지에 표시합니다. 변경된 약관은 표시된 시행일부터 적용됩니다.',
            ],
          },
        ],
      },
      privacy: {
        title: '개인정보처리방침',
        effective: '시행일: 2026년 8월 11일',
        intro:
          `${operatorName}는 LiqGuard에서 처리되는 정보와 이용자의 권리를 다음과 같이 안내합니다. 계산기는 로그인 없이 사용할 수 있으며, 계정·클라우드 저장·기록·구독 기능은 이용자가 해당 기능을 선택한 경우에만 관련 정보를 처리합니다.`,
        sections: [
          operatorSection(locale),
          {
            title: '1. 처리 항목·목적·보유기간',
            table: {
              headers: ['구분', '처리 항목', '목적', '보유기간·삭제'],
              rows: [
                [
                  '기기 내 저장',
                  '계좌 평가금액, 가격, 계약수, 증거금, 상품 설정 등 이용자가 입력한 계산값',
                  '다음 방문 시 계산기 입력 복원',
                  '이용자가 입력값 비우기를 실행하거나 브라우저 사이트 데이터를 삭제할 때까지',
                ],
                [
                  '필수 설정',
                  '언어, 면책 확인, 로컬 저장 선택, 개인정보·쿠키 선택',
                  '이용자 설정 유지와 반복 안내 방지',
                  '설정별 localStorage 삭제 또는 브라우저 사이트 데이터 삭제 시까지',
                ],
                [
                  '계정 및 인증',
                  '이메일 주소, 표시 이름, 인증 제공자, 계정 식별자',
                  '로그인, 계정 식별, 보안, 계정 지원',
                  '계정 삭제 시까지. 법령상 보존 또는 보안 대응이 필요한 정보는 해당 기간까지',
                ],
                [
                  '클라우드 저장 및 기록',
                  '계산기 입력값, 숫자세트, 주문 시뮬레이션 기록, 계좌 스냅샷과 저장 시각',
                  '다른 기기에서의 복원, 기록 조회, Pro 기능 제공',
                  '이용자가 개별 기록 또는 계정을 삭제할 때까지. 백업은 제공자 정책에 따라 제한된 기간 잔존할 수 있음',
                ],
                [
                  '구독 및 결제 상태',
                  'Paddle 고객·구독 식별자, 플랜, 구독 상태, 결제 주기와 갱신일',
                  'Pro 권한 제공, 구독 상태 동기화, 결제 지원',
                  '계정 또는 구독 관계 종료 후 관련 법령과 Paddle 정책에 따른 기간',
                ],
                [
                  '지역 쿠키',
                  '접속 국가 코드',
                  '초기 언어 선택 보조',
                  '브라우저 쿠키에 최대 30일',
                ],
                [
                  '호스팅 로그',
                  '접속 시각, IP 주소, 요청 URL, 브라우저·기기 정보, 오류·보안 로그',
                  '서비스 제공, 보안, 장애 대응과 부정 이용 방지',
                  'Vercel의 서비스 운영 및 보안 정책에 따른 기간',
                ],
                [
                  'Vercel Web Analytics',
                  '이벤트 시각, 페이지 URL·경로, 필터링된 쿼리, 리퍼러, 국가·지역, OS·브라우저·기기 종류, 스크립트 버전',
                  '익명·집계 방문 통계와 서비스 개선',
                  '방문자 세션 식별 정보는 24시간 후 폐기되며 집계 데이터는 Vercel 정책에 따른 기간',
                ],
                [
                  'Google Analytics 4',
                  '쿠키·기기 식별 정보, IP에서 파생된 지역, 페이지·이용 이벤트',
                  '이용 현황 분석과 서비스 개선',
                  'GA4 이벤트 데이터 보유기간 14개월 설정을 기준으로 하며 동의 철회 후 추가 수집 중단',
                ],
                [
                  'Google AdSense',
                  '광고 쿠키·기기 식별자, IP 주소, 광고 노출·클릭과 상호작용 정보',
                  '광고 제공, 빈도 제한, 측정, 부정 트래픽 방지와 맞춤 광고',
                  'Google 정책과 이용자의 광고·쿠키 선택에 따른 기간',
                ],
              ],
            },
          },
          {
            title: '2. 계산기 입력값의 처리',
            paragraphs: [
              '이 기기 저장을 선택한 계산기 입력값은 해당 브라우저의 localStorage에만 저장됩니다. 클라우드 저장이나 기록 기능을 선택하면 입력값과 기록이 이용자 계정에 연결된 Supabase 데이터베이스로 전송되어 저장될 수 있습니다. 운영자는 계산기 입력값을 판매하지 않습니다.',
              '활성 저장 슬롯을 다시 선택해 저장값을 삭제하거나 각 기록의 삭제 기능을 이용할 수 있습니다. 브라우저의 사이트 데이터 삭제 기능으로 로컬 입력값과 언어·동의 설정을 제거할 수도 있습니다.',
            ],
          },
          {
            title: '3. 처리위탁 및 외부 제공자',
            table: {
              headers: ['수탁자·제공자', '업무', '처리 정보'],
              rows: [
                ['Vercel Inc.', '웹 호스팅, 전송, 보안 로그, Web Analytics', '접속·기기·집계 이용 정보'],
                ['Google LLC', 'GA4 이용 분석, AdSense 광고와 동의 관리', '쿠키·기기·접속·이용·광고 정보'],
                ['Supabase Inc.', '인증, 계정 데이터베이스, 클라우드 저장과 기록', '계정·인증·계산기 저장·기록 정보'],
                ['Paddle', 'Merchant of Record, 결제, 세금, 영수증, 구독과 환불 지원', '구매자·거래·구독·세금·지원 정보'],
              ],
            },
          },
          {
            title: '4. 개인정보의 국외 이전',
            table: {
              headers: ['이전받는 자', '국가·시점·방법', '목적', '보유기간'],
              rows: [
                [
                  'Vercel Inc.',
                  '미국 및 Vercel 인프라 운영 국가 · 서비스 접속 시 암호화된 네트워크 전송',
                  '호스팅, 보안, 장애 대응, 익명 방문 통계',
                  'Vercel의 서비스·보안·분석 정책에 따른 기간',
                ],
                [
                  'Google LLC',
                  '미국 및 Google 데이터센터 운영 국가 · 동의 후 암호화된 네트워크 전송',
                  'GA4 분석, AdSense 광고 제공·측정·부정 이용 방지',
                  'GA4 설정 및 Google 광고·개인정보 정책에 따른 기간',
                ],
                [
                  'Supabase Inc.',
                  'Supabase 프로젝트 리전 및 지원 운영 국가 · 로그인 또는 클라우드 기능 이용 시 암호화된 네트워크 전송',
                  '인증, 계정 데이터베이스, 클라우드 저장과 기록',
                  '계정·기록 삭제 및 Supabase 백업·보안 정책에 따른 기간',
                ],
                [
                  'Paddle',
                  '영국 및 Paddle 인프라 운영 국가 · 결제 또는 구독 지원 이용 시 암호화된 네트워크 전송',
                  '결제, 세금, 영수증, 구독 관리, 환불과 구매자 지원',
                  '관련 법령, 거래 기록 의무 및 Paddle 개인정보 정책에 따른 기간',
                ],
              ],
            },
          },
          {
            title: '5. 쿠키와 선택권',
            paragraphs: [
              'Google 태그는 기본적으로 광고·분석 저장을 거부 상태로 시작합니다. 적용 지역에서는 Google 인증 CMP를 통해 선택을 받은 뒤 GA4 측정 여부를 결정하고, AdSense는 선택에 따라 맞춤·비맞춤·제한 광고 중 허용되는 방식으로 요청할 수 있습니다.',
              'Google과 광고 파트너는 이용자의 이 사이트 또는 다른 웹사이트 방문 기록을 바탕으로 광고를 제공하기 위해 광고 쿠키를 사용할 수 있습니다. 이용자는 Google 광고 설정에서 맞춤 광고를 해제할 수 있습니다.',
              '푸터의 개인정보·쿠키 설정에서 선택을 변경하거나 철회할 수 있습니다. 선택 기능을 거부해도 계산기, 수식, 가이드와 기기 내 저장 기능은 사용할 수 있습니다.',
            ],
            links: [
              {
                label: 'Google 광고 설정',
                href: 'https://adssettings.google.com/',
              },
              {
                label: 'Google Analytics 차단 브라우저 부가기능',
                href: 'https://tools.google.com/dlpage/gaoptout',
              },
            ],
          },
          {
            title: '6. 정보주체의 권리와 행사방법',
            paragraphs: [
              `개인정보 처리에 관한 열람, 정정, 삭제, 처리정지 또는 문의는 ${email}로 요청할 수 있습니다. 본인 확인이 필요한 요청에는 권리 보호를 위해 추가 확인을 요청할 수 있습니다.`,
              '브라우저에 저장된 값은 입력값 비우기 또는 브라우저 사이트 데이터 삭제로 직접 제거할 수 있습니다. 계정·클라우드 저장값·기록은 서비스 내 삭제 기능 또는 문의를 통해 삭제를 요청할 수 있습니다.',
            ],
          },
          {
            title: '7. 안전성 확보조치',
            paragraphs: [
              '운영자는 전송구간 암호화(HTTPS), 접근권한 최소화, 비밀정보의 서버 환경변수 분리, 보안 업데이트와 로그 점검 등 서비스 규모에 적합한 보호조치를 적용합니다.',
            ],
          },
          {
            title: '8. 개인정보 보호책임자와 구제방법',
            paragraphs: [
              `개인정보 문의: ${email}`,
              '개인정보 침해에 대한 상담이나 분쟁조정은 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972), 경찰청 또는 관계 기관에 요청할 수 있습니다.',
            ],
            links: [
              {
                label: '개인정보 포털',
                href: 'https://www.privacy.go.kr/',
              },
              {
                label: '개인정보분쟁조정위원회',
                href: 'https://www.kopico.go.kr/',
              },
            ],
          },
          {
            title: '9. 처리방침 변경',
            paragraphs: [
              '처리방침이 변경되면 시행일과 변경 내용을 이 페이지에 표시합니다. 계정, 저장, 결제, 광고·분석 도구 또는 운영 주체가 바뀌면 관련 내용을 함께 갱신합니다.',
            ],
          },
        ],
      },
      refund: {
        title: '환불 정책',
        effective: '시행일: 2026년 8월 11일',
        intro:
          '본 정책은 Paddle Live 결제가 활성화된 뒤 판매되는 LiqGuard Pro 월간·연간 구독의 취소와 환불 요청에 적용됩니다.',
        sections: [
          operatorSection(locale),
          {
            title: '1. 판매 및 결제 주체',
            paragraphs: [
              'LiqGuard Pro 구독은 Paddle을 통해 판매됩니다. Paddle은 Merchant of Record로서 구매자 결제, 관련 세금, 송장과 영수증, 결제 지원 및 적격 환불을 처리합니다.',
            ],
          },
          {
            title: '2. 환불 요청 방법',
            paragraphs: [
              `구매 확인 이메일의 지원 링크 또는 paddle.net의 Paddle 주문 지원을 이용하세요. 제품 접근이나 기능 문제는 ${email}로 문의할 수 있으며, 필요한 경우 Paddle 지원 경로를 안내합니다.`,
            ],
          },
          {
            title: '3. 환불 가능 여부',
            paragraphs: [
              '환불 가능 여부는 Paddle 구매자 약관, 구매자의 지역에 적용되는 법률, 구매 시점, 이용 내역과 요청 사유에 따라 검토됩니다. 본 정책은 법령에 따른 철회·환불 권리를 제한하지 않습니다.',
            ],
          },
          {
            title: '4. 구독 취소와 환불의 차이',
            paragraphs: [
              '구독을 취소하면 다음 자동 갱신이 중단되며, 별도 안내가 없는 한 이미 결제한 기간이 끝날 때까지 Pro 기능을 이용할 수 있습니다.',
              '구독 취소가 현재 결제 기간의 자동 환불을 의미하지는 않습니다. 환불이 필요하면 별도로 Paddle 주문 지원에 요청해야 합니다.',
            ],
          },
          {
            title: '5. 승인된 환불과 서비스 접근',
            paragraphs: [
              '환불이 승인되면 Paddle은 가능한 경우 원래 결제 수단으로 처리합니다. 실제 입금 시점은 은행과 카드사에 따라 달라질 수 있으며, 환불된 구독의 Pro 접근 권한은 종료될 수 있습니다.',
            ],
          },
          {
            title: '6. 제품 지원',
            paragraphs: [
              `계정 접근, 계산기 동작 또는 Pro 기능 문제는 ${email}로 알려주세요. 환불 요청과 별개로 기술 문제 해결을 지원합니다.`,
            ],
          },
        ],
      },
    }
  }

  return {
    terms: {
      title: 'Terms of Use',
      effective: 'Effective: August 11, 2026',
      intro:
        'These terms govern LiqGuard Free features, Pro subscriptions sold after Paddle approval, and related public information pages.',
      sections: [
        operatorSection(locale),
        {
          title: '1. Service scope',
          paragraphs: [
            'LiqGuard estimates liquidation price, margin headroom, leverage, and order-simulation results from values entered by the user.',
            'It does not provide investment advice, execute orders, manage accounts, recommend trades, or guarantee returns.',
          ],
        },
        {
          title: '2. Verification of results',
          paragraphs: [
            'Exchanges, brokers, products, and accounts may use different margin formulas, fees, rounding, liquidation timing, and risk policies.',
            'You must verify results against official exchange or broker information before trading. You remain responsible for every trading decision.',
          ],
        },
        {
          title: '3. Storage and account features',
          paragraphs: [
            'If you select on-device saving, calculator inputs are stored in this browser localStorage. If you sign in and select cloud saving or records, inputs, number sets, order-simulation history, and account snapshots may be stored in a server database linked to your account.',
            'Stored values may be exposed or lost on shared devices, through browser extensions or malware, device loss, browser-data deletion, or storage errors.',
          ],
        },
        {
          title: '4. Advertising, analytics, and external services',
          paragraphs: [
            'We may use Vercel Web Analytics, Google Analytics 4, and Google AdSense to operate and improve the free service.',
            'Advertisers and external sites are responsible for their own products and services. LiqGuard does not endorse them.',
          ],
        },
        {
          title: '5. Pro subscriptions and billing',
          paragraphs: [
            'Pro subscription sales begin only after Paddle live-account and liqguard.com domain approval are complete and live checkout is enabled.',
            'Once sales begin, Paddle acts as merchant of record for payment processing, applicable taxes, invoices and receipts, billing support, cancellation, and eligible refunds. Monthly and yearly subscriptions renew for each billing period until canceled.',
            'The pricing page lists plan prices and included features. The Refund Policy explains cancellation and refund procedures.',
          ],
        },
        {
          title: '6. Intellectual property',
          paragraphs: [
            'Software, interface design, documentation, and original content are protected by applicable rights and licenses.',
            'You may use the service for personal calculation and review, but may not reproduce or resell the service as a whole or misrepresent its source.',
          ],
        },
        {
          title: '7. Changes and availability',
          paragraphs: [
            'We may change or temporarily suspend the service or calculation methods for accuracy, security, legal, or operational reasons.',
          ],
        },
        {
          title: '8. Limitation of liability',
          paragraphs: [
            'To the extent permitted by law, the operator is not liable for direct or indirect loss, lost opportunities, calculation differences, local-data loss, external-service failures, or investment decisions.',
            'This does not exclude liability that cannot legally be excluded, including intentional misconduct or gross negligence.',
          ],
        },
        {
          title: '9. Governing law and disputes',
          paragraphs: [
            `These terms are governed by the laws of the Republic of Korea. Contact ${email} first for service disputes; unresolved matters follow applicable courts or dispute-resolution procedures.`,
          ],
        },
        {
          title: '10. Changes to these terms',
          paragraphs: [
            'We will show the effective date and material changes on this page. Updated terms apply from the displayed effective date.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      effective: 'Effective: August 11, 2026',
      intro:
        `${operatorName} explains below how information is handled in LiqGuard. The calculator works without sign-in. Account, cloud-storage, records, and subscription information is processed only when you choose to use the related feature.`,
      sections: [
        operatorSection(locale),
        {
          title: '1. Data, purposes, and retention',
          table: {
            headers: ['Category', 'Data', 'Purpose', 'Retention or deletion'],
            rows: [
              [
                'On-device inputs',
                'Account equity, prices, contracts, margin, and instrument settings entered by you',
                'Restore calculator inputs on a later visit',
                'Until you clear inputs or delete browser site data',
              ],
              [
                'Required preferences',
                'Language, disclaimer acknowledgement, local-save and privacy choices',
                'Keep settings and avoid repeating notices',
                'Until the related localStorage value or browser site data is deleted',
              ],
              [
                'Account and authentication',
                'Email address, display name, authentication provider, and account identifier',
                'Sign-in, account identification, security, and account support',
                'Until account deletion; information required by law or for security is retained for the applicable period',
              ],
              [
                'Cloud storage and records',
                'Calculator inputs, number sets, order-simulation history, account snapshots, and save times',
                'Cross-device restore, record access, and Pro features',
                'Until you delete the record or account; backups may remain for a limited period under provider policy',
              ],
              [
                'Subscription and billing status',
                'Paddle customer and subscription identifiers, plan, status, billing period, and renewal date',
                'Pro access, subscription synchronization, and billing support',
                'After the account or subscription relationship ends, for periods required by law and Paddle policy',
              ],
              [
                'Region cookie',
                'Country code',
                'Initial language selection',
                'Up to 30 days',
              ],
              [
                'Hosting logs',
                'Access time, IP address, URL, browser, device, error, and security logs',
                'Delivery, security, troubleshooting, and abuse prevention',
                'Under Vercel operational and security retention policies',
              ],
              [
                'Vercel Web Analytics',
                'Event time, page URL and path, filtered query, referrer, region, OS, browser, device type, and script version',
                'Anonymous aggregate traffic measurement',
                'Visitor-session identification is discarded after 24 hours; aggregate data follows Vercel policy',
              ],
              [
                'Google Analytics 4',
                'Cookies or device identifiers, IP-derived region, pages, and usage events',
                'Usage analysis and product improvement',
                'Configured for 14-month event-data retention; new collection stops after withdrawal',
              ],
              [
                'Google AdSense',
                'Advertising cookies or identifiers, IP address, impressions, clicks, and interactions',
                'Ad delivery, frequency control, measurement, invalid-traffic prevention, and personalization',
                'Under Google policies and your advertising or cookie choices',
              ],
            ],
          },
        },
        {
          title: '2. Calculator inputs',
          paragraphs: [
            'Inputs saved on this device remain in this browser localStorage. If you select cloud saving or records, inputs and records may be transmitted to and stored in the Supabase database linked to your account. We do not sell calculator inputs.',
            'You can reselect the active save slot to delete its saved inputs or use each record deletion control. Browser controls can remove local inputs and language or consent settings.',
          ],
        },
        {
          title: '3. Processors and service providers',
          table: {
            headers: ['Provider', 'Service', 'Information'],
            rows: [
              ['Vercel Inc.', 'Hosting, delivery, security logs, Web Analytics', 'Access, device, and aggregate usage data'],
              ['Google LLC', 'GA4 analytics, AdSense advertising, consent management', 'Cookie, device, access, usage, and ad data'],
              ['Supabase Inc.', 'Authentication, account database, cloud storage, and records', 'Account, authentication, saved calculator, and record data'],
              ['Paddle', 'Merchant of record, payments, tax, receipts, subscriptions, and refund support', 'Buyer, transaction, subscription, tax, and support data'],
            ],
          },
        },
        {
          title: '4. International transfers',
          table: {
            headers: ['Recipient', 'Country, timing, and method', 'Purpose', 'Retention'],
            rows: [
              [
                'Vercel Inc.',
                'United States and infrastructure locations; encrypted network transfer when the service is accessed',
                'Hosting, security, troubleshooting, and anonymous traffic measurement',
                'Under Vercel service, security, and analytics policies',
              ],
              [
                'Google LLC',
                'United States and Google data-center locations; encrypted network transfer after the applicable choice',
                'GA4 analytics and AdSense delivery, measurement, and invalid-traffic prevention',
                'Under GA4 settings and Google advertising and privacy policies',
              ],
              [
                'Supabase Inc.',
                'Configured Supabase project region and support locations; encrypted network transfer when sign-in or cloud features are used',
                'Authentication, account database, cloud storage, and records',
                'Until account or record deletion and under Supabase backup and security policies',
              ],
              [
                'Paddle',
                'United Kingdom and Paddle infrastructure locations; encrypted network transfer when billing or subscription support is used',
                'Payments, tax, receipts, subscription management, refunds, and buyer support',
                'Under applicable law, transaction-record obligations, and Paddle privacy policy',
              ],
            ],
          },
        },
        {
          title: '5. Cookies and choices',
          paragraphs: [
            'Google consent defaults begin in a denied state. Where required, a choice through a Google-certified CMP controls GA4 measurement, while AdSense may request an eligible personalized, non-personalized, or limited ad based on that choice.',
            'Google and its advertising partners may use advertising cookies to serve ads based on visits to this site or other websites. You can opt out of personalized advertising through Google Ads Settings.',
            'You can change or withdraw your choice through Privacy and cookie settings in the footer. Denying optional use does not disable the calculator, formulas, guide, or on-device saving.',
          ],
          links: [
            { label: 'Google Ads Settings', href: 'https://adssettings.google.com/' },
            {
              label: 'Google Analytics opt-out browser add-on',
              href: 'https://tools.google.com/dlpage/gaoptout',
            },
          ],
        },
        {
          title: '6. Your rights',
          paragraphs: [
            `Contact ${email} to request access, correction, deletion, restriction, or information about processing. We may request reasonable verification to protect your rights.`,
            'You can directly remove browser-stored values by clearing calculator inputs or browser site data. Use in-service deletion controls or contact us to request deletion of account, cloud, or record data.',
          ],
        },
        {
          title: '7. Security measures',
          paragraphs: [
            'We use HTTPS, least-privilege access, separation of secrets into server environment variables, security updates, and log review appropriate to the service.',
          ],
        },
        {
          title: '8. Privacy contact and remedies',
          paragraphs: [
            `Privacy contact: ${email}`,
            'Korean users may also contact the Personal Information Infringement Report Center, the Personal Information Dispute Mediation Committee, police, or other competent authorities.',
          ],
          links: [
            { label: 'Korean Privacy Portal', href: 'https://www.privacy.go.kr/' },
            { label: 'Dispute Mediation Committee', href: 'https://www.kopico.go.kr/' },
          ],
        },
        {
          title: '9. Policy changes',
          paragraphs: [
            'We will display the effective date and material changes here. We will update this policy when account, storage, billing, analytics, advertising, or operator details change.',
          ],
        },
      ],
    },
    refund: {
      title: 'Refund Policy',
      effective: 'Effective: August 11, 2026',
      intro:
        'This policy applies to cancellation and refund requests for LiqGuard Pro Monthly and Pro Yearly subscriptions after Paddle live checkout is enabled.',
      sections: [
        operatorSection(locale),
        {
          title: '1. Seller and payment provider',
          paragraphs: [
            'LiqGuard Pro subscriptions are sold through Paddle. Paddle acts as merchant of record for buyer payments, applicable taxes, invoices and receipts, billing support, and eligible refunds.',
          ],
        },
        {
          title: '2. How to request a refund',
          paragraphs: [
            `Use the support link in your purchase email or Paddle order support at paddle.net. For product access or functionality issues, contact ${email}; we can direct you to the appropriate Paddle support route when needed.`,
          ],
        },
        {
          title: '3. Refund eligibility',
          paragraphs: [
            'Eligibility is reviewed under Paddle buyer terms, laws that apply in the buyer location, purchase timing, usage, and the reason for the request. This policy does not limit statutory withdrawal or refund rights.',
          ],
        },
        {
          title: '4. Cancellation compared with a refund',
          paragraphs: [
            'Canceling stops the next automatic renewal. Unless otherwise stated, Pro access continues until the end of the paid period.',
            'Cancellation does not automatically refund the current billing period. Submit a separate refund request through Paddle order support when a refund is needed.',
          ],
        },
        {
          title: '5. Approved refunds and access',
          paragraphs: [
            'If approved, Paddle returns funds to the original payment method where possible. Bank and card timing varies, and Pro access for the refunded subscription may end.',
          ],
        },
        {
          title: '6. Product support',
          paragraphs: [
            `Report account access, calculator, or Pro feature issues to ${email}. Product troubleshooting is available separately from the refund process.`,
          ],
        },
      ],
    },
  }
}

export function PublicLegalPage({ kind }: { kind: PublicLegalKind }) {
  const { locale } = useLanguage()
  const page = buildDocuments(locale)[kind]
  const eyebrow = locale === 'ko' ? 'LiqGuard · 법적 고지' : 'LiqGuard · Legal'
  const activePath = kind === 'terms' ? TERMS_PATH : kind === 'privacy' ? PRIVACY_PATH : null

  return (
    <PublicInfoShell
      activePath={activePath}
      tone="legal"
      eyebrow={eyebrow}
      title={page.title}
      lead={page.intro}
    >
      <div className="public-legal-document">
        <p className="public-legal-effective">{page.effective}</p>
        <div className="public-legal-sections">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.table && (
                  <div className="public-legal-table-wrap">
                    <table className="public-legal-table">
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} scope="col">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join('|')}>
                            {row.map((cell, index) =>
                              index === 0 ? (
                                <th key={cell} scope="row">
                                  {cell}
                                </th>
                              ) : (
                                <td key={`${index}-${cell}`}>{cell}</td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.links && (
                  <ul className="public-legal-links">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
        </div>
        <BackToCalculatorLink className="public-legal-home" />
      </div>
    </PublicInfoShell>
  )
}
