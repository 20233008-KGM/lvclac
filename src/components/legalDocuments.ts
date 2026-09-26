import { PUBLIC_OPERATOR_INFO, publicOperatorDetails, publicOperatorDisplayName } from '../config/operator'
import type { Locale } from '../i18n'

export interface LegalSection {
  title: string
  paragraphs?: string[]
  table?: { headers: string[]; rows: string[][] }
  links?: { label: string; href: string }[]
}

export interface LegalDocument {
  title: string
  effective: string
  intro: string
  sections: LegalSection[]
}

const providerLinks = [
  { label: 'Supabase', href: 'https://supabase.com/privacy' },
  { label: 'Supabase subprocessors', href: 'https://supabase.com/legal/subprocessors' },
  { label: 'Vercel', href: 'https://vercel.com/legal/privacy-notice' },
  { label: 'Vercel Web Analytics', href: 'https://vercel.com/docs/analytics/privacy-policy' },
  { label: 'Google', href: 'https://policies.google.com/privacy' },
  { label: 'Resend', href: 'https://resend.com/legal/privacy-policy' },
  { label: 'Paddle', href: 'https://www.paddle.com/legal/privacy' },
]

// Restores the detailed public document structure removed in 303eb35, updated
// for the current account, cloud, billing, and measurement implementations.
export function buildLegalDocuments(locale: Locale): Record<'terms' | 'privacy', LegalDocument> {
  const ko = locale === 'ko'
  const email = PUBLIC_OPERATOR_INFO.contactEmail
  const operator = publicOperatorDisplayName(locale)
  const operatorSection: LegalSection = {
    title: ko ? '운영자 정보' : 'Operator information',
    table: {
      headers: ko ? ['항목', '내용'] : ['Item', 'Details'],
      rows: publicOperatorDetails(locale).map(({ label, value }) => [label, value]),
    },
  }
  const effective = ko ? '시행일: 2026년 9월 26일' : 'Effective: September 26, 2026'

  if (ko) return {
    terms: {
      title: '이용약관', effective,
      intro: `이 약관은 ${operator}가 제공하는 LiqGuard 계산기, 계정·저장·기록 기능 및 Pro 구독의 이용 조건을 정합니다.`,
      sections: [operatorSection,
        { title: '1. 서비스의 성격과 범위', paragraphs: [
          'LiqGuard는 이용자가 입력한 계좌 평가금액, 가격, 계약수, 증거금 등을 바탕으로 예상 청산가, 증거금 여유, 레버리지와 주문 시나리오를 계산하는 보조 도구입니다.',
          '서비스는 투자자문, 매매 권유, 주문 실행, 증권계좌 관리 또는 수익 보장을 제공하지 않습니다. 실제 증권사·거래소 계좌와 연결하여 거래를 실행하지 않으며, 주문 기록도 서비스 안에서 계산한 시뮬레이션 기록입니다.',
        ] },
        { title: '2. 계산 결과의 확인', paragraphs: [
          '거래소·증권사·브로커·상품별로 증거금 산식, 수수료, 세금, 반올림, 가격 단위와 강제청산 규칙이 다를 수 있습니다. 입력값의 오류나 시점 차이도 결과에 영향을 줍니다.',
          '실제 거래 전에 공식 상품 명세와 본인의 거래 화면에서 결과를 확인해야 합니다. 계산 결과, 예시, 가이드와 수식 설명은 거래 결과를 보장하지 않으며, 최종 거래 판단은 이용자가 수행합니다.',
        ] },
        { title: '3. 계정과 이용자의 의무', paragraphs: [
          '기본 계산은 로그인 없이 이용할 수 있습니다. 계정 기능은 이메일 또는 제공되는 외부 인증 수단으로 로그인하여 이용합니다. 이용자는 자신이 관리할 수 있는 정확한 정보를 사용하고 로그인 정보와 기기의 보안을 관리해야 합니다.',
          `타인의 계정을 사용하거나 무단 접근, 서비스 방해, 악성 코드 전송, 불법 콘텐츠 게시 또는 자동화된 대량 요청을 해서는 안 됩니다. 계정의 무단 사용이 의심되면 ${email}로 알려주세요.`,
          '부정 이용이나 보안 위험이 확인되면 필요한 범위에서 해당 기능 또는 계정 이용을 제한할 수 있습니다. 가능한 경우 사유와 문의 방법을 안내하며, 긴급한 보안 조치는 먼저 시행할 수 있습니다.',
        ] },
        { title: '4. 저장·기록·메모와 데이터 삭제', paragraphs: [
          '이 기기 저장은 현재 브라우저에 데이터를 보관합니다. 클라우드 저장은 로그인 계정에 계산값, 숫자세트, 메모와 관련 설정을 저장하며, 주문 시뮬레이션·계좌 스냅샷 기록은 계정별로 관리됩니다. 자동 기록을 켜면 해당 설정에 따라 스냅샷이 생성될 수 있습니다.',
          '저장 안 함은 저장을 중지하는 선택이며 기존 저장 데이터 전체를 삭제하는 기능이 아닙니다. 입력값 비우기는 계산 입력을 초기화하며 메모·기록·저장 슬롯을 일괄 삭제하지 않습니다. 삭제하려면 해당 슬롯·기록의 삭제 기능이나 브라우저 사이트 데이터 삭제 기능을 사용하세요. 클라우드 슬롯 삭제 시 연결 기록도 삭제될 수 있으므로 확인 화면의 범위를 확인하세요.',
          '공용 기기, 브라우저 데이터 삭제, 확장 프로그램, 기기 분실 또는 장애로 저장값이 노출되거나 사라질 수 있습니다. 필요한 자료는 별도로 보관하세요. 로그아웃만으로 모든 로컬 데이터가 지워지는 것은 아닙니다.',
        ] },
        { title: '5. Pro 구독·가격·자동 갱신', paragraphs: [
          'Pro 구독의 가격, 결제 주기, 제공 기능과 적용 조건은 요금제 및 결제 화면에 표시합니다. 구매 지역에 따라 세금이 추가될 수 있으며 최종 결제 금액은 결제 전에 확인할 수 있습니다.',
          'Paddle은 온라인 재판매자이자 Merchant of Record로서 구매 거래, 결제, 관련 세금, 송장·영수증, 구독 결제 지원과 환불을 처리합니다. 구매·결제 관계에는 Paddle 구매자 약관이, LiqGuard 기능 이용에는 본 약관이 적용됩니다.',
          '월간·연간 구독은 취소하지 않으면 해당 주기로 자동 갱신됩니다. 구독 관리 화면 또는 Paddle 주문 지원에서 갱신을 취소할 수 있습니다. 별도 안내가 없는 한 취소 후에도 이미 결제한 기간 종료 시점까지 Pro를 이용할 수 있습니다.',
          '일반적인 개인의 Pro 노트 작성에는 분량 제한을 두지 않습니다. 다만 한 번에 붙여넣기는 50,000자까지 가능하며 저장 요청 빈도와 자동화된 대량 입력은 제한될 수 있습니다. 플랜 변경으로 기존 메모를 임의로 잘라내지 않으며, 추가 작성·기능 이용에는 현재 플랜의 조건이 적용됩니다.',
          '가격이나 유료 이용 조건의 중요한 변경은 적용 시점과 함께 사전에 안내합니다. 이미 결제한 기간의 권리와 법령상 필요한 동의·해지 권리를 존중합니다.',
        ], links: [
          { label: 'Paddle 구매자 약관', href: 'https://www.paddle.com/legal/buyer-terms' },
          { label: 'Paddle 주문 지원', href: 'https://paddle.net/' },
        ] },
        { title: '6. 구독 취소·환불·회원 탈퇴', paragraphs: [
          '구독 취소는 다음 자동 갱신을 중단하는 것이며 현재 결제 기간의 자동 환불을 의미하지 않습니다. 환불 요청 방법과 적용 조건은 환불 정책 및 Paddle 구매자 조건을 따릅니다. 법령상 철회·환불 권리나 구매 당시 별도로 약속된 더 유리한 조건은 제한하지 않습니다.',
          `회원 탈퇴와 계정·클라우드 데이터 삭제는 ${email}로 요청할 수 있습니다. 본인 확인 후 처리 범위와 법정 보존 예외를 안내합니다. 계정 삭제와 유료 구독 취소는 별개이므로, 자동 갱신을 원하지 않으면 구독도 취소하거나 문의 시 함께 요청하세요.`,
        ], links: [{ label: 'LiqGuard 환불 정책', href: '/refund-policy' }] },
        { title: '7. 광고·분석과 외부 서비스', paragraphs: [
          '서비스 운영과 개선을 위해 호스팅·인증·저장·메일·결제·방문 통계 및 광고 성과 측정 서비스를 이용합니다. 구체적인 정보 처리와 선택권은 개인정보처리방침에 설명합니다.',
          '현재 사이트 내 AdSense 광고 게재는 중지되어 있습니다. Google Ads 성과 측정은 사이트 내 광고 게재와 별개입니다. 외부 링크의 상품·서비스는 각 제공자의 조건이 적용되며 운영자가 그 품질이나 적합성을 보증하지 않습니다.',
        ] },
        { title: '8. 지식재산권과 이용자 콘텐츠', paragraphs: [
          '프로그램, 화면 구성, 문서와 자체 작성 콘텐츠에 관한 권리는 관련 법령과 개별 라이선스에 따라 운영자 또는 정당한 권리자에게 귀속됩니다. 허용된 범위를 넘어 서비스 전체를 복제·재판매하거나 출처를 오인하게 해서는 안 됩니다.',
          '이용자가 작성한 메모·문의 등 콘텐츠의 권리는 이용자에게 있습니다. 운영자는 저장·복원·지원 등 서비스 제공에 필요한 범위에서 이를 처리합니다. 타인의 개인정보나 권리를 침해하는 자료, 비밀번호·카드번호·계좌 인증정보 등을 입력하거나 첨부하지 마세요.',
        ] },
        { title: '9. 서비스 변경과 중단', paragraphs: [
          '정확성 개선, 보안, 점검, 법령 또는 운영상 필요에 따라 기능이 변경되거나 일시 중단될 수 있습니다. 중요한 변경이나 서비스 종료는 가능한 범위에서 사전에 안내합니다.',
          '유료 서비스의 중대한 축소 또는 종료로 계약 이행이 어려워지면 관련 법령과 구매 조건에 따라 이용기간·환불 등 필요한 조치를 안내합니다. 중단 없는 이용이나 데이터의 영구 보관을 보장하지는 않습니다.',
        ] },
        { title: '10. 책임 범위', paragraphs: [
          '운영자는 서비스의 합리적인 정확성과 안정성을 위해 노력합니다. 다만 이용자의 잘못된 입력, 외부 거래 규칙의 차이, 이용자 책임의 보안 사고 또는 통제할 수 없는 장애 등으로 발생한 손해에는 법령이 허용하는 범위에서 책임이 제한될 수 있습니다.',
          '본 약관은 운영자의 고의·중대한 과실로 인한 책임이나 법령상 배제할 수 없는 책임을 면제하지 않으며, 이용자의 강행법상 권리를 제한하지 않습니다.',
        ] },
        { title: '11. 준거법과 분쟁 해결', paragraphs: [
          `LiqGuard 기능 이용에 관한 약관에는 대한민국 법령을 적용합니다. 문의나 분쟁은 먼저 ${email}로 협의를 요청할 수 있으며, 해결되지 않으면 관계 법령이 정한 관할 법원 또는 분쟁조정 절차를 따릅니다.`,
          'Paddle 구매 거래에는 해당 구매자 약관이 함께 적용됩니다. 이용자 거주지의 강행 소비자보호법에 따른 권리는 그대로 보장됩니다.',
        ] },
        { title: '12. 약관 변경과 이번 개정', paragraphs: [
          '변경 시 시행일과 주요 내용을 이 페이지에 표시합니다. 권리·의무에 중요한 변경은 사이트 또는 등록된 연락 수단으로 사전에 안내하며, 별도 동의가 필요한 경우 해당 절차를 진행합니다.',
          '2026년 9월 26일: 축약 과정에서 빠진 상세 안내를 복구하고, 현재 계정·클라우드 저장·메모·Pro 자동 갱신·탈퇴 및 개인정보 안내와의 연결을 보충했습니다. 이 개정으로 기존 구매에 약속된 권리를 소급하여 축소하지 않습니다.',
        ] },
      ],
    },
    privacy: {
      title: '개인정보처리방침', effective,
      intro: `${operator}는 LiqGuard 이용 과정에서 어떤 정보를 왜 처리하는지, 어디에 보관하는지, 이용자가 어떻게 확인·삭제할 수 있는지 다음과 같이 안내합니다.`,
      sections: [operatorSection,
        { title: '1. 처리 목적·항목·보유기간', paragraphs: [
          '이용자가 선택한 기능에 필요한 범위에서 정보를 처리합니다. 계정·저장·지원 등 계약 이행에 필요한 처리, 선택 기능에 대한 동의, 법령상 의무 등 적용되는 근거에 따라 처리하며, 필요한 경우 별도로 동의를 받습니다.',
        ], table: { headers: ['구분', '처리 항목', '목적', '보유·삭제 기준'], rows: [
          ['계정·인증', '이메일, 비밀번호 인증정보(이메일 가입 시), 인증 제공자·사용자 식별자, 닉네임, 프로필·언어 설정, 인증·변경 시각', '가입·로그인, 계정 식별, 보안과 설정 유지', '회원 탈퇴 처리 시까지. 보존 의무가 있는 정보는 6항의 기준 적용'],
          ['클라우드 저장·기록', '계산 입력값, 숫자세트명, 메모, 주문 시뮬레이션, 계좌 스냅샷, 저장 시각, 자동 기록·시간대 설정', '계정별 저장·복원, 기록·내보내기, 선택한 자동 기록 제공', '해당 데이터 삭제 또는 회원 탈퇴 처리 시까지'],
          ['문의·피드백', '작성자·연락처, 제목·본문, 첨부 이미지·파일 정보, 답변·처리 상태와 시각', '문의 대응, 오류 재현과 처리 이력 관리', '문의 처리 목적 달성 시까지. 소비자 불만·분쟁 기록에 해당하면 법정 3년 보존'],
          ['구독·결제', '계정 연결 정보, Paddle 고객·구독·거래 식별자, 플랜·상태·결제기간, 결제·환불 관련 이벤트', 'Pro 권한, 구독 동기화, 결제 지원 및 법정 의무', '구독·지원 처리에 필요한 기간 및 6항의 법정 보존기간'],
          ['기기 내 저장·설정', '로컬 계산값·메모, 언어·화면 설정, 저장·동의 선택, 로그인 세션, 클라우드 값의 기기 캐시', '기기 내 복원, 로그인 유지, 설정·선택 기억', '해당 데이터 삭제, 세션 만료 또는 브라우저 사이트 데이터 삭제 시까지. 국가 코드 쿠키는 최대 30일'],
          ['접속·보안', 'IP 주소, 접속 시각, 요청 주소, 브라우저·기기 정보, 오류·보안 로그', '페이지·API 제공, 부정 이용 방지와 장애 대응', '각 처리업체의 계약·로그 보존 정책상 필요한 기간'],
          ['분석·광고 성과', '페이지·리퍼러, 대략적 지역, 기기·브라우저, 이벤트·동의 상태, 허용 시 쿠키·광고 식별정보', '집계 방문 통계, 이용 현황·광고 성과 측정', '동의와 각 제공자의 보존 설정·정책에 따름. 철회 후 선택적 수집 중단; 이미 처리된 정보는 해당 삭제 절차 적용'],
        ] } },
        { title: '2. 계산값·저장 설정의 의미', paragraphs: [
          '기본 계산은 브라우저에서 실행되며 증권계좌에 연결하지 않습니다. 이 기기 저장을 선택한 값은 해당 브라우저에 보관합니다. 클라우드 저장이나 기록 기능을 사용하면 계정에 연결된 데이터가 Supabase로 전송됩니다. 복원 속도를 위해 클라우드 값 일부가 기기에도 캐시될 수 있습니다.',
          '저장 안 함을 선택해도 기존 데이터가 모두 삭제되지는 않습니다. 입력값 비우기도 메모·저장 슬롯·과거 기록 전체 삭제가 아닙니다. 슬롯·기록 삭제 화면의 범위를 확인하고, 공용 기기에서는 로그아웃 후 사이트 데이터도 삭제하세요. 다운로드한 CSV·XLSX 파일은 이용자가 직접 관리·삭제해야 합니다.',
          '운영자는 계산 입력값이나 메모를 판매하지 않습니다. 문의·첨부파일에는 비밀번호, 카드번호, 계좌 인증정보와 불필요한 타인 개인정보를 포함하지 마세요.',
        ] },
        { title: '3. 처리위탁·외부 서비스와 제3자 제공', paragraphs: [
          '운영에 필요한 업무를 아래 사업자의 서비스로 처리합니다. 업무 수행에 필요한 범위로 접근을 제한하며, 독립된 구매·로그인 제공자의 처리는 해당 제공자의 정책도 적용됩니다.',
          '개인정보를 임의로 판매하지 않습니다. 법령에 근거한 요청, 이용자가 선택한 외부 서비스 이용 또는 별도 동의 등 적법한 사유가 있는 경우에만 해당 범위에서 제공합니다.',
        ], table: { headers: ['사업자', '업무·역할', '처리 정보'], rows: [
          ['Supabase', '인증, 데이터베이스·첨부파일 저장 수탁', '계정·프로필, 클라우드 계산값·메모·기록, 문의·첨부, 구독 상태'],
          ['Vercel Inc.', '호스팅·서버 함수·보안 및 Web Analytics', '요청·접속·오류 정보, 기능 처리에 필요한 요청 데이터, 집계 방문 정보'],
          ['Google', '선택한 Google 로그인, Google Ads 측정·동의 관리, 설정된 경우 GA4', '로그인 허용 프로필, 접속·기기·이벤트·동의 정보 및 허용된 식별정보'],
          ['Resend', '인증·지원 관련 이메일 전송', '이메일 주소, 메일 내용, 전송·오류 메타데이터'],
          ['Paddle', '독립된 판매자(Merchant of Record): 구매·세금·구독·환불', '구매자·결제·거래 정보와 LiqGuard 계정 연결 정보. 카드 정보는 Paddle 결제 과정에서 처리'],
        ] }, links: providerLinks },
        { title: '4. 국외 처리·보관', paragraphs: [
          '서비스 제공에 필요한 국외 처리위탁·보관은 계약 체결·이행에 필요한 처리 등 개인정보 보호법 제28조의8의 해당 요건에 따라 수행합니다. 별도 동의가 필요한 선택적 이전에는 해당 동의를 적용합니다.',
          '아래 국가에는 운영 데이터의 주 보관 지역과 사업자의 처리 거점이 포함됩니다. 글로벌 전송·지원·하위처리자의 처리는 제공자의 최신 목록에 따르며, 목적과 기간은 이 방침의 해당 데이터 항목 및 제공자 정책을 함께 적용합니다.',
        ], table: { headers: ['이전받는 자·문의', '국가', '항목·시점·방법', '목적·보유기간'], rows: [
          ['Supabase · privacy@supabase.com', '일본(도쿄 주 데이터베이스); 해외 지원·하위처리자는 연결된 목록 참조', '계정·클라우드·기록·첨부·구독 정보 / 가입·저장·기능 이용 시 암호화 통신', '인증·데이터 보관 / 해당 데이터 삭제·탈퇴 처리 시까지, 백업·운영 로그는 제공자 보존 주기'],
          ['Vercel · privacy@vercel.com', '미국 및 글로벌 전송·하위처리자 운영 국가', '접속·요청·기술 로그 및 집계 방문 정보 / 접속·API 이용 시 암호화 통신', '호스팅·보안·통계 / 서비스 계약·로그 정책상 필요한 기간. Web Analytics 방문 세션 식별 정보는 24시간 후 폐기'],
          ['Google · 아래 개인정보 문의 경로', '미국 및 Google 데이터센터 운영 국가', '선택한 로그인 프로필, 접속·동의·측정 정보와 허용된 쿠키 정보 / 로그인·페이지 접속·이벤트 시 암호화 통신', '인증·광고 성과·선택 분석 / Google 정책 및 해당 제품 보존 설정에 따름'],
          ['Resend · 아래 개인정보 문의 경로', '미국', '이메일·메일 내용·전송 메타데이터 / 인증·알림 메일 발송 시 암호화 통신', '메일 전달·장애 대응 / 제공자의 메일·로그 보존 정책에 따름'],
          ['Paddle · privacy@paddle.com', '영국·미국 및 결제 관련 하위처리자 운영 국가', '구매자·거래·구독 정보 / 결제·구독·환불 처리 시 암호화 통신', '구매 계약·세무·결제·환불 / Paddle의 법정 의무 및 개인정보 정책상 기간'],
        ] }, links: providerLinks },
        { title: '5. 쿠키·분석·광고와 선택권', paragraphs: [
          '로그인 세션과 언어·저장·개인정보 선택 등을 기억하기 위해 쿠키와 브라우저 저장소를 사용합니다. 브라우저에서 차단·삭제할 수 있으나 로그인 유지나 저장 복원이 제한될 수 있습니다.',
          'Vercel Web Analytics는 제3자 쿠키 없이 집계 방문 통계를 처리합니다. 방문 세션 식별 정보는 24시간 후 폐기되며 집계 통계의 보존은 Vercel 정책을 따릅니다.',
          'Google Ads 태그는 광고 성과 측정을 위해 로드됩니다. 광고·분석 저장, 광고 사용자 데이터 및 개인화는 기본 거부 상태로 시작하고 개인정보 설정을 반영합니다. 저장을 거부하더라도 동의 상태와 쿠키 없는 측정 신호가 Google에 전송될 수 있으므로, 거부가 모든 Google 네트워크 통신의 차단을 뜻하지는 않습니다. GA4는 설정되어 있고 분석을 허용한 경우 사용합니다.',
          '현재 AdSense를 통한 사이트 내 광고 게재는 중지되어 있습니다. 광고를 재개하거나 처리 목적·범위가 바뀌면 방침과 필요한 동의 절차를 갱신합니다.',
          '푸터의 개인정보·쿠키 설정에서 분석과 맞춤 광고 선택을 변경·철회할 수 있습니다. 적용 지역에서는 Google 동의 관리 화면을 사용합니다. 선택 기능을 거부해도 기본 계산기를 사용할 수 있습니다. Google 광고 설정과 브라우저의 쿠키 차단 기능도 이용할 수 있습니다.',
        ], links: [
          { label: 'Google 광고 설정', href: 'https://adssettings.google.com/' },
          { label: 'Google 파트너 사이트 정보 사용', href: 'https://policies.google.com/technologies/partner-sites' },
          { label: 'Google Analytics 차단 도구', href: 'https://tools.google.com/dlpage/gaoptout' },
        ] },
        { title: '6. 법정 보존과 목적 달성 후 처리', paragraphs: [
          '처리 목적이 달성되거나 탈퇴·삭제가 처리되면 불필요한 개인정보를 지체 없이 파기합니다. 법령상 보존 의무가 적용되는 기록은 다른 이용 목적과 구분하여 해당 기간에만 보존합니다.',
          '전자상거래법상 보존 의무가 당사에 적용되는 경우 계약·청약철회 기록 및 대금결제·재화 공급 기록은 5년, 소비자 불만·분쟁 처리 기록은 3년, 표시·광고 기록은 6개월 보존합니다. Paddle이 판매자로 보유하는 기록에는 Paddle에 적용되는 별도 의무가 적용됩니다.',
          '제공자별 로그·메일·백업에는 각 계약과 제품의 보존 주기가 적용됩니다. 개별 요청에 필요한 보존 범위와 삭제 가능 여부는 개인정보 문의처를 통해 확인할 수 있습니다. 법정 보존 대상이라는 이유로 모든 계산값·메모를 일괄 보존하지 않습니다.',
        ] },
        { title: '7. 삭제·탈퇴와 파기 방법', paragraphs: [
          `회원 탈퇴 또는 클라우드 정보 삭제는 ${email}로 요청하세요. 현재 자동 탈퇴 기능 대신 본인 확인 후 요청 범위를 확인하는 절차를 사용합니다. 계정·연결 데이터·첨부파일과 보존 예외를 확인하여 처리하고 결과를 안내합니다.`,
          '전자 데이터는 복구하기 어렵도록 삭제하고, 종이 자료가 있는 경우 분쇄 등으로 파기합니다. 백업·보안 로그에 남는 정보는 제공자 보존 주기에 따라 제거하며 일상적인 서비스 이용 목적으로 복원하지 않습니다.',
          '브라우저 저장값은 해당 데이터의 삭제 기능이나 브라우저 사이트 데이터 삭제로 제거하세요. 계정 삭제만으로 이용자의 기기나 이미 내보낸 파일까지 원격 삭제되지는 않습니다. 구독 자동 갱신 취소도 별도로 확인하세요.',
        ] },
        { title: '8. 정보주체의 권리와 행사방법', paragraphs: [
          `본인 또는 적법한 대리인은 ${email}로 열람, 정정, 삭제, 처리정지, 동의 철회와 적용 법령상 권리 행사를 요청할 수 있습니다. 필요한 최소한의 본인·대리권 확인 후 법정 기간 내 처리하며, 제한되는 경우 근거와 사유를 안내합니다.`,
          '기록 화면의 내보내기 기능으로 제공되는 주문·스냅샷 자료를 내려받을 수 있습니다. 그 밖의 정보 사본이 필요하면 문의하세요. 선택적 분석·광고 동의 철회는 기본 계산기 이용에 영향을 주지 않습니다.',
          '국외 처리에 관한 문의나 거부 요청도 같은 이메일로 접수합니다. 계정 인증·클라우드 보관·결제에 필요한 처리를 거부하면 해당 기능 제공이 제한될 수 있으며, 로그인 없는 기본 계산기는 계속 이용할 수 있습니다.',
        ] },
        { title: '9. 안전성 확보조치', paragraphs: [
          'HTTPS 전송, 계정별 접근 통제, 관리자 권한 제한, 서버 비밀정보 분리와 보안 업데이트 등 보호조치를 적용합니다. 비밀번호 인증은 인증 제공자가 처리하며, LiqGuard가 결제 카드 전체 정보를 직접 저장하지 않습니다.',
          '문의와 비공개 첨부파일은 작성자와 권한 있는 관리자 중심으로 접근을 제한합니다. 이용자도 공용 기기 로그아웃, 브라우저 데이터 관리와 안전한 비밀번호 사용에 유의해 주세요.',
        ] },
        { title: '10. 아동의 개인정보', paragraphs: [
          'LiqGuard는 아동을 대상으로 한 서비스가 아닙니다. 만 14세 미만 아동의 개인정보가 법정대리인 동의 등 필요한 요건 없이 수집된 사실을 알게 되면 확인 후 삭제 등 필요한 조치를 취합니다. 보호자는 개인정보 문의처로 연락할 수 있습니다.',
        ] },
        { title: '11. 자동화된 결정', paragraphs: [
          '계산 결과는 입력값에 따른 수식 계산이며 운영자가 이용자를 대신해 매매하거나 신용·투자 적격성을 평가하는 결정이 아닙니다. 구독 권한은 결제·구독 상태에 따라 반영됩니다. 잘못된 권한 반영은 문의처를 통해 확인·정정을 요청할 수 있습니다.',
        ] },
        { title: '12. 개인정보 보호책임자와 구제방법', paragraphs: [
          `개인정보 보호책임자는 위 운영자 정보에 표시되어 있으며, 문의·권리 행사 접수처는 ${email}입니다.`,
          '개인정보 침해 상담이나 분쟁조정은 개인정보 포털 및 개인정보분쟁조정위원회의 공식 접수 경로를 이용할 수 있습니다.',
        ], links: [
          { label: '개인정보 포털', href: 'https://www.privacy.go.kr/' },
          { label: '개인정보분쟁조정위원회', href: 'https://www.kopico.go.kr/' },
        ] },
        { title: '13. 방침 변경과 이번 개정', paragraphs: [
          '처리 목적, 항목, 제공자 또는 이용자 권리에 중요한 변경이 있으면 시행일과 내용을 안내하고 필요한 동의를 받습니다.',
          '2026년 9월 26일: 상세 처리 항목·보관·국외 처리·권리 행사 안내를 복구하고 계정, 클라우드·메모·첨부, Paddle 결제, Google Ads 측정 및 실제 삭제 동작을 반영했습니다.',
        ] },
      ],
    },
  }

  return {
    terms: {
      title: 'Terms of Use', effective,
      intro: `These terms govern the LiqGuard calculator, accounts, saved data, records and Pro subscriptions provided by ${operator}.`,
      sections: [operatorSection,
        { title: '1. Nature and scope of the service', paragraphs: [
          'LiqGuard calculates estimated liquidation prices, margin headroom, leverage and order scenarios from account equity, prices, contract quantities and margin information that you enter.',
          'It does not provide investment advice, trading recommendations, order execution, brokerage account management or guaranteed returns. It does not connect to a brokerage account to execute trades; order records are simulations within the service.',
        ] },
        { title: '2. Checking calculation results', paragraphs: [
          'Margin formulas, fees, taxes, rounding, price units and liquidation rules vary between exchanges, brokers, products and accounts. Incorrect inputs or different observation times can affect results.',
          'Check official product specifications and your own trading screen before trading. Results, examples, guides and formula explanations do not guarantee an outcome. You make the final trading decision.',
        ] },
        { title: '3. Accounts and acceptable use', paragraphs: [
          'Basic calculations are available without signing in. Account features use email or supported external authentication. Use accurate information under your control and protect your credentials and devices.',
          `Do not use another person's account, attempt unauthorized access, disrupt the service, transmit malicious code, post unlawful content or send automated bulk requests. Report suspected account misuse to ${email}.`,
          'We may restrict affected accounts or features to address abuse or security risks. We provide the reason and a contact route where practicable; urgent security measures may take effect first.',
        ] },
        { title: '4. Saved data, records and notes', paragraphs: [
          'This device saving keeps data in the current browser. Cloud saving associates inputs, number sets, notes and settings with your signed-in account. Simulated orders and account snapshots are managed by account. Enabling automatic records can create snapshots according to your settings.',
          'Do not save pauses saving; it does not erase all existing data. Clearing calculator inputs does not delete all notes, records or saved slots. Use the relevant slot or record deletion action, or clear browser site data. Deleting a cloud slot can also delete linked records; review the scope in the confirmation screen.',
          'Shared devices, browser data removal, extensions, device loss and failures can expose or remove saved data. Keep separate copies of important information. Signing out alone does not erase every local value.',
        ] },
        { title: '5. Pro subscriptions, pricing and renewal', paragraphs: [
          'Pricing, billing intervals, features and applicable conditions are shown on the pricing and checkout screens. Taxes may be added for your location; the final amount is displayed before payment.',
          'Paddle acts as the authorized reseller and merchant of record for purchases, payments, applicable taxes, invoices, receipts, billing support and refunds. Paddle Buyer Terms apply to the purchase relationship; these terms apply to using LiqGuard.',
          'Monthly and annual subscriptions renew automatically at the relevant interval unless canceled. Cancel renewal through subscription management or Paddle order support. Unless stated otherwise, Pro remains available until the end of the paid period.',
          'Ordinary personal Pro note writing has no total length limit. A single paste is limited to 50,000 characters, and save frequency and automated bulk input may be restricted. A plan change does not arbitrarily truncate existing notes; further writing and features are subject to the current plan.',
          'Material changes to pricing or paid terms will be communicated in advance with their effective date. Rights for an already-paid period and legally required consent or cancellation rights remain protected.',
        ], links: [
          { label: 'Paddle Buyer Terms', href: 'https://www.paddle.com/legal/buyer-terms' },
          { label: 'Paddle order support', href: 'https://paddle.net/' },
        ] },
        { title: '6. Cancellation, refunds and account closure', paragraphs: [
          'Canceling a subscription stops the next renewal; it does not automatically refund the current period. Refund procedures and eligibility follow the refund policy and applicable Paddle purchase terms. Statutory withdrawal or refund rights and any more favorable commitment made at purchase remain protected.',
          `Request account closure or cloud data deletion at ${email}. After verifying identity, we explain the scope and any legal retention exceptions. Account deletion and subscription cancellation are separate: cancel renewal or include that request when contacting us if you no longer want recurring charges.`,
        ], links: [{ label: 'LiqGuard refund policy', href: '/en/refund-policy' }] },
        { title: '7. Advertising, analytics and external services', paragraphs: [
          'We use hosting, authentication, storage, email, payment, traffic analytics and advertising measurement services. The Privacy Policy explains the information processed and your choices.',
          'On-site AdSense advertising is currently paused. Google Ads campaign measurement is separate from displaying advertisements on this site. External products and services follow their providers’ terms; we do not warrant their quality or suitability.',
        ] },
        { title: '8. Intellectual property and user content', paragraphs: [
          'Rights in the software, interface, documentation and original content belong to the operator or relevant rights holders under applicable law and licenses. Do not reproduce or resell the service as a whole beyond permitted use, or misrepresent its source.',
          'You retain rights to your notes and submissions. We process them as needed to store, restore and support the service. Do not submit material that infringes others’ rights, unnecessary personal information, passwords, card numbers or account authentication details.',
        ] },
        { title: '9. Changes and availability', paragraphs: [
          'Features may change or be temporarily unavailable for accuracy, security, maintenance, legal or operational reasons. Material changes or discontinuation will be announced in advance where practicable.',
          'If a significant reduction or discontinuation prevents delivery of a paid service, we explain appropriate access or refund arrangements under applicable law and purchase terms. Uninterrupted availability and permanent data storage are not guaranteed.',
        ] },
        { title: '10. Responsibility and liability', paragraphs: [
          'We work toward reasonable accuracy and reliability. Liability for incorrect user inputs, differences in external trading rules, security incidents attributable to the user, or events outside our control may be limited to the extent permitted by law.',
          'These terms do not exclude liability for our willful misconduct or gross negligence, other liability that cannot legally be excluded, or your mandatory legal rights.',
        ] },
        { title: '11. Governing law and disputes', paragraphs: [
          `Korean law governs these terms for LiqGuard features. Contact ${email} first to discuss a dispute. Unresolved matters may be referred to a court or dispute resolution process with jurisdiction under applicable law.`,
          'Paddle purchases are also subject to its Buyer Terms. Mandatory consumer protections in your country of residence remain available.',
        ] },
        { title: '12. Changes to these terms', paragraphs: [
          'The effective date and material changes are published here. Important changes to rights or obligations are announced in advance through the site or registered contact details. Separate consent is obtained when required.',
          'September 26, 2026: restored detailed provisions omitted from the shortened version and updated accounts, cloud saving, notes, Pro renewals, account closure and privacy references. This revision does not retroactively reduce commitments made for existing purchases.',
        ] },
      ],
    },
    privacy: {
      title: 'Privacy Policy', effective,
      intro: `${operator} explains below what LiqGuard processes, why and where information is kept, and how you can access or delete it.`,
      sections: [operatorSection,
        { title: '1. Data, purposes and retention', paragraphs: [
          'We process information needed for the features you choose, relying on applicable grounds such as providing the account, storage and support contract, consent for optional features, and legal obligations. Separate consent is requested where required.',
        ], table: { headers: ['Category', 'Information', 'Purpose', 'Retention and deletion'], rows: [
          ['Account and authentication', 'Email; password authentication data for email accounts; provider and user identifiers; nickname, profile and language settings; authentication and update times', 'Registration, sign-in, account identification, security and settings', 'Until account closure is processed, except records covered by section 6'],
          ['Cloud data and records', 'Calculator inputs, number-set names, notes, simulated orders, account snapshots, save times, automatic record and time-zone settings', 'Account storage, restoration, history, export and selected automation', 'Until the relevant data is deleted or account closure is processed'],
          ['Support and feedback', 'Author and contact information, subject, message, attachments and file metadata, replies, status and times', 'Support, issue reproduction and case management', 'Until the support purpose is fulfilled; qualifying consumer complaint or dispute records are kept for the statutory three years'],
          ['Subscriptions and payments', 'Account association, Paddle customer, subscription and transaction identifiers, plan, status, billing period and payment/refund events', 'Pro access, subscription synchronization, payment support and legal obligations', 'For subscription/support needs and applicable statutory periods in section 6'],
          ['Device storage and settings', 'Local inputs and notes, language and layout, saving and consent choices, login sessions and device caches of cloud data', 'Restoration, sign-in continuity and preferences', 'Until deletion, session expiry or browser site-data removal; country-code cookie up to 30 days'],
          ['Access and security', 'IP address, time, request URL, browser/device information, error and security logs', 'Page and API delivery, abuse prevention and troubleshooting', 'As required by the providers’ contracted logging and retention policies'],
          ['Analytics and ad measurement', 'Page/referrer, approximate location, device/browser, events, consent state and permitted cookie/ad identifiers', 'Aggregate traffic, usage and advertising performance measurement', 'According to consent and provider retention settings/policies. Withdrawal stops optional collection; previously processed data follows applicable deletion procedures'],
        ] } },
        { title: '2. Calculator data and saving choices', paragraphs: [
          'Basic calculations run in the browser without a brokerage connection. This device saving keeps values in that browser. Cloud or record features send account-associated data to Supabase. Some cloud values may also be cached on your device to speed up restoration.',
          'Do not save does not erase all existing data. Clearing calculator inputs does not remove all notes, saved slots or earlier records. Check the scope of each deletion action; on shared devices, sign out and clear site data. You manage and delete downloaded CSV/XLSX files yourself.',
          'We do not sell calculator inputs or notes. Do not include passwords, card numbers, account authentication details or unnecessary personal information about others in messages or attachments.',
        ] },
        { title: '3. Processors, external providers and disclosure', paragraphs: [
          'The following providers support our operations. Access is limited to the relevant work. Independent purchase and sign-in providers also apply their own privacy terms.',
          'We do not arbitrarily sell personal information. Disclosures are limited to lawful grounds such as legal requests, external services you choose, or separate consent.',
        ], table: { headers: ['Provider', 'Work and role', 'Information'], rows: [
          ['Supabase', 'Authentication, database and attachment storage processor', 'Accounts, profiles, cloud inputs, notes, records, support attachments and subscription state'],
          ['Vercel Inc.', 'Hosting, server functions, security and Web Analytics', 'Requests, access/errors, data required to handle feature requests and aggregate traffic'],
          ['Google', 'Selected Google sign-in, Google Ads measurement/consent, GA4 when configured', 'Permitted sign-in profile, access/device/events/consent and permitted identifiers'],
          ['Resend', 'Authentication and support-related email delivery', 'Email address, message content, delivery and error metadata'],
          ['Paddle', 'Independent merchant of record for purchases, taxes, subscriptions and refunds', 'Buyer, payment, transaction and account association; card data is processed through Paddle checkout'],
        ] }, links: providerLinks },
        { title: '4. International processing and storage', paragraphs: [
          'Necessary overseas processing and storage are carried out under applicable requirements of Article 28-8 of the Korean Personal Information Protection Act, including processing needed to enter into or perform a contract. Optional transfers requiring separate consent rely on that consent.',
          'The countries below include primary storage and provider processing locations. Global delivery, support and subprocessors follow the providers’ current lists. The relevant data category and provider policy govern the purpose and retention.',
        ], table: { headers: ['Recipient and contact', 'Country', 'Data, timing and method', 'Purpose and retention'], rows: [
          ['Supabase · privacy@supabase.com', 'Japan (Tokyo primary database); overseas support/subprocessors listed in the linked directory', 'Accounts, cloud values, records, attachments and subscriptions; encrypted transfer at registration, saving and feature use', 'Authentication/storage; until deletion or account closure, with backups and operational logs on provider cycles'],
          ['Vercel · privacy@vercel.com', 'United States and global delivery/subprocessor locations', 'Access, requests, technical logs and aggregate traffic; encrypted transfer on page/API access', 'Hosting, security and analytics; applicable contractual/logging periods. Web Analytics visitor session identifiers expire after 24 hours'],
          ['Google · privacy contact in linked policy', 'United States and Google data-center countries', 'Selected sign-in profile, access/consent/measurement and permitted cookies; encrypted transfer on sign-in, page access and events', 'Authentication, advertising performance and optional analytics; product retention settings and Google policies'],
          ['Resend · privacy contact in linked policy', 'United States', 'Email, content and delivery metadata; encrypted transfer when authentication/notification mail is sent', 'Delivery and troubleshooting; provider email/log retention policies'],
          ['Paddle · privacy@paddle.com', 'United Kingdom, United States and payment subprocessor locations', 'Buyer, transaction and subscription information; encrypted transfer during payment, subscription and refund processing', 'Purchase, tax, payment and refunds; Paddle statutory and privacy retention periods'],
        ] }, links: providerLinks },
        { title: '5. Cookies, analytics, advertising and choices', paragraphs: [
          'Cookies and browser storage support login sessions, language, saving and privacy choices. You can block or delete them in your browser; this may affect sign-in continuity or restoration.',
          'Vercel Web Analytics processes aggregate traffic without third-party cookies. Visitor session identifiers are discarded after 24 hours; aggregate statistics follow Vercel retention policies.',
          'The Google Ads tag loads for campaign measurement. Advertising/analytics storage, advertising user data and personalization start denied and reflect your privacy choices. Consent-state and cookieless measurement signals may still be sent to Google when storage is denied; refusal does not block all Google network traffic. GA4 is used when configured and analytics is allowed.',
          'On-site AdSense advertising is currently paused. We will update this policy and any required consent process before resuming advertising or changing the processing purposes or scope.',
          'Change or withdraw analytics and personalized-ad choices through privacy/cookie settings in the footer. Google consent management is used in applicable regions. Refusing optional features does not prevent basic calculations. Google ad settings and browser cookie controls provide additional choices.',
        ], links: [
          { label: 'Google ad settings', href: 'https://adssettings.google.com/' },
          { label: 'Google partner-site information use', href: 'https://policies.google.com/technologies/partner-sites' },
          { label: 'Google Analytics opt-out', href: 'https://tools.google.com/dlpage/gaoptout' },
        ] },
        { title: '6. Statutory retention and completed purposes', paragraphs: [
          'Unnecessary personal information is destroyed without undue delay when its purpose ends or deletion/account closure is processed. Records subject to a legal obligation are separated from other uses and retained for the required period.',
          'Where Korean e-commerce record obligations apply to us, contract/withdrawal and payment/supply records are retained for five years, consumer complaint/dispute records for three years, and advertising representations for six months. Paddle retains its own seller records under the obligations applicable to it.',
          'Provider logs, email and backups follow their contracted product retention cycles. Contact us about the scope and deletion options for a specific request. Statutory retention does not mean that all calculator inputs or notes are retained indiscriminately.',
        ] },
        { title: '7. Deletion and account closure', paragraphs: [
          `Email ${email} to request account closure or cloud data deletion. The current process verifies identity and scope rather than offering automatic account closure. We review associated data, attachments and legal exceptions and notify you of the outcome.`,
          'Electronic data is deleted using methods intended to prevent recovery; any paper records are shredded or otherwise destroyed. Backup/security-log copies expire on provider retention cycles and are not restored for ordinary service use.',
          'Remove browser data through the relevant deletion controls or browser site-data settings. Closing an account does not remotely erase your device or exported files. Separately check cancellation of recurring subscriptions.',
        ] },
        { title: '8. Your rights and how to exercise them', paragraphs: [
          `You or an authorized representative may contact ${email} for access, correction, deletion, restriction, consent withdrawal and other applicable legal rights. We request only necessary identity/authority verification, respond within applicable legal periods and explain any lawful restrictions.`,
          'Use record export for available order/snapshot files, or contact us for other copies. Withdrawing optional analytics or advertising consent does not affect basic calculator access.',
          'International-processing inquiries or objections can be sent to the same address. Refusing processing necessary for authentication, cloud storage or purchases may prevent those features; the basic calculator remains available without sign-in.',
        ] },
        { title: '9. Security measures', paragraphs: [
          'Safeguards include HTTPS, account-level access controls, restricted administrator permissions, separated server secrets and security updates. Authentication providers handle password authentication; LiqGuard does not directly store full payment card details.',
          'Support submissions and private attachments are restricted primarily to their author and authorized administrators. Protect your password, sign out on shared devices and manage browser data carefully.',
        ] },
        { title: '10. Children’s information', paragraphs: [
          'LiqGuard is not directed to children. If we learn that personal information of a child under 14 was collected without required guardian consent or another necessary condition, we investigate and take appropriate steps including deletion. Guardians may contact our privacy address.',
        ] },
        { title: '11. Automated decisions', paragraphs: [
          'Results are formulas applied to your inputs, not decisions to trade on your behalf or assess credit or investment eligibility. Subscription access reflects payment/subscription status. Contact us for review and correction of an incorrect access decision.',
        ] },
        { title: '12. Privacy contact and remedies', paragraphs: [
          `The privacy officer is listed under Operator information. Send privacy questions and rights requests to ${email}.`,
          'For Korean privacy complaints or dispute resolution, use the official Privacy Portal or Personal Information Dispute Mediation Committee channels below.',
        ], links: [
          { label: 'Korean Privacy Portal', href: 'https://www.privacy.go.kr/' },
          { label: 'Personal Information Dispute Mediation Committee', href: 'https://www.kopico.go.kr/' },
        ] },
        { title: '13. Changes to this policy', paragraphs: [
          'We announce material changes to purposes, data, providers or rights with their effective date and obtain consent where necessary.',
          'September 26, 2026: restored detailed data, retention, international processing and rights information and updated accounts, cloud notes/attachments, Paddle payments, Google Ads measurement and actual deletion behavior.',
        ] },
      ],
    },
  }
}
