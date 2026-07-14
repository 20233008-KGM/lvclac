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

## 브라우저 작업 방식

- Codex는 내장 Chrome 연결 도구가 이상하게 작동하므로, 내가 만든 AutoCorp Chrome 도구를 사용하세요. 
- claude는 autocorp chrome말고 본인 앱의 원래 브라우저 툴(claude in chrome)을 사용해도 됩니다. 가급적이면 앱 imbed 브라우저 쓰지마세요. claude in chrome쓰세요.

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


=================================================================
아래는 ai가 적는 칸 입니다.

## 공통 운영 규칙

- 구현 관련 작업 후에는 변경 내용, 검증, 미검증, 남은 제품/운영 리스크를 보고합니다.
- 이 repo는 브랜치를 나누지 않고 가급적이면 `main`에 바로 커밋해 쌓습니다. `main`에서 작업을 시작해도 가급적이면 별도 작업 브랜치를 만들지 마세요. 사람 사용자가 관리가 힘듭니다. 여럿이 동시에 건드리는 대공사일 때만 예외적으로 브랜치를 씁니다.

- **세션 기록은 2층 구조다**(무한 성장 방지). 새 세션은 시작할 때 이 두 섹션부터 읽어 현재 상태를 파악하고, 매번 사용자에게 진행상황을 다시 묻지 않는다.
  1. **`## 프로젝트 현황 (Live Summary)`** — 로그가 아니라 **항상 최신 전체 그림으로 덮어쓰는** 요약. 1,000자 내외 유지. 이번 세션으로 전체 상태(기능·인프라·미해결)가 바뀌었으면 해당 줄만 갱신한다. 길이가 안 늘어나는 게 핵심.
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

**제품**: LiqGuard — 선물·파생상품 **청산가(강제청산 가격) 계산기** 웹앱. 운영 도메인 liqguard.com(Porkbun 등록·Vercel 연결·SSL). 정식 공개 전이라 robots 전체 Disallow + noindex로 검색 차단 중. 회사 도메인 farfield.software는 별도 보유.

**스택/인프라**: React + TypeScript + Vite 프런트, Supabase(DB·Auth), Vercel(호스팅·`/api/*` 서버리스 함수·크론). 인증메일 발신 auth@liqguard.com(Resend, 한/영 분기). 테스트 vitest 604개. **주의: Vercel은 api/ TS를 파일단위 컴파일만 함 → 서버 상대 import는 반드시 `.js` 확장자**(serverEsmImports.test.ts가 자동 검사).

**핵심 기능**: ①청산가 계산기(상품군별 용어 프리셋 오버레이 — 라벨만 바뀌고 계산 로직 불변) ②계좌 스냅샷(수동 버튼 + 자동: pg_cron 15분 폴링으로 due 슬롯 처리, **값이 바뀐 날만 저장**) ③숫자세트(로컬=무료·클라우드=Pro) ④마이페이지(계정·데이터·환경설정, Free/Pro 비교 카드) ⑤첫방문 온보딩(면책 흡수) ⑥롤오버(만기 이월) 인앱 알림. 요금제 Free/Pro 존재하나 **결제(Paddle) 환경변수 미설정 → 실결제 불가**(크래시는 해소됨, 현재는 /billing 유도만).

**디자인**: 다크 UI, variables.css 토큰 기반. 모달 3계층(base·auth·snapshot)을 단일 규칙(R1–R6)으로 수렴 완료. 개선 접근: 레퍼런스 캡처 → 토큰 준수 → 여백 4·8·16·24 리듬 → 실제 화면 검증.

**법인**: 주식회사 파필드소프트웨어 설립 중 — startbiz 서식 13종 완료, **일괄 전자서명(김규민 + 누나 감사 김에림) → 파주등기소 제출**만 남음(9~17시 운영시간 처리).

**다음/미해결**: 결제(Paddle) env 설정, 롤오버 이메일/푸시 알림(현재 인앱만), 법인 등기 마무리.

## 최근 근황

- **읽기 비용 게이지**: 위 'Live Summary' + 아래 근황 5개 합산 대략 **≈1,800토큰** (한글 글자수 ÷ 2.5로 어림 — 정확한 계량 아님, 매 세션 갱신). 이 값이 크게 넘으면 근황을 더 쳐내라는 신호.
- **운영 규칙**: 근황은 **최신 5개만** 여기 둔다. 새 항목을 맨 위에 추가해 6개가 되면 **가장 오래된 1개를 [`docs/project-history.md`](./project-history.md)로 잘라 이동**(요약 말고 원문 그대로). 전체 흐름은 위 Live Summary가 책임지므로, 근황은 마음 놓고 짧게 유지한다.

**2026-07-15 — 숫자세트 열람 슬롯 원라인 심플화 + 계좌평가금·레버리지 노출** (커밋 13cf29a·07cdfc5)
- 사용자 요청: 계산기 메인 "숫자세트 열람" 드롭다운(`draft-number-set-menu`) 슬롯을 심플하게(최대 10+10=20개 수용). 목업 5회 반복(show_widget)으로 방향 정한 뒤 구현 — 34px 아이콘타일+2줄(제목/메타)+체크서클(~52px) → **방향 색점 + 제목 + 우측 `계좌평가금·레버리지` 원라인(~32px)**. 20개 차도 세로 절반 이하.
- **정렬 고정**(사용자 핵심 요구): 우측 숫자를 `[금액 우측정렬][·][레버리지]` 3칸 inline-grid, **레버리지 칸 32px 고정폭 우측정렬** → 배수 자릿수(5x·50x·125x) 달라도 3축 안 흔들림(실측: 전 행 금액끝568·점577·레버끝609px 동일, 칸폭 32 불변). 통화기호(₩) 제거·천단위 콤마·레버리지 단위 `x`(본문은 '배', 슬롯만 x).
- **레버리지는 파생값**: CalculatorInputs에 레버리지 입력 필드 없음(국내 선물식 — 평가금·약정금액서 도출). 세트엔 원천 입력만 저장되고 `calculateEvaluate(inputs).leverageRatio`로 매번 계산(순수 산술, 20개 무해). 따로 저장 안 하는 게 원천값 변경 시 유령값 방지로 더 안전. 값 null(입력 불완전)이면 칸 비우되 고정폭 유지. `formatNumberSetMeta`(시각·방향·계약수) → `describeNumberSet`(방향·평가금·레버리지)로 교체.
- 검증: tsc·vitest 605/605(워크트리 제외). dev(5223)에 로컬세트 6종 주입 후 DOM 실측 — 렌더·레버리지(20/50/5/10/125/15x)·active 하이라이트·3축 정렬 확인. **스크린샷은 이 환경 캡처도구 타임아웃(JS 실행은 정상) → DOM 측정으로 대체**. saveDraftSlotUi 테스트의 format import 정확문자열 검사를 정규식으로 완화(import 확장 대응). 남의 세션 project-memory.md 미커밋 1줄(Live Summary 자수 1,000→2,000) 동반 커밋됨.

**2026-07-15 — 마이페이지 레거시 유령 CSS 200줄 전면 삭제** (커밋 548032d)
- 2f45d57 잔여 후보였던 `my-page-setting-row` 계열(마이페이지 v3 이전 시스템) 정리. src 전체(ts/tsx/test) grep 참조 0건 전수 확인 — 참조처럼 보인 곳은 `.recovery/` 백업과 일회성 복구 스크립트뿐, CSS 소스를 읽는 테스트 3개(autoSnapshotSettingHint·myPageLayout·myPageNumberSetsUi)도 미검사.
- 조사 중 추가 유령 발견해 함께 삭제(사용자 승인): `.my-page-nickname-form` 본체+오버라이드 4블록(현행 폼은 `my-page-nickname-edit`라 "legacy를 덮어쓴다"던 오버라이드까지 전부 매칭 대상 없는 죽은 코드), `.my-page-account-settings-meta`. `.my-page-settings-list`(@deprecated)·`.my-page-settings-note`·모바일 미디어쿼리 블록 포함 총 5구간 200줄, 렌더링 변화 0.
- 검증: vitest 604/604(main rebase 후 재실행), dev /my에서 CSSOM 유령 규칙 0·실사용 규칙(linked-row/setting-line/inline-control) 유지·데스크톱 1265px/모바일 428px 가로 오버플로 없음·콘솔 에러 0. 게스트 화면 실측(로그인 화면 쪽은 참조 0건으로 코드 레벨 보장).
- 함정: 포트 5199를 다른 세션 dev 서버가 점유 → launch.json 임시 5198로 검증 후 원복. harness 워크트리 세션이라 워크트리 커밋→main rebase→ff-merge로 main 반영(97e2302 모바일 linked-row 개편과 충돌 없음 확인).

**2026-07-15 — 모바일 UI 협업 검토: 마이페이지 '연동된 로그인' 카드 수정** (커밋 2f45d57)
- 사용자가 devtools로 모바일 뷰포트(428px) 직접 세팅 → Claude in Chrome으로 계산기·마이페이지 전 화면 스윕. 계산기 본화면은 사용자 판단 "큰 문제 없음"으로 종료.
- **좌상단 고정 언어토글·상품군 선택(.lang-toggle--fixed/.preset-select--fixed)은 개발용 의도 배치 — 수정 금지(사용자 지시)**. 모바일서 본문과 겹쳐 보여도 이슈 아님. 진행 방식 합의: 수정 전 뭘/왜/어떻게 설명 → 오케이 받고 나서 편집.
- 마이페이지 유일한 실붕괴: 연동된 로그인 카드 — TSX 미사용 레거시 `.my-page-linked-item` 모바일 규칙의 `grid-column:2`가 스코프 없이 살아있는 `.my-page-linked-row`(모바일 1fr)에 누수 → 암시적 2번째 칸 생성(실측 210+103px), `1/-1`은 명시적 그리드까지만이라 버튼 반쪽. 아이콘 20px+내용 2열로 명시, 자식 규칙을 행 클래스로 스코프, 유령 규칙 4세트(linked-group/linked-item/linked-logins-note/setting-row--linked) 삭제.
- 검증: vitest 604/604, 428px 실측(computed grid 20px+294px·버튼 전폭 330px·콘솔 에러 0). 데스크톱(>620px) 규칙 무변경.
- 잔여: `my-page-setting-row-*` 계열 전체가 TSX 미사용 레거시(별도 정리 후보). 계산기 터치타겟(스테퍼 ▲▼ 22×20px·비우기 h16·툴팁 ? 14×14) 측정만 해둠, 미조치.

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

<!-- 근황은 최신 5개만. 더 오래된 기록은 docs/project-history.md 참조. -->
