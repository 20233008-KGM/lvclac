# 자동 계좌 스냅샷 — 시세 자동 연동 타당성 조사 (Market Data Feasibility)

상태: **조사·결정 기록 (2026-07-11). 구현 미착수.**
관련 구현 설계 초안: 세션 plan 파일 `~/.claude/plans/vast-tickling-liskov.md`(요약은 본 문서 §7에 보존).

---

## 1. 배경 / 질문

현재 Pro의 "자동 계좌 스냅샷"은 매일 크론(`/api/cron/account-snapshots`)이 돌지만,
**유저가 마지막에 저장한 계산기 입력값을 그대로 다시 저장**할 뿐이다. 현재가(`inputs.currentPrice`)가
바뀌지 않으니 매일 동일한 스냅샷이 쌓여, "자동 스냅샷"의 목적(시간에 따른 청산위험/계좌 변화 기록)이 사실상 죽어 있다.

**아이디어(사용자 제안):** Pro 기능으로 유저가 선물 종목코드를 등록하면, 매일 장마감 후
그 종목의 **종가/정산가를 가져와 현재가를 갱신한 뒤 스냅샷**하면 자동 스냅샷이 진짜 의미를 갖는다.

**사용자가 스스로 짚은 고민 4가지:** ① 전세계 선물 종목코드를 어떻게 다 입력받나 ② 몇 월물인지
코드가 구분하나 ③ 결제/마감일이 나라마다 다르지 않나 ④ 롤오버 날엔 자동 스냅샷을 빼야 하지 않나.

→ 조사 결과, 진짜 병목은 이 4가지가 아니라 그 앞의 **"데이터를 어디서 무료로·합법적으로 구하나"**였다.

---

## 2. 결론 요약 (TL;DR)

| 시장 | 자동화 | 비용 | 합법(재배포) | 지금 가능? |
| --- | --- | --- | --- | --- |
| 🇰🇷 한국(KRX) | **완전자동** | **무료** | ✅ 이용허락범위 "제한없음" | **예** |
| 🇺🇸 미국(CME)·기타 | 완전자동은 유료계약 | 유저당 과금 + ILA | 라이선스 필요 | 런칭 전엔 과함 |

**채택 전략(층 분리):** "자동 되는 시장은 완전자동, 안 되는 시장은 반자동."
- 한국 = 공공데이터포털 무료 공식 API로 **완전자동**.
- 그 외 = 유저가 오늘 종가 한 칸 입력하는 **반자동**(같은 다운스트림 재사용).
- 유료 다벤더 완전자동은 **매출 발생 이후 로드맵**.

---

## 3. 다섯 가지 접근을 모두 검토 — 전부 같은 벽

런타임 시세 취득 방법으로 아래 5가지를 검토했고, 전부 **동일한 근본 벽**에 도달했다:
> **선물 시세는 거래소가 소유한 라이선스 데이터이며, 상업적 재배포(우리 앱→Pro 유저 노출)는
> 유저 1명당 과금(pass-through)되거나 별도 계약을 요구한다.** 방법을 바꿔도 데이터 소유권과
> "공짜로 정확한 숫자"의 부재는 바뀌지 않는다.

1. **유료 종합 API 완전자동(전세계):** 벤더 구독료 + 거래소 유저당 라이선스료 누적 + 지역별
   별도 계약. 저렴한 종합 API(EODHD 등, 월 $20~100)엔 **선물이 아예 없음**(주식·ETF·FX만).
2. **웹 크롤링(우리가 직접):** 주요 시세 사이트(Investing/TradingView/네이버금융) 약관이
   **상업적 재사용 금지**. 안티봇(Cloudflare)·JS렌더링·사이트개편마다 파서 붕괴·비공식 데이터
   품질(스크랩 last price ≠ 공식 정산가) 문제. 상업 제품엔 유료보다 나쁜 리스크. → **비채택.**
