-- =========================================
-- 1. Table posts (feed social)
-- =========================================
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  ai_score INTEGER,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- =========================================
-- 2. RPC consume_credit (atomique)
-- =========================================
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  remaining int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.profiles
  SET vibers = vibers - 1,
      updated_at = now()
  WHERE id = uid AND vibers > 0
  RETURNING vibers INTO remaining;

  RETURN remaining IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credit() FROM public;
GRANT EXECUTE ON FUNCTION public.consume_credit() TO authenticated;