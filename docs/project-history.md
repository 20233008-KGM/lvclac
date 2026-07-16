# lvclac 프로젝트 히스토리 (근황 아카이브)

상태: **참고용 아카이브**. [`docs/project-memory.md`](./project-memory.md)의 `## 최근 근황`에서 5개 상한을 넘겨 밀려난 오래된 세션 로그를 시간 역순(최신이 위)으로 보관하는 곳.

- 여기는 `docs/legacy/`(아주 오래된 문서 격리소)와 **다르다**. 현역 프로젝트 기록의 연장선이며, 필요하면 언제든 꺼내 읽는다.
- 이동 규칙: `project-memory.md`의 `## 최근 근황`이 6개가 되면, **가장 오래된 1개를 통째로 잘라 이 파일 맨 위**(아래 구분선 바로 밑)에 붙인다. 요약하지 말고 원문 그대로 옮긴다.

=================================================================

<!-- 밀려난 근황 로그를 이 아래에 최신순으로 쌓는다. -->

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
