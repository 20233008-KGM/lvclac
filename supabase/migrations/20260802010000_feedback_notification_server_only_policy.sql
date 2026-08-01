-- 기존 적용 DB에도 service_role 전용 알림 장부의 명시적 거부 정책을 추가한다.
-- service_role은 RLS를 우회하며, anon/authenticated는 권한 취소 + false 정책으로 차단된다.

drop policy if exists "Feedback notifications are server only"
  on public.feedback_post_notifications;
create policy "Feedback notifications are server only"
on public.feedback_post_notifications for all
to anon, authenticated
using (false)
with check (false);
