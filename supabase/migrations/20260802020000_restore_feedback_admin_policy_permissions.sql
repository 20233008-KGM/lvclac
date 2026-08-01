-- RLS policies execute private.is_admin() as the authenticated caller.
-- Keep the helper outside PostgREST's exposed public schema, while granting
-- only the privileges required for authenticated policy evaluation.

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
