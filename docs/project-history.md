# lvclac 프로젝트 히스토리 (근황 아카이브)

상태: **참고용 아카이브**. [`lvclac-project-memory.md`](C:/Users/rlarb/Documents/lvclac-project-memory.md)의 `## 최근 근황`에서 5개 상한을 넘겨 밀려난 오래된 세션 로그를 시간 역순(최신이 위)으로 보관하는 곳.

- 여기는 `docs/legacy/`(아주 오래된 문서 격리소)와 **다르다**. 현역 프로젝트 기록의 연장선이며, 필요하면 언제든 꺼내 읽는다.
- 이동 규칙: `C:/Users/rlarb/Documents/lvclac-project-memory.md`의 `## 최근 근황`이 6개가 되면, **가장 오래된 1개를 통째로 잘라 이 파일 맨 위**(아래 구분선 바로 밑)에 붙인다. 요약하지 말고 원문 그대로 옮긴다.

=================================================================

<!-- 밀려난 근황 로그를 이 아래에 최신순으로 쌓는다. -->

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
