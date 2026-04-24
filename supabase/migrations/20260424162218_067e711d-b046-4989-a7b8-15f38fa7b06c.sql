-- Lock down add_credits so only the server (service_role) can grant credits.
-- Defence in depth: revoke from PUBLIC/authenticated and add an in-function guard.

REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.add_credits(target_user uuid, scans integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Only the service role (server-side) may grant credits.
  if auth.role() is distinct from 'service_role' then
    raise exception 'unauthorized';
  end if;

  update public.profiles
  set vibers = coalesce(vibers, 0) + scans,
      updated_at = now()
  where id = target_user;
end;
$function$;