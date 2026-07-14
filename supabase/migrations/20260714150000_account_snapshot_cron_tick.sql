-- 자동 스냅샷 15분 폴링 (pg_cron + pg_net)
--
-- 배경: Vercel Hobby 크론은 하루 1회(UTC 0시)만 가능해 유저별 time_of_day(예: 16:00 KST)를
-- 원리상 못 맞춘다. 서버 로직은 이미 next_run_at 기반 due-선별 설계이므로,
-- Supabase에서 15분마다 크론 엔드포인트를 깨워주기만 하면 된다.
-- 중복 스냅샷은 (user, slot, local_date) 유니크 인덱스가 막는다.
--
-- 시크릿: Authorization 헤더의 CRON_SECRET은 Vault에 'lvclac_cron_secret' 이름으로
-- 별도 보관한다(이 파일에는 값이 없다). Vault에 시크릿이 없으면 이 잡은 401만 받고
-- 아무것도 하지 않으므로 안전하게 실패한다.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 재실행(로컬 리셋 등) 시 중복 등록 방지
do $do$
begin
  if exists (select 1 from cron.job where jobname = 'account-snapshots-tick') then
    perform cron.unschedule('account-snapshots-tick');
  end if;
end
$do$;

select cron.schedule(
  'account-snapshots-tick',
  '*/15 * * * *',
  $job$
  select net.http_get(
    url := 'https://liqguard.com/api/cron/account-snapshots',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'lvclac_cron_secret')
    )
  )
  $job$
);
