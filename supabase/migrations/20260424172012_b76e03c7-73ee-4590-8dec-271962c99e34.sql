ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS story_count integer NOT NULL DEFAULT 0;