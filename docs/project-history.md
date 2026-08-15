# lvclac 프로젝트 히스토리 (근황 아카이브)

상태: **참고용 아카이브**. [`lvclac-project-memory.md`](C:/Users/rlarb/Documents/lvclac-project-memory.md)의 `## 최근 근황`에서 5개 상한을 넘겨 밀려난 오래된 세션 로그를 시간 역순(최신이 위)으로 보관하는 곳.

- 여기는 `docs/legacy/`(아주 오래된 문서 격리소)와 **다르다**. 현역 프로젝트 기록의 연장선이며, 필요하면 언제든 꺼내 읽는다.
- 이동 규칙: `C:/Users/rlarb/Documents/lvclac-project-memory.md`의 `## 최근 근황`이 6개가 되면, **가장 오래된 1개를 통째로 잘라 이 파일 맨 위**(아래 구분선 바로 밑)에 붙인다. 요약하지 말고 원문 그대로 옮긴다.

=================================================================

<!-- 밀려난 근황 로그를 이 아래에 최신순으로 쌓는다. -->

**2026-08-12 — 업데이트 제목 목록·Markdown 상세 글 구조 구현**
- `maintenance/public`의 공개 업데이트를 `content/updates/*.md` 한영 파일 쌍으로 관리한다. frontmatter는 `id`·`publishedAt`·`locale`·`type`·`title`·검색용 `description`을 검증하고 본문 Markdown 줄바꿈을 보존한다. 목록은 날짜·구분·제목만 표시하며 제목 클릭 시 `/updates/:id` 또는 `/en/updates/:id`의 상세 글로 이동한다. React Markdown으로 본문을 렌더링하고, 빌드가 각 글의 한영 상세 HTML·canonical·hreflang·사이트맵 URL을 자동 생성한다. 첫 글 `2026-08-12-beta-experience`는 필드 안내·리사이저·공식 문의 개선을 여러 섹션과 목록이 있는 상세 글로 확장했다.
- 검증: 집중 **34/34**·전체 Vitest **800/800**, 변경 파일 ESLint, TypeScript 포함 production build 통과. 빌드 산출물의 한영 상세 HTML·canonical·hreflang·사이트맵을 확인했고 로컬 브라우저에서 목록→상세 클릭, 한영 본문·메타데이터·가로 넘침 0·콘솔 경고/오류 0을 확인했다. 전체 ESLint는 기존 오류 31건/경고 4건으로 실패한다. 커밋·push·Production 배포·운영 화면·390px 모바일 실기기 검증은 미수행이며 다른 미커밋 변경을 보존했다. Notion [Task](https://app.notion.com/p/3ba26e6d586f8105b463c643634377fb)·[Work Log](https://app.notion.com/p/3ba26e6d586f814a959ecd6674538248) 갱신 완료.

**2026-08-12 — Paddle 심사용 공개 요금제·법률 문구 실기능 정합화**
- `maintenance/public`에서 현재 공개 기능을 무료 브라우저 계산기·로컬 숫자세트 1개로 명확히 하고 로그인·클라우드·결제·Pro는 향후 공개 기능으로 분리했다. Pro 월 $5·연 $48과 USD, 자동 갱신, Paddle 승인 후 판매 개시를 표시하고 Paddle의 온라인 재판매자·Merchant of Record 지위, Buyer Terms·Refund Policy·paddle.net 직접 링크, 원칙적 비환불과 취소/환불 차이를 한영 약관·환불 정책에 반영했다. 개인정보처리방침은 현재 Vercel·Google 처리만 본문에 두고 국외 이전의 근거·항목·국가·방법·보유기간·연락처, 파기 절차, 향후 Supabase·Paddle 기능 공개 전 재고지 의무를 보강했다. 영어 페이지의 법인명·대표자·주소·개인정보 보호책임자도 영문 표시값으로 통일했다.
- 검증: 변경 파일 ESLint, TypeScript 포함 production build, 전체 Vitest **787/787**, diff check 통과. 로컬 1440×1000 요금제와 390×844 개인정보 페이지에서 2개 카드·결제 준비 중·한영 법인정보·가로 넘침 0을 확인했다. 로컬 Vercel Analytics 스크립트 404 외 앱 오류는 없었다. Production 배포·Paddle 재심사 결과·환불 완료 adjustment 웹훅에 따른 Pro 권한 회수는 미검증이며, 동시 작업 중인 요금제 UI/CSS 변경을 보존해 커밋은 하지 않았다. Notion [Work Log](https://app.notion.com/p/3ba26e6d586f816489e7f6c4e0bed5e5) 기록 완료.

**2026-08-12 — 공개 문의 페이지와 이메일 UX 정리**
- `maintenance/public`의 푸터 `문의하기`를 즉시 `mailto:` 실행하던 방식에서 `/contact` 내부 페이지로 바꿨다. 문의 카드는 공통 메인 콘텐츠 그리드 폭 100%를 유지하며, 그라데이션·광선·중첩 카드와 과한 그림자를 제거해 단색 표면과 얇은 구분선 중심으로 정돈했다. `contact@farfield.software` 주소 복사는 중립적인 겹친 사각형 아이콘 버튼으로 제공하고 성공 시 체크 아이콘과 `복사됨` 상태를 표시한다. 외부 앱 실행은 밑줄형 `이메일 앱 열기` 보조 링크로 명시하고, 영업 관련 제안·버그 제보·기타 문의는 데스크톱 01~03 편집형 열과 모바일 구분선 목록으로 구성한다. 공개판 DB·로그인·이미지/파일 첨부는 추가하지 않았다.
- 검증: 전체 Vitest **782/782**, TypeScript 포함 production build, 변경 파일 ESLint, diff check 통과. 저장소 전체 ESLint는 기존 31개 오류와 4개 경고로 미통과다. 로컬 브라우저 1280px에서 카드/안내/메인 폭 **822px**, 390×844에서 **321px**로 일치하고 이메일 한 줄 표시, 가로 넘침 0, 복사 완료 상태, 콘솔 오류 0을 확인했다. 커밋 **`62fa872`**, **`2bdd2aa`**, **`f8b4b4f`**, 시각 체계 단순화 **`0c72b5a`** 완료. push·Vercel 배포·실제 `liqguard.com/contact`·신규 메일 실수신은 미수행이다. Notion [Task](https://app.notion.com/p/39a26e6d586f818a94cddf5a039feec3)·[초기 Work Log](https://app.notion.com/p/3ba26e6d586f81d7a95bdcbaf9bff557)·[디자인 개선 Work Log](https://app.notion.com/p/3ba26e6d586f81788902ec6fb8d02167) 기록 완료.

**2026-08-03 — 개발·공개 첫방문 온보딩 재구성 및 운영 배포**
- `dev` **9aa95bf**에서 첫방문 흐름을 환영→지역→종목·증거금→거래 상황→맞춤 사용법→입력 저장→시작 전 확인의 7단계로 분리했다. `maintenance/public` **71b376b**는 지역·상품·로그인·클라우드를 제외한 환영→증거금 방식→거래 상황→맞춤 사용법→로컬 저장→시작 전 확인의 6단계로 같은 2패널 구조를 다시 연결했다. 두 흐름 모두 첫 화면을 선택 없는 제품 인사로 만들고, 상황 선택 뒤 별도 다음 화면에서 맞춤 3개 안내와 가이드·수식 링크를 보여준다.
- 공개판은 실제 로컬 저장 성공 뒤에만 다음 단계로 이동하고 실패 시 같은 화면에 오류를 남기며, 저장 안 함은 저장 중지와 온보딩 완료를 분리한다. 기존 면책·공개 저장 기록이 있는 방문자는 새 흐름을 건너뛰고, 레거시 서비스 안내·저장 선택과 푸터 재열기는 중간 이탈 호환 경로로 유지한다. `WelcomeFlow`·레거시 2종을 `firstVisitGateActive`에 함께 묶어 개인정보/CMP가 겹치지 않게 했다.
- 검증: dev 전체 Vitest **833/833**, public **757/757**, 공개 지역·CMP Playwright **7/7**, 양쪽 production build·변경 파일 ESLint·diff check 통과. 데스크톱·375px 로컬 브라우저와 운영에서 진행 레일·필수 게이트·상황/사용법 분리·공개 신규 완료 후 재로드 재노출 없음·콘솔 경고/오류 0을 확인했다. Vercel Production **dpl_2mWu2exHpQKgCLaxdsp4nUG5ZpbA**(`devpilgrm.liqguard.com`)와 **dpl_25VLn9gkNjHn66XmYxRmJ2sg6cGC**(`liqguard.com`)가 `READY`다. 실제 저장소 장애 주입과 규제 지역 실제 IP Google CMP는 남았다. Notion 완료 [Task LV-106](https://app.notion.com/p/3b126e6d586f8149a761e9c5d8d7ecdb)·[QA](https://app.notion.com/p/3b126e6d586f8129b8cff525f6687c78)·[Work Log](https://app.notion.com/p/3b126e6d586f813cb4d5f5a47fd66342)·[Release](https://app.notion.com/p/3b126e6d586f816b9909ebad5ba61757)와 2026-08-07 Calendar 공개 일정 갱신 완료.

**2026-08-02 — 인증 이메일 카드·배경 구분 강화 및 Supabase 반영**
- `dev` **a0b701e**에서 Gmail이 사용하는 라이트 인라인 페이지/카드 대비가 1.047:1에 불과해 경계가 붙어 보이던 원인을 수정했다. 라이트 페이지 `#e2e8f0`·카드 `#fdfdfe`·테두리 `#cbd5e1`, 다크 테두리 `#3a4354`와 보조 그림자를 적용하고 페이지/카드 1.18:1·카드/테두리 1.4:1 미만이면 생성을 중단하는 가드를 추가했다. 가입 확인·복구·매직 링크·이메일 변경 4종과 한영 프리뷰 8종을 재생성했다.
- 검증: 라이트 페이지/카드 **1.213:1**·카드/테두리 **1.461:1**, 다크 페이지/카드 **1.208:1**·카드/테두리 **1.583:1**. 변경 파일 ESLint, 전체 Vitest **804/804**, production build, diff check를 통과했고 Supabase Management API에서 원격 4종 HTML과 로컬 생성물 일치·SMTP 활성·Site URL `https://devpilgrm.liqguard.com` 유지를 확인했다.
- 원격 Supabase 템플릿 업로드 완료. `farfieldsoftware+liqguard-auth-20260802122630@gmail.com`으로 실제 회원가입 메일을 보내 2026-08-02 12:26 KST Gmail 수신, 발신자·제목·한국어 본문·카드 경계·인증 버튼을 확인했고 버튼 실행 뒤 개발 도메인 리다이렉트·URL 토큰 제거·`LiqGuard Email QA` 세션 생성까지 통과했다. 인증샷은 `C:/Users/rlarb/.codex/visualizations/2026/08/02/019fc072-5bd5-7752-8870-32610996dfda/liqguard-auth-email-gmail-20260802-1226.png`에 보관했다. iOS·Android 메일 앱 렌더링은 미검증이고 테스트 계정은 삭제하지 않았다. Notion 완료 [Task LV-102](https://app.notion.com/p/3b026e6d586f819487d1f0f478a80e0c)·[Work Log](https://app.notion.com/p/3b026e6d586f81069dd9c2c426ddfcaa)·Release Notes·QA / Test Plan 기록 완료.

**2026-08-02 — Paddle `/billing` Free 화면 플래시 수정**
- `dev` **15e99bf**에서 구독 상태 조회 전 기본 `isPro=false`를 실제 Free 상태로 단정하던 분기를 `loading`으로 분리했다. Pro 계정의 `/billing` 직접 진입·새로고침 중에는 업그레이드 화면 대신 중립 계정 로더를 표시하고, 결제 성공 화면은 구독 새로고침 전에도 우선 표시한다.
- 검증: 상태 분기 집중 **3/3**·전체 Vitest **804/804**, 변경 파일 ESLint, TypeScript 포함 production build, diff check 통과. 처음 빌드와 병렬로 돌린 XLSX 테스트 1개가 5초 제한에 걸렸지만 단독 및 전체 순차 재실행에서 통과했다. [Task LV-101](https://app.notion.com/p/3af26e6d586f81daaabbc6fcaee0f5bf)과 [Work Log](https://app.notion.com/p/3b026e6d586f815fa24bd072026232be)를 갱신했다. push·배포·운영 도메인 브라우저 QA는 수행하지 않았고, 같은 Task의 온보딩 재노출·해지 예약 표시는 후속으로 남아 있다.

**2026-07-23 — 숫자세트 ‘매일 기록’ 체크 행 UX**
- `dev` 마이페이지 클라우드 숫자세트를 `[매일 기록 체크박스] [이름] [상세·삭제]` 한 줄 열 구조로 바꾸고 열 라벨은 그룹 위에 한 번만 표시한다. 체크된 행은 옅은 파랑으로 강조하며 체크박스만 기존 `onSetAutoSnapshot(storageMode, setId, enabled)` 경로를 호출한다. Pro는 모든 행을 선택할 수 있고 무료 사용자는 신규 활성화 열을 숨기되 이미 활성인 세트는 해제할 수 있다. 로컬 세트·DB·cron·`autoSnapshotEnabled` 계약은 그대로다.
- 검증: 관련 **9/9**·전체 Vitest **748/748**, TypeScript, production build, 변경 파일 ESLint(기존 `MyPage.tsx` effect 규칙 제외), diff check 통과. UI 키트 한영 1920·1023·428·390px에서 긴 이름·상세/롤오버·Tab/Space, 32px 클릭 영역, 행 내부 가로 오버플로 0을 확인했다. 로그인된 Pro 실제 저장 왕복은 미검증이다.
- 적용 커밋 `dev` **dd514ca**, 테스트 계약 보강 **81bb4ff**. Notion 완료 [Task LV-80](https://app.notion.com/p/3a526e6d586f8164bd4ad2f1e7f23b3e)와 [Work Log](https://app.notion.com/p/3a526e6d586f8129be9ad2e923a26a69) 기록 완료. 푸시·배포는 수행하지 않았고 병행 중인 로그인 로딩·클라우드 활성 세트 선호도 변경은 커밋에서 제외했다.

**2026-07-21 — 주문기록·계좌 스냅샷 CSV/Excel 내보내기**
- `dev` `/records`에 모든 로그인 사용자가 구독과 무관하게 쓰는 내보내기 모달을 추가했다. 주문·스냅샷, CSV·XLSX, 전체·미분류·특정 슬롯, 시작/종료일, 한국어·영어 열 제목을 선택하며 성공 후 모달을 유지한다. 화면 20건과 별개로 Supabase RLS 아래 전체 일치를 500건씩 안정 정렬 조회한다.
- CSV는 UTF-8 BOM·RFC 4180·빈 값·수식 삽입 방지를 적용하고, XLSX는 숫자·날짜·불리언 타입, 열 너비, 1행 고정, 전체 범위 필터를 보존한다. `write-excel-file`은 클릭 시 별도 청크로 로드한다. 검증: 전체 Vitest **700/700**, 변경 파일 ESLint, production build, diff check, npm audit 0건 통과. 실제 로그인 장부에서 주문 **108행×54열** 한국어 CSV/XLSX와 스냅샷 **112행×33열** 영문 XLSX를 내려받아 BOM·헤더·타입·필터·고정행을 확인했고 1920×855·390×844 모달을 실측했다. 테스트 PC에 Microsoft Excel이 없고 번들 스프레드시트 렌더러도 로드되지 않아 Excel GUI 복구 경고 확인만 미수행이다.
- 적용 커밋 `dev` **2fd1aff**. Notion [Task LV-71](https://app.notion.com/p/3a426e6d586f81e0a617ddbd7a3e2061), [백로그](https://app.notion.com/p/39d26e6d586f81a9abdbf90c3b89f6dd), [Work Log](https://app.notion.com/p/3a426e6d586f81a39206da56bd5fe056)을 완료 처리했다. 푸시·배포는 수행하지 않았다.

**2026-07-21 — maintenance 계산기 툴팁 개선 7종을 dev에 이식**
- `maintenance/public`의 최종 문구를 수동 이식해 유지·개시증거금률의 보유/신규 기준과 청산 위험, 약정가격의 평균 진입가격·거래 단위, 세팅 전후 공통 현재가 갱신 안내, 틱 사이즈의 현재가·주문가격, 영문 `Contract multiplier`와 나스닥→KOSPI200→원유 예시, 롱·숏 추가 주문 부호를 `dev`에 반영했다. 공개판 전용 모달·가이드·수식·저장 동작은 가져오지 않았고 `rollPnlOnChange={setupComplete}` 계약은 유지했다.
- 검증: 집중 **16/16**·전체 Vitest **675/675**, 변경 파일 ESLint, 툴팁 격리 production build, diff check 통과. 병행 중이던 기록 내보내기가 별도 커밋으로 완성된 뒤 현재 `dev` 전체 production build도 재실행해 통과했다. 인앱 브라우저 한영 1280×720·390×844에서 키보드 툴팁의 줄바꿈·가로 넘침 0과 콘솔 오류 0을 확인했다. 세팅 후 현재가 35,000→35,100에서 평가금 10,000,000→10,004,000 반영 및 `Ctrl+Z` 복원을 확인했다. 전체 ESLint만 기존 `.recovery`·React 규칙 오류로 실패했다.
- 적용 커밋 `dev` **6e04806**. 원본 추적 커밋은 `f063742`·`267614d`·`f9544b1`·`5642dcc`·`cd6db28`·`a05d9ea`·`161d9a0`·`d3a2758`·`a01f6b5`이며, 병행 중인 export 변경은 스테이징하지 않았다. Notion 완료 [Task](https://app.notion.com/p/3a526e6d586f815db326d6664c3764a8)와 [Work Log](https://app.notion.com/p/3a526e6d586f81908418e9cb0c294c99) 기록 완료. 푸시·배포는 수행하지 않았다.

**2026-07-20 — 서비스 안내 결과 불일치 경고의 중립·간격 정리**
- 첫 방문 서비스 안내 모달의 결과 불일치 경고에서 노란 채움과 상자 테두리를 제거하고, 원형 느낌표를 본문과 같은 회색으로 중립화했다. 아이콘 간격·경고 위쪽 간격·서비스 모달 본문 하단은 8px, 경고 내부 세로 패딩은 4px로 줄여 앞 구분선→텍스트와 텍스트→아래 구분선이 각각 12px이 되게 맞췄다. 원형 아이콘 외곽은 본문 글자와 같은 12×12px다. 문장의 600 굵기·밑줄·2px 간격과 문구·모달 동작은 유지하고 CSS 회귀 테스트를 최종 계약에 맞게 보완했다.
- 검증: 전용 **6/6**·전체 Vitest **719/719**, 변경 테스트 ESLint, production build, diff check 통과. 인앱 브라우저 한국어 1280×720·390×844에서 실제 위·아래 간격 각 12px, 아이콘 12×12px, 배경·테두리 투명, 느낌표·본문색 일치, 데스크톱 경고 높이 약 44.6→26.6px, 모바일 첫 줄 정렬, 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **b30a8f6**, **b6de744**, **fa18f87**, **6a06df6**. Notion [Task LV-48](https://app.notion.com/p/3a126e6d586f81f7a91ddf623ab3b1b8)와 [Work Log](https://app.notion.com/p/3a326e6d586f813880a9c32b5d73849a) 기록 완료. 운영 배포·푸시는 수행하지 않았다.

**2026-07-19 — 문서형 페이지와 푸터의 좌우 폭 정렬**
- 공용 문서 셸 안에서 데스크톱 푸터에만 남아 있던 좌우 10px 인셋을 제거해 920px 문서 카드와 푸터 바깥선을 일치시켰다. 계산기 화면의 푸터 인셋과 푸터 내부 패널 여백은 유지하고 CSS 회귀 테스트를 추가했다.
- 검증: 전용 **5/5**·전체 Vitest **699/699**, 변경 테스트 파일 ESLint, production build 통과. 인앱 브라우저 1280×900에서 문서·푸터 `left 180 / right 1100 / width 920px`, 390×844에서 `left 10 / right 380 / width 370px`, 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **7ade5e9**. Notion 완료 [Task LV-60](https://app.notion.com/p/3a126e6d586f81858ae2d1559b2991d6)와 [Work Log](https://app.notion.com/p/3a126e6d586f814dae17c68a027f8b3d) 기록 완료. 운영 배포와 `dev` 전파는 수행하지 않았다.

**2026-07-19 — 푸터 정보구조 재배치와 회사 소개 페이지 추가**
- 푸터의 수식 정의를 `dev`와 같은 결과 패널 오른쪽 위로 옮기고 Product를 `서비스 소개 → 사용 가이드 → 업데이트`, Company를 `회사 소개 → 문의하기`로 재배치했다. 기존 `/about`은 서비스 소개로 유지하고, 상단 5개 문서 내비게이션에 넣지 않는 광고 없는 `/company`를 추가했다.
- `/company`는 Farfield Software 소개·운영 원칙·문의와 `publicFooterOperatorDetails()`의 회사정보 6개를 한영으로 표시한다. 검증: 관련 **27/27**·전체 Vitest **698/698**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 1280×900·390×844 한영에서 결과 링크 이동, 데스크톱 3×2·모바일 1열 회사정보, 푸터 순서, 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **e66a6d2**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f81aeb779d8f6b92a3c40)와 [Work Log](https://app.notion.com/p/3a126e6d586f81b9b169d1b1b227171f) 기록 완료. 실제 법인정보 교체와 운영 배포는 수행하지 않았다.

**2026-07-18 — 현재가 통합 툴팁을 실제 갱신 흐름에 맞게 교정**
- 세팅 전·후 현재가 안내를 하나의 한영 툴팁으로 통합해 계좌 평가금액과 같은 시점 기준, 세팅 후 가격 변동 손익의 평가금액 자동 반영, 직접 입력·▲▼·Ctrl+Z 확정/취소 방법을 함께 설명한다. 현재 화면에 없는 시나리오 가격 문구는 제거했으며 `rollPnlOnChange={setupComplete}`를 유지해 계산 동작은 바꾸지 않았다.
- 검증: 관련 **46/46**·전체 Vitest **687/687**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 한영 1280×720·1280×900·390×844에서 세팅 전후 동일 문구, 직접 입력 손익 반영·스테퍼 즉시 반영·Ctrl+Z 복원, 툴팁 잘림·가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **a01f6b5**. Notion 완료 [Task LV-57](https://app.notion.com/p/3a126e6d586f814db9b9d388f65abe80)와 [Work Log](https://app.notion.com/p/3a126e6d586f81719bb4fe9a85a2d662) 기록 완료. `dev` 전파와 운영 배포는 수행하지 않았다.

**2026-07-18 — 쿠키 설정 모달 닫기 아이콘 렌더링 수정**
- 공용 `TrustModalFrame` 닫기 X를 브라우저 정적 위치 계산에 의존하던 CSS 가상 요소 두 선에서 좌표가 명시된 16×16 SVG 두 경로로 교체했다. 접근성 라벨·32×32 클릭 영역·색상·닫기 동작은 유지하고 SVG 구조 회귀 테스트를 추가했다.
- 검증: 전용 **5/5**·전체 Vitest **687/687**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 실제 개인정보·쿠키 설정 모달에서 SVG 16×16 중앙 정렬·두 경로·닫기 동작·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **b0efb8c**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f8199ba76f285d56c1ea7)와 [Work Log](https://app.notion.com/p/3a126e6d586f81a6a97bc7cc9390a5ce) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — `/updates` 공용 상단 네비게이션 오노출 수정**
- `activePath={null}`이 활성 탭만 없애고 서비스 소개·사용 가이드·수식 정의·이용약관·개인정보 네비게이션은 그대로 렌더링하던 원인을 확인했다. 공용 `PublicInfoShell`에 기본값이 켜진 `showNavigation` 옵션을 추가하고 `/updates`에서만 꺼서 업데이트 내용 영역에 집중하도록 교정했다. 다른 정보 페이지 5종의 네비게이션은 유지했다.
- 검증: 관련 7/7·전체 Vitest **654/654**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 한영 1280×900·390×844에서 `/updates` 내 공용 네비게이션 0개, 가로 오버플로·콘솔 오류 0을 확인했다. 최종 공개 브랜치 적용 커밋 `maintenance/public` **f4fc5ba**, 프로젝트 이력 정리 **46e20be**. 작업 중 외부 브랜치 전환으로 생긴 원본 `design` **3617abc**도 비파괴적으로 보존했다. Notion 완료 [Task LV-46](https://app.notion.com/p/3a126e6d586f81359a48ceb6c7b098ad)와 [Work Log](https://app.notion.com/p/3a126e6d586f813bab97f4e13768536f) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 영문 계약승수 라벨 단축으로 입력 패널 최소폭 완화**
- 기본 영어 라벨과 도움말 제목을 `Contract multiplier` 하나로 통일해 긴 문구가 입력 패널과 리사이저 최소폭을 과도하게 키우지 않도록 했다. 전역 줄바꿈·리사이저 계산과 `dev`는 변경하지 않았으며, 상품별 `Shares per contract`·`Contract size` 세분화는 v2 프리셋 개선으로 남겼다.
- 검증: 관련 회귀 테스트 5/5·전체 Vitest **651/651**, 변경 파일 ESLint, production build, diff check 통과. 브라우저 제어 스킬용 연결 도구가 세션에 노출되지 않아 실제 최소폭 드래그·한영 전환 화면 QA는 미수행이다. 적용 커밋 `maintenance/public` **f063742**, 최종 용어 정리 **267614d**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f815c875fe5711242d95d)와 [Work Log](https://app.notion.com/p/3a126e6d586f8146bfdccb458f2377a4) 갱신 완료. 실배포는 수행하지 않았다.

**2026-07-18 — 푸터 링크 역할 재정리 및 `/updates` 빈 문서 추가**
- 푸터 Product에서 계산기 링크를 빼고 사용 가이드·수식 정의·업데이트를 배치했다. Company는 서비스 소개·문의, Legal은 개인정보·쿠키 설정·서비스 이용 안내 다시 보기로 정리했으며, 이용약관·개인정보처리방침은 하단 법무 줄에만 남겼다. 서비스 안내는 면책 자동 표시 설정과 무관하게 누구나 다시 열 수 있다.
- `/updates`는 기존 `PublicInfoShell`의 920px 문서 톤을 재사용하되 상단 5개 내비게이션에는 넣지 않고 활성 탭 없이 표시한다. 합의대로 한영 빈 상태만 두고, trailing slash·canonical/OG·사이트맵·광고 제외 경로를 연결했다.
- 검증: 관련 26/26·구현 시 전체 Vitest **650/650**, production build, diff check 통과. 병행 i18n 커밋까지 합친 최종 HEAD에서도 **651/651**과 build가 재통과했다. 변경 파일 lint의 `ServiceDisclaimer.tsx` Fast Refresh 1건은 기준 커밋에서도 동일했다. 인앱 브라우저 1280×900·390×844 한영에서 3개 칼럼·모바일 2열+Legal 전체폭·문서 폭·모달 2종·푸터 링크·canonical, 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **bb6650e**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f81299d92c0dae13ed011)와 [Work Log](https://app.notion.com/p/3a126e6d586f81929a9afcb432f9c4c3), Release Notes 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 공개 푸터 워드마크를 공식 LiqGuard 파비콘으로 교체**
- 제품과 무관하게 보이던 CSS 합성 장식 아이콘을 제거하고 공식 방패 체크 형태를 푸터 LiqGuard 홈 링크에 적용했다. 단순 채도·밝기 필터가 색을 탁하게 만들어 필터를 제거하고 푸터 전용 `public/footer-brand-mark.svg`를 사용한다. 최종 팔레트는 본체를 블루차콜(`#65708a → #404857`)로 푸터 배경 쪽에 붙이고, 하단 20%가량은 따뜻한 레드(`#a84b4a → #e15e52`)를 되살렸으며 체크는 차가운 백색이다. 크기는 20px, 글자 간격은 9px이다. 브라우저 파비콘 원본과 탭 설정은 변경하지 않았고 중복 낭독을 피하도록 장식 이미지로 처리했다.
- 검증: 푸터 테스트 5개, 전체 Vitest **641/641**, 변경 파일 ESLint, production build. 브라우저에서 한국어 1280px·390px 모두 20×20px·중앙 정렬·가로 오버플로 없음, 블루차콜 본체와 선명한 하단 레드, 콘솔 오류 0건을 확인했다. 적용 커밋 `maintenance/public` **6d55711**, 중간 크기 보정 **6e80efe**, 푸터 전용색 도입 **3b345b9**, 최종 차콜·레드 균형 **2b004d8**. Notion 완료 [Task](https://app.notion.com/p/3a026e6d586f81609b9ce1a9bc13d6a4)와 [Work Log](https://app.notion.com/p/3a026e6d586f81a39975f127441d022e) 기록 완료.

**2026-07-17 — 공개 실행기록 팝업 hover 연결 구역 복원**
- 실행기록 버튼에서 아래 팝업으로 마우스를 옮길 때 4px 간격에서 `mouseleave`가 발생해 팝업이 즉시 닫히던 문제를 수정했다. 팝업 위쪽에 같은 폭의 투명 연결 구역을 추가해 버튼에서 팝업 어느 지점으로 비스듬히 이동해도 hover가 이어진다.
- 공개 브랜치에 빠져 있던 기존 main 검증 패턴을 복원하고 CSS 연결 구역을 확인하는 회귀 테스트를 추가했다. 메뉴 동작·시각 간격·키보드 focus 동작은 바꾸지 않았다.
- 검증: public vitest **623/623**, production build. 실제 localhost 화면에서 버튼 중앙→4px 간격→팝업, 버튼 중앙→팝업 왼쪽 간격 이동 모두 팝업 유지, 콘솔 오류 0건을 확인했다. 적용 커밋 `maintenance/public` **4a3dab7**.

**2026-07-17 — 공개 로컬 저장 동의 모달 SaaS 리디자인 적용**
- 승인된 신뢰 중심 시안을 실제 공개 계산기에 적용했다. 상단 기기 타일, 브라우저 내부 저장·서버 미전송 신뢰 정보, 저장 항목 칩, 공용 기기 주의, 결과가 바로 보이는 2개 선택 카드를 한 화면으로 정리했다. 반투명 안내 박스는 쓰지 않고 평면 구획과 세로 경고선으로 위계를 만들었다.
- 기존 저장 슬롯의 모니터·클라우드 SVG를 공용 컴포넌트로 분리해 모달에서도 같은 아이콘을 사용했다. 상단 중앙 하이라이트는 개발판 모달 계열처럼 짧은 헤어라인+은은한 중심 광원으로 맞췄고, 경고선은 시각 보정을 위해 2px 안쪽으로 넣었다. 한국어·영어 문구와 390px 이하 1열 버튼 레이아웃을 함께 적용했다.
- 저장 여부 결정과 localStorage 동작은 기존 그대로다. 검증: public vitest **623/623**, production build, 변경 파일 eslint, Chrome 한국어 데스크톱·390×844 모바일 실화면에서 잘림·가로 오버플로·콘솔 오류 0건. 영어 카피는 i18n 타입·소스와 테스트로 확인했다. 적용 커밋은 `maintenance/public` **9124499**.
- 후속 피드백으로 선택과 적용을 2단계로 분리했다. 최초에는 미선택이며 네이티브 라디오 카드로 고른 뒤 동적 확정 버튼을 눌러야 실제 설정이 바뀐다. 로컬 저장 실패 시 모달을 유지하고 재시도할 수 있다. 격리된 세 localhost origin에서 카드 클릭만으로 모달 유지, 키보드 화살표 이동, 저장 안 함·로컬 저장 확정 경로를 확인했고 390×844에서 모달 652px로 화면 안에 수용됐다. 콘솔 오류 0건, 적용 커밋 **d5a7bf2**.

**2026-07-17 — 언어·용어 전환 시 리사이저 최소 폭 재측정**
- 한글에서 계산기 폭을 최소까지 줄인 뒤 더 긴 영어로 전환하면 입력 라벨이 패널 밖으로 넘치던 문제를 수정했다. 원인은 DOM 기반 열 최소 폭이 `useGridResize` ref에 캐시되지만 실제 번역 메시지·용어 프리셋 변경이 재측정 조건에 없고, 수동 모드에서는 자동 오버플로 보정도 꺼지는 구조였다.
- 실제 적용된 번역 메시지 객체를 콘텐츠 버전으로 전달하고, 변경 후 입력·결과 최소 폭을 다시 측정한다. 부족하면 계산기 중심을 유지하며 좌우 여백을 필요한 만큼만 줄이고, 한쪽이 먼저 소진되면 반대쪽이 나머지를 부담한다. 짧은 문구로 돌아갈 때는 사용자 폭을 자동 축소하지 않는다.
- 적용 커밋은 `maintenance/public` d9b685a, `dev` 8c34bda. `dev`는 이미 `C:/Users/rlarb/김규민/code/lvclac-worktrees/dev` worktree(당시 이름 `history-dev`)에 체크아웃되어 있어 현재 폴더에서 checkout하지 않고 해당 worktree에 cherry-pick했다.
- 검증: public vitest **623/623**, dev **636/636**, 양쪽 production build. 브라우저에서 한글 최소 축소→영어 전환 및 영어 6개 프리셋 모두 입력·결과 오버플로 0건. 전체 lint는 기존 기준선 오류로 실패했으며 변경 App·유틸·테스트 lint는 통과했다. Notion 완료 Task와 Work Log 기록 완료.

**2026-07-17 — 프로젝트 메모리를 Git 브랜치 밖의 단일 기준본으로 전환**
- 브랜치마다 `docs/project-memory.md`가 달라지는 문제를 없애기 위해 최신 작업본을 `C:/Users/rlarb/Documents/lvclac-project-memory.md`로 이동했다. 앞으로 `main`·`dev`·`maintenance/public` 모두 이 외부 파일 하나를 읽고 갱신한다.
- `AGENTS.md`, `CLAUDE.md`, Cursor 규칙과 활성·레거시 문서의 운영 참조를 새 절대경로로 바꿨다. 외부 메모리 안에서 repo 문서를 가리키던 상대 링크도 저장소 절대경로로 보정했다.
- 검증: 기존 파일의 미커밋 최신 내용이 외부 파일에 보존됐고, 세 브랜치 모두 저장소의 현재 운영 참조에서 `docs/project-memory.md` 경로가 제거됐다. 적용 커밋은 `maintenance/public` 4ae4c35, `main` 5c0cbd1, `dev` 0090bee.
- Notion: 완료 Task `LV-31`과 Work Log에 변경·검증·외부 파일 백업 주의를 기록했다.

**2026-07-17 — 공개 푸터 SaaS형 리디자인 적용 + AutoCorp screenshot 복구**
- 실제 계산기 화면을 기준으로 푸터 시안을 반복 조정한 뒤 `SiteFooter.tsx`·`App.css`에 적용했다. 카드형 외곽을 제거하고 LiqGuard 로고/설명, Product·Company·Legal 3열, 확정값만 표시하는 Operator 한 줄, 저작권·약관·개인정보·면책 재진입을 319~321px 높이로 정리했다. Google CMP 재호출과 내부 라우팅 동작은 보존했다.
- 구버전 푸터는 런타임에 죽은 코드를 남기지 않고 적용 직전 HEAD를 annotated Git tag `archive/public-footer-before-2026-07-redesign`로 보존했다. 필요 시 해당 태그의 `SiteFooter.tsx`와 CSS를 파일 단위로 복원할 수 있다.
- 병행 수정: AutoCorp Chrome의 `Page.captureScreenshot` 무한 대기에 단계별 timeout·오래된 debugger detach·1회 재시도를 추가하고 개인 플러그인 `0.2.0+codex.20260716195100`으로 재설치했다(autocorp-chrome 커밋 `191407b`). 실캡처가 기존 20초 timeout에서 약 0.17~0.2초 PNG 반환으로 정상화됐다.
- 검증: public vitest **617/617**, production build, 대상 eslint 통과. 새 AutoCorp 탭에서 런타임 합성 없는 실제 React 푸터 높이 321px·브랜드/설명 간격 11px·Operator/3열 탐색을 DOM과 PNG로 확인했다.

**2026-07-17 — 공개판 저장 2슬롯·첫 방문 로컬 저장 동의·사용법 복원**
- `maintenance/public`의 축약 저장 UI를 dev 슬롯 스타일에 맞춰 **`저장 안 함`·`로컬 저장` 두 아이콘 슬롯**으로 정리했다. 입력 패널 하단의 한 줄 설명, 클라우드·숫자세트·도움말·별도 삭제 링크는 공개판에서 제거하고, 저장 중지 시 기존 로컬 값은 보존한다.
- 신규·기존 방문자 모두 공개 홈에서 배포 후 한 번 로컬 저장 여부를 고른다. 기존 필수 면책을 먼저 확인한 뒤 `저장 안 함`/`로컬 저장`을 즉시 적용하며, 계좌 평가금·증거금률·계약 수가 브라우저 localStorage에만 저장되고 공용 기기·악성 프로그램·확장 프로그램 환경에서는 노출될 수 있음을 고지한다. 결정은 `leverage-public-save-consent-v1`에 기록하고 저장소 접근 실패는 앱 사용을 막지 않는다.
- 헤더 `사용법` 초보자/트레이더 툴팁과 `/guide` 상세 페이지 라우팅을 공개판에 복원했다. 로그인·클라우드 코드는 되살리지 않았다.
- 검증: public vitest **597/597**, production build 통과. 변경 파일 eslint는 기존 `ServiceDisclaimer.tsx`의 Fast Refresh 상수 export 기준선 1건만 남음. 로컬 Vite `127.0.0.1:5173` 200 및 Chrome `선물 계산기` 탭 오픈 확인. 현재 세션에 Chrome DOM 제어와 Notion 도구가 노출되지 않아 클릭 실측·Work Log/Task 기록은 미수행.

**2026-07-16 — `main` 무료 실배포 / `dev` 전체 개발환경 영구 분리** (main 04f4ed3, dev a342674)
- `dev`를 기존 전체 기능 브랜치로 만들고 별도 Vercel `lvclac-dev`의 Production Branch로 지정. Supabase·service role·cron env와 Auth Site URL/Redirect URL을 `devpilgrm.liqguard.com` 기준으로 이관하고 `DEV` 배지를 추가했다. Vercel 파일단위 TypeScript 오류(Node 타입, middleware `.js`, cron union narrowing)를 수정해 dev Production이 오류 없이 Ready.
- `main`은 로그인/AuthProvider·클라우드·다중 숫자세트·마이페이지·기록·결제·피드백·관리자·가이드/공식/소개/UI키트/복구 진입을 제거. `/terms`, `/privacy`만 유지하고 제거 경로는 홈으로 이동. billing/cron API와 Vercel cron, Production Supabase/service-role/cron env도 제거.
- 공개 저장은 단일 `localStorage` 슬롯. 기존 active 로컬 숫자세트를 `leverage_calculator_draft`로 1회 마이그레이션하고 저장 일시정지와 데이터 삭제를 분리했다. 광고 값이 없으면 기존 자리표시를 유지한다.
- 검증: public vitest 592/592·build, dev 620/620·build, 양쪽 Vercel Ready. `liqguard.com` 홈/terms/privacy 200, 제거 경로 307→홈, billing API 404, robots 전체 차단 확인. 남은 외부 작업은 Porkbun `A devpilgrm 76.76.21.21` 한 건과 이후 SSL/기능 smoke test.

**2026-07-16 — 기록 장부 시안 레이아웃·중앙 기준일을 실제 /records에 적용 + 6열 정렬 복원**
- 범위 착오 수정: 처음에는 `docs/design/2026-07-16-records-date-anchor-mockup.html`만 다듬어 운영 도메인이 바뀌지 않았음. 사용자 확인 후 실제 `RecordsArchivePage.tsx`·`pages.css`에 시안 방향을 적용.
- 데스크톱을 **왼쪽 제목/한 줄 설명 + 오른쪽 960px 장부** 2열로 재배치하고, 우측 여백은 3vw(최대 56px)로 잡아 시안처럼 오른쪽·하단에 숨 쉴 공간을 남겼다. 기록 영역은 `420~520px`로 제한해 900px 데스크톱에서 장부 하단이 화면 밖으로 밀리지 않으며, 모바일은 자동 높이를 유지.
- 기준일 UX: 처음에는 가장 최근 기록일을, 날짜 점프 뒤에는 선택일을 타임라인 세로 중앙 마커로 렌더한다. 마커 위는 미래 영역으로 비워 두고 기록은 아래부터 시간 역순으로 이어진다. 날짜 변경/초기 조회 때만 내부 스크롤을 맨 위로 되돌리며, 오래된 기록 추가 로드 중에는 현재 읽던 위치를 보존한다. 기존 상단 날짜 상태바는 중앙 마커로 통합하고 `최신으로` 해제 버튼도 그곳에 둔다.
- 정렬 원인: 값 카드에는 `[선택칸][3개 값][28px 메모칸]`이 있지만 헤더에는 메모칸이 없어 중심선이 어긋남. 헤더에도 메모 spacer를 넣고 스냅샷/주문 열 규격을 CSS 변수로 단일화, 라벨·값 모두 가운데 정렬. 구조 회귀 테스트 신규 추가.
- 검증: tsc 통과, vitest **620/620**, build 통과. 실제 앱 CSS를 쓰는 임시 렌더 하네스로 1867×900 데스크톱에서 가로·하단 여백과 중앙 기준일을 확인하고 하네스 삭제. 대상 eslint는 기존 `RecordsArchivePage` 기준선 오류 3건만 잔존.

**2026-07-15 — 기록 장부(/records) 무한 스크롤 + 날짜 점프 조회** (커밋 c02a694)
- 사용자 요청: 수백 개로 쌓일 기록 대응 — ①스크롤 바닥 도달 시 자동 추가 로드(더보기 버튼 유지) ②특정 날짜 근처 조회. UX는 AskUserQuestion으로 확정: **날짜 점프 방식**(달력서 날짜 선택→그 날짜 이하로 재조회, 채팅/은행 '날짜로 이동' 표준) + **자동/버튼 병행**(observer 미지원·키보드 폴백).
- **재활용**: 페이지네이션 백엔드(offset+`.range()` N+1 오버페치·`hasMore`·`fetchRecordCounts`·로컬 offset 보정)는 이미 완성 → `loadOlderRecords`에 트리거만 붙임. 신규 훅 `src/hooks/useInfiniteScroll.ts`(IntersectionObserver sentinel, rootMargin 200px, onLoadMore ref로 최신참조, IO 미지원 시 no-op → jsdom 테스트 안전). 날짜는 조회 4함수에 선택적 `before?`(ISO 상한) 추가→`.lte('created_at', before)`, 슬롯 필터와 AND, 생략 시 하위호환.
- 컨테이너: `dateAnchor`(YYYY-MM-DD)→`beforeBound`(그 날 끝 23:59:59.999 ISO) memo, load 함수 deps 포함→날짜 변경 시 첫 페이지 재조회+상세 닫음. UI는 툴바 네이티브 `<input type=date>`(max=오늘)+활성 시 "{date} 이전 기록" 칩+"최신으로" 해제. 시맨틱 '선택일 이하'라 빈 날 골라도 그 이전 이어짐.
- 검증: tsc·vitest 608/608(워크트리 제외, accountRecords에 before→.lte 2건 추가). dev /records 로그인 실측 — 07-11 선택 시 스냅샷 6→4·07.14 제외·칩 표시, 최신으로 복귀 정상, 콘솔 에러 0, 패널 360px 툴바 줄바꿈·오버플로 0. **무한스크롤 자동로딩은 현재 계정 13개(20개 미만)라 hasMore 미발동 → sentinel/버튼 정상 부재로 실측 불가**(단위테스트+코드 커버). 공유 워크트리라 내 8파일만 명시 스테이징.

**2026-07-15 — '계산결과/주문시나리오 공유' 기능 디자인 시안(방향 탐색만, 미구현)** (커밋 예정)
- 사용자 요청: 공유 기능을 만들기 전 "받은 사람이 링크 누르면 뭐가 떠야 하나"부터 설계. Claude in Chrome에 로컬서버(HTML 목업) 띄워 시안 4종을 사용자 피드백 반복하며 다듬음. **구현은 안 함** — 백로그 등재 후 종료.
- **합의 방침**: 방식은 **B안**(짧은링크+DB+서버 OG 이미지) — 카톡 링크 미리보기 카드가 바이럴 핵심(A안=URL에 다 담기는 미리보기 안 뜸). **프라이버시**: 계좌잔고·진입가·체결가·유지증거금률 등 개인정보는 화면서 전면 제외 → 노출값은 청산가/하락 여유%/방향/레버리지/현재가만. **CTA는 '내 포지션 점검하기'**(입력값 미공유라 남 계산기에 값 프리필 불가 → 받은 사람이 자기 포지션 넣게 유도). **톤**: 청산가 숫자 흰색, 빨강은 작은 점 표식만(겁주지 않게).
- **재활용 확인**: 읽기전용 렌더는 `RecordsArchivePage.tsx`의 `RecordsDetailPanel`(InputPanel/ResultPanel onChange=noop + 주문 전/후 토글)을 모달 껍데기만 벗겨 재사용 가능. CalculatorInputs에 accountEval(계좌잔고) 등 민감필드 있어 공유용은 가림 필요.
- 산출물: 시안 HTML을 repo에 보관 `docs/design/2026-07-15-share-feature-mockups.html`(4종+합의방침 헤더 주석). 백로그 등재 '계산결과·주문시나리오 공유 기능 (언젠가)' P3/Feature(예상 2~3일). **미결정**: ②결과우선형 vs ③계산기통째형 택1·③빨강 톤다운·④2열 계약수/레버리지 노출범위.

**2026-07-15 — 숫자세트 열람 슬롯 원라인 심플화 + 계좌평가금·레버리지 노출** (커밋 13cf29a·07cdfc5)
- 사용자 요청: 계산기 메인 "숫자세트 열람" 드롭다운(`draft-number-set-menu`) 슬롯을 심플하게(최대 10+10=20개 수용). 목업 5회 반복(show_widget)으로 방향 정한 뒤 구현 — 34px 아이콘타일+2줄(제목/메타)+체크서클(~52px) → **방향 색점 + 제목 + 우측 `계좌평가금·레버리지` 원라인(~32px)**. 20개 차도 세로 절반 이하.
- **정렬 고정**(사용자 핵심 요구): 우측 숫자를 `[금액 우측정렬][·][레버리지]` 3칸 inline-grid, **레버리지 칸 32px 고정폭 우측정렬** → 배수 자릿수(5x·50x·125x) 달라도 3축 안 흔들림(실측: 전 행 금액끝568·점577·레버끝609px 동일, 칸폭 32 불변). 통화기호(₩) 제거·천단위 콤마·레버리지 단위 `x`(본문은 '배', 슬롯만 x).
- **레버리지는 파생값**: CalculatorInputs에 레버리지 입력 필드 없음(국내 선물식 — 평가금·약정금액서 도출). 세트엔 원천 입력만 저장되고 `calculateEvaluate(inputs).leverageRatio`로 매번 계산(순수 산술, 20개 무해). 따로 저장 안 하는 게 원천값 변경 시 유령값 방지로 더 안전. 값 null(입력 불완전)이면 칸 비우되 고정폭 유지. `formatNumberSetMeta`(시각·방향·계약수) → `describeNumberSet`(방향·평가금·레버리지)로 교체.
- 검증: tsc·vitest 605/605(워크트리 제외). dev(5223)에 로컬세트 6종 주입 후 DOM 실측 — 렌더·레버리지(20/50/5/10/125/15x)·active 하이라이트·3축 정렬 확인. **스크린샷은 이 환경 캡처도구 타임아웃(JS 실행은 정상) → DOM 측정으로 대체**. saveDraftSlotUi 테스트의 format import 정확문자열 검사를 정규식으로 완화(import 확장 대응). 남의 세션 project-memory.md 미커밋 1줄(Live Summary 자수 1,000→2,000) 동반 커밋됨.

**2026-07-15 — 모바일 UI 협업 검토 세션(사용자 devtools 페어링): 마이페이지·기록 장부 6건 + 상세=계산기 모달(+다듬기 4라운드)** (커밋 2f45d57·97e2302·5162ec2·ce3e130·28fac22·53fdbb5·8861bf4·66d909c·2e691c5·727a9f5)
- 협업 방식: 사용자가 devtools로 뷰포트 전환(428px↔데스크톱), Claude in Chrome으로 실측→설명→오케이→수정→재실측. **좌상단 고정 언어토글·상품군 위젯은 개발용 의도 배치 — 수정 금지(사용자 지시)**. 계산기 본화면은 "큰 문제 없음"(터치타겟 작음만 측정해둠, 미조치).
- 마이페이지: 연동된 로그인 카드 모바일 붕괴(유령 `.my-page-linked-item` 규칙 누수 → 암시적 2칸) 수정 후 표준 한 줄 행+✓체크 텍스트 상태로 리디자인. 최근 스냅샷·주문 표의 가로 스크롤 제거(행 min-width 강제 삭제 — 1fr 열이 빈 공간만 먹고 숫자 열이 밀려나던 것).
- 기록 장부(/records): 타임라인을 한쪽 정렬로 접기(날짜 칩 항상 카드 위+기록 간 16px — 등간격이라 그룹 경계가 소멸했던 것). 터치 기기 체크박스는 `@media (hover:none)`에서 opacity 0.4로 배경에 녹이고 체크/선택모드/포커스 시 1.
- 행 상세: 인라인 패널(복구 사건 때 모달 소실 추정, 히스토리·.recovery 전수 확인)을 표준 조회형 모달로 복원 → 사용자 요청으로 **저장 당시 계산기 화면 통째(읽기 전용)+주문 전/후 토글**로 확장. 구현 전 사용자 브라우저 실화면에 iframe 목업 띄워 합의(데스크톱 1160px 2열). InputPanel·ResultPanel은 props 전용 독립 부품이라 그대로 재사용(onChange noop+pointer-events:none).
- **함정 3개**: ①입력패널은 내부 표시상태 보유 — props 변경만으론 화면 미갱신, `key` 재마운트 필요. ②주문 beforeInputs는 주문 '반영 중' 시나리오 상태로 저장 — 표시 로직이 반영값(=주문 후와 동일)을 보여줌 → `revertOrderScenarioState`(계산기 ESC 취소 함수)로 벗겨 표시, 진위는 Supabase 원본 대조로 확정. ③터치 에뮬레이션 탭은 CDP 마우스 입력 불가(JS click·키보드로 검증), 전환(transition) 중 getComputedStyle은 중간값 반환.
- 상세 모달 다듬기 4라운드(사용자 피드백 반복): 계산기 본체 외 chrome 제거(툴팁·비우기·저장토글·헤드액션) → 여백 다이어트+무스크롤 자동 축소(CSS zoom, 가용높이/계산기높이, 하한 0.55) → 헤더 최소화(제목 제거, aria-label 대체) → **주문 전/후 소형 토글(20px)+주문 입력줄은 '주문 전'에서만 표시**(그 순간 입력돼 있던 주문 스펙 노출). 세로 1px=글자 크기 통화: 세로 chrome을 뺄 때마다 zoom 0.69→0.90까지 상승. 폭은 내용 적응형 대신 고정 프레임(1160px) 유지 결정 — 흔들림 방지, 조단위 수용 실측.
- 검증: tsc·vitest main 전부 통과(모달 소스검증 테스트 확장), 각 건 브라우저 실측. 미검증: 상세 모달 ≤960px 1열 스택·실기기. Work Log 11건 기록.

**2026-07-15 — 모달 디자인 일관성 정돈(핸드오프 R1–R6 적용)**
- 다운로드 zip("모달 디자인 일관성 검토") 개선안을 실제 소스에 역반영. 16개 모달 상태가 갈려 있던 세 시각 계층(base·auth·snapshot)의 편차를 단일 토큰/규칙으로 수렴. 로직·포털·포커스복원·i18n 계약은 그대로, 시각·마크업만 교체.
- **R1(토큰 통일)**: variables.css에 `--modal-radius:16 / --btn-radius:10 / --btn-h:46` 신설. App.css `.btn`(min-height/radius/weight 600), `.disclaimer-modal`·`.snap-modal`(18→16) 토큰화. `.btn` 변경은 앱 전역 버튼에 영향(핸드오프 의도).
- **R3(Primary 단일)**: 표준 `.btn-primary`는 solid+상단 하이라이트 1개(inset). 그라데이션+상승그림자는 고가치 CTA(로그인 제출/스냅샷 게이트)만 예외 유지.
- **R5(오버레이)**: `.disclaimer-overlay`를 `rgba(6,8,12,.72)+blur6`로 통일, `.snap-modal-overlay`는 커스텀 radial 배경 제거하고 이 값을 상속(등장 애니메이션만 유지).
- **auth 리디자인**: 기존 1c 파랑/보라 그라데이션 워시 블록을 스냅샷 계열(surface+상단 헤어라인+primary radial glow+snap-card-in)로 교체. `.reset-screen` 카드도 동일 톤. eyebrow(계정/비밀번호, mono) 신설 — AuthPage·ResetPasswordScreen 헤더에 추가(i18n `eyebrowAccount`/`eyebrowPassword` ko·en). 입력창 mono→본문폰트, 포커스 링.
- **약관 fine print 이동**: GoogleButton 안(개별 버튼 옆)에서 떼어 AuthPage 하단(모든 로그인 수단 공통, login·register만·forgot 제외)으로. 로그인 모달 업계 표준.
- **R4(파괴형 X 제거)**: BulkDeleteConfirmModal 우상단 X 삭제(ESC·오버레이클릭·취소버튼으로 dismiss 유지). 조회형(NumberSetDetailModal·스냅샷)은 X 유지. 테스트도 X-검증→X-부재 검증으로 교체.
- 검증: tsc 통과, vitest 604/604, dev 브라우저에서 disclaimer/로그인/forgot 모달 computed-style·DOM순서 실측(카드 16px·surface·eyebrow·약관 하단·입력 본문폰트·primary 그라데이션·콘솔 에러 0). 스크린샷은 이 환경 타임아웃이라 미수행. 미검증: 회원가입/reset 실제 제출 플로우, 스냅샷 저장완료/게이트 실모달(토큰 상속으로 커버).

**2026-07-14 — 자동 스냅샷 "값이 바뀐 날만 저장"으로 전환** (커밋 c6d51ac)
- 사용자 결정: what-if("이 가격이면 청산가?") 놀이 날 처리 논의 → 슬롯의 **마지막 스냅샷(수동 포함)과 입력값이 다를 때만** 자동 저장. 수정시각 기준은 계산기 즉시 자동저장 특성상 what-if와 구분 불가라 기각, '항상/변한날만' 설정 분기·연습모드도 불채택(백로그 미등재 — 사용자 지시). ADR은 Design & Decision Log "자동 스냅샷 저장 조건" 행.
- 비교는 `storedCalculatorInputsEqual`(정규화 후 필드 단위, jsonb 키순서 무관). 미변경 스킵은 오류 아님(last_error 미기록). 부수 수정: 저장 없던 실행이 last_run_at/last_run_local_date를 null로 덮지 않게 유지(스킵이 일상이 되면 "마지막 실행" 표시가 매일 지워지던 문제 예방).
- 마이페이지 자동 스냅샷 설정에 안내 1줄(ko/en `autoSnapshotChangeOnlyHint`) + `.my-page-setting-hint`(xs 위계). MyPage 렌더 테스트는 환경설정 섹션이 스텁이라 **소스 텍스트 검증**(autoSnapshotSettingHint.test.ts, 리포 관례).
- 검증: vitest 603/603, 배포 후 실서비스 /my 로그인 세션으로 문구 렌더·다음 스냅샷 07.15 16:00 예약 확인. 미검증: 실제 미변경 날 서버 스킵(내일 16:00 자연 검증, 유닛테스트 커버).

**2026-07-14 — 자동 스냅샷 미작동 규명 + 프로덕션 API 전면 크래시 수정** (커밋 9aceb4b)
- 사용자 제보(본계정 16:00 자동 스냅샷 미실행) 조사 → 자동 스냅샷은 **배포 후 한 번도 실행된 적 없음**(`account_snapshots`에 source='auto' 0건). 3중 원인:
  1. **`/api/*` 전 함수가 배포에서 즉사**: `type: module`(ESM) + Vercel의 파일단위 TS 컴파일(번들링 없음) 조합에서 상대 import에 `.js` 확장자가 없으면 `ERR_MODULE_NOT_FOUND`. 빌링 API도 동일하게 죽어 있었음(실제 결제 시도 500 로그 확인). → 서버 import 그래프 22개 파일에 `.js` 확장자 부여로 수정, 배포 후 핸들러 정상 응답 확인. **재발방지: `scripts/serverEsmImports.test.ts`**(api/에서 상대 import 재귀 추적, 확장자 누락 시 실패).
  2. **Vercel 프로덕션에 `CRON_SECRET`·`SUPABASE_SERVICE_ROLE_KEY` 미등록**(VITE_ 2개만 있음) → 사용자 승인 받아 등록 완료(CRON_SECRET 신규 생성)·재배포.
  3. **크론 주기**: vercel.json `0 0 * * *`(UTC 0시=KST 9시, Hobby는 하루 1회 제한)라 유저별 time_of_day를 원리상 못 맞춤 → **pg_cron+pg_net 15분 폴링 등록 완료**(커밋 c8a3aa4, 원격 적용됨, 시크릿은 Supabase Vault `lvclac_cron_secret`). 코드는 이미 `next_run_at` due-선별 설계라 서버 변경 없음. 중복은 (user,slot,local_date) 유니크 인덱스로 안전. vercel.json 일 1회 크론은 백스톱 유지.
- **최종 검증**: 올바른 토큰으로 호출 시 200 `{ok:true, processed:1}` — 밀려 있던 오늘자 '슬롯 2' 자동 스냅샷 실제 생성(source='auto' 최초 1건), next_run_at 내일 16:00 KST로 정상 전진.
- **함정 기록**: `vercel build`를 로컬에서 돌리면 package-lock.json을 멋대로 바꿈 → 커밋 전 원복할 것. 미들웨어는 엣지 런타임(자체 번들러)이라 확장자 규칙 무관. **새 서버 진입점/모듈 추가 시 상대 import에 .js 필수**(scripts/serverEsmImports.test.ts가 자동 검사).
- **잔여 별개 이슈**: 빌링(Paddle) 환경변수는 여전히 미설정 — 결제 받으려면 별도 설정 필요(이번 수정으로 크래시는 해소, 22:31 실제 결제 시도 실패 로그 있었음).

**2026-07-14 — 디자인 핸드오프 3종 적용(로그인 모달 1c · 스냅샷 모달 2종 · 숫자세트 메뉴 1a)** (커밋 af33321)
- 다운로드 zip 3개(로그인 모달/활성 숫자세트 메뉴/스냅샷저장 모달)를 기존 컴포넌트 위에 재구현. 로직·포털·포커스복원·i18n 계약 유지, 시각/모션 레이어만 교체.
- **로그인 모달 1c**: AuthModal에 `auth-overlay` 스코프 클래스 → auth-dialog.css에서 카드 상단 그라데이션 2겹(::before/::after), #1c212b/16px 카드, 입력 모노→Pretendard(#161a22), primary 그라데이션. 오버레이 배경은 `.disclaimer-overlay.auth-overlay` 복합선택자로 특이도 확보(같은 클래스 충돌 회피).
- **스냅샷 모달 2종**: 공통 `.snap-modal` 셸(등장 애니메이션+88px 엠블럼 disc/glow/halo/mark+순차 rise+prefers-reduced-motion). 저장완료=success green 링+체크 draw, 게이트=blue 자물쇠 draw+혜택 리스트(snap-feats)+shimmer. eyebrow i18n 신설, 혜택은 `t.myPage.billing.page.benefits` 재사용.
- **숫자세트 메뉴 1a**: SaveDraftToggle 메뉴 재구성(총개수 배지·위치별 그룹 글리프+개수 used/limit·34px 아이콘타일·메타(시각·방향·계약수)·활성 좌측 액센트바+체크서클·빈 상태·무료 한도힌트·PRO배지). '세트 추가' 게이트는 SnapshotProGateModal 재사용.
- **주의(회귀 수정)**: `createNumberSet('local')`은 로그인 없이 무료 한도까지 생성 가능, 클라우드만 로그인 필요. 게이트 로직이 게스트 로컬 세트 생성까지 막던 걸 `storageMode==='cloud'&&!user` / `한도초과&&!isPro` 조건으로 수정(로컬 우선 UX 보존).
- **함정 기록**: 요금제 혜택 카피 경로는 `t.billing.plans.benefits`가 아니라 **`t.myPage.billing.page.benefits`**. `t`가 느슨한 타입이라 tsc는 통과하고 런타임에서만 터짐(브라우저 검증에서 발견·수정).
- 검증: tsc·vitest 597/597 통과. dev 브라우저에서 4화면 실제 렌더 확인(스크린샷은 이 환경에서 타임아웃 → computed-style/DOM 검사로 검증). 미검증: 실제 Pro 유저의 클라우드 세트/스냅샷 저장 성공 플로우(로그인 필요), 이메일/푸시 등 비주얼 외 경로 없음.

**2026-07-14 — 법인설립: 법인인감 신고서 인감인영 업로드 성공(최대 병목 돌파)**
- 법인도장(주식회사 파필드소프트웨어/사내이사) 7/14 도착. 각인은 주문(해서체)과 달리 **전서체**로 왔으나 법인인감 요건상 서체 무관 → 그대로 진행. 각인 내용(회사명 외곽+사내이사 내부+상단 다이아몬드 비표) 정상 확인.
- HP M1212nf 스캐너 미인식 수리: WIA 서비스 시작 + HP Smart Install(가짜CD) 모드 드라이버 설치. 실제 인주 인영 A4 스캔 확보(바탕화면 `법인도장_스캔` 폴더).
- startbiz **법인인감 신고서 → 인감인영 스캔은 PC 스캐너 실시간 스캔만 허용**(저장 이미지 파일 업로드 불가). 좌측 "인감파일업로드" 메뉴는 모바일앱 전용(사용자 확인상 iOS 앱은 스토어에서 사라짐).
- 스캔 프로그램(PaceSystem "Image Document Scan", `C:\PaceSystem`) 무반응 → 4중 장애 해결: ①PSWebSocket 에이전트 미실행 ②OCX 4개 미등록(32bit regsvr32) ③의존DLL이 `Engine`폴더에만 있어 못찾음(→`C:\PaceSystem`로 복사) ④**진짜 원인: Smart App Control이 미서명 Interop DLL 차단(0x800711C7)** → Smart App Control 껐더니 스캔 성공.
- 결과: **서식 13종 전부 "완료"**(법인인감 신고서 포함). 전자서명만 남음.
- **다음(9~17시 운영시간에)**: 진행업무(잔액증명 발급의뢰→등록면허세→등기수수료 2만원) → 일괄전자서명(김규민+누나 감사 김에림, 등기수수료 납부 후 버튼 노출) → 파주등기소 제출. Tasks LV-6 참조.
- 주의: 재부팅 시 스캔 에이전트(PSWebSocket_Launcher) 자동실행 안 됨 → 다음 스캔 전 수동 실행 또는 자동실행 등록 필요. Smart App Control은 한 번 끄면 재활성화 어려움(그대로 유지됨).
**2026-07-15 — 마이페이지 레거시 유령 CSS 200줄 전면 삭제** (커밋 548032d)
- 2f45d57 잔여 후보였던 `my-page-setting-row` 계열(마이페이지 v3 이전 시스템) 정리. src 전체(ts/tsx/test) grep 참조 0건 전수 확인 — 참조처럼 보인 곳은 `.recovery/` 백업과 일회성 복구 스크립트뿐, CSS 소스를 읽는 테스트 3개(autoSnapshotSettingHint·myPageLayout·myPageNumberSetsUi)도 미검사.
- 조사 중 추가 유령 발견해 함께 삭제(사용자 승인): `.my-page-nickname-form` 본체+오버라이드 4블록(현행 폼은 `my-page-nickname-edit`라 "legacy를 덮어쓴다"던 오버라이드까지 전부 매칭 대상 없는 죽은 코드), `.my-page-account-settings-meta`. `.my-page-settings-list`(@deprecated)·`.my-page-settings-note`·모바일 미디어쿼리 블록 포함 총 5구간 200줄, 렌더링 변화 0.
- 검증: vitest 604/604(main rebase 후 재실행), dev /my에서 CSSOM 유령 규칙 0·실사용 규칙(linked-row/setting-line/inline-control) 유지·데스크톱 1265px/모바일 428px 가로 오버플로 없음·콘솔 에러 0. 게스트 화면 실측(로그인 화면 쪽은 참조 0건으로 코드 레벨 보장).
- 함정: 포트 5199를 다른 세션 dev 서버가 점유 → launch.json 임시 5198로 검증 후 원복. harness 워크트리 세션이라 워크트리 커밋→main rebase→ff-merge로 main 반영(97e2302 모바일 linked-row 개편과 충돌 없음 확인).

**2026-07-17 — v1 푸터·공개 콘텐츠·법무·AdSense/GA4 동의 준비**
- 푸터를 제품·회사·법무 3영역으로 복구하고 계산기·가이드·수식·소개·약관·개인정보·개인정보/쿠키 설정과 문의 이메일을 연결했다. 실제 법인 정보는 `PublicOperatorInfo` 환경변수에서 한 번만 읽고 미확정 값은 숨긴다. `/about`은 로그인 없이 운영 주체·목적·수식 투명성·계산 한계·문의처를 설명하며 `/guide`는 로컬 브라우저 저장만 안내한다.
- 약관·개인정보처리방침을 한영으로 확장해 계산 보조 도구 범위, 투자자문 아님, 결과 검증, localStorage 위험, Vercel 호스팅/Web Analytics, GA4, AdSense 광고 쿠키, 처리위탁·국외 이전·권리·보호책임자·구제 절차를 표로 공개한다. Vercel 집계 차원과 Google 광고 쿠키/맞춤광고 해제도 명시했다.
- Consent Mode v2 네 항목을 Google 태그보다 먼저 기본 거부하고, Google CMP 결과가 미확정이면 GA4·광고 요청을 막는다. 비규제 지역도 명시 선택 전에는 막고 자체 설정창을 제공하며, 규제 지역은 Google CMP 철회 메시지를 재호출한다. AdSense 요청은 `pauseAdRequests=1` 뒤 동의 시에만 `push()`·재개한다.
- 공개 6경로 sitemap·canonical·페이지별 title/description/OG를 추가하고 Vercel 리다이렉트를 해제했다. `ALLOW_INDEXING=true` 또는 실 AdSense 설정인데 필수 법인 정보가 비면 production build가 실패하며, 올바른 client ID에서 AdSense account meta와 `ads.txt`를 자동 생성한다. 외부 입력값과 대시보드 작업은 `docs/public-launch-checklist.md`에 정리했다.
- 검증: vitest **617/617**, production build, 변경 파일 eslint, 누락 법인정보 build 차단, 테스트 publisher ID의 noindex 제거·메타·`ads.txt` 생성 확인. 전체 eslint는 기존 `.recovery` 파싱 오류와 dev 전용 기존 규칙 위반으로 실패. 현재 세션에는 브라우저 제어 실행 도구와 Notion 도구가 없어 모바일/데스크톱 클릭 QA와 Work Log/Task 갱신은 미수행.

**2026-07-17 — 공개 푸터 받침대형 라운딩·차콜 글로우·계산기 카드선 정렬**
- 기존 SaaS형 푸터의 콘텐츠·높이는 그대로 두고 상단 두 모서리에 계산기와 같은 8px radius를 적용했다. 하단은 flush로 남겨 독립 카드가 아니라 계산기 아래 받침대처럼 보이게 했다. 후속 피드백으로 푸터에만 있던 파란 radial·세로 그라데이션을 제거하고 입력·결과 패널과 같은 `var(--color-surface)` 단색으로 통일했다. 상단 1px 파란 accent는 유지한다.
- 1024px 이상에서는 리사이저 손잡이 폭과 같은 좌우 10px을 inset해 푸터 외곽이 입력·결과 카드의 `x=218 / right=1047` 선에 정확히 맞는다. 1023px 이하에서는 푸터와 계산기 그리드가 기존처럼 같은 전체 폭을 유지한다.
- 검증: public vitest **623/623**, SiteFooter 2/2, production build. 브라우저 실측 1280px·1023px·390px에서 가로 오버플로 0건, 모바일 한영 푸터 텍스트 오버플로 0건. 최종 computed style은 푸터·입력·결과 모두 `background-color: rgb(30, 35, 45)`, 푸터 `background-image: none`으로 확인했고 PNG를 Codex visualizations에 보관했다.
- 적용 커밋 `maintenance/public` **8a9cf32**(받침대형), **68a721f**(그라데이션 제거), **ab1b2d7**(계산기 패널색 일치).
- 실제 계산기 화면에 fixed 토글을 주입해 단색 4종·그라데이션 4종을 비교한 뒤, 최종적으로 `radial-gradient(70% 120% at 16% 0%, rgb(142 130 255 / 6%), transparent 64%)`와 `#1d212a → #15181f` 차콜 세로 그라데이션을 선택했다. 기존 상단 파란 accent·8px 상단 radius·데스크톱 10px inset은 유지한다.
- 최종 검증: public vitest **623/623**, production build, Chrome 실제 소스 새로고침에서 보라빛 시작점 `16% 0%`·불투명도 `6%`, 가로 오버플로·콘솔 오류 0건을 확인했다. 적용 커밋 `maintenance/public` **050fbcc**.

**2026-07-17 — 푸터 상단 투자 위험 문구 여백 토큰 정렬**
- 투자 위험 문구가 `clamp(54px, 6vw, 78px)`, 푸터가 `clamp(34px, 4vw, 52px)`의 독립 마진을 가져 상위 레이아웃 간격과 중첩되던 문제를 수정했다. 범위 재확인 결과 계산기→문구만 확 띄우는 것이 의도였다. 문구 상단은 `var(--space-xl) × 2 + var(--space-md)`로 80px, 푸터 상단은 `var(--space-md)`로 두어 상위 레이아웃 간격 포함 문구→푸터는 기존 32px을 유지한다.
- 기존 푸터 차콜 글로우와 실행기록 hover 연결 구역은 보존했다. 검증: 관련 Vitest 4개, production build, 1280×900·390×844 브라우저 실측에서 계산기→문구 80px·문구→푸터 32px, 가로 오버플로·콘솔 오류 0건. 최종 적용 커밋 `maintenance/public` **c8d45e1**. Notion 완료 Task와 Work Log도 최종 80px/32px 기준으로 갱신했다.

**2026-07-17 — 공개 푸터 법인정보 그리드·한영 회사명 정리**
- 기존 `Operator` 제목+인라인 정보 행을 제거하고, 데스크톱은 `회사·대표자·문의 / 주소·사업자등록번호·통신판매업 신고번호`의 3열×2행, 모바일은 1열로 표시한다. 실제 법인정보 설정 전에도 한글 `김아무개`, 영어 `Jane Doe`와 예시 주소·등록번호를 채워 여섯 칸을 유지하며 환경변수가 들어오면 실제 값이 자동으로 우선한다.
- 한글 `회사`·영문 `Company` 모두 `Farfield Software Inc.`를 사용하고 개인정보 보호책임자는 푸터에서만 제외한다. 라벨·값은 `var(--font-size-xs)` 11px, 굵기 600/400이다. 검증: 대상 Vitest 5개, 전체 635/635, 변경 파일 ESLint, production build, Chrome 한영 각각 6개 항목·3열×2행 좌표·가로 오버플로 0건.
- 적용 커밋 `maintenance/public` **11b7c65**, 6칸 유지 수정 **5179e7e**. Notion 완료 [Task](https://app.notion.com/p/3a026e6d586f8150b63efcd570c8de57)와 [Work Log](https://app.notion.com/p/3a026e6d586f818f93dffd1bb547b866) 갱신 완료.

**2026-07-17 — 공개 실행 기록을 확정 동작의 인접 전후값으로 교정**
- 누적 목표값 비교를 없애고 각 확정 동작의 바로 전·후 상태를 보존하는 entry 히스토리로 교체했다. 일반 입력은 현재 용어 프리셋의 필드명과 `이전값 → 이후값` 두 줄로 표시하며, 현재가가 계좌평가금을 자동 보정해도 현재가 한 건만 보인다. 포커스 입력과 스테퍼 빠른 클릭·길게 누르기·드래그는 한 동작으로 묶인다.
- 주문 입력 자체는 일반 기록으로 남지만 첫 Enter 미리보기와 미리보기 중 조정·Esc 취소는 transient로 처리해 목록과 undo 스택에 넣지 않는다. 최종 반영만 `주문 가격, 계약수계약` 한 줄로 커밋하며 음수 계약수를 보존한다. 주문 undo는 미리보기 없이 실제 주문 전 계좌와 마지막 주문 초안을 복원하고 redo는 같은 주문을 재적용한다.
- 검증: 대상 26개·전체 Vitest **635/635**, production build, 변경 파일 lint 새 오류 0건. 엄격 lint의 기존 Context 오류 3건·hook 경고 2건은 기준선으로 분리했다. 브라우저에서 한영 문구, 현재가 중복 억제, 미리보기 무기록, 주문 undo/redo, 390×844 오버플로, 콘솔 오류 0건을 확인했다.
- 적용 커밋 `maintenance/public` **6aad1f0**. Notion 완료 Task **LV-38**과 Work Log 기록 완료.

**2026-07-18 — 푸터 내부 페이지 5종을 LiqGuard 문서 공간으로 통합**
- `/guide`·`/formulas`·`/about`·`/terms`·`/privacy`에 공용 `PublicInfoShell`을 적용했다. 계산기의 차콜·저채도 블루와 푸터의 보라 광원을 잇되, 좁은 읽기 폭·편집물형 헤더·5개 페이지 내비게이션·평평한 섹션 구획으로 별도 정보 공간을 표현했다. 기존 `/about` 금색 테마는 제거했다.
- 처음에는 가이드·수식의 기존 광고를 유지했지만, 최종적으로 다섯 문서 경로를 모두 광고 없는 구조로 통일했다. 법률 문구·표·외부 링크와 가이드·수식의 투자 위험 안내는 바꾸지 않았으며 모바일 표만 내부 가로 스크롤된다. 고정 언어·용어 선택기와 헤더가 겹치지 않도록 390px 상단 여유도 보정했다.
- 후속 보정으로 5개 경로의 상단 그라데이션을 `/terms`의 저채도 블루-그레이 값으로 통일하고, 가이드·수식도 최대 너비 920px로 맞췄다. 문구 길이가 가장 긴 페이지를 기준으로 한영 hero 높이를 예약해 헤더+5개 내비게이션이 경로 이동 때 흔들리지 않는다. 카드 안쪽에 빗금처럼 퍼지던 상단 광원은 푸터와 같은 `top: -1px`·1px·최대 210px 기본 블루 경계선으로 교체했다. 내비게이션은 서비스 소개 → 사용 가이드 → 수식 정의 → 이용약관 → 개인정보 순이다. 공용 `withAds` 분기와 가이드·수식의 광고용 `PageShell`을 제거했으며, 다섯 경로 모두 동의 상태와 무관하게 앱 수준 광고 허용을 끄고 요청을 정지한다.
- 검증: 전체 Vitest **642/642**, production build, 변경 파일 ESLint, Chrome 데스크톱·390×844 한영 5개 경로에서 동일 그라데이션·너비·헤더 높이, 상단선 계산 스타일, `/guide`·`/formulas` 광고 DOM·`PageShell` 0 및 문서 너비 920px, 가로 오버플로·콘솔 오류 0. 적용 커밋 `maintenance/public` **f7d90e5**, 후속 정렬 **eb29377**, 상단선 마감 **cc74597**, 1차 광고 차단 **2aedb54**, 내비게이션 순서 **3e15434**, 다섯 문서 무광고 통일 **f1b4759**. 운영 AdSense 활성화 시 공급자 측 Page exclusions에도 `/about`·`/guide`·`/formulas`·`/terms`·`/privacy`를 등록한다.

**2026-07-18 — 푸터 로고 균형형 팔레트로 선명도 복원**
- 푸터 배경에 맞추며 지나치게 회색화됐던 전용 방패 SVG를 차가운 블루(`#7183b8 → #596a94 → #46516a`)로 복원하고, 하단 22% 레드(`#bd5551 → #ef6657`)와 원본에 가까운 밝은 체크(`#f5f7fa`)를 적용했다. 브라우저 파비콘·방패 형태·체크 굵기·20px 크기·9px 간격은 유지하고 CSS 필터·불투명도·그림자는 추가하지 않았다.
- 검증: 푸터 5/5·전체 Vitest 642/642, 변경 테스트 ESLint, production build, diff check 통과. 인앱 브라우저 1280×900·390×844에서 20×20px·filter none·opacity 1, 블루/레드/체크 구분, 모바일 가로 오버플로 0, 콘솔 오류·경고 0을 확인했다. 적용 커밋 `maintenance/public` **0821773**. Notion 완료 [Task LV-41](https://app.notion.com/p/3a126e6d586f8194ad68c6236a47adb5)와 [Work Log](https://app.notion.com/p/3a126e6d586f81eb82bbc2f519467627) 기록 완료. 실배포는 수행하지 않았다.

**2026-07-18 — `/about` 제품 소개를 SaaS형 카피와 평면 CTA로 개편**
- 영웅 문구를 `포지션 위험을, 한 화면에서` / `See position risk in one place`로 교체하고, 본문을 제품 효용→제작 배경→계산 기준·브라우저 저장 신뢰 원칙의 3단 흐름으로 한영 모두 다시 썼다. 경고·재확인 중심 표현과 `검증 가능한 도구로` 문구는 제거했다.
- 푸터 회사정보와 중복되던 운영정보 카드를 없애고, 상단 구분선만 사용하는 반응형 문의 CTA를 추가했다. 공용 문서 셸·푸터·약관·수식은 변경하지 않았고 `/about` 메타 설명도 새 제품 서사에 맞췄다.
- 검증: 관련 16/16·전체 Vitest **645/645**, 변경 파일 ESLint, production build. 인앱 브라우저 1280×900·390×844 한영에서 문서→푸터 32px, 내부 하단 여백 데스크톱 49px·모바일 33px, 가로 오버플로·콘솔 오류 0. 적용 커밋 `maintenance/public` **876e129**. 동시 진행 중인 업데이트 페이지 변경은 부분 스테이징으로 제외했다. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f8120972ef6466f347fed)와 [Work Log](https://app.notion.com/p/3a126e6d586f81e48ec6e09e6fcd7fe5) 기록 완료.

**2026-07-18 — 공개 가이드의 폐기 기능 제거·필수 세팅/증거금 안내 교정**
- `/guide`의 한글 `시나리오 가격`과 영문 `Scenario price` 섹션을 삭제했다. 이어서 패널 위치를 나열하던 `입력 순서`를 실제 초기 세팅에 필요한 방향·계약수·약정가격·평가금액·현재가·계약승수·선택 모드의 유지/개시 증거금 안내로 바꾸고, 틱 크기는 선택값으로 분리했다.
- 증거금 모드는 국내/해외 구분을 없애고 비율=KOSPI 200·KOSPI 종목선물, 계약당=CME 주가지수·원유/금 등 원자재, 총액=브로커가 보유 포지션 전체 총액만 표시하는 경우로 한영 모두 설명했다. `/guide` 메타 설명과 재발 방지 테스트도 함께 갱신했으며 계산기 필드 툴팁·레거시 문서는 범위에서 제외했다.
- 검증: 가이드 관련 13/13·전체 **654/654**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 한영 `/guide`에서 새 섹션 렌더·국가 구분 제거·콘솔 오류 0건을 확인했다. 적용 커밋 `maintenance/public` **9a70d83**, 후속 교정 **87ed666**. Notion 완료 [Task LV-45](https://app.notion.com/p/3a126e6d586f81fda128c0089f0b7377)와 [Work Log](https://app.notion.com/p/3a126e6d586f81948ea9d67418ef3b51) 갱신 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 공개 첫 방문 모달을 신뢰 중심 디자인으로 통합**
- 서비스 안내·로컬 저장·개인정보/쿠키 설정을 공용 `TrustModalFrame`으로 통합했다. 포털, 배경 스크롤 잠금, 제목 초기 포커스, 내부 순환, 종료 후 복원과 모달별 Escape·배경 클릭 정책을 공통화하고, 16px 차콜 카드·얇은 경계·저채도 블루·4/8/16/24 간격으로 금융 도구다운 차분한 위계를 적용했다.
- 첫 방문 Provider 순서를 서비스 안내 → 저장 선택 → 비규제 지역 개인정보 설정으로 고정해 동시에 겹치지 않게 했다. 저장 선택→확인, 기존 저장 키·동의 데이터·Consent Mode 기본 거부·GA4/AdSense 적용·규제 지역 Google CMP 위임은 유지했다. 개인정보 모달은 기본 기능과 선택 기능, 현재 상태(기본 차단/거부/허용), 같은 무게의 거부·허용 버튼을 한영 i18n으로 제공한다.
- 검증: 전체 Vitest **674/674**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 1280×900·390×844 한영에서 3단 순서, 모달 폭 560/480/440px, 내부 스크롤·가로 오버플로·콘솔 오류 0, 허용 상태 재진입·Escape 닫기·포커스 복원을 확인했다. 적용 커밋 `maintenance/public` **f9544b1**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f81f7a91ddf623ab3b1b8), [Work Log](https://app.notion.com/p/3a126e6d586f818daf25c11221d45a01), [Design & Decision Log](https://app.notion.com/p/3a126e6d586f817596c6e4bb3fa8e83d), Release Notes 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 계약승수 툴팁 예시 순서를 나스닥→KOSPI200→원자재로 통일**
- 한글·영문 계약승수 도움말의 예시를 나스닥 E-mini, KOSPI200, 원유 순서로 정리하고 순서 회귀 테스트를 추가했다. 계산식·필드 의미·예시 수치는 변경하지 않았다.
- 검증: 관련 **6/6**·전체 Vitest **676/676**, 변경 파일 ESLint, production build, diff check 통과. 브라우저 실행 도구가 세션에 노출되지 않아 실제 hover 화면 QA는 미수행이다. 같은 worktree의 동시 작업 커밋 과정에서 문구는 **f9544b1**에 포함됐고, 회귀 테스트는 **cd6db28**로 분리해 커밋했다. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f81f19547d95ce52a3a98)와 [Work Log](https://app.notion.com/p/3a126e6d586f813c886ed6dfa64cdfa3) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — `/updates` 10개 단위 URL 페이지네이션 구현**
- 한영 업데이트를 id·ISO 날짜·분류·제목·요약의 단일 정적 데이터 모델로 통합하고 최신순 10개씩 표시하도록 했다. `/updates?page=2` URL 상태, page=1 제거, lang 등 다른 쿼리 보존, 잘못된 값·범위 초과 보정, 뒤로가기·앞으로가기와 목록 시작점 스크롤을 지원한다. 데스크톱 숫자 최대 5개, 모바일 3개와 `« ‹ › »` 이동, 접근성 라벨·현재 페이지·비활성 상태를 제공한다. 10개 이하에서는 컨트롤을 숨기고 실제 데이터 0개에서는 빈 상태를 유지한다. 네비게이션 제거 뒤 남은 hero 고정 높이·본문 상단 중복 여백도 해제했다.
- 검증: 관련 18/18·전체 Vitest **680/680**, 변경 파일 ESLint, production build, diff check 통과. 23개 임시 데이터로 10/10/3 분할, page 2·last·back, 영문 `?lang=en&page=2`, invalid/out-of-range normalization, 모바일 40×40px 7개 버튼·overflow 0을 확인한 뒤 가짜 데이터를 제거했다. 최종 빈 상태에서 table/pagination/nav 0, canonical·console error 0. 구현 `maintenance/public` **71dead1**, 병행 스테이징 분리 **dee0729**. Notion 완료 [Task LV-51](https://app.notion.com/p/3a126e6d586f81ea8671e1544d4b89f0)와 [Work Log](https://app.notion.com/p/3a126e6d586f8144935cdb225fbfd547) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 약정가격 툴팁의 지역 중심 용어 제거**
- 한영 약정가격 도움말에서 `원화 가격`·`해외선물`과 `cash price`·`overseas futures`를 제거했다. 보유 포지션의 평균 진입 가격이라는 뜻을 명확히 하고, 거래 화면 표시 단위·종목선물 주당 가격·지수선물 지수 포인트를 안내해 롱·숏과 상품군에 공통으로 쓰도록 정리했다.
- 검증: 전용 **2/2**·전체 Vitest **680/680**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 1280×720·390×844 한영에서 정확한 문구, 화면 내 배치, 가로 오버플로·콘솔 오류 0을 확인했다. 동시 작업 커밋 과정에서 문구는 **f9544b1**, 전용 회귀 테스트는 **a05d9ea**에 분리됐다. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f81e586dbe5d7cdee5bf7)와 [Work Log](https://app.notion.com/p/3a126e6d586f8136a85cc6aaeb114dcc) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 유지·개시증거금률 툴팁에 개념 설명 보강**
- 유지증거금률은 포지션을 계속 보유하기 위한 최소 증거금 비율이며 기준 미충족 시 마진콜·청산이 발생할 수 있다는 설명을, 개시증거금률은 새 포지션을 열 때 필요한 비율이며 일반적으로 유지증거금률보다 높다는 설명을 한영 툴팁에 추가했다. 약정가치 대비 소수 입력 예시와 고정 금액 모드 안내는 유지하고 양 언어 회귀 테스트를 더했다.
- 검증: 관련 **2/2**·전체 Vitest **680/680**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 한영 실제 툴팁에서 320px 폭 줄바꿈, 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **161d9a0**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f813c916be7f287f3db49)와 [Work Log](https://app.notion.com/p/3a126e6d586f81cca110f1143a6eeaf8) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 추가 주문 계약수 툴팁의 롱·숏 부호 의미 명확화**
- 한영 추가 주문 계약수 도움말에 양수는 선택한 포지션 확대, 음수는 축소라는 기준을 명시하고, 롱은 `+ 매수 / − 매도`, 숏은 `+ 매도 / − 매수(환매)`로 실제 방향을 구분했다. 계산 로직·가이드·반대 포지션 전환 제한은 변경하지 않고 양 언어 회귀 테스트를 추가했다.
- 검증: 전용 **2/2**·전체 Vitest **682/682**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저 1280×720·390×844 한영에서 320px 툴팁 문구, 화면 내 배치, 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **d3a2758**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f819c84e1dd6942893138)와 [Work Log](https://app.notion.com/p/3a126e6d586f81a68948d9f41772c7f0) 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 업데이트 페이지네이션에 차분한 페이지 전환 모션 적용**
- 페이지 번호를 누르면 목록이 즉시 바뀌던 흐름을 현재 목록 160ms 퇴장 → URL·목록 교체 → 새 목록 240ms 진입으로 바꿨다. 목록 전체가 8px 위로 빠졌다가 새 페이지가 12px 아래에서 들어오며, `aria-busy`로 전환 상태를 노출한다. 뒤로가기 중 기존 모션이 진행 중이면 예약을 취소하고 실제 URL 상태 기준으로 새 전환을 시작한다.
- `prefers-reduced-motion`에서는 JavaScript 지연과 CSS 모션을 모두 제거해 즉시 전환한다. 23개 임시 데이터로 10/10/3 페이지를 만든 뒤 데스크톱·390×844 모바일, 한영, page 1→2→3, 모션 감소, 40px 버튼·가로 오버플로를 검수하고 임시 데이터는 제거했다.
- 검증: 관련 **15/15**·전체 Vitest **686/686**, 변경 파일 ESLint, production build, diff check 통과. 실제 전환 중 퇴장 `opacity 0.86/translateY -1.1px`, 진입 `opacity 0.29/translateY 8.5px`, 종료 `idle`, 모바일 overflow 0, 콘솔 오류·경고 0을 확인했다. 적용 커밋 `maintenance/public` **f113203**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f811c8957f0505502595a), [Work Log](https://app.notion.com/p/3a126e6d586f811e8fedce0509267496), Release Notes 기록 완료. 운영 배포는 수행하지 않았다.

**2026-07-18 — 분석·맞춤 광고 선택 분리와 거부 후 privacy-treated 광고 지원**
- 비규제 지역 개인정보 설정을 `동의하지 않고 계속`·`모두 허용`·`세부 설정`의 1차 화면과 분석/맞춤 광고 독립 스위치로 나눴다. 모두 거부하거나 맞춤 광고만 끄면 Google Consent Mode의 광고 저장·사용자 데이터·맞춤설정을 거부한 채 AdSense 요청은 재개하고, `requestNonPersonalizedAds=1`로 일반·제한 광고가 가능하도록 했다. 기존 단일 허용/거부 저장값은 새 두 선택으로 자동 변환한다.
- 한영 안내·개인정보처리방침·접근성 이름·모바일 토글 UI와 광고 요청 단위 테스트를 함께 보강했다. 검증: 전체 Vitest **691/691**, 변경 파일 ESLint, production build, diff check 통과. 인앱 브라우저에서 분석만 켠 선택이 재진입 후 유지되고 1280×720·390×844 한영 모달의 가로 오버플로·콘솔 오류 0을 확인했다. 적용 커밋 `maintenance/public` **a54550e**. Notion 완료 [Task](https://app.notion.com/p/3a126e6d586f817ab0e6dc49c5432834), [Work Log](https://app.notion.com/p/3a126e6d586f813498cbe787ab8dc24b), [Decision Log](https://app.notion.com/p/3a126e6d586f81c69223c9d4e10d3c60) 기록 완료. 실제 AdSense ID·Google CMP·대시보드 제한 광고 설정과 운영 배포는 아직 하지 않았다.

**2026-07-20 — 공개 SaaS 푸터 본체를 dev에 이식**
- `maintenance/public`의 LiqGuard 방패 워드마크, 차콜·보라 광원, 상단 라운딩, 회사정보 6칸을 `dev`에 수동 이식했다. 공개판 전용 페이지·Google 동의 컨텍스트는 가져오지 않고 계산기·Pro·가이드, 회사·문의·후원, 피드백 3종, 약관·개인정보·환불과 조건부 서비스 안내 재열기 등 dev 링크를 유지했다. 운영자 환경변수 계약과 반응형 회귀 테스트를 추가했다.
- 검증: 최초 전체 Vitest **642/642**, 후속 정렬 보정 후 **644/644**, production build, 변경 TypeScript ESLint, diff check 통과. 인앱 브라우저 1280×900·390×844 한영과 `/`·`/guide`·`/formulas`·`/my`·`/records`·`/admin/feedback`·`/kit`에서 회사정보 6칸, 내부 오버플로·콘솔 오류 0을 확인했다. 계산기→위험 안내 80px, 위험 안내→푸터 32px을 실측했다. 좁은 데스크톱 푸터에서 4열이 잘리던 최소폭을 제거한 뒤 `/kit` 900px 프레임에서 본문 `clientWidth = scrollWidth = 832px`, 내비게이션 우측 넘침 0을 재확인했다. `/records` 데스크톱의 기존 900px 패널과 `/kit` 3600px 전시장 전체 폭은 푸터 밖 기존 레이아웃임을 분리 확인했다.
- 적용 커밋 `dev` **efd3437**, 후속 정렬 보정 **dc07649**. Notion 완료 [Task](https://app.notion.com/p/3a326e6d586f81f6ab84cd4a365e56eb)와 [Work Log](https://app.notion.com/p/3a326e6d586f81b4b754de31e7dba3e5) 기록 갱신 완료. 실제 법인정보 환경변수 반영, 푸시·배포는 수행하지 않았다.

**2026-07-23 — 숫자세트 로컬 저장 안내를 패널 하단으로 이동**
- `dev` `/my` 숫자세트의 로컬 저장 안내를 `이 기기 세트` 카드 내부 아이콘 안내에서 이 기기·클라우드 그룹 아래의 작은 보조문구로 옮겼다. 문구는 `이 기기 세트는 이 브라우저에만 저장되며, 브라우저 데이터 삭제 시 함께 사라집니다.`와 대응 영문으로 짧게 정리하고 저장·클라우드·자동 기록 동작은 유지했다.
- 검증: 관련 **12/12**·전체 Vitest **735/735**, TypeScript 포함 production build, 기존 `MyPage.tsx` effect 규칙 제외 변경 파일 ESLint, diff check 통과. UI 키트 1920×855·390×844 한영에서 카드 밖 하단 배치, 13px 보조문구, 패널 내부 가로 오버플로 0을 확인했다. 로그인 상태 실제 `/my` 데이터는 미검증이다.
- 적용 커밋 `dev` **b5122ff**. Notion [Task LV-77](https://app.notion.com/p/3a526e6d586f81c5a4cfef4a338749f0) 갱신과 [Work Log](https://app.notion.com/p/3a526e6d586f81259419d6fb00e72423) 기록 완료. 푸시·배포는 수행하지 않았고 병행 중인 클라우드 활성 세트 선호도 변경은 커밋에서 제외했다.

**2026-07-25 — AdSense 법인 연결·사이트 심사 요청**
- 법인용 Google AdSense 지급 프로필과 `liqguard.com` 사이트 연결을 완료했다. Production에 `ca-pub-3778648907823044`, 정확한 `ads.txt`, 법인명·대표자·주소·사업자등록번호·개인정보 보호책임자를 설정하고 일반 검색 `noindex`는 유지한 채 `Mediapartners-Google`·`Google-Display-Ads-Bot`만 허용했다. Google CMP는 동의·거부·옵션 관리의 3가지 선택 메시지로 생성했다.
- 검증: 전체 Vitest **720/720**, 변경 파일 ESLint, TypeScript 포함 production build 통과. `liqguard.com`에서 HTTP 200·AdSense meta·exact ads.txt·크롤러별 robots 허용·일반 검색 차단·meta/header noindex를 확인했다. Chrome 실화면에서 공식 법인정보와 소유권 확인 성공, `리뷰가 요청됨`, CMP 저장을 확인했고, 발견한 가짜 통신판매업 예시값은 미설정 시 숨기도록 교정했다.
- 적용 커밋 `maintenance/public` **ce9fd03**, **5ac150e**, **b910d1a**, 최종 Vercel 배포 **dpl_89wepc9RxD2eGb6mHao5VGossbs2**. Notion [Task LV-8](https://app.notion.com/p/39926e6d586f8167ba2ec366525a5bdf)·[Work Log](https://app.notion.com/p/3a826e6d586f8120bff2c8b64542ac07)와 8월 7일 Google Calendar 일정을 갱신했다. 남은 외부 게이트는 Google 최종 승인·ads.txt 대시보드 반영·실제 광고 게재 및 VPN 기반 CMP QA다.

**2026-07-25 — 공개판 공통 선물 용어세트 단일 고정**
- `maintenance/public`은 지수·종목·원자재 선물을 다루지만 상품별 용어를 선택하거나 바꾸지 않는다. 상단 용어 선택기를 제거하고 LanguageContext가 구버전 프리셋을 복원·영속화·오버라이드하지 않게 했으며, 한국어 `약정가격·계약승수(계약크기)`와 영어 `Entry price·Contract multiplier` 공통 용어를 항상 사용한다. 개인정보 문서에서도 용어 프리셋 저장 설명을 제거했고 계산식·입력값은 유지했다.
- 검증: 집중 **25/25**·전체 Vitest **725/725**, TypeScript 포함 production build, diff check 통과. 변경 파일 ESLint는 신규 오류 없이 HEAD에도 있는 `LanguageContext.tsx` Fast Refresh 1건만 재현됐다. 인앱 브라우저에서 용어 combobox 0개, 한영 공통 용어, 새로고침 유지, 콘솔 오류 0을 확인했다.
- 처음 만든 3종 선택 해석 **f2fa858**은 요구와 달라 최종 교정 커밋 **6dd0084**에서 바로잡았다. Notion 완료 [Task](https://app.notion.com/p/3a826e6d586f81988aa8d2b73fbd108d)·[Work Log](https://app.notion.com/p/3a826e6d586f81049448cadfa7dd6124)도 정정했다. `dev` 전파와 push·배포는 수행하지 않았다.

**2026-07-28 — 비율 증거금·청산가 현재가 기준 통일**
- `dev` 비율 입력 모드에서 결과표의 유지·위탁증거금과 레버리지가 진입가 기준인데 청산가는 현재가 기준이던 혼용을 제거했다. 진입가·현재가가 같은 가격 축이면 현재 명목가치를 사용하고, `fixedSpec` 또는 가격 축이 다른 해외선물식 명목값은 기존 고정값을 유지한다. 역할 필드 도입 전 저장값도 보수적인 가격축 판별로 지원한다.
- 사용자 사례(계좌평가금 28,229,439·진입가 279,500·현재가 243,500·41계약·승수 10·유지율 0.247)에서 유지증거금 24,659,245·여유 +3,570,194·청산가 231,936·레버리지 3.54를 회귀 테스트와 로컬 실화면으로 확인했다.
- 검증: 집중 **142/142**·전체 Vitest **763/763**, 변경 파일 ESLint, TypeScript 포함 production build 통과. 인앱 브라우저 결과표·주문 전 표 일치와 콘솔 경고/오류 0을 확인했다. 적용 커밋 `dev` **c0bdec3**. Notion 완료 [Task](https://app.notion.com/p/3ab26e6d586f816a8499c666a0129e6e)·[Work Log](https://app.notion.com/p/3ab26e6d586f814b8d1ec65d3ffbc0a0) 기록 완료. 실제 증권사별 포트폴리오 증거금·반대매매 시점은 미검증이며, `dev` 배포는 위 2026-07-29 배포 기록에서 완료했다.

**2026-07-28 — 청산가 통과 후 값 보존**
- `dev`에서 현재가가 계산된 청산가를 지나면 청산가격이 `-`로 바뀌던 동작을 수정했다. 양수·유한 청산가는 현재가 반대편으로 넘어가도 기준값으로 보존하고, 유지증거금 부족은 계산 차단 오류가 아니라 위험 경고로 처리해 평가·주문 시뮬레이션 모두 숫자를 유지한다.
- 사용자 후속 사례(롱 41계약·승수 10·진입가 279,500·현재가 230,000·계좌평가금 22,694,439·유지율 0.247)에서 청산가 231,936·청산 여유 -0.84·유지증거금 여유 -597,661과 위험 강조를 회귀 테스트와 로컬 실화면으로 확인했다.
- 검증: 집중 **76/76**·전체 Vitest **764/764**, 변경 파일 ESLint, TypeScript 포함 production build, diff check 통과. 인앱 브라우저 결과 카드·주문 전 표에서 청산가 숫자 유지와 콘솔 경고/오류 0을 확인했다. 적용 커밋 `dev` **2b59981**. Notion 완료 [Task](https://app.notion.com/p/3ab26e6d586f81c3b6afcaefd860aa35)·[Work Log](https://app.notion.com/p/3ab26e6d586f813591aecc7bffca0892) 기록 완료. 실제 증권사별 장중 반대매매 시점과 push·배포는 미검증/미수행이다.

**2026-07-29 — dev 계산·저장·기록 개선 배포**
- `maintenance/public`의 **b276ccc**를 `dev` **789a1eb**로 체리픽해 청산가격·청산 여유 카드의 `청산위험` 보조 문구만 제거하고 기존 빨간 `danger` 강조와 청산가 숫자는 유지했다. 후속 **9ea4287**에서 롱·숏 모두 청산가 도달·통과 시 청산 여유 (%)만 `-`로 숨기고 내부 계산값과 청산까지 가격폭은 보존했다. `dev`의 현재가 기준 증거금·교차 후 청산가 보존·청산 여유 표시 수정은 `maintenance/public` **e09f8de**로 전파했다.
- 주문 평균가는 두 브랜치 구현이 동일하다. 사용자 화면의 `-12`는 롱 41계약 중 12계약 축소라 남은 포지션 평균가 279,500이 유지되는 것이 정상이고, 같은 221,000 가격의 `+12` 확대 주문은 266,254.716981로 변경됨을 확인했다.
- 검증: `dev` 전체 Vitest **767/767**, 공개판 **729/729**, production build와 diff check 통과. 양 브랜치 로컬 한국어 실화면에서 위험 구간은 청산가격 231,936·청산 여유 `-`, 정상 구간은 청산가격 231,936·청산 여유 -4.75, 주문 전 표 일치, 빨간 카드 유지와 콘솔 경고/오류 0을 확인했다. 클라우드 저장 성공의 `cloudNumberSets` 갱신이 `persistInputs` 참조를 바꿔 자동저장을 재실행하던 피드백 루프는 `dev` **9771968**에서 최신 슬롯 목록을 ref로 분리해 제거했고, 의존성 재유입 방지 테스트를 추가했다. Notion 완료 [Task LV-92](https://app.notion.com/p/3ab26e6d586f81b68f06d53e7d3116ba)·[Task LV-93](https://app.notion.com/p/3ab26e6d586f81f3bdccf51b6175f45b)·[Work Log](https://app.notion.com/p/3ab26e6d586f81238222cbff957b6ba7)을 기록했다. 로컬 브라우저 로그인 부재로 실제 Supabase 요청 횟수 계측, push·배포는 수행하지 않았다.
- `dev` **32920db**에서 활성 숫자세트 팝업의 로컬↔로컬·로컬↔클라우드·클라우드↔클라우드 값/프리셋 드래그 복사와 한영 툴팁·드롭 강조를 추가했다. 대상 세트의 이름·ID·저장 위치와 클라우드 메모·자동 스냅샷·롤오버 설정은 보존한다. 주문 헤더에는 주문 계약수·가격만 초기화하는 `비우기`를 추가했고 주문 미리보기 중에는 진입 전 계좌 기준값 복원과 미리보기 종료를 함께 수행한다. 전체 Vitest **774/774**와 production build, 기존 lint 오류가 없는 변경 파일의 ESLint, 로컬 실화면의 주문 입력 초기화·버튼 상태·숫자세트 행 드래그 속성/툴팁을 확인했다. 비로그인 무료 환경의 세트 한도 때문에 실제 2행 간 브라우저 드롭과 Supabase 쓰기는 자동 테스트로만 검증했다. 전체 ESLint는 기존 `.recovery` 파싱·React Hook 규칙 오류 때문에 실패했고 push·배포는 수행하지 않았다.
- `dev` **32696f5**에서 기록 타임라인의 50px 행 리듬은 유지하고 카드 최소 높이 48→42px·세로 패딩 9→6px로 줄여 행 사이 유격을 확보했다. 전체 Vitest **775/775**, 변경 테스트 ESLint, production build와 diff check를 통과했다. 배포된 인증 화면의 기존 카드 48px·패딩 9px은 계측했으나 브라우저 DOM 쓰기 제한 때문에 변경 CSS의 로그인 실화면 렌더는 직접 캡처하지 못했다. 함께 조사한 입력 `비우기`는 빈 입력 자동저장 분기가 활성 숫자세트를 삭제하고 클라우드에서는 주문·스냅샷을 cascade 삭제하는 Critical 버그로 확정해 `docs/bugs.md`와 Notion [완료 Task LV-95](https://app.notion.com/p/3ab26e6d586f81b4bf8dce7677d3f8a3)·[수정 대기 Task LV-96](https://app.notion.com/p/3ab26e6d586f81a9bc89c6c370c41c6b)·[Work Log](https://app.notion.com/p/3ab26e6d586f8102a792d7fba2237550)에 기록했다. 실제 데이터 파괴 재현과 수정·push·배포는 하지 않았다.
- 후속 `dev` **30f6e87**에서 사용자 제공 카드 DOM을 기준으로 내부 여백을 재검토해 카드 최소 높이 42→38px·세로 패딩 6→3px로 한 단계 더 줄였다. 내부 `dl`·숫자 값에는 별도 세로 padding이 없어서 가로 10px, 숫자 line-height, 체크박스·메모 버튼 크기와 50px 행 리듬은 그대로 유지했다. 전체 Vitest **779/779**, 변경 테스트 ESLint, production build와 diff check 통과. 공개판은 이미 별도 `6px 8px` compact 규칙을 사용해 전파하지 않았다. Notion [Task LV-95](https://app.notion.com/p/3ab26e6d586f81b4bf8dce7677d3f8a3)·[Work Log](https://app.notion.com/p/3ab26e6d586f8115a10df9e8e3b0ef02) 갱신 완료.
- 후속 `dev` **8e0d8ad**에서 빈 입력을 삭제 신호가 아닌 정상 저장값으로 바꿔 활성 로컬·클라우드 세트와 이름·프리셋·메모·자동화 설정·연결 기록을 보존하고 빈 입력 클라우드 세트도 존재하는 저장 슬롯으로 복원한다. `maintenance/public` **d168d7e**는 공개 전용 컨텍스트에서 입력만 초기화하고 로컬 저장 설정·키를 유지하며 기본 입력값 초안도 복원한다. 검증: `dev` 집중 **59/59**·전체 **779/779**, 공개 집중 **12/12**·전체 **731/731**, 양쪽 production build·diff check 통과. 공개 localhost 실화면에서 12,345,678 저장→비우기→로컬 저장 활성·체크 유지→새로고침 후 빈 입력 복원과 콘솔 경고/오류 0을 확인했다. 실제 계정의 Supabase 쓰기·연결 기록 보존은 회귀 계약으로 검증했고 실제 데이터 파괴 재현·push·배포는 하지 않았다. Notion [Task LV-96](https://app.notion.com/p/3ab26e6d586f81a9bc89c6c370c41c6b)·[Work Log](https://app.notion.com/p/3ab26e6d586f819fbc0cd7842ba1956b) 완료.
- `dev`의 원격 미반영 10개 커밋 **c0bdec3..30f6e87**을 `origin/dev`에 푸시하고 Vercel `lvclac-dev` Production **dpl_3vyfwbauYPQNUYwGquNqpx9xL23d**로 배포했다. 배포 전 전체 Vitest **779/779**와 production build를 통과했고, `devpilgrm.liqguard.com`의 실제 저장 입력(계좌평가금 14,873,119·진입가 279,500·현재가 208,000·31계약·승수 10)에서 현재가 기준 약정가치 64,480,000·레버리지 4.34·유지증거금 여유 -1,053,441, `-3`계약 주문 후 레버리지 3.92·유지증거금 여유 +487,839와 DEV 배지·브라우저 경고/오류 0을 확인했다. 로그인 세션은 보였지만 데이터 변경은 하지 않았고, 실제 Supabase 쓰기·cron·billing은 이번 배포 smoke 범위에서 제외했다.

**2026-07-29 — 현재가·주문가격 실시간 연동**
- `dev` **ce18461**과 `maintenance/public` **632aab7**에서 현재가 입력 옆 `🔗`를 누르면 주문가격을 즉시 현재가로 맞추고 이후 현재가 변경도 한 방향으로 동기화하도록 했다. 연동 중에는 현재가·주문가격 양쪽 버튼이 정적인 파란 글로우 `🔗`로 표시되며 주문가격 직접 입력·틱 스테퍼·드래그 스크럽은 값을 적용하면서 즉시 연동을 해제해 기존 `현` 1회 복사 버튼으로 복귀한다. 포커스만으로는 해제하지 않고 주문 적용 후에는 연동을 유지해 새 현재가로 주문가격을 다시 맞추며, 주문 비우기·전체 입력 초기화는 연동을 끈다.
- 양 브랜치에서 연동 상태를 저장 초안과 계산기 기록에 포함하고 구버전·불일치 저장값은 복원 시 보정했다. public에는 주문 계약수·가격만 지우고 미리보기 중이면 진입 전 계좌 기준값을 복원하는 주문 패드 `비우기`도 함께 전파했다. 상태 전이·저장 복원·기록 UI·접근성 속성 회귀 테스트를 추가했다.
- 검증: dev 집중 **70/70**·전체 Vitest **789/789**, public 전체 Vitest **745/745**, 양쪽 변경 파일 ESLint·TypeScript 포함 production build·diff check 통과. dev 1280×720·428×900·390×844·1920×1080, public 1280×900·390×844 인앱 브라우저에서 연동/직접 입력/`현` 복사/현재가 변경/틱 해제 또는 주문 비우기와 글로우·버튼 전환·가로 오버플로 0·콘솔 경고/오류 0을 확인했다. public 전체 ESLint는 기존 `.recovery` 파싱·React Hooks·Fast Refresh 등 **32 errors/5 warnings** 기준선 오류로 실패했다. Notion 완료 [Task](https://app.notion.com/p/3ac26e6d586f816cb32cf4fe13a9a28c)·[dev Work Log](https://app.notion.com/p/3ac26e6d586f816097e5e061ac579d6d)·[public 전파 Work Log](https://app.notion.com/p/3ac26e6d586f81e2901ee5ffdc49ea65) 기록 완료. push·Vercel 배포·운영 도메인 smoke는 수행하지 않았다.

**2026-07-30 — 공개판 미배포 9커밋 Production 배포**
- `liqguard.com`의 이전 Vercel Production 소스가 `maintenance/public` **b910d1a**임을 API 메타데이터로 확인하고, 로컬 앱 변경 HEAD **632aab7**까지 미배포 9커밋을 확정했다. 계산 로직 보정·공개판 용어 고정·입력 비우기 시 로컬 저장 유지·현재가와 주문가 연동 변경을 포함해 Vercel `awesome-s-projects1/lvclac` Production에 배포하고, 기록 커밋 **0a4395c**까지 포함한 최종 배포 **dpl_6Df4ySYYDcjRgsqMSfyk59t7C7J1**로 정합성을 맞췄다.
- 검증: 전체 Vitest **745/745**, TypeScript 포함 production build 통과. 배포 `READY`, 최종 소스 SHA **0a4395c**, `liqguard.com` 별칭, 홈과 `/guide`·`/formulas`·`/updates`·`/about`·`/company`·`/terms`·`/privacy` HTTP 200, 새 번들, `noindex`, AdSense 메타, 전용 크롤러 허용 robots.txt와 정확한 ads.txt 행을 확인했다. 실브라우저 상호작용과 AdSense 대시보드 승인·실제 광고 게재는 이번 범위에서 확인하지 않았다.
- Notion 완료 [Task](https://app.notion.com/p/3ad26e6d586f815d9902f8933782cfb8)·[Work Log](https://app.notion.com/p/3ad26e6d586f81abb4d9d6d4306be733)·[Release](https://app.notion.com/p/3ad26e6d586f81e78440e4e068255228) 기록 완료. 8월 7일 런칭 전 `ALLOW_INDEXING`은 변경하지 않았고 Calendar 일정도 유지했다.

**2026-07-31 — 공개 사이트 검색 크롤링·색인 조기 허용**
- 사용자의 명시적 요청에 따라 Adsterra 등 새 광고망은 추가하지 않고 Vercel `awesome-s-projects1/lvclac` Production의 `ALLOW_INDEXING`만 `true`로 전환했다. 정식 공개 공지·결제·나머지 런칭 게이트는 2026-08-07 일정을 유지한다. 일정 문서는 `maintenance/public` **908d6cf**에서 이 경계를 반영했다.
- 검증: 색인 허용 분기 집중 Vitest **9/9**, `ALLOW_INDEXING=true` production build, 배포 **dpl_CHUuD9zKBgMQ7fmdbLjdoDtxxAQ4** `READY`. `liqguard.com` 공개 6경로 HTTP 200, HTML robots meta와 응답 `X-Robots-Tag` 제거, `robots.txt` 전체 허용, sitemap 6 URL을 확인했다. AdSense 계정 메타와 정확한 ads.txt 행은 유지되고 `devpilgrm.liqguard.com`은 계속 `X-Robots-Tag: noindex, nofollow`다. 검색엔진 실제 수집·색인 시점과 AdSense 승인 상태는 외부 시스템 결정이라 아직 미확인이다.
- Notion [Task LV-8](https://app.notion.com/p/39926e6d586f8167ba2ec366525a5bdf)·[Work Log](https://app.notion.com/p/3ae26e6d586f8120aceadb3d946faff2)·[Release](https://app.notion.com/p/3ae26e6d586f81f3831ef37351568189)를 갱신했고 8월 7일 Google Calendar 이벤트도 검색 전환 완료 상태로 정정했다.

**2026-07-31 — 모바일 스테퍼 숫자패드·첫 탭 지연 수정**
- `dev` **33bdc1c**와 `maintenance/public` **bfc00ee**에서 터치·펜 스테퍼가 숫자 입력창에 강제 포커스를 주지 않도록 분리해 모바일 OS 입력패드가 새로 열리며 첫 `pointerup`이 끊기던 원인을 제거했다. 마우스는 기존 포커스 동작을 유지하고, 드래그 스크럽 버튼은 제스처를 직접 소유한다.
- 입력창에 이미 타이핑 중인 미확정 숫자가 있으면 마지막 전역값 대신 해당 draft를 기준으로 다음 틱을 계산하고 입력 표시와 전역 `inputs`를 함께 맞춘다. 클라우드 저장은 blur 직접 호출이 아니라 전역 `inputs` 변경 후 500ms 디바운스라는 기존 계약을 유지하며, 취소된 스크럽 포인터는 탭으로 오인하지 않는다.
- 검증: dev 집중 **72/72**·전체 Vitest **795/795**, public 전체 **754/754**, 양쪽 변경 파일 ESLint와 TypeScript 포함 production build·diff check 통과. dev 390×844에서 1,000→1,100, public에서 1,000→1,001 첫 틱과 미확정 2,000→2,100, `touch-action: none`, 가로 오버플로 0·콘솔 오류 0을 확인했다. public은 500ms 뒤 localStorage `savedAt`과 `currentPrice: 2100` 갱신까지 확인하고 테스트 데이터를 원상 복구했다. 실제 iOS/Android OS 키보드와 로그인 Supabase 쓰기는 미검증이며 push·배포는 수행하지 않았다. Notion 완료 [Task LV-99](https://app.notion.com/p/3ae26e6d586f815291b2deacbb9d021d)·[dev Work Log](https://app.notion.com/p/3ae26e6d586f81f9a6e1c6272a2d37dc)·[public Work Log](https://app.notion.com/p/3ae26e6d586f8101bbc3fbdf97724228)·QA / Test Plan 갱신 완료.

**2026-08-02 — 클라우드 snapshot SWR 캐시 구현·운영 배포**
- `dev` **a1a839e**에서 마이페이지→계산기 복귀를 SPA 이동으로 바꿔 CalculatorProvider 메모리를 유지하고, 실제 새로고침·새 탭은 계정별 브라우저 snapshot을 즉시 복원한 뒤 active cloud set ID와 모든 세트의 `id,updated_at`만 비교하도록 했다. revision이 다를 때만 전체 입력을 다시 읽고, 미저장 편집의 서버 덮어쓰기와 로그아웃·계정 전환의 캐시 노출을 차단했다.
- 검증: 집중 **49/49**·전체 Vitest **830/830**, TypeScript 포함 production build, diff check 통과. 운영 마이페이지 링크와 브라우저 기본 뒤로가기 모두 document navigation **0회**, 활성 세트·입력 유지, 전체 `inputs` 조회 **0회**였고 active ID·revision 2건만 조회했다. 1,200ms 지연 재로드에서도 전체 입력 조회 없이 cache-first 표시와 콘솔 경고·오류 0을 확인했다.
- `origin/dev` 푸시와 Vercel Production **dpl_BSgogLmdrTBT3zkwUbCNkCUEqbx4** `READY`·`devpilgrm.liqguard.com` 200 확인 완료. 실제 교차 기기 변경 E2E와 기기·회선별 절대 시간은 남았다. Notion 완료 [Task LV-104](https://app.notion.com/p/3b026e6d586f81b2929deb9c764a5cb4)·[ADR](https://app.notion.com/p/3b026e6d586f8120ac04f115e57a4cfb)·[Work Log](https://app.notion.com/p/3b026e6d586f81e791c3dacf0aadc6b7)·QA / Test Plan·Release Notes 기록 완료. public은 로그인·클라우드가 없어 앱 코드 전파 대상이 아니다.

**2026-08-03 — 활성 저장 슬롯 재클릭 삭제 회귀 복원**
- `dev` **6e3a13d**에서 다중 숫자세트 UI 도입 때 단순 `return`으로 바뀐 활성 로컬·클라우드 저장 슬롯 재클릭 분기를 기존 삭제 확인 흐름에 다시 연결했다. 확인 후 현재 활성 숫자세트를 삭제하고 입력을 초기화하며 저장을 끄고, 삭제 실패 시 확인창을 유지하면서 중복 실행을 막는다. 입력 패널 `비우기`의 숫자세트·연결 기록 보존 계약은 그대로다.
- 클라우드 숫자세트 삭제는 연결 주문·스냅샷 기록도 함께 삭제되는 실제 범위를 한영 확인 문구에 명시했다. 검증: 집중 **42/42**·전체 Vitest **831/831**, TypeScript, 변경 파일 ESLint, production build, diff check 통과. 로컬 실브라우저에서 `12,345,678` 저장→활성 슬롯 재클릭→확인창→삭제 후 입력 공란·`저장 안 함` 활성·로컬 아이콘 stored/active 제거·콘솔 경고/오류 0을 확인했다.
- `origin/dev` 푸시와 Vercel Production **dpl_AdBqFpQVTagnXfcyqdfLwMnEMwvv** `READY`·`devpilgrm.liqguard.com` 반영을 완료했다. 운영 브라우저에서도 동일한 로컬 삭제 흐름과 콘솔 경고/오류 0을 재확인했다. 실제 계정 클라우드 삭제는 수행하지 않았고 public은 별도 저장 UI라 이번 배포 대상이 아니다. Notion 완료 [Task](https://app.notion.com/p/3b126e6d586f81028b08fbe9db86ad07)·[QA](https://app.notion.com/p/3b126e6d586f81dd9ddbe9198f9ec242)·[Work Log](https://app.notion.com/p/3b126e6d586f810898c8c63d59f282da)·[Release](https://app.notion.com/p/3b126e6d586f81c297e4f3e0a7b0d399) 기록 완료.

**2026-08-03 — 공개·DEV 첫방문 맞춤 사용법 가독성 개선**
- `maintenance/public` **7ff466c**에서 첫방문 `4 / 6 · 맞춤 사용법`의 긴 동일 위계 문장을 상황 배지→3단계 순서 목록→굵은 행동 제목·짧은 설명→입력값 칩으로 재구성했다. 보유 포지션을 선택한 경우에만 카메라 아이콘과 함께 계좌평가금액·현재가를 가능하면 한 화면에서 캡처하고 증권사 종합잔고 페이지에서 확인하라는 안내를 표시한다. `dev` **86d359a**는 같은 정보 구조와 한영 카피·`ol/li/strong/aside` 접근성 마크업을 `5 / 7` 단계에 수동 이식하면서 지역·종목·저장·인증·클라우드 동작을 유지했다.
- 검증: 공개 집중 **23/23**·전체 **758/758**, DEV 집중 **22/22**·전체 **834/834** Vitest, 양쪽 production build·변경 파일 ESLint·diff check 통과. 로컬 실브라우저 데스크톱과 375×812에서 단계 번호·핵심 3단계·입력값 칩·캡처 팁·스크롤·고정 푸터를 확인했고 콘솔 경고/오류 0이었다. 운영 도메인·실사용자 정성 테스트는 미검증이며 양쪽 push·Vercel 배포는 수행하지 않았다. 공개 [Task](https://app.notion.com/p/3b126e6d586f8176a37cd91d253997e7)·[Work Log](https://app.notion.com/p/3b126e6d586f813b8c97e9fa7839afa5)·[Release](https://app.notion.com/p/3b126e6d586f81beb6ebf26ff5c3a28f), DEV [Task](https://app.notion.com/p/3b126e6d586f816e8c5aedba0e371164)·[Work Log](https://app.notion.com/p/3b126e6d586f814486ecc64e83fe7b21)·[Release](https://app.notion.com/p/3b126e6d586f81b1a2dcc038d57adef1) 기록 완료. 8월 7일 Calendar 일정은 공개판 배포 전 상태로 유지한다.
