-- 롤오버(만기 이월) 알림 — 슬롯별 설정 (Pro 자동 스냅샷 확장)
-- 롤오버일에는 자동 스냅샷이 옛 포지션 기준의 잘못된 기록을 남기므로, 그날은 스냅샷을
-- 건너뛰고 슬롯을 "롤오버 대기"로 표시한다. 유저는 마이페이지 배너를 보고 새 약정가로
-- 값을 갱신한다. 만기 주기는 우리가 조사하지 않고 유저가 슬롯마다 직접 설정한다.

alter table public.number_sets
  -- 롤오버 알림 사용 여부. 기본 꺼짐.
  add column if not exists rollover_reminder_enabled boolean not null default false,
  -- 주기(개월): 매월=1, 격월=2, 분기=3, 반기=6. 미설정 시 null.
  add column if not exists rollover_interval_months smallint,
  -- 기준일 규칙: 'second_thursday'(한국식) | 'third_friday'(미국식).
  add column if not exists rollover_anchor text,
  -- 다음 롤오버 예정일(유저 로컬 달력 날짜, YYYY-MM-DD). 위상 기준 + 도래 판정 마커.
  add column if not exists rollover_next_date date,
  -- 크론이 롤오버일을 감지해 스냅샷을 건너뛰면 true. 유저가 값을 갱신하면 false로 해제.
  add column if not exists rollover_pending boolean not null default false;

-- 값 방어: 주기·기준일 허용값만.
alter table public.number_sets
  drop constraint if exists number_sets_rollover_interval_check;
alter table public.number_sets
  add constraint number_sets_rollover_interval_check
  check (rollover_interval_months is null or rollover_interval_months in (1, 2, 3, 6));

alter table public.number_sets
  drop constraint if exists number_sets_rollover_anchor_check;
alter table public.number_sets
  add constraint number_sets_rollover_anchor_check
  check (rollover_anchor is null or rollover_anchor in ('second_thursday', 'third_friday'));

-- 크론이 "자동 대상 + 롤오버 알림 켜진 + 오늘 도래한" 슬롯을 빠르게 훑기 위한 부분 인덱스.
create index if not exists number_sets_rollover_due_idx
  on public.number_sets(rollover_next_date)
  where rollover_reminder_enabled = true and auto_snapshot_enabled = true;
