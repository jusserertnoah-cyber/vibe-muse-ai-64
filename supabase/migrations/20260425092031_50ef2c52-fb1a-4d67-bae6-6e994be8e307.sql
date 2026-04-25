CREATE OR REPLACE FUNCTION public.weekly_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset total : on supprime tous les votes et tous les posts.
  -- Aucune archive : tout repart à zéro chaque semaine.
  DELETE FROM public.post_votes;
  DELETE FROM public.posts;
END;
$function$;