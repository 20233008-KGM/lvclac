# LiqGuard v1 공개 입력값·대시보드 체크리스트

이 문서는 코드가 추측할 수 없는 실제 운영 정보와 외부 대시보드 작업을 정리한다.
검증되지 않은 값이나 예시 값을 Production에 넣지 않는다.

## 1. Production 환경변수

Vercel `lvclac` 프로젝트의 Production 환경에 아래 값을 입력한다.

| 환경변수 | 입력할 실제 값 | 상태 |
| --- | --- | --- |
| `VITE_PUBLIC_OPERATOR_LEGAL_NAME` | 등기 완료 후 정확한 법인명 | 미입력 |
| `VITE_PUBLIC_OPERATOR_REPRESENTATIVE` | 법인 대표자명 | 미입력 |
| `VITE_PUBLIC_OPERATOR_ADDRESS` | 공개 가능한 정확한 본점 주소 | 미입력 |
| `VITE_PUBLIC_OPERATOR_BUSINESS_REGISTRATION_NUMBER` | 사업자등록번호 | 미입력 |
| `VITE_PUBLIC_OPERATOR_PRIVACY_OFFICER` | 개인정보 보호책임자 성명 또는 직책 | 미입력 |
| `VITE_PUBLIC_OPERATOR_COMMERCE_REGISTRATION_NUMBER` | 실제 발급된 경우에만 통신판매업 신고번호 | 선택 |
| `VITE_GA4_MEASUREMENT_ID` | GA4 웹 데이터 스트림의 `G-...` ID | 미입력 |
| `VITE_ADSENSE_CLIENT` | AdSense `ca-pub-...` client ID | 미입력 |
| `VITE_AD_SLOT_*` | 각 광고 단위 숫자 ID | 미입력 |
| `VITE_SITE_URL` | `https://liqguard.com` | 확인 필요 |
| `ALLOW_INDEXING` | 공개 직전까지 `false`, Go 결정 뒤 `true` | 공개일 전환 |

`ALLOW_INDEXING=true` 또는 `VITE_ADSENSE_CLIENT`가 설정되면 필수 운영자 정보가
하나라도 비어 있는 production 빌드는 실패한다.

## 2. Google AdSense / CMP

- 사이트를 AdSense에 등록하고 publisher/client ID와 광고 단위 ID를 발급한다.
- Privacy & messaging에서 Google 인증 CMP 메시지를 게시한다.
- EEA·영국·스위스 대상 메시지가 TCF v2.3 기준인지 확인한다.
- Consent Mode 연동을 활성화한다.
- 푸터 `개인정보·쿠키 설정`에서 CMP 메시지가 다시 열리는지 확인한다.
- Google CMP 테스트 파라미터로 메시지를 강제 표시해 허용·거부·철회를 각각 검사한다.
- 허용 전에는 `adsbygoogle.push()` 광고 요청이 없고 자리표시가 유지되는지 확인한다.
- 허용 후 실제 광고 요청, 거부·철회 후 요청 중단과 자리표시 복귀를 확인한다.
- 배포된 루트의 `ads.txt`가 `google.com, pub-..., DIRECT, f08c47fec0942fa0`인지 확인한다.
- 배포 HTML에 `google-adsense-account` 메타 태그가 정확한 `ca-pub-...` 값으로 들어갔는지 확인한다.

## 3. Google Analytics 4

- GA4 속성과 웹 데이터 스트림을 만들고 Measurement ID를 입력한다.
- 이벤트 데이터 보유기간을 개인정보처리방침에 적은 14개월로 맞춘다.
- Consent Mode의 `analytics_storage` 거부 상태에서는 GA4 태그와 이벤트 요청이 없는지 확인한다.
- 허용 후 DebugView에서 첫 페이지뷰와 공개 6경로 이동을 확인한다.
- 광고 기능을 실제 사용하는 범위에 맞춰 Google Signals·광고 개인 최적화 설정을 최종 검토한다.

## 4. Vercel·국외 이전 법무 확인

- Vercel 호스팅 로그와 Web Analytics의 실제 처리 국가, 보유기간, 계약상 수탁 관계를 확인한다.
- Google GA4·AdSense·CMP의 실제 처리 국가, 이전 시점·방법, 보유기간을 확인한다.
- 확인 결과가 개인정보처리방침의 국외 이전 표와 다르면 공개 전에 문구를 수정한다.
- 법인명·대표자·주소·사업자등록번호·개인정보 보호책임자 표시를 전문가 또는 관할기관 기준으로 최종 검토한다.

## 5. 공개일 검증

- `/`, `/guide`, `/formulas`, `/about`, `/terms`, `/privacy`가 모두 200으로 열리는지 확인한다.
- 다른 제품·결제·계정·관리자 경로가 sitemap에 없고 홈으로 이동하는지 확인한다.
- 페이지별 title, description, canonical과 sitemap 도메인이 `https://liqguard.com`인지 확인한다.
- production HTML과 응답 헤더에서 `noindex`가 제거됐는지 확인한다.
- 모바일·데스크톱에서 푸터 3개 영역, 운영자 정보, 법무 표, 설정 모달의 줄바꿈과 가로 스크롤을 확인한다.
- 로컬 입력 저장 동의와 광고·분석 동의가 서로 영향을 주지 않는지 확인한다.

이 체크리스트는 법률 자문이 아니다. 실제 운영 지역과 법인 상태를 기준으로 최종
법무 검토를 거친다.
