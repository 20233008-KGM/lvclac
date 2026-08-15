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
  const operatorName = publicOperatorDisplayName(locale)
  const email = PUBLIC_OPERATOR_INFO.contactEmail

  if (locale === 'ko') {
    return {
      terms: {
        title: '이용약관',
        effective: '시행일: 2026년 8월 12일',
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
              '현재 공개 서비스는 로그인이나 클라우드 저장 기능을 제공하지 않습니다. 이용자가 이 기기 저장을 선택하면 계산기 입력값과 숫자세트 1개가 현재 브라우저의 localStorage에만 저장됩니다.',
              '공용 기기, 브라우저 확장 프로그램, 악성 프로그램, 기기 분실, 브라우저 데이터 삭제 또는 저장소 오류로 데이터가 노출되거나 사라질 수 있습니다. 중요한 계좌 정보의 별도 보관 수단으로 사용해서는 안 됩니다.',
              '계정, 클라우드 저장, 기록 또는 Pro 기능을 공개하기 전에는 실제 처리 방식과 제공 조건에 맞춰 본 약관과 개인정보처리방침을 다시 안내합니다.',
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
              '판매가 시작되면 Paddle은 온라인 재판매자이자 Merchant of Record로서 구매 거래, 결제 처리, 관련 세금, 송장과 영수증, 구독 결제 지원, 취소와 환불을 담당합니다. 구매·결제 관계에는 Paddle 구매자 약관과 환불 정책이 적용되고, LiqGuard 기능 이용에는 본 약관이 적용됩니다.',
              '월간·연간 구독은 이용자가 취소할 때까지 각 결제 주기마다 자동 갱신됩니다. 취소하면 다음 갱신을 중단하며, 별도 환불이 승인되지 않은 경우 이미 결제한 기간 종료 시점까지 이용할 수 있습니다.',
              '플랜별 가격과 제공 기능은 요금제 페이지에 표시하며, 환불과 취소 절차는 환불 정책을 따릅니다.',
            ],
            links: [
              { label: 'Paddle 구매자 약관', href: 'https://www.paddle.com/legal/buyer-terms' },
              { label: 'Paddle 환불 정책', href: 'https://www.paddle.com/legal/refund-policy' },
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
              `LiqGuard 기능 이용에 관한 본 약관은 대한민국 법령을 따릅니다. Paddle을 통한 구매 거래에는 Paddle 구매자 약관이 함께 적용됩니다. 서비스 관련 문의 또는 분쟁은 먼저 ${email}로 협의를 요청할 수 있으며, 해결되지 않는 경우 관계 법령이 정한 관할 법원 또는 분쟁조정 절차를 따릅니다.`,
              '본 약관은 구매자 거주지의 강행 소비자보호법에 따른 권리를 제한하지 않습니다.',
            ],
          },
          {
            title: '10. 약관 변경',
            paragraphs: [
              '약관이 변경되면 시행일과 주요 변경 내용을 이 페이지에 표시합니다. 이용자 권리나 의무에 중요한 변경은 합리적으로 가능한 경우 시행 전에 사이트 또는 등록된 연락 수단으로 안내하며, 법령·보안상 긴급한 변경은 즉시 적용될 수 있습니다.',
            ],
          },
        ],
      },
      privacy: {
        title: '개인정보처리방침',
        effective: '시행일: 2026년 8월 12일',
        intro:
          `${operatorName}는 현재 공개된 LiqGuard 무료 계산기에서 처리되는 정보와 이용자의 권리를 다음과 같이 안내합니다. 현재 공개 서비스에는 로그인, 클라우드 저장, 결제 또는 Pro 기능이 없습니다.`,
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
              '이 기기 저장을 선택한 계산기 입력값과 숫자세트 1개는 해당 브라우저의 localStorage에만 저장되며 운영자 서버로 전송되지 않습니다. 운영자는 계산기 입력값을 판매하지 않습니다.',
              '활성 저장 슬롯을 다시 선택해 저장값을 삭제할 수 있습니다. 입력값 비우기 또는 브라우저의 사이트 데이터 삭제 기능으로 로컬 입력값과 언어·동의 설정을 제거할 수도 있습니다.',
            ],
          },
          {
            title: '3. 외부 서비스와 제3자 제공',
            paragraphs: [
              '운영자는 현재 개인정보를 독립된 제3자에게 판매하거나 일반적인 목적으로 제공하지 않습니다. 다만 이용자가 선택한 Google 분석·광고 처리에는 Google의 개인정보처리방침과 동의 설정이 적용됩니다.',
              '서비스 운영을 위해 아래 외부 사업자가 필요한 범위의 정보를 처리합니다. 각 사업자의 법적 지위와 처리 조건은 해당 서비스 약관 및 개인정보처리방침에 따릅니다.',
            ],
            table: {
              headers: ['외부 사업자', '업무', '처리 정보'],
              rows: [
                ['Vercel Inc.', '웹 호스팅, 전송, 보안 로그, Web Analytics', '접속·기기·집계 이용 정보'],
                ['Google LLC', 'GA4 이용 분석, AdSense 광고와 동의 관리', '쿠키·기기·접속·이용·광고 정보'],
              ],
            },
          },
          {
            title: '4. 개인정보의 국외 이전',
            paragraphs: [
              '국외 이전은 개인정보 보호법 제28조의8에 따라 아래와 같이 이루어집니다. Google 선택 기능은 동의하지 않아도 계산기를 이용할 수 있으며, 푸터에서 동의를 철회할 수 있습니다.',
            ],
            table: {
              headers: ['이전받는 자·연락처', '근거·이전 항목', '국가·시점·방법', '목적·보유기간'],
              rows: [
                [
                  'Vercel Inc. · privacy@vercel.com',
                  '개인정보 보호법 제28조의8 제1항 제3호(계약 이행) · 접속 시각, IP 주소, URL, 브라우저·기기·오류·보안 로그 및 Web Analytics 항목',
                  '미국 및 Vercel 하위처리자 운영 국가 · 서비스 접속 시 HTTPS 전송',
                  '호스팅·보안·장애 대응·익명 방문 통계 · 방문자 세션 식별 정보는 24시간 후 폐기, 그 밖의 로그와 집계 정보는 Vercel 계약·정책상 필요한 기간',
                ],
                [
                  'Google LLC · Google 개인정보 보호 문의',
                  '개인정보 보호법 제28조의8 제1항 제1호(이용자 동의) · 쿠키·기기 식별 정보, IP에서 파생된 지역, 페이지·이용·광고 상호작용 정보',
                  '미국 및 Google 데이터센터 운영 국가 · 선택 기능 동의 후 HTTPS 전송',
                  'GA4 분석, AdSense 광고·측정·부정 이용 방지 · GA4 이벤트 데이터는 최대 14개월, 광고 정보는 Google 정책과 이용자 설정에 따른 기간',
                ],
              ],
            },
            links: [
              { label: 'Vercel 개인정보처리방침', href: 'https://vercel.com/legal/privacy-notice' },
              { label: 'Vercel Web Analytics 개인정보 안내', href: 'https://vercel.com/docs/analytics/privacy-policy' },
              { label: 'Google 개인정보처리방침', href: 'https://policies.google.com/privacy' },
            ],
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
            title: '6. 향후 계정·결제 기능',
            paragraphs: [
              '로그인, Supabase 클라우드 저장, 기록, Paddle 결제와 Pro 권한 기능은 현재 공개 서비스에서 제공하지 않습니다. 해당 기능을 공개하기 전에 실제 처리 항목, 법적 근거, 보유기간, 위탁·국외 이전, 삭제 방법을 이 방침에 반영하고 필요한 동의를 받습니다.',
            ],
          },
          {
            title: '7. 개인정보의 파기',
            paragraphs: [
              '보유기간이 끝나거나 처리 목적이 달성된 정보는 지체 없이 파기합니다. 법령에 따라 별도 보존해야 하는 정보는 다른 정보와 분리해 해당 기간 동안만 보관합니다.',
              '브라우저 저장 정보는 이용자가 입력값 비우기, 저장 슬롯 삭제 또는 브라우저 사이트 데이터 삭제로 파기합니다. 운영자나 외부 사업자가 보유한 전자 기록은 복구하기 어렵도록 삭제하거나 비식별·집계 형태로 전환하며, 백업은 정해진 순환 주기에 따라 삭제합니다.',
            ],
          },
          {
            title: '8. 정보주체의 권리와 행사방법',
            paragraphs: [
              `개인정보 처리에 관한 열람, 정정, 삭제, 처리정지 또는 문의는 ${email}로 요청할 수 있습니다. 본인 확인이 필요한 요청에는 권리 보호를 위해 추가 확인을 요청할 수 있습니다.`,
              '브라우저에 저장된 값은 입력값 비우기, 저장 슬롯 삭제 또는 브라우저 사이트 데이터 삭제로 직접 제거할 수 있습니다. 선택 기능의 국외 이전이나 쿠키 처리를 거부·철회해도 계산기 핵심 기능은 이용할 수 있으나 분석·맞춤 광고는 제한됩니다.',
            ],
          },
          {
            title: '9. 안전성 확보조치',
            paragraphs: [
              '운영자는 전송구간 암호화(HTTPS), 접근권한 최소화, 비밀정보의 서버 환경변수 분리, 보안 업데이트와 로그 점검 등 서비스 규모에 적합한 보호조치를 적용합니다.',
            ],
          },
          {
            title: '10. 개인정보 보호책임자와 구제방법',
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
            title: '11. 처리방침 변경',
            paragraphs: [
              '처리방침이 변경되면 시행일과 변경 내용을 이 페이지에 표시합니다. 계정, 저장, 결제, 광고·분석 도구 또는 운영 주체가 바뀌면 관련 내용을 함께 갱신합니다.',
            ],
          },
        ],
      },
      refund: {
        title: '환불 정책',
        effective: '시행일: 2026년 8월 14일',
        intro:
          '본 정책은 Paddle Live 결제가 활성화된 뒤 판매되는 LiqGuard Pro 월간·연간 구독의 취소와 환불 요청에 적용됩니다.',
        sections: [
          operatorSection(locale),
          {
            title: '1. 판매 및 결제 주체',
            paragraphs: [
              'LiqGuard Pro 구독은 판매가 시작되면 Paddle을 통해 판매됩니다. Paddle은 온라인 재판매자이자 Merchant of Record로서 구매자 거래, 결제, 관련 세금, 송장과 영수증, 결제 지원 및 환불을 처리합니다.',
            ],
            links: [
              { label: 'Paddle 구매자 약관', href: 'https://www.paddle.com/legal/buyer-terms' },
              { label: 'Paddle 환불 정책', href: 'https://www.paddle.com/legal/refund-policy' },
            ],
          },
          {
            title: '2. 환불 요청 방법',
            paragraphs: [
              `구매 확인 이메일의 지원 링크 또는 paddle.net의 Paddle 주문 지원을 이용하세요. 제품 접근이나 기능 문제는 ${email}로 문의할 수 있으며, 필요한 경우 Paddle 지원 경로를 안내합니다.`,
            ],
            links: [{ label: 'Paddle 주문 지원', href: 'https://paddle.net/' }],
          },
          {
            title: '3. 30일 환불 보장',
            paragraphs: [
              'LiqGuard Pro 월간·연간 구독은 최초 결제일 또는 갱신 결제일로부터 30일 이내에 Paddle에 환불을 요청하면 해당 거래 금액을 전액 환불합니다. 환불 요청에 별도의 사유나 이용량 조건을 두지 않습니다.',
              '구매자 거주지의 강행 소비자보호법 또는 Paddle 환불 정책이 더 넓은 권리를 제공하는 경우 그 권리도 함께 적용됩니다.',
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
              'Paddle은 환불 대상 거래의 전액을 가능한 경우 원래 결제 수단으로 처리합니다. 실제 입금 시점은 은행과 카드사에 따라 달라질 수 있습니다.',
              'Paddle이 환불 완료를 확인하면 해당 거래로 부여된 Pro 접근 권한은 종료됩니다.',
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
      effective: 'Effective: August 12, 2026',
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
            'The current public service does not offer sign-in or cloud storage. If you select on-device saving, calculator inputs and one number set are stored only in this browser localStorage.',
            'Stored values may be exposed or lost on shared devices, through browser extensions or malware, device loss, browser-data deletion, or storage errors.',
            'Before account, cloud-storage, records, or Pro features launch publicly, we will update these terms and the Privacy Policy to describe the actual processing and service conditions.',
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
            'Once sales begin, Paddle acts as the online reseller and merchant of record for purchase transactions, payment processing, applicable taxes, invoices and receipts, billing support, cancellation, and refunds. Paddle Buyer Terms and Refund Policy govern the purchase and payment relationship; these LiqGuard terms govern use of the product.',
            'Monthly and yearly subscriptions renew for each billing period until canceled. Cancellation stops the next renewal; unless a separate refund is approved, access continues through the end of the paid period.',
            'The pricing page lists plan prices and included features. The Refund Policy explains cancellation and refund procedures.',
          ],
          links: [
            { label: 'Paddle Buyer Terms', href: 'https://www.paddle.com/legal/buyer-terms' },
            { label: 'Paddle Refund Policy', href: 'https://www.paddle.com/legal/refund-policy' },
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
            `These terms for use of LiqGuard are governed by the laws of the Republic of Korea. Paddle Buyer Terms also apply to purchases made through Paddle. Contact ${email} first for product disputes; unresolved matters follow applicable courts or dispute-resolution procedures.`,
            'Nothing in these terms limits mandatory consumer rights that apply where the buyer lives.',
          ],
        },
        {
          title: '10. Changes to these terms',
          paragraphs: [
            'We will show the effective date and material changes on this page. Where reasonably possible, material changes to user rights or obligations will be announced on the site or through an available contact method before they take effect. Urgent legal or security changes may take effect immediately.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      effective: 'Effective: August 12, 2026',
      intro:
        `${operatorName} explains below how information is handled in the currently public LiqGuard free calculator. The public service does not currently offer sign-in, cloud storage, billing, or Pro features.`,
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
            'Calculator inputs and one number set saved on this device remain only in this browser localStorage and are not sent to our server. We do not sell calculator inputs.',
            'You can reselect the active save slot to delete it. Clearing calculator inputs or browser site data can remove local inputs and language or consent settings.',
          ],
        },
        {
          title: '3. External services and third-party disclosure',
          paragraphs: [
            'We do not currently sell personal information or disclose it to independent third parties for general purposes. Google analytics and advertising selected by the user remain subject to Google privacy terms and consent settings.',
            'The following external providers process information needed to operate the service. Their legal roles and processing conditions follow the applicable service terms and privacy policies.',
          ],
          table: {
            headers: ['Provider', 'Service', 'Information'],
            rows: [
              ['Vercel Inc.', 'Hosting, delivery, security logs, Web Analytics', 'Access, device, and aggregate usage data'],
              ['Google LLC', 'GA4 analytics, AdSense advertising, consent management', 'Cookie, device, access, usage, and ad data'],
            ],
          },
        },
        {
          title: '4. International transfers',
          paragraphs: [
            'International transfers take place as described below. Optional Google processing can be refused or withdrawn through the footer without disabling the core calculator.',
          ],
          table: {
            headers: ['Recipient and contact', 'Basis and data', 'Country, timing, and method', 'Purpose and retention'],
            rows: [
              [
                'Vercel Inc. · privacy@vercel.com',
                'Processing necessary to provide the service · access time, IP address, URL, browser, device, error and security logs, and Web Analytics fields',
                'United States and Vercel subprocessor locations · HTTPS transfer when the service is accessed',
                'Hosting, security, troubleshooting, and anonymous analytics · visitor-session identification is discarded after 24 hours; other logs and aggregates are kept as needed under the Vercel agreement and policies',
              ],
              [
                'Google LLC · Google Privacy Help',
                'User consent · cookies or device identifiers, IP-derived region, pages, usage events, and advertising interactions',
                'United States and Google data-center locations · HTTPS transfer after consent to the optional feature',
                'GA4 analytics and AdSense delivery, measurement, and invalid-traffic prevention · GA4 event data for up to 14 months; advertising information under Google policies and user settings',
              ],
            ],
          },
          links: [
            { label: 'Vercel Privacy Notice', href: 'https://vercel.com/legal/privacy-notice' },
            { label: 'Vercel Web Analytics privacy', href: 'https://vercel.com/docs/analytics/privacy-policy' },
            { label: 'Google Privacy Policy', href: 'https://policies.google.com/privacy' },
          ],
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
          title: '6. Future account and billing features',
          paragraphs: [
            'Sign-in, Supabase cloud storage, records, Paddle billing, and Pro access are not available in the current public service. Before those features launch, we will update this policy with the actual data, legal basis, retention, processors, international transfers, and deletion methods, and obtain any consent that is required.',
          ],
        },
        {
          title: '7. Data destruction',
          paragraphs: [
            'We delete information without undue delay when its retention period ends or its purpose is complete. Records that must be kept by law are separated and retained only for the required period.',
            'You delete browser data through the input-clear, save-slot deletion, or browser site-data controls. Electronic records held by us or a provider are deleted so they are not reasonably recoverable or converted to de-identified aggregate form; backups expire through the applicable rotation schedule.',
          ],
        },
        {
          title: '8. Your rights',
          paragraphs: [
            `Contact ${email} to request access, correction, deletion, restriction, or information about processing. We may request reasonable verification to protect your rights.`,
            'You can remove browser-stored values through input clearing, save-slot deletion, or browser site-data controls. Refusing or withdrawing optional international transfer or cookie processing does not disable the core calculator, but analytics and personalized advertising will be limited.',
          ],
        },
        {
          title: '9. Security measures',
          paragraphs: [
            'We use HTTPS, least-privilege access, separation of secrets into server environment variables, security updates, and log review appropriate to the service.',
          ],
        },
        {
          title: '10. Privacy contact and remedies',
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
          title: '11. Policy changes',
          paragraphs: [
            'We will display the effective date and material changes here. We will update this policy when account, storage, billing, analytics, advertising, or operator details change.',
          ],
        },
      ],
    },
    refund: {
      title: 'Refund Policy',
      effective: 'Effective: August 14, 2026',
      intro:
        'This policy applies to cancellation and refund requests for LiqGuard Pro Monthly and Pro Yearly subscriptions after Paddle live checkout is enabled.',
      sections: [
        operatorSection(locale),
        {
          title: '1. Seller and payment provider',
          paragraphs: [
            'When sales begin, LiqGuard Pro subscriptions are sold through Paddle. Paddle acts as the online reseller and merchant of record for purchase transactions, payments, applicable taxes, invoices and receipts, billing support, and refunds.',
          ],
          links: [
            { label: 'Paddle Buyer Terms', href: 'https://www.paddle.com/legal/buyer-terms' },
            { label: 'Paddle Refund Policy', href: 'https://www.paddle.com/legal/refund-policy' },
          ],
        },
        {
          title: '2. How to request a refund',
          paragraphs: [
            `Use the support link in your purchase email or Paddle order support at paddle.net. For product access or functionality issues, contact ${email}; we can direct you to the appropriate Paddle support route when needed.`,
          ],
          links: [{ label: 'Paddle order support', href: 'https://paddle.net/' }],
        },
        {
          title: '3. 30-day money-back guarantee',
          paragraphs: [
            'LiqGuard Pro Monthly and Pro Yearly subscriptions include a 30-calendar-day money-back guarantee. Submit the request to Paddle within 30 calendar days of the initial or renewal transaction date to receive a full refund for that transaction. No reason or usage threshold is required.',
            'If mandatory consumer law or Paddle’s Refund Policy grants the buyer broader rights, those rights also apply.',
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
            'Paddle returns the full transaction amount to the original payment method where possible. Bank and card timing varies.',
            'When Paddle confirms that a refund is complete, Pro access granted by that transaction ends.',
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
      showNavigation={kind !== 'refund'}
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
