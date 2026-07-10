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

## codex 작업 방식

- Codex는 내장 Chrome 연결 도구가 이상하게 작동하므로, 내가 만든 AutoCorp Chrome 도구를 사용하세요. claude,cursor는 autocorp chrome말고 본인 앱의 원래 브라우저 툴(claude in chrome)을 사용해도 됩니다.

## 작업 참고 및 최신화

1. 업무할 때는 Whimsical, Notion, Google Calendar를 참고해서 무엇을 해야 하는지 확인하세요.
2. 일이 끝나면 Whimsical, Notion, Google Calendar에 체계적으로 정리하여 최신 상태로 업데이트하세요.
   관련 내용이 있는지만 확인하지 말고, 본인이 한 일을 기록하는 겁니다.

Whimsical, Google Calendar는 관련 내용만 최신화하고 관련 내용이 없으면 건들지 않습니다.
Notion을 최신 기준으로 사용합니다. 작업 결과는 관련 Task, Release Notes, QA/Incident, 또는 관련 문서에 기록합니다.

3. Whimsical에서는 텍스트만 수정하세요. 배치나 디자인은 내가 예쁘게 만들어둔 상태를 건드리지 마세요.
   컴포넌트를 붙여야 할 때는 기존 컴포넌트를 건드리지 말고 주변부에 붙여두세요. 나중에 내(인간)가 정리할게요.

4. 작업이 끝나면 본인 변경분을 꼭 커밋하세요. 커밋메시지도 상세히 적으세요.

5. 미뤄둔 일은 backlog에 기록하고, 당장 이어서 할일은 tasks db에 기록합니다.

=================================================================
아래는 ai가 적는 칸 입니다.

## 공통 운영 규칙

- 구현 관련 작업 후에는 변경 내용, 검증, 미검증, 남은 제품/운영 리스크를 보고합니다.
- 이 repo는 브랜치를 나누지 않고 가급적이면 `main`에 바로 커밋해 쌓습니다. `main`에서 작업을 시작해도 가급적이면 별도 작업 브랜치를 만들지 마세요. 사람 사용자가 관리가 힘듭니다. 여럿이 동시에 건드리는 대공사일 때만 예외적으로 브랜치를 씁니다.


## Agent Operating Rules

이 섹션은 lvclac 에이전트 운영 규칙입니다.

- Notion 주소: https://app.notion.com/p/36426e6d586f80a3ad15f147fae38ed9
- 일상 작업 기록 DB: Agent Work Log https://app.notion.com/p/5ed33baec3464baa9e4517217a0f90ef
- 작업 시작 시 Notion Project OS, 관련 Task, 관련 page를 먼저 확인합니다.

- 모든 종류의(행정,법무,개발 등등) 업무 종료 시 [Agent Work Log](https://app.notion.com/p/5ed33baec3464baa9e4517217a0f90ef?v=85c0159949314d4a87f1f2217f3e3d60)에 꼭 업무 내용을 상세히 기록합니다.

- Release 성격의 변경은 Release Notes 또는 Releases DB에 남깁니다.
- 버그, 장애, QA 리스크는 QA / Test Plan 또는 Incidents / QA DB에 남깁니다.
- 오래된 Notion 문서는 `휴지통/레거시`, 오래된 repo 문서는 `docs/legacy/`를 참고 전용으로 봅니다.

## Active 문서

| 문서 | 용도 |
| --- | --- |
| [`docs/product-core-design.md`](./product-core-design.md) | 제품 핵심 설계 |
| [`docs/launch-schedule.md`](./launch-schedule.md) | 런칭 일정 |
| [`docs/bugs.md`](./bugs.md) | 알려진 버그 |
