-- 회사 버그 제보 운영: 공개 처리 답변, 관리자 전용 분류, 메일 알림 멱등성

alter table public.feedback_posts
  add column if not exists staff_reply text not null default '',
  add column if not exists staff_replied_at timestamptz;

alter table public.feedback_posts
  drop constraint if exists feedback_posts_staff_reply_length_check;
alter table public.feedback_posts
  add constraint feedback_posts_staff_reply_length_check
  check (char_length(staff_reply) <= 4000);

create table if not exists public.feedback_post_admin_details (
  post_id uuid primary key references public.feedback_posts(id) on delete cascade,
  priority text not null default 'P2',
  assignee text not null default '',
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_post_admin_details_priority_check
    check (priority in ('P0', 'P1', 'P2', 'P3')),
  constraint feedback_post_admin_details_assignee_length_check
    check (char_length(assignee) <= 120),
  constraint feedback_post_admin_details_internal_note_length_check
    check (char_length(internal_note) <= 4000)
);

drop trigger if exists feedback_post_admin_details_set_updated_at
  on public.feedback_post_admin_details;
create trigger feedback_post_admin_details_set_updated_at
before update on public.feedback_post_admin_details
for each row execute function public.set_updated_at();

alter table public.feedback_post_admin_details enable row level security;

drop policy if exists "Feedback admin details are readable by admin"
  on public.feedback_post_admin_details;
create policy "Feedback admin details are readable by admin"
on public.feedback_post_admin_details for select
using (private.is_admin());

drop policy if exists "Feedback admin details are insertable by admin"
  on public.feedback_post_admin_details;
create policy "Feedback admin details are insertable by admin"
on public.feedback_post_admin_details for insert
with check (private.is_admin());

drop policy if exists "Feedback admin details are updatable by admin"
  on public.feedback_post_admin_details;
create policy "Feedback admin details are updatable by admin"
on public.feedback_post_admin_details for update
using (private.is_admin())
with check (private.is_admin());

revoke all on public.feedback_post_admin_details from anon;
grant select, insert, update on public.feedback_post_admin_details to authenticated;

-- 브라우저에서는 접근하지 않고 service_role 서버 함수만 사용하는 알림 장부다.
create table if not exists public.feedback_post_notifications (
  post_id uuid primary key references public.feedback_posts(id) on delete cascade,
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_post_notifications_attempt_count_check
    check (attempt_count >= 0),
  constraint feedback_post_notifications_last_error_length_check
    check (last_error is null or char_length(last_error) <= 500)
);

drop trigger if exists feedback_post_notifications_set_updated_at
  on public.feedback_post_notifications;
create trigger feedback_post_notifications_set_updated_at
before update on public.feedback_post_notifications
for each row execute function public.set_updated_at();

alter table public.feedback_post_notifications enable row level security;
revoke all on public.feedback_post_notifications from anon, authenticated;

drop policy if exists "Feedback notifications are server only"
  on public.feedback_post_notifications;
create policy "Feedback notifications are server only"
on public.feedback_post_notifications for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.update_feedback_post_triage(
  p_post_id uuid,
  p_status text,
  p_priority text,
  p_assignee text,
  p_internal_note text,
  p_staff_reply text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  normalized_reply text := btrim(coalesce(p_staff_reply, ''));
begin
  if not private.is_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  if p_status not in ('new', 'reviewed', 'in_progress', 'done', 'on_hold') then
    raise exception 'invalid_feedback_status' using errcode = '22023';
  end if;
  if p_priority not in ('P0', 'P1', 'P2', 'P3') then
    raise exception 'invalid_feedback_priority' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_assignee, ''))) > 120
    or char_length(btrim(coalesce(p_internal_note, ''))) > 4000
    or char_length(normalized_reply) > 4000 then
    raise exception 'feedback_triage_text_too_long' using errcode = '22001';
  end if;

  update public.feedback_posts
  set
    status = p_status,
    staff_replied_at = case
      when normalized_reply = '' then null
      when staff_reply is distinct from normalized_reply then now()
      else staff_replied_at
    end,
    staff_reply = normalized_reply
  where id = p_post_id;

  if not found then
    raise exception 'feedback_post_not_found' using errcode = 'P0002';
  end if;

  insert into public.feedback_post_admin_details (
    post_id,
    priority,
    assignee,
    internal_note
  ) values (
    p_post_id,
    p_priority,
    btrim(coalesce(p_assignee, '')),
    btrim(coalesce(p_internal_note, ''))
  )
  on conflict (post_id) do update
  set
    priority = excluded.priority,
    assignee = excluded.assignee,
    internal_note = excluded.internal_note;
end;
$$;

revoke all on function public.update_feedback_post_triage(
  uuid, text, text, text, text, text
) from public, anon;
grant execute on function public.update_feedback_post_triage(
  uuid, text, text, text, text, text
) to authenticated;