3. **매일 AI 에이전트로 종가 검색:** ① LLM 숫자 hallucination이 **청산위험 계산에 직접 유입**
   (정답지 없음, 고위험) ② 결국 같은 웹을 읽어 약관·품질 문제 그대로 ③ 유저×종목×매일 실행
   비용이 데이터 API보다 클 수 있음 ④ 재현·감사 불가로 기록 부적합. → **런타임 오라클로는 비채택.**
   (단, "각 시장의 공식·무료 소스/마감시각/롤오버일/종목코드 체계 카탈로그"를 사람 검수 하에
   1회성 구성하는 **조사 도우미**로는 활용 가능.)
4. **거래소에 각각 직접 연결:** 주요 선물 거래소는 ~20개로 셀 수 있으나(§5), "붙인다"의 비용은
   API 개수가 아니라 **거래소 20곳과 각각 데이터 라이선스 계약**. 무료 공식은 한국(KRX)만 확인됨.
5. **단일 애그리게이터(한 API로 전세계):** 존재함(Databento·Barchart·dxFeed / Bloomberg·LSEG·ICE).
   그러나 "한 곳"이 해결하는 건 **기술 통합**이지 **비용·라이선스**가 아니다. 거래소 요금은
   그대로 **통과과금(pass-through)** 되고 벤더 마진이 얹혀 총액이 20~50% 더 붙기도 한다.
   저렴한 개발자 API는 **한국(KRX) 미지원**(Databento는 roadmap). 진짜 전세계(한국 포함)를 다 주는
   곳은 기업용 단말(**Bloomberg 유저당 월 $2,000~2,400** 등)뿐 → B2C 재배포엔 완전 부적합.

---

## 4. 시장별 상세

### 🇰🇷 한국 (KRX) — 무료·합법·자동 가능
- **공공데이터포털 `금융위원회_파생상품시세정보`** (KRX 출처, 선물/옵션 일별 시세, 무료 OpenAPI).
  - 엔드포인트: `apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getStockFuturesPriceInfo`
  - **이용허락범위 "제한없음" → 상업적 이용·재배포·노출 가능**(출처표기 권장).
  - 트래픽: 개발계정 10,000건/일, 운영계정은 활용사례 등록 시 상향.
- 대안: KRX Data Marketplace OpenAPI(openapi.krx.co.kr) — 인증키 발급 + 약관 동의 필요.
- **결론:** 한국은 지금 바로 "진짜 완전자동(유저 손 안 감) + 무료 + 합법". 확정.

### 🇺🇸 미국 (CME) — 무료 경로 없음(유료)
- CME 설정가(settlement)는 cmegroup.com에서 자정(CT) 이후 **"눈으로 보기"는 무료**지만,
  **앱에 끌어와 유저에게 보여주기(display·재배포)는 라이선스 필수.**
- **반전:** CME가 과거 무료였던 **EOD 데이터 라이선스를 폐지**하고 EOD를 '지연데이터 라이선스'로
  재분류 → 모든 공급 경로에 **새 요금** 부과.
- 상업 앱 노출 = 정보이용계약(**ILA**) + **비전문가 구독자(유저) 1명당 매월 요금** + 최소요금.
  우리는 정산가로 **청산가를 계산**하므로 **파생데이터 라이선스**까지 걸릴 소지.
- **비용 오해 정정:** "유저당 월 $2,000"은 **블룸버그 단말기 1대(전문 트레이더 워크스테이션) 값**이며
  우리 유저당 비용이 아니다. 우리 방식(EOD만 앱에 노출)은 개발자 API + 거래소별 소액으로,
  **유저당 월 몇 달러 수준**(거래소마다 상이) + 벤더 기본료. 자릿수가 "천 달러"가 아니라 "몇 달러".
  단 **유저 수만큼 누적 + 계약 필요**하고, 한국과 달리 **$0가 아니다**.

---

## 5. 전세계 주요 선물 거래소 (참고 — ~20개, 데이터는 KRX 외 전부 유료 기본)

- **북미:** CME Group(CME·CBOT·NYMEX·COMEX), ICE(+ICE Europe), Cboe(VIX)
- **유럽:** Eurex(Euro Stoxx 50·DAX·Bund), Euronext(CAC40), LME(비철금속, HKEX 산하)
- **아시아·태평양:** **KRX(한국, KOSPI200 — 무료 공식 API ✅)**, JPX/오사카(닛케이225·JGB),
  HKEX(항셍), SGX(중국A50·철광석), NSE(인도, 세계 계약수 1위), 중국 4대(CFFEX·SHFE·DCE·ZCE)+INE,
  ASX(호주), TAIFEX(대만), Bursa Malaysia(팜유 FCPO)
