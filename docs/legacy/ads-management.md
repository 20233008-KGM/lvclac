# 광고·분석 통합 관리

> **상태: 런칭 직전** — AdSense·GA4 슬롯·스크립트 코드는 구현됨. env·`ads.txt`·승인 후 실광고 전환. **쿠키 동의 UI는 미구현** (아래 [해결할 일](#해결할-일) 참고).

## 현재 동작

| 항목 | 동작 |
|------|------|
| AdSense | `VITE_ADSENSE_CLIENT` + 슬롯 ID가 **모두** 설정된 슬롯만 실광고. 미설정 시 placeholder |
| GA4 | `VITE_GA4_MEASUREMENT_ID` 설정 시 `main.tsx`에서 앱 로드와 함께 `initAnalytics()` 실행 |
| Pro (예정) | 광고 제거 — [premium/ad-free.md](./premium/ad-free.md) |

계산기 입력값 localStorage 저장은 광고·분석과 **별개** (`CalculatorContext`, 사용자 토글). 약관·개인정보 문구는 `src/i18n/locales/ko.ts` · `en.ts` `legal` 섹션.

## 코드 위치

| 파일 | 역할 |
|------|------|
| `src/components/PageShell.tsx` | 6슬롯 배치 (좌·우 사이드바, 상·하단 배너) |
| `src/components/AdSlot.tsx` | placeholder / `<ins class="adsbygoogle">` 렌더·push |
| `src/config/ads.ts` | env 매핑, `sidebar-tall` on/off, 설정 여부 판별 |
| `src/lib/adsense.ts` | AdSense 스크립트 lazy 로드 |
| `src/lib/analytics.ts` | GA4 gtag 초기화 |
| `src/main.tsx` | `initAnalytics()` 호출 (동의 없이 실행) |
| `.env.example` | env 변수 목록 |

## 슬롯 구성

| slotId | variant | 표시 | env |
|--------|---------|------|-----|
| `left-sidebar-top` | sidebar (160×600) | 데스크톱 ≥1024px | `VITE_AD_SLOT_LEFT_SIDEBAR_TOP` |
| `left-sidebar-bottom` | sidebar-tall (160×250) | 위와 동일, `SIDEBAR_TALL` 켜짐 시 | `VITE_AD_SLOT_LEFT_SIDEBAR_BOTTOM` |
| `right-sidebar-top` | sidebar | 좌측과 대칭 | `VITE_AD_SLOT_RIGHT_SIDEBAR_TOP` |
| `right-sidebar-bottom` | sidebar-tall | 좌측과 대칭 | `VITE_AD_SLOT_RIGHT_SIDEBAR_BOTTOM` |
| `top-banner` | banner (반응형) | 메인 콘텐츠 하단 | `VITE_AD_SLOT_TOP_BANNER` |
| `bottom-banner` | banner | top-banner 아래 | `VITE_AD_SLOT_BOTTOM_BANNER` |

- `VITE_AD_ENABLE_SIDEBAR_TALL=false` → tall 슬롯 2개 비활성 (6→4슬롯)
- 모바일·태블릿: 사이드바 숨김, 배너만 노출 (`App.css` breakpoint)

## 환경 변수 (배포)

```env
VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
VITE_AD_SLOT_LEFT_SIDEBAR_TOP=...
VITE_AD_SLOT_LEFT_SIDEBAR_BOTTOM=...
VITE_AD_SLOT_TOP_BANNER=...
VITE_AD_SLOT_BOTTOM_BANNER=...
VITE_AD_SLOT_RIGHT_SIDEBAR_TOP=...
VITE_AD_SLOT_RIGHT_SIDEBAR_BOTTOM=...

# 선택
VITE_AD_ENABLE_SIDEBAR_TALL=false
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SITE_URL=https://your-domain.com
```

Vercel 등 배포 환경에 설정 후 **재배포**해야 클라이언트 번들에 반영됩니다.

## 런칭 체크리스트

- [ ] 도메인 배포·placeholder 레이아웃 확인
- [ ] Google AdSense 사이트 등록·승인
- [ ] AdSense에서 광고 단위 6개 생성 → env 슬롯 ID 입력
- [ ] `public/ads.txt` 추가 (AdSense 안내 형식: `google.com, pub-XXXX, DIRECT, f08c47fec0942fa0`)
- [ ] 개인정보 처리방침 **공개 URL** (AdSense·GA4 심사용 — 앱 내 모달만으로는 부족할 수 있음)
- [ ] **[쿠키 동의](#해결할-일)** — AdSense·GA4 live 전 권장·EU 등에서는 필수
- [ ] 승인 후 실광고 노출·빈 슬롯·정책 위반 여부 확인

## 출시 후 최적화 (2~4주)

`src/config/ads.ts` 주석과 동일:

1. AdSense 슬롯별 RPM·노출수 비교
2. GA4 이탈률·체류 — tall 사이드바가 UX를 해치면 `VITE_AD_ENABLE_SIDEBAR_TALL=false`
3. 모바일 배너 RPM 낮으면 슬롯 수·위치 재검토 (배너는 `AdSlot`에서 responsive 처리됨)

## 해결할 일

### 쿠키·동의 (미구현 — 우선 처리)

현재 **AdSense·GA4 스크립트는 사용자 동의 없이 로드**될 수 있습니다. 약관·개인정보 문구에는 “GA4·AdSense 이용 시 쿠키”가 명시되어 있으나, **동의 배너·선택 UI는 없습니다.**

| # | 할 일 | 비고 |
|---|--------|------|
| 1 | **쿠키/추적 동의 배너** | 필수(기능) vs 선택(광고·분석) 구분. “거부” 시에도 계산기는 동작해야 함 |
| 2 | **동의 전 스크립트 지연** | GA4: `initAnalytics()`를 동의 후 호출. AdSense: `ensureAdSenseScript` / `adsbygoogle.push`를 동의 후 실행 |
| 3 | **Google Consent Mode v2** | EEA·UK 트래픽 대비 `gtag('consent', 'default', …)` 및 AdSense 연동 검토 |
| 4 | **동의 기록 저장** | localStorage 등에 선택 저장, “쿠키 설정” 재진입 링크 (footer 등) |
| 5 | **개인정보 처리방침 URL** | 배너·AdSense 계정에 연결할 고정 경로 (`/privacy` 등) |
| 6 | **언어 쿠키와의 관계 정리** | `detectLocale.ts`의 언어 preference 쿠키는 기능 쿠키 — 배너 문구·정책에 “필수/선택” 구분 명시 |

**참고:** 브라우저 “캐시 삭제”만으로는 localStorage 동의 기록·입력값 draft가 남을 수 있음. “사이트 데이터 삭제”와 별개 이슈.

### 기타 (광고)

- [ ] `public/ads.txt` 파일 추가
- [ ] Pro 연동 — [premium/ad-free.md](./premium/ad-free.md)

## 관련 문서

- [premium/ad-free.md](./premium/ad-free.md) — **광고 제거 (Pro)**
- [premium/README.md](./premium/README.md) — 유료·Pro 전체
- [login-integration.md](./login-integration.md) — `isPro` 통합
- [.env.example](../.env.example) — env 템플릿
