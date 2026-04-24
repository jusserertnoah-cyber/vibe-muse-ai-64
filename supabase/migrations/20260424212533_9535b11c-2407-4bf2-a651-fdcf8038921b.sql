
-- 1) POSTS : enrichissement
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS pseudo text,
  ADD COLUMN IF NOT EXISTS vibe_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS challenge_name text,
  ADD COLUMN IF NOT EXISTS challenge_met boolean NOT NULL DEFAULT false;

-- score décimal : passer de integer à numeric(3,1)
ALTER TABLE public.posts
  ALTER COLUMN ai_score TYPE numeric(3,1) USING ai_score::numeric(3,1);

-- Un seul post actif par utilisateur (le nouveau remplace l'ancien — géré côté code via DELETE puis INSERT)
CREATE UNIQUE INDEX IF NOT EXISTS posts_user_unique ON public.posts(user_id);

CREATE INDEX IF NOT EXISTS posts_vibe_count_idx ON public.posts(vibe_count DESC, created_at DESC);

-- 2) POST_VOTES : un user ne peut "Viber" qu'une fois par post
CREATE TABLE IF NOT EXISTS public.post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by authenticated"
  ON public.post_votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can vote as themselves"
  ON public.post_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
  ON public.post_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3) HALL OF FAME
CREATE TABLE IF NOT EXISTS public.hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pseudo text,
  image_url text NOT NULL,
  score numeric(3,1),
  vibe_count integer NOT NULL DEFAULT 0,
  challenge_name text,
  caption text,
  week_start date NOT NULL,
  week_end date NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hall of Fame public to authenticated"
  ON public.hall_of_fame FOR SELECT TO authenticated USING (true);

-- 4) PROFILES : compteur de défis réussis
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS challenges_completed integer NOT NULL DEFAULT 0;

-- 5) FONCTION : voter Vibe (toggle atomique)
CREATE OR REPLACE FUNCTION public.toggle_vibe(target_post uuid)
RETURNS TABLE(vibed boolean, new_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing uuid;
  cnt integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT id INTO existing FROM public.post_votes
   WHERE post_id = target_post AND user_id = uid;

  IF existing IS NOT NULL THEN
    DELETE FROM public.post_votes WHERE id = existing;
    UPDATE public.posts SET vibe_count = GREATEST(vibe_count - 1, 0)
      WHERE id = target_post RETURNING vibe_count INTO cnt;
    RETURN QUERY SELECT false, COALESCE(cnt, 0);
  ELSE
    INSERT INTO public.post_votes(post_id, user_id) VALUES (target_post, uid);
    UPDATE public.posts SET vibe_count = vibe_count + 1
      WHERE id = target_post RETURNING vibe_count INTO cnt;
    RETURN QUERY SELECT true, COALESCE(cnt, 0);
  END IF;
END;
$$;

-- 6) FONCTION : récompense défi (1 crédit gratuit tous les 10)
CREATE OR REPLACE FUNCTION public.reward_challenge()
RETURNS TABLE(total_completed integer, granted_credit boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_total integer;
  granted boolean := false;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  UPDATE public.profiles
     SET challenges_completed = challenges_completed + 1,
         updated_at = now()
   WHERE id = uid
   RETURNING challenges_completed INTO new_total;

  IF new_total IS NOT NULL AND new_total % 10 = 0 THEN
    UPDATE public.profiles SET vibers = vibers + 1, updated_at = now() WHERE id = uid;
    granted := true;
  END IF;

  RETURN QUERY SELECT COALESCE(new_total, 0), granted;
END;
$$;

-- 7) FONCTION : reset hebdo (à appeler dimanche 23h59)
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
  -- Seul le service role peut tout reset
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

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

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_votes;
