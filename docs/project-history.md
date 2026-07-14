# lvclac 프로젝트 히스토리 (근황 아카이브)

상태: **참고용 아카이브**. [`docs/project-memory.md`](./project-memory.md)의 `## 최근 근황`에서 5개 상한을 넘겨 밀려난 오래된 세션 로그를 시간 역순(최신이 위)으로 보관하는 곳.

- 여기는 `docs/legacy/`(아주 오래된 문서 격리소)와 **다르다**. 현역 프로젝트 기록의 연장선이며, 필요하면 언제든 꺼내 읽는다.
- 이동 규칙: `project-memory.md`의 `## 최근 근황`이 6개가 되면, **가장 오래된 1개를 통째로 잘라 이 파일 맨 위**(아래 구분선 바로 밑)에 붙인다. 요약하지 말고 원문 그대로 옮긴다.

=================================================================

<!-- 밀려난 근황 로그를 이 아래에 최신순으로 쌓는다. -->

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
