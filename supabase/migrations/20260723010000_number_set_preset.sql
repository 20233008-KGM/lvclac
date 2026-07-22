-- 숫자세트가 계산 입력값과 함께 거래용어 프리셋을 보존한다.
-- 기존 행은 null로 유지해 현재 기기의 기존 전역 프리셋을 fallback으로 사용할 수 있게 한다.
alter table public.number_sets
  add column if not exists preset_id text;

alter table public.number_sets
  drop constraint if exists number_sets_preset_id_check;

alter table public.number_sets
  add constraint number_sets_preset_id_check
  check (
    preset_id is null
    or preset_id in ('default', 'index', 'stock', 'commodity', 'fx', 'cfd')
  );
