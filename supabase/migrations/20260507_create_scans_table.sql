-- Create scans table to store analysis results
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  score NUMERIC(3, 1) NOT NULL,
  coherence INTEGER NOT NULL CHECK (coherence >= 0 AND coherence <= 10),
  originalite INTEGER NOT NULL CHECK (originalite >= 0 AND originalite <= 10),
  fit INTEGER NOT NULL CHECK (fit >= 0 AND fit <= 10),
  point_fort TEXT NOT NULL,
  point_faible TEXT NOT NULL,
  conseil TEXT NOT NULL,
  challenge_name TEXT,
  challenge_met BOOLEAN,
  challenge_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_scans"
  ON public.scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_scans"
  ON public.scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER scans_set_updated_at
BEFORE UPDATE ON public.scans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add index for faster queries
CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_created_at ON public.scans(created_at DESC);