- **기타:** B3(브라질)

리테일 거래량은 소수(CME 지수·에너지·금속·금리 + Eurex + KRX)에 쏠려 있어, 20개 전부가 아니라
**우리 유저가 실제로 거래하는 2~4개**만 선별하는 것이 현실적.

---

## 6. 정직함 / 제품적 유의점

이 계산기는 **"계좌당 종목 1개·포지션 1개"** 모델이다. 따라서 현재가만 자동 갱신하는 것은
**"내 포지션이 마지막 입력 그대로일 때 오늘 종가 기준 청산위험"**을 뜻한다.
실거래 계좌명세서가 아니라 **"청산 위험 자동 모니터"**이며, UI 문구로 이를 명확히 해야 한다.

---

## 7. 향후 구현 착수 시 참고 (설계 초안 보존)

**핵심 통찰:** 자동/반자동/유료 모두 다운스트림이 동일하다 —
`inputs.currentPrice` 갱신 → `calculateEvaluate`(`src/calc/leverage.ts`) 재계산 → 스냅샷 insert.
앞단의 "현재가를 어디서 얻나"만 다르므로 **시세 조회를 provider 인터페이스로 추상화**하고
기존 크론(`scripts/accountSnapshots/automation.ts`) 분기만 바꾼다.

재사용 가능한 기존 인프라: Vercel Cron + `handleAccountSnapshotCron`(의존성 주입),
유저별 타임존/마감시각(`computeNextSnapshotRunAt`), Pro 게이팅(`subscriptions.status`),
하루 1건 유니크 인덱스(`account_snapshots(user_id, source_local_date)`), Resend(반자동 리마인더용).

Phase 1(한국 완전자동) 스케치:
1. `account_snapshot_settings`에 `price_source`/`instrument_code`/`instrument_label` 컬럼 추가(마이그레이션).
2. `scripts/marketData/{provider,krxProvider}.ts` 신규 — 공식 API 조회(정산가), 휴장 시 `null`.
3. 크론 분기: 종목 연동 시 현재가 override → 재계산 → insert. 휴장/롤오버는 스킵(+`lastError` 마킹).
4. `vercel.json` 크론 `0 0 * * *` → `0 * * * *`(매시간; 현재 UTC 자정=09:00 KST는 한국 장마감 이전).
5. MyPage에 종목 검색/선택 UI + "위험 모니터" 문구(i18n ko/en).
6. (선택) 반자동 폴백: 한국 외 시장은 종가 입력 리마인더.

**선행 확인(착수 전):** ① 공식 API 이용허락범위/출처표기 최종 확인 ② API 키 발급(활용신청) 및
운영 트래픽 한도 ③ 응답 스키마 확정(정산가 vs 종가 필드, 종목코드 파라미터 체계, 휴장일 응답 형태).

**예상 작업량:** Phase 1(한국 완전자동) 약 1.5~2주 + 선행 확인 리드타임. 반자동 폴백 +약 1일.

---

## 8. 출처

- CME Daily Settlements — https://www.cmegroup.com/market-data/daily-settlements.html
- CME EOD 라이선스 변경 보도(WatersTechnology) — https://www.waterstechnology.com/data-management/7952957/cme-rankles-market-data-users-with-licensing-changes
- CME 2026 시장데이터 요금표 — https://www.cmegroup.com/market-data/files/january-2026-market-data-fee-list.pdf
- 공공데이터포털 금융위 파생상품시세정보 — https://www.data.go.kr/data/15094802/openapi.do
- KRX Data Marketplace OpenAPI — https://openapi.krx.co.kr/
- Databento Futures(커버리지·라이선스) — https://databento.com/futures
- ICE 데이터 요금 개요 — https://www.ice.com/publicdocs/Fee_Overview.pdf
- LSEG/Refinitiv 가격 — https://www.vendr.com/marketplace/refinitiv
