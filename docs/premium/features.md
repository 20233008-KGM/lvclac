# Pro 기능 목록

유료 결제(`isPro`)로 잠금 해제되는 기능 전체입니다.

## Free (현재 유지)

- 평가·주문 모드 전체 계산 기능
- 비로그인 사용 가능
- 6개 AdSense 슬롯 — Free 광고 운영: [../ads-management.md](../ads-management.md)
- 로그인 시 입력값 1세트 — [input-sets.md](./input-sets.md)

## Pro 유료 기능

| 기능 | 가치 | 난이도 | 상세 |
|------|------|--------|------|
| **광고 제거** | 6슬롯 미노출, 집중 UI | 낮음 | [ad-free.md](./ad-free.md) |
| **입력 세트 확장** | 다중 숫자 세트 저장·전환 | 중간 | [input-sets.md](./input-sets.md) |
| **역산 시스템** | 목표 청산·버퍼·레버리지 → 정리 계약수 | 중간 | [reverse-calc.md](./reverse-calc.md) |
| **저장 프리셋** | 이름 붙인 입력값 CRUD | 중간 | [input-sets.md](./input-sets.md) |
| **클라우드 동기화** | 기기 간 세트·프리셋 동기화 | 중간 | Supabase 어댑터 |
| **시나리오 비교** | 2~3개 포지션 나란히 | 중간 | — |
| **민감도 분석** | 가격 ±N% 슬라이더 | 낮음 | `calc/` 재사용 |
| **결과보내기** | PNG/PDF 스냅샷 | 중간 | — |
| **청산 근접 알림** | 이메일/푸시 (가격 피드) | 높음 | Phase 3 |

## 핵심 원칙

기본 청산가 계산은 무료. Pro는 **반복 사용 편의 + 리스크 관리 + 깔끔한 UI**.

## Phase별 로드맵

### Phase 1 — 결제·기반

- Stripe·`isPro` — [implementation.md](./implementation.md)
- [광고 제거](./ad-free.md)

### Phase 2

- [역산 시스템](./reverse-calc.md)
- [입력 세트](./input-sets.md) · 저장 프리셋 CRUD
- 시나리오 비교 · 민감도 슬라이더 · 결과 PNG

### Phase 3 (선택)

- 청산 근접 알림 · 포트폴리오 뷰 · 브로커 프리셋

## 기능별 상세 문서

| 문서 | 내용 |
|------|------|
| [ad-free.md](./ad-free.md) | 광고 제거 |
| [input-sets.md](./input-sets.md) | 숫자 세트 저장 |
| [reverse-calc.md](./reverse-calc.md) | 역산 시스템 |

## 관련

- [plans.md](./plans.md) — 플랜·혜택
- [pricing.md](./pricing.md) — 가격
- [../login-integration.md](../login-integration.md) — 로그인·`isPro` 통합
