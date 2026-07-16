# lvclac 프로젝트 메모리

상태: lvclac repo 전용 장기 메모리
전역 공통 지침: [`C:\Users\rlarb\Documents\agent-global-memory.md`](C:\Users\rlarb\Documents\agent-global-memory.md)

=================================================================
아래는 사람이 작성하는 칸 입니다. ai는 건들지마세요.

## 소통

- 설명 및 답변은 아주아주 쉽게 하세요.
- 작업은 내가 판단하는 데 도움이 될 대략적인 예상 시간이나 작업량을 함께 알려주세요.
- 내가 웹에서 직접 처리해줘야하는 일이 있으면 여러분이 브라우저 제어툴로 화면을 켜서 '이것만 클릭하시면 됩니다'하고 안내합니다.
- 자주 웃어주세요. 요즘 심적으로 힘듭니다.


## 작업 참고 및 최신화

1. 새 세션은 Whimsical, Notion, Google Calendar를 반드시 상세히 읽어서 프로젝트 이해도를 높이고 무엇을 해야 하는지 확인하세요.
2. 일이 끝나면 Whimsical, Notion, Google Calendar에 체계적으로 정리하여 최신 상태로 업데이트하세요.
   관련 내용이 있는지만 확인하지 말고, 본인이 한 일을 기록하는 겁니다.

Whimsical, Google Calendar는 관련 내용만 최신화하고 관련 내용이 없으면 건들지 않습니다.
Notion을 최신 기준으로 사용합니다. 작업 결과는 관련 Task, Release Notes, QA/Incident, 또는 관련 문서에 기록합니다.

3. Whimsical에서는 텍스트만 수정하세요. 배치나 디자인은 내가 예쁘게 만들어둔 상태를 건드리지 마세요.
   컴포넌트를 붙여야 할 때는 기존 컴포넌트를 건드리지 말고 주변부에 붙여두세요. 나중에 내(인간)가 정리할게요.

4. 작업이 끝나면 본인 변경분을 꼭 커밋하세요. 커밋메시지도 상세히 적으세요.

5. 미뤄둔 일은 backlog에 기록하고, 당장 이어서 할일은 tasks db에 기록합니다.

6. tasks db인 https://app.notion.com/p/9677d2bd9bb74376a7ee964292978f24?v=61e5027eeaca4942bbb24bc71475d7cf 에는 현재 진행중인 업무들의 상세한 기록이 있습니다. 새 세션은 코드베이스와 함께 이걸 읽어서 프로젝트 이해도를 높이세요.

7. 매번 제가 프로젝트 내용을 세션마다 설명하기 귀찮습니다. 자체 메모리에 현재 프로젝트 상황 및 내용을 좀 적어두세요.

8. 모든 작업, 문제 해결 시에 업계 표준 관점을 제시합니다.

9. autocorp chrome 툴은 쓰지마세요.

=================================================================
아래는 ai가 적는 칸 입니다.

## 공통 운영 규칙

- 구현 관련 작업 후에는 변경 내용, 검증, 미검증, 남은 제품/운영 리스크를 보고합니다.
- 이 repo는 브랜치를 나누지 않고 가급적이면 `main`에 바로 커밋해 쌓습니다. `main`에서 작업을 시작해도 가급적이면 별도 작업 브랜치를 만들지 마세요. 사람 사용자가 관리가 힘듭니다. 여럿이 동시에 건드리는 대공사일 때만 예외적으로 브랜치를 씁니다.

- **세션 기록은 2층 구조다**(무한 성장 방지). 새 세션은 시작할 때 이 두 섹션부터 읽어 현재 상태를 파악하고, 매번 사용자에게 진행상황을 다시 묻지 않는다.
  1. **`## 프로젝트 현황 (Live Summary)`** — 로그가 아니라 **항상 최신 전체 그림으로 덮어쓰는** 요약. 2,000자 내외 유지. 이번 세션으로 전체 상태(기능·인프라·미해결)가 바뀌었으면 해당 줄만 갱신한다. 길이가 안 늘어나는 게 핵심.
  2. **`## 최근 근황`** — 이번 세션에 한 일(무엇을·검증·다음)을 **맨 위에 한 덩어리** 추가. **최신 5개만** 유지하고, 6개가 되면 가장 오래된 1개를 [`docs/project-history.md`](./project-history.md)로 잘라 옮긴다(원문 그대로).
  - 갱신 후 `## 최근 근황`의 **읽기 비용 게이지**(Live Summary+근황 합산 대략 토큰, 글자수÷2.5)도 새로 어림해 적는다.

## Agent Operating Rules

이 섹션은 lvclac 에이전트 운영 규칙입니다.

- Notion 주소: https://app.notion.com/p/36426e6d586f80a3ad15f147fae38ed9
- 일상 작업 기록 DB: Work Log https://app.notion.com/p/5ed33baec3464baa9e4517217a0f90ef
- 작업 시작 시 Notion Project OS, 관련 Task, 관련 page를 먼저 확인합니다.

- 모든 종류의(행정,법무,개발 등등) 업무 종료 시 [Work Log](https://app.notion.com/p/5ed33baec3464baa9e4517217a0f90ef?v=85c0159949314d4a87f1f2217f3e3d60)에 꼭 업무 내용을 상세히 기록합니다.
- **Work Log의 `Date`(날짜) 속성은 날짜만 찍지 말고 반드시 시·분까지 포함**해서 기록합니다(시간 포함 = datetime). 같은 날 여러 건이 쌓여도 순서가 정확히 잡히고, 최근순 정렬이 제대로 동작합니다. 기본 표 뷰(Default view)는 `Date` 내림차순(최근이 맨 위)으로 고정되어 있습니다.

- **Work Log 페이지를 만들 때는 작업 성격에 맞는 이모지 아이콘을 꼭 답니다**(`notion-create-pages`의 `icon` 파라미터). 리스트가 한눈에 보기 좋아집니다. 권장 매핑: ✨신규 · 🐛버그수정 · 🔧수정/개선 · 📝문서/규칙 · ✅QA/검증 · 🚀릴리즈 · 🎨UI/스타일 · 🏷️이름/라벨 · ♻️리팩터 · 🔒보안/인증 · 🗂️데이터/DB (애매하면 📝).

- **모든 노션 DB의 행(페이지)에는 항목 성격에 맞는 이모지 아이콘을 답니다**(생성 시 `notion-create-pages`의 `icon`, 기존 행은 `update-page`의 `icon`). Work Log뿐 아니라 Tasks·Backlog·Decision Log 등 **어느 DB든 새 행을 만들면 아이콘 부여**가 기본입니다. 리스트 스캔성이 좋아집니다. 이모지는 위 Work Log 권장 매핑을 준용하고, 항목에 더 맞는 게 있으면 그걸 씁니다(예: 📧이메일 · 💱외환/FX · 🪙크립토 · 🔗링크 · 🧹정리 · 🔄복원, 애매하면 📝).

- 모든 종류의(행정,법무,개발 등등) 업무 종료 시 tasks db( https://app.notion.com/p/9677d2bd9bb74376a7ee964292978f24?v=61e5027eeaca4942bbb24bc71475d7cf)에 꼭 업무 내용을 상세히 기록하고 최신화합니다.

- **⚠️ 백로그 DB 착오 주의**: 워크스페이스에 이름이 똑같은 **"백로그 항목" DB가 2개** 있다. **lvclac(선물 청산 계산기) 백로그**는 `collection://29a3b15d-8ce6-4c1e-a456-fbda80e2ea77` (페이지 [🗂️ Backlog](https://app.notion.com/p/39826e6d586f81b2a0e1e9c67c1c567b), 부모 "선물 청산 계산기"). **다른 하나는 Atrelier(캔버스/그림 앱) 백로그** `collection://0fc34f14-14d7-4de1-8d43-51660b7b043f` (부모 "Atrelier") — **lvclac 항목을 여기 넣지 말 것**. Notion 검색은 둘 다 반환하니, 백로그에 행 추가 전 **부모 경로(ancestor-path)가 "선물 청산 계산기"인지 반드시 확인**한다. 2026-07-15에 lvclac 항목 2건(주문/스냅샷 CSV export, 트레이딩 광고 필터)이 Atrelier로 잘못 들어가 있어 lvclac 백로그로 옮겼다. 캔버스/브러시/3D 카테고리면 Atrelier, 청산가/스냅샷/트레이딩이면 lvclac이다.

- Release 성격의 변경은 Release Notes 또는 Releases DB에 남깁니다.
- 버그, 장애, QA 리스크는 QA / Test Plan 또는 Incidents / QA DB에 남깁니다.

- **되돌리기 어려운 제품/기술·UX 결정·설계·타당성 조사(ADR 성격)는 Notion [`Design & Decision Log`](https://app.notion.com/p/c97c38480a8249baaf18c43591d47281) DB에 행으로 기록**합니다(맥락·대안·근거·영향을 속성+본문에, Type = ADR·결정 / Design·UX / Spec·설계). repo·Work Log에 별도 설계/결정 문서로 두지 않습니다.

- 오래된 Notion의 `휴지통/레거시`는 참고전용입니다.
- repo의 `docs/legacy/`또한 레거시 문서로서 참고 전용으로 봅니다.

## Active 문서

| 문서 | 용도 |
| --- | --- |
| [`docs/product-core-design.md`](./product-core-design.md) | 제품 핵심 설계 |
| [`docs/launch-schedule.md`](./launch-schedule.md) | 런칭 일정 |
| [`docs/bugs.md`](./bugs.md) | 알려진 버그 |


## 프로젝트 현황 (Live Summary)

> **로그가 아니라, 항상 최신 전체 그림으로 덮어쓰는 요약.** 2,000자 내외로 유지(넘치면 오래된 서술을 쳐내 다이어트). 새 세션은 이거 하나만 읽어도 프로젝트 전체 흐름·현재 상태를 파악한다. 상세 진행은 아래 '최근 근황'에서 본다.

**제품/배포**: LiqGuard는 공개 제품과 개발 제품을 영구 분리한다. `main → liqguard.com`은 로그인 없는 무료 계산기·단일 로컬 저장·광고 자리와 `/guide`·`/formulas`·`/about`·`/terms`·`/privacy`를 제공한다. `dev → lvclac-dev → devpilgrm.liqguard.com`은 로그인·클라우드·기록·결제·크론 등 전체 기능을 보존한다. 두 환경 모두 정식 공개 전 `noindex`; 개발 사이트는 항상 `DEV` 배지를 표시한다.

**스택/인프라**: React + TypeScript + Vite, Vercel 프로젝트 2개. `main` Production에는 Supabase/service-role/cron env와 billing/cron API가 없고 public 테스트는 617개다. 공개판은 Consent Mode v2 기본 거부, Google CMP 재진입, 동의 후 GA4·AdSense 실행, 자동 AdSense 메타·`ads.txt`, 운영자 정보 런칭 검사를 갖춘다. `dev`는 Supabase(DB·Auth), Vercel 서버리스 함수·크론, Paddle 준비 코드를 유지하며 테스트 620개다. **주의: Vercel은 api/ TS를 파일단위 컴파일만 함 → 서버 상대 import는 `.js`, API/middleware는 Node 타입 참조 필요**.

**핵심 기능**: 공개 사이트는 청산가 계산기, 상품군별 용어 프리셋, 주문 시나리오, undo/redo, 면책, 사용법 툴팁·`/guide`, 광고 레이아웃, 단일 브라우저 저장을 제공한다. 저장 UI는 `저장 안 함`·`로컬 저장` 2슬롯이며 첫 홈 방문에는 면책 확인 뒤 로컬 저장 여부와 계좌정보 보안 주의를 한 번 묻는다. 기존 활성 로컬 숫자세트는 공개 단일 저장 키로 1회 마이그레이션한다. 개발 사이트에는 계좌 스냅샷, 다중 숫자세트, 마이페이지, 온보딩, 롤오버, 피드백·관리자·Paddle 준비 기능이 남아 있다.

**디자인**: 다크 UI, variables.css 토큰 기반. 공개 푸터는 카드형 구버전에서 전체 폭 SaaS형 구조(브랜드·Product/Company/Legal·Operator·하단 법무)로 교체했으며 구버전은 Git 태그 `archive/public-footer-before-2026-07-redesign`로 보존한다. 개선 접근: 레퍼런스 캡처 → 토큰 준수 → 여백 4·8·16·24 리듬 → 실제 화면 검증.

**법인**: 주식회사 파필드소프트웨어 설립 중 — startbiz 서식 13종 완료, **일괄 전자서명(김규민 + 누나 감사 김에림) → 파주등기소 제출**만 남음(9~17시 운영시간 처리).

**다음/미해결**: 실제 법인명·대표자·본점 주소·사업자등록번호·개인정보 보호책임자 입력, AdSense/GA4 ID 입력, Google CMP(TCF v2.3) 게시, Vercel·Google 국외 이전 정보 법무 확인. 그 뒤 CMP 허용·거부·철회 실배포 네트워크 QA와 `ALLOW_INDEXING=true` 전환. 개발 도메인 로그인·클라우드·cron smoke test도 별도 남아 있다.

## 최근 근황

- **읽기 비용 게이지**: 위 'Live Summary' + 아래 근황 5개 합산 대략 **≈2,360토큰** (한글 글자수 ÷ 2.5로 어림 — 정확한 계량 아님, 매 세션 갱신). 이 값이 크게 넘으면 근황을 더 쳐내라는 신호.
- **운영 규칙**: 근황은 **최신 5개만** 여기 둔다. 새 항목을 맨 위에 추가해 6개가 되면 **가장 오래된 1개를 [`docs/project-history.md`](./project-history.md)로 잘라 이동**(요약 말고 원문 그대로). 전체 흐름은 위 Live Summary가 책임지므로, 근황은 마음 놓고 짧게 유지한다.

**2026-07-17 — 공개 푸터 SaaS형 리디자인 적용 + AutoCorp screenshot 복구**
- 실제 계산기 화면을 기준으로 푸터 시안을 반복 조정한 뒤 `SiteFooter.tsx`·`App.css`에 적용했다. 카드형 외곽을 제거하고 LiqGuard 로고/설명, Product·Company·Legal 3열, 확정값만 표시하는 Operator 한 줄, 저작권·약관·개인정보·면책 재진입을 319~321px 높이로 정리했다. Google CMP 재호출과 내부 라우팅 동작은 보존했다.
- 구버전 푸터는 런타임에 죽은 코드를 남기지 않고 적용 직전 HEAD를 annotated Git tag `archive/public-footer-before-2026-07-redesign`로 보존했다. 필요 시 해당 태그의 `SiteFooter.tsx`와 CSS를 파일 단위로 복원할 수 있다.
- 병행 수정: AutoCorp Chrome의 `Page.captureScreenshot` 무한 대기에 단계별 timeout·오래된 debugger detach·1회 재시도를 추가하고 개인 플러그인 `0.2.0+codex.20260716195100`으로 재설치했다(autocorp-chrome 커밋 `191407b`). 실캡처가 기존 20초 timeout에서 약 0.17~0.2초 PNG 반환으로 정상화됐다.
- 검증: public vitest **617/617**, production build, 대상 eslint 통과. 새 AutoCorp 탭에서 런타임 합성 없는 실제 React 푸터 높이 321px·브랜드/설명 간격 11px·Operator/3열 탐색을 DOM과 PNG로 확인했다.

**2026-07-17 — v1 푸터·공개 콘텐츠·법무·AdSense/GA4 동의 준비**
- 푸터를 제품·회사·법무 3영역으로 복구하고 계산기·가이드·수식·소개·약관·개인정보·개인정보/쿠키 설정과 문의 이메일을 연결했다. 실제 법인 정보는 `PublicOperatorInfo` 환경변수에서 한 번만 읽고 미확정 값은 숨긴다. `/about`은 로그인 없이 운영 주체·목적·수식 투명성·계산 한계·문의처를 설명하며 `/guide`는 로컬 브라우저 저장만 안내한다.
- 약관·개인정보처리방침을 한영으로 확장해 계산 보조 도구 범위, 투자자문 아님, 결과 검증, localStorage 위험, Vercel 호스팅/Web Analytics, GA4, AdSense 광고 쿠키, 처리위탁·국외 이전·권리·보호책임자·구제 절차를 표로 공개한다. Vercel 집계 차원과 Google 광고 쿠키/맞춤광고 해제도 명시했다.
- Consent Mode v2 네 항목을 Google 태그보다 먼저 기본 거부하고, Google CMP 결과가 미확정이면 GA4·광고 요청을 막는다. 비규제 지역도 명시 선택 전에는 막고 자체 설정창을 제공하며, 규제 지역은 Google CMP 철회 메시지를 재호출한다. AdSense 요청은 `pauseAdRequests=1` 뒤 동의 시에만 `push()`·재개한다.
- 공개 6경로 sitemap·canonical·페이지별 title/description/OG를 추가하고 Vercel 리다이렉트를 해제했다. `ALLOW_INDEXING=true` 또는 실 AdSense 설정인데 필수 법인 정보가 비면 production build가 실패하며, 올바른 client ID에서 AdSense account meta와 `ads.txt`를 자동 생성한다. 외부 입력값과 대시보드 작업은 `docs/public-launch-checklist.md`에 정리했다.
- 검증: vitest **617/617**, production build, 변경 파일 eslint, 누락 법인정보 build 차단, 테스트 publisher ID의 noindex 제거·메타·`ads.txt` 생성 확인. 전체 eslint는 기존 `.recovery` 파싱 오류와 dev 전용 기존 규칙 위반으로 실패. 현재 세션에는 브라우저 제어 실행 도구와 Notion 도구가 없어 모바일/데스크톱 클릭 QA와 Work Log/Task 갱신은 미수행.

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

<!-- 근황은 최신 5개만. 더 오래된 기록은 docs/project-history.md 참조. -->
