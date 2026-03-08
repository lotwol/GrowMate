
-- Table: seed_shares
CREATE TABLE public.seed_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  crop_name text NOT NULL,
  variety text,
  zone text NOT NULL,
  quantity_description text,
  harvest_year integer,
  notes text,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_seed_share_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'reserved', 'gone') THEN
    RAISE EXCEPTION 'status must be one of: active, reserved, gone';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_seed_share_status_trigger
  BEFORE INSERT OR UPDATE ON public.seed_shares
  FOR EACH ROW EXECUTE FUNCTION public.validate_seed_share_status();

-- Updated_at trigger
CREATE TRIGGER update_seed_shares_updated_at
  BEFORE UPDATE ON public.seed_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seed_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active shares" ON public.seed_shares
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own shares" ON public.seed_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares" ON public.seed_shares
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares" ON public.seed_shares
  FOR DELETE USING (auth.uid() = user_id);

-- Table: seed_share_interests
CREATE TABLE public.seed_share_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_share_id uuid REFERENCES public.seed_shares(id) ON DELETE CASCADE NOT NULL,
  interested_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.seed_share_interests ENABLE ROW LEVEL SECURITY;

-- Users can read interests on their own shares
CREATE POLICY "Share owners can read interests" ON public.seed_share_interests
  FOR SELECT USING (
    interested_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.seed_shares WHERE id = seed_share_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own interests" ON public.seed_share_interests
  FOR INSERT WITH CHECK (auth.uid() = interested_user_id);
