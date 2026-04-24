
CREATE OR REPLACE FUNCTION public.weekly_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  winner record;
  ws date := (date_trunc('week', now())::date);
  we date := (date_trunc('week', now())::date + 6);
BEGIN
  SELECT * INTO winner FROM public.posts
   ORDER BY vibe_count DESC, created_at ASC LIMIT 1;

  IF winner.id IS NOT NULL THEN
    INSERT INTO public.hall_of_fame(
      user_id, pseudo, image_url, score, vibe_count, challenge_name, caption, week_start, week_end
    ) VALUES (
      winner.user_id, winner.pseudo, winner.image_url, winner.ai_score,
      winner.vibe_count, winner.challenge_name, winner.caption, ws, we
    );
  END IF;

  DELETE FROM public.posts;
END;
$$;

REVOKE ALL ON FUNCTION public.weekly_reset() FROM public, anon, authenticated;
