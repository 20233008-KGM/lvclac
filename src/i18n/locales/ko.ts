import type { Messages } from '../types'
import { boardPath } from '../../config/boards'
export const ko: Messages = {
  lang: 'ko',
  htmlLang: 'ko',
  siteTitle: '레버리지 계산기',
  siteDescription:
    '선물·레버리지 포지션의 청산가와 증거금 여유를 즉시 계산하는 무료 도구. 계좌 평가금액, 개시·유지증거금을 입력하세요.',
  appIntro:
    '선물·레버리지 포지션의 청산가와 증거금 여유를 즉시 계산합니다. 브로커 앱 표시값 중 아는 항목만 입력하세요.',
  loading: '불러오는 중...',
  login: '로그인',
  logout: '로그아웃',
  close: '닫기',
  langToggleLabel: '언어 선택',
  optional: '(선택)',
  fieldTooltipLabel: '용어 설명',
  input: '입력',
  result: '결과',
  long: '롱',
  short: '숏',
  position: '포지션',
  modeLabel: '모드',
  orderBlocked: '주문 불가',
  stepUp: '1 증가',
  stepDown: '1 감소',
  contractsUnit: '계약',
  modes: { evaluate: '평가', order: '주문' },
  sections: { instrument: '종목 스펙', margin: '증거금', account: '계좌' },
  scenarioPriceCommit: 'Enter로 시나리오 모드 진입',
  scenarioPriceClear: '시나리오 가격 삭제 및 적용 전 상태로 복원',
  scenarioApplyPnl: '손익 반영',
  draftSave: {
    label: '이 기기에 입력값 저장',
    hint: '활성화 시 입력값이 이 브라우저에만 저장되어 다음 방문 시 불러옵니다. 서버로 전송되지 않습니다. 비활성화 시 저장된 값이 삭제됩니다.',
    cleared: '저장된 데이터가 삭제되었습니다.',
    enableModalTitle: '입력값 저장 안내',
    enableModalBody: [
      '이용자가 「이 기기에 입력값 저장」을 켠 경우, 계산기에 입력한 값(계좌 평가금액, 증거금률, 계약 수 등)이 이용자 기기의 브라우저 저장소(localStorage)에 저장될 수 있습니다.',
      '이 정보는 편의를 위한 기능이며, 당사 서버로 전송·보관하지 않습니다.',
      '비활성화 시 해당 기기에 저장된 입력값은 삭제됩니다.',
      '다만 동일 기기를 다른 사람이 사용하는 경우, 악성 프로그램·브라우저 확장 프로그램, 또는 보안에 취약한 환경에서는 저장된 값이 노출될 수 있습니다. 당사는 이용자 기기 환경의 보안을 보증하지 않으며, 민감한 정보의 저장 여부는 이용자가 판단하여 선택해야 합니다.',
    ],
    enableConfirm: '동의하고 저장',
    skipModalLabel: '다시 이 창을 띄우지 않기',
    showGuideAgain: '입력값 저장 안내 다시 보기',
    clearedModalTitle: '저장 해제',
    confirm: '확인',
  },
  fields: {
    accountEquity: {
      label: '계좌 평가금액',
      hint: '예탁금에 포지션 미결제 손익을 더한 금액입니다. 증권사 HTS·MTS에 표시되는 「계좌 평가금액」과 같습니다.',
      placeholder: '10,000,000',
    },
    maintenanceMarginRate: {
      label: '유지증거금률',
      hint: '약정가치 대비 비율 (예: 0.247 = 24.7%)',
      placeholder: 'ex) 0.25',
    },
    maintenanceMargin: {
      label: '유지증거금 (직접)',
      hint: '앱 표시값 입력 시 비율 산출값보다 우선 적용',
      placeholder: '500,000',
    },
    entrustedMarginRate: {
      label: '개시증거금률 (위탁)',
      hint: '약정가치 대비 비율. 고정 금액은 직접 입력 사용',
      placeholder: 'ex) 0.35',
    },
    entrustedMargin: {
      label: '위탁증거금 (직접)',
      hint: '앱 표시값 입력 시 비율 산출값보다 우선 적용',
      placeholder: '12,000',
    },
    contracts: {
      label: '보유 계약수',
      hint: '현재 포지션 계약 수',
      placeholder: '2',
    },
    contractAmount: {
      label: '약정금액 (1계약)',
      hint: 'HTS·MTS 종목별 1계약 약정금액',
      placeholder: '250,000',
    },
    currentPrice: {
      label: '현재가',
      hint: '기준 시세',
      placeholder: '35,000',
    },
    scenarioPrice: {
      label: '시나리오 가격',
      hint: 'Enter(↵) 첫 입력은 시나리오 모드 진입, 모드 중 Enter는 현재가 반영·종료. 「손익 반영」도 동일. del 또는 Delete로 복원.',
      placeholder: '변동 가격',
    },
    tickSize: {
      label: '틱 사이즈',
      hint: '입력 시 현재가·시나리오 가격에 스테퍼가 나타납니다.',
      placeholder: '1',
    },
    contractMultiplier: {
      label: '계약 승수',
      hint: '약정금액 산출용 배율. 미입력 시 1로 간주',
      placeholder: '1',
    },
    orderContracts: {
      label: '추가 주문 계약수',
      hint: '매수·매도 추가 수량',
      placeholder: '+/-0',
    },
  },
  results: {
    sheetIndex: '지표',
    sheetBefore: '주문 전',
    sheetAfter: '주문 후',
    liquidationPrice: '청산가격',
    maxBuyableLong: '추가 매수 한도',
    maxBuyableShort: '추가 매도 한도',
    leverage: '레버리지',
    leverageRatio: '레버리지',
    leverageSub: '약정가치 ÷ 계좌 평가금액',
    maintenanceMargin: '유지증거금',
    contractNotional: '약정가치',
    entrustedMargin: '위탁증거금 (개시)',
    availableMargin: '가용증거금',
    availableMarginSub: '계좌 평가금액 − 위탁증거금',
    maintenanceExcess: '유지증거금 여유',
    maintenanceExcessSub: '계좌 평가금액 − 유지증거금',
    perContractEntrusted: '1계약당 위탁증거금',
    perContractMaintenance: '1계약당 유지증거금',
    toleranceLong: '청산까지 하락 여유(%)',
    toleranceShort: '청산까지 상승 여유(%)',
    toleranceDeltaLong: '청산까지 하락폭',
    toleranceDeltaShort: '청산까지 상승폭',
    beforeLiquidation: '주문 전 청산가',
    afterLiquidation: '주문 후 청산가',
    liquidationDelta: '청산가 변화',
    beforeTolerance: '주문 전',
    afterTolerance: '주문 후',
    afterMaintenance: '주문 후 유지증거금',
    afterEntrusted: '주문 후 위탁증거금',
    afterAvailable: '주문 후 가용증거금',
    beforeLeverage: '주문 전 레버리지',
    afterLeverage: '주문 후 레버리지',
  },
  leverageUnit: '배',
  calcMessages: {
    contracts_zero: '계약 수를 입력해 주세요.',
    multiplier_zero: '계약승수는 0이 될 수 없습니다.',
    order_contracts_zero: '주문 계약 수를 입력해 주세요.',
    maintenance_exceeds_equity:
      '유지증거금이 계좌 평가금액 이상입니다. 이미 청산 위험 구간입니다.',
    maintenance_rate_exceeds_entrusted: '유지증거금률이 개시증거금률보다 큽니다.',
    no_available_margin: '가용 증거금이 없습니다. (계좌 평가금액 − 위탁증거금)',
    cannot_calc_per_contract_entrusted: '1계약당 위탁증거금을 계산할 수 없습니다.',
    order_exceeds_max_buyable:
      '주문 계약 수가 가용 증거금 기준 추가 매수 한도를 초과합니다. 현재 계좌 상태로는 체결할 수 없습니다.',
    order_exceeds_max_sellable:
      '주문 계약 수가 가용 증거금 기준 추가 매도 한도를 초과합니다. 현재 계좌 상태로는 체결할 수 없습니다.',
    order_exceeds_position: '보유 계약 수보다 많이 매도할 수 없습니다.',
    at_risk: '청산 위험',
  },
  auth: {
    title: '레버리지 계산기',
    modalTitle: '로그인',
    subtitle: '로그인하면 입력값이 자동으로 저장됩니다.',
    tabLogin: '로그인',
    tabRegister: '회원가입',
    username: '아이디',
    password: '비밀번호',
    submitLogin: '로그인',
    submitRegister: '회원가입',
    usernameTaken: '이미 사용 중인 아이디입니다.',
    invalidCredentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  },
  legal: {
    bannerShort:
      '본 도구는 참고용 시뮬레이션이며 투자 자문이 아닙니다. 최종 판단과 책임은 이용자에게 있습니다.',
    resultMismatchWarning: '표시 결과와 실제 청산가·마진콜 시점이 일치하지 않을 수 있습니다.',
    contentNoticeLabel: '투자 위험 및 계산 한계 안내',
    modalTitle: '서비스 이용 안내',
    modalIntro:
      '레버리지 계산기를 이용하기 전에 아래 내용을 확인해 주세요. 금융·파생상품 거래에는 원금 초과 손실 위험이 있습니다.',
    sections: [
      {
        title: '정보 제공 목적',
        body: '본 서비스는 선물·레버리지 포지션의 청산가·증거금을 추정하는 참고용 계산 도구입니다. 투자 권유, 종목 추천, 법률·세무 자문이 아닙니다.',
      },
      {
        title: '계산의 한계',
        body: '증권사·거래소마다 청산 규정, 반올림, 수수료, 유지증거금 산식이 다를 수 있습니다. 본 서비스는 계산의 무결성·정확성을 보증하지 않습니다.',
      },
      {
        title: '이용자 책임',
        body: '모든 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다. 거래 전 반드시 이용 중인 증권사·거래소의 공식 수치와 약관을 확인하세요.',
      },
      {
        title: '면책',
        body: '운영자는 본 서비스 이용 또는 계산 결과 신뢰로 발생한 손실·손해에 대해 어떠한 책임도 지지 않습니다.',
      },
    ],
    acknowledge: '위 내용을 확인했으며, 참고용으로만 사용하겠습니다.',
    confirmButton: '동의하고 시작',
    dismissButton: '확인',
    skipModalLabel: '다시 이 창을 띄우지 않기',
    showModalAgain: '서비스 이용 안내 다시 보기',
    termsLink: '이용약관',
    privacyLink: '개인정보 처리방침',
    termsTitle: '이용약관',
    privacyTitle: '개인정보 처리방침',
    back: '돌아가기',
    termsBody: [
      '제1조 (목적) 본 약관은 Farfield Software(이하 「회사」)가 제공하는 레버리지 계산기(이하 「서비스」)의 이용 조건을 정합니다.',
      '제2조 (서비스 성격) 서비스는 청산가·증거금을 추정하는 무료 웹 도구이며, 금융투자업·투자자문업을 영위하지 않습니다.',
      '제3조 (이용자 의무) 이용자는 자신의 거래 환경에 맞는 값을 입력하고, 결과를 참고용으로만 활용해야 합니다.',
      '제4조 (입력값 저장) 계산기 입력값은 이용자가 「이 기기에 입력값 저장」을 켠 경우에만 해당 기기의 브라우저 localStorage에 저장됩니다. 서버로 전송되지 않으며, 끄면 저장된 값이 삭제됩니다.',
      '제5조 (광고) 서비스는 Google AdSense 등 제3자 광고를 게재할 수 있으며, 해당 사업자의 정책·쿠키가 적용될 수 있습니다.',
      '제6조 (면책) 운영자는 천재지변, 시스템 장애, 제3자 서비스 변경, 계산식과 실제 거래소 규정의 차이로 인한 손해에 대해 고의·중과실이 없는 한 책임을 지지 않습니다.',
      '제7조 (약관 변경) 약관은 서비스 내 공지 후 변경될 수 있으며, 변경 후 계속 이용 시 동의한 것으로 봅니다.',
    ],
    privacyBody: [
      '1. 수집 항목: 계산기 입력값(저장 토글 켠 경우에만 기기 localStorage); (자동) GA4·AdSense 이용 시 쿠키·접속 로그',
      '2. 이용 목적: 입력값 저장·복원, 서비스 개선, 광고·통계',
      '3. 보관: 입력값은 저장을 켠 경우에만 이용자 기기 브라우저에 보관되며, 서버로 전송하지 않습니다. 토글을 끄면 삭제됩니다.',
      '4. 제3자 제공: Google Analytics·AdSense 등 설정 시 해당 사업자로 전송될 수 있음',
      '5. 이용자 권리: 저장 토글을 끄거나 브라우저 데이터를 삭제하여 저장된 입력값을 제거할 수 있습니다.',
      '6. 문의: Farfield Software — 서비스 footer에 표시된 연락처로 요청',
    ],
  },
  formulas: {
    backToCalculator: '← 계산기로 돌아가기',
    title: '수식 정의',
    description:
      '레버리지 계산기가 사용하는 수식입니다. 브로커·거래소 규정과 다를 수 있으므로 참고용으로만 활용하세요.',
    disclaimer:
      '직접 입력한 유지·위탁증거금이 있으면 비율 산출값보다 우선합니다. 청산 시점·반올림은 증권사마다 다를 수 있습니다.',
    symbolTitle: '용어',
    symbols: [
      { symbol: '계좌평가금액', meaning: '입력한 계좌 평가금액 (현재 자산)' },
      { symbol: '현재가', meaning: '입력한 현재 시세' },
      { symbol: '변동 후 가격', meaning: '가격이 움직인 뒤의 가격 (청산가를 구할 때 미지수)' },
      { symbol: '보유 계약수', meaning: '현재 보유 중인 계약 수' },
      { symbol: '계약승수', meaning: '1계약의 배율 (미입력 시 1)' },
      {
        symbol: '총 민감도',
        meaning: '보유 계약수 × 계약승수 (가격 1단위 움직일 때 손익 크기)',
      },
      { symbol: '유지증거금률', meaning: '약정가치 대비 유지증거금 비율 (소수, 예: 0.247)' },
      { symbol: '위탁증거금률', meaning: '약정가치 대비 개시·위탁증거금 비율' },
    ],
    sections: [
      {
        title: '약정가치·증거금',
        intro:
          '약정금액·계약승수는 명목가치 산출에 씁니다. 아래 「총 민감도」와는 별개입니다.',
        entries: [
          {
            name: '약정가치 (포지션 명목)',
            expression: '약정가치 = 보유 계약수 × 약정금액(1계약) × 계약승수',
          },
          {
            name: '유지증거금 (비율 입력)',
            expression: '유지증거금 = 약정가치 × 유지증거금률',
            description: '증권사 화면에서 직접 입력한 금액이 있으면 그 값을 우선합니다.',
          },
          {
            name: '위탁증거금 (비율 입력)',
            expression: '위탁증거금 = 약정가치 × 위탁증거금률',
          },
          {
            name: '가용증거금',
            expression: '가용증거금 = 계좌평가금액 − 위탁증거금',
          },
          {
            name: '1계약당 위탁·유지증거금',
            expression: '1계약당 = 포지션 증거금 ÷ 보유 계약수',
          },
        ],
      },
      {
        title: '청산가 — 공통',
        intro:
          '청산은 「변동 후 계좌 자산 = 변동 후 유지증거금」이 되는 가격에서 발생한다고 가정합니다.',
        entries: [
          {
            name: '총 민감도',
            expression: '총 민감도 = 보유 계약수 × 계약승수',
            description:
              '코스피200 예: 보유 58계약, 승수 10 → 총 민감도 580. 승수 1이면 보유 계약수와 같습니다.',
          },
          {
            name: '현재가에서 유지증거금',
            expression: '현재가 기준 유지증거금 = 현재가 × 총 민감도 × 유지증거금률',
            description: '직접 입력 시 증권사 표시 유지증거금(계약 수에 비례 조정).',
          },
          {
            name: '변동 후 가격에서 유지증거금',
            expression:
              '해당 가격 기준 유지증거금 = 현재가 기준 유지증거금 × (변동 후 가격 ÷ 현재가)',
          },
        ],
      },
      {
        title: '청산가 — 롱',
        entries: [
          {
            name: '변동 후 계좌 자산',
            expression:
              '변동 후 계좌 자산 = 계좌평가금액 + (변동 후 가격 − 현재가) × 총 민감도',
          },
          {
            name: '청산 조건',
            expression: '변동 후 계좌 자산 = 해당 가격 기준 유지증거금',
          },
          {
            name: '청산가',
            expression:
              '청산가 = (현재가×총 민감도 − 계좌평가금액) ÷ (총 민감도 − 현재가 기준 유지증거금÷현재가)',
          },
          {
            name: '요약 (유지증거금률 기준)',
            expression:
              '청산가 = (현재가×총 민감도 − 계좌평가금액) ÷ (총 민감도×(1 − 유지증거금률))',
            description: '「현재가 기준 유지증거금 = 현재가×총 민감도×유지증거금률」일 때와 같습니다.',
          },
        ],
      },
      {
        title: '청산가 — 숏',
        entries: [
          {
            name: '변동 후 계좌 자산',
            expression:
              '변동 후 계좌 자산 = 계좌평가금액 − (변동 후 가격 − 현재가) × 총 민감도',
          },
          {
            name: '청산 조건',
            expression: '변동 후 계좌 자산 = 해당 가격 기준 유지증거금',
          },
          {
            name: '청산가',
            expression:
              '청산가 = (계좌평가금액 + 현재가×총 민감도) ÷ (총 민감도 + 현재가 기준 유지증거금÷현재가)',
          },
          {
            name: '요약 (유지증거금률 기준)',
            expression:
              '청산가 = (계좌평가금액 + 현재가×총 민감도) ÷ (총 민감도×(1 + 유지증거금률))',
          },
        ],
        notes: [
          '같은 계좌평가금액·총 민감도에서 숏 상승 여유(%) < 롱 하락 여유(%) — 대칭이 아닙니다.',
        ],
      },
      {
        title: '청산 여유·레버리지·추가 주문',
        entries: [
          {
            name: '롱 — 청산까지 하락 여유(%)',
            expression: '((현재가 − 청산가) ÷ 현재가) × 100',
          },
          {
            name: '숏 — 청산까지 상승 여유(%)',
            expression: '((청산가 − 현재가) ÷ 현재가) × 100',
          },
          {
            name: '청산까지 가격 변동폭',
            expression: '롱: 현재가 − 청산가  /  숏: 청산가 − 현재가',
          },
          {
            name: '레버리지',
            expression: '레버리지 = 약정가치 ÷ 계좌평가금액',
          },
          {
            name: '추가 매수·매도 한도',
            expression:
              '내림((계좌평가금액 − 위탁증거금) ÷ 1계약당 위탁증거금)',
            description: '롱은 추가 매수, 숏은 추가 매도(신규 숏) 한도. 증거금 기준은 동일합니다.',
          },
        ],
      },
    ],
  },
  footer: {
    navAriaLabel: '사이트 하단 메뉴',
    disclaimer:
      '투자에는 원금 손실의 위험이 따르며, 손실액이 투입 원금을 초과할 수 있습니다. 투자에 관한 판단과 그에 따른 책임은 전적으로 이용자 본인에게 있습니다.',
    tagline: '선물 거래 보조용 증거금, 마진콜 계산기',
    copyright: '© 2026 Farfield Software. All rights reserved.',
    soon: '준비 중',
    columns: [
      {
        title: '제품',
        links: [
          { label: '레버리지 계산기', href: '/' },
          { label: 'Pro', soon: true },
          { label: '업데이트 노트', soon: true },
        ],
      },
      {
        title: '회사',
        links: [
          { label: 'Farfield Software 소개', soon: true },
          { label: '문의', href: 'mailto:contact@farfield.software' },
          { label: '채용', soon: true },
        ],
      },
      {
        title: '리소스',
        links: [
          { label: '이용 가이드', soon: true },
          { label: 'API 문서', soon: true },
          { label: '상태 페이지', soon: true },
        ],
      },
      {
        title: '의견 보내기',
        links: [
          { label: '개발 의뢰', href: boardPath('dev-request') },
          { label: '버그 제보', href: boardPath('bugs') },
          { label: '개선 제안', href: boardPath('suggestions') },
        ],
      },
    ],
  },
  boards: {
    backToCalculator: '← 계산기로 돌아가기',
    storageNotice:
      '각 게시판은 용도별로 분리되어 있습니다. 현재는 이 기기 브라우저에만 글이 저장되며, 서버 연동 후 다른 이용자와 공유됩니다.',
    writePost: '글쓰기',
    postList: '게시글',
    postTitle: '제목',
    postTitlePlaceholder: '요청·버그·개선 내용을 한 줄로 적어 주세요',
    postBody: '내용',
    postBodyPlaceholder: '상세 내용, 재현 방법, 기대 동작 등을 적어 주세요',
    postAuthor: '작성자',
    postAuthorPlaceholder: '닉네임 (미입력 시 익명)',
    submit: '등록',
    empty: '아직 등록된 글이 없습니다. 첫 글을 남겨 주세요.',
    anonymous: '익명',
    items: {
      'dev-request': {
        title: '개발 의뢰',
        footerLabel: '개발 의뢰',
        description:
          '원하시는 소프트웨어·기능 개발 의뢰를 남겨 주세요. Farfield Software가 검토합니다.',
      },
      bugs: {
        title: '버그 제보',
        footerLabel: '버그 제보',
        description:
          '화면·입력 버그, 계산 결과 불일치, 수식 논리 오류 등을 알려 주세요.',
      },
      suggestions: {
        title: '개선 제안',
        footerLabel: '개선 제안',
        description:
          'UI, 기능, 사용성 등 개선 아이디어를 자유롭게 제안해 주세요.',
      },
    },
  },
  ads: {
    leftTop: '좌측 상단 광고',
    leftBottom: '좌측 하단 광고',
    top: '상단 배너 광고',
    bottom: '하단 배너 광고',
    rightTop: '우측 상단 광고',
    rightBottom: '우측 하단 광고',
    generic: '광고',
  },
}
