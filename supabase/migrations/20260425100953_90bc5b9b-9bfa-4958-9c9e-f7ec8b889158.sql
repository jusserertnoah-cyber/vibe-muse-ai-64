-- Table to track welcome pack claims per device
CREATE TABLE public.device_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  email text,
  scans_granted integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_claims_user_id ON public.device_claims(user_id);

ALTER TABLE public.device_claims ENABLE ROW LEVEL SECURITY;

-- Only the service role (edge functions) may read/write. No client policies.
CREATE POLICY "Service role manages device claims"
ON public.device_claims
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Atomic function: claims the welcome pack if device is new, returns status.
-- SECURITY DEFINER + service-role check → only callable from edge functions.
CREATE OR REPLACE FUNCTION public.claim_welcome_pack(
  p_user_id uuid,
  p_device_id text,
  p_email text
)
RETURNS TABLE(granted boolean, reason text, scans integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_claim uuid;
  pack_size integer := 3;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RETURN QUERY SELECT false, 'invalid_device'::text, 0;
    RETURN;
  END IF;

  SELECT id INTO existing_claim
  FROM public.device_claims
  WHERE device_id = p_device_id
  LIMIT 1;

  IF existing_claim IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_claimed'::text, 0;
    RETURN;
  END IF;

  INSERT INTO public.device_claims (device_id, user_id, email, scans_granted)
  VALUES (p_device_id, p_user_id, p_email, pack_size);

  UPDATE public.profiles
  SET vibers = COALESCE(vibers, 0) + pack_size,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN QUERY SELECT true, 'granted'::text, pack_size;
END;
$$;