-- ============================================================
-- Referral code system
-- ============================================================

-- 1. Track which institutional code a user signed up with
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code_used text;

-- 2. Admin-managed pool of school / institutional codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text         UNIQUE NOT NULL,
  description text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  used_count  int          NOT NULL DEFAULT 0
);

-- 3. Audit trail of discounts applied at payment time
CREATE TABLE IF NOT EXISTS public.subscription_discounts (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid           NOT NULL REFERENCES public.profiles(id),
  code            text           NOT NULL,
  discount_amount decimal(10,2)  NOT NULL,
  applied_at      timestamptz    NOT NULL DEFAULT now()
);

-- ---- Row Level Security ----------------------------------------

ALTER TABLE public.referral_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_discounts ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated) can look up a code to validate it at signup.
CREATE POLICY "referral_codes_public_read"
  ON public.referral_codes FOR SELECT USING (true);

-- Users can read their own discount records.
CREATE POLICY "sub_discounts_own_read"
  ON public.subscription_discounts FOR SELECT
  USING (auth.uid() = user_id);

-- ---- Helper functions (SECURITY DEFINER) ----------------------

-- Validate a code and atomically apply it to the calling user's profile.
-- Returns {valid: true} on success, {valid: false, error: "..."} if not found.
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM referral_codes WHERE code = p_code) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid referral code');
  END IF;

  -- Idempotent: only set if not already set (ignore if user somehow applies twice)
  UPDATE profiles
     SET referral_code_used = p_code
   WHERE id = auth.uid()
     AND referral_code_used IS NULL;

  UPDATE referral_codes
     SET used_count = used_count + 1
   WHERE code = p_code;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- Admin: create a new referral code.
CREATE OR REPLACE FUNCTION public.admin_create_referral_code(p_code text, p_description text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  INSERT INTO referral_codes (code, description) VALUES (p_code, p_description);
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Admin: list all referral codes.
CREATE OR REPLACE FUNCTION public.admin_get_referral_codes()
RETURNS TABLE (
  id          uuid,
  code        text,
  description text,
  created_at  timestamptz,
  used_count  int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT r.id, r.code, r.description, r.created_at, r.used_count
      FROM referral_codes r
     ORDER BY r.created_at DESC;
END;
$$;
