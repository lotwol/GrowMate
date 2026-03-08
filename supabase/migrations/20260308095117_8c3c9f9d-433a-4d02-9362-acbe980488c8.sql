
ALTER TABLE public.community_insights
  ADD COLUMN IF NOT EXISTS confidence_level TEXT 
    DEFAULT 'tidig',
  ADD COLUMN IF NOT EXISTS baseline_sow_start INTEGER,
  ADD COLUMN IF NOT EXISTS baseline_sow_end INTEGER,
  ADD COLUMN IF NOT EXISTS baseline_harvest_start INTEGER,
  ADD COLUMN IF NOT EXISTS baseline_harvest_end INTEGER,
  ADD COLUMN IF NOT EXISTS sow_deviation_weeks NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS harvest_deviation_weeks NUMERIC(4,1);

CREATE OR REPLACE FUNCTION public.validate_confidence_level()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.confidence_level IS NOT NULL AND NEW.confidence_level NOT IN ('tidig','växande','tillförlitlig','stark') THEN
    RAISE EXCEPTION 'confidence_level must be one of: tidig, växande, tillförlitlig, stark';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_confidence_level_trigger
  BEFORE INSERT OR UPDATE ON public.community_insights
  FOR EACH ROW EXECUTE FUNCTION public.validate_confidence_level();

CREATE TABLE public.algorithm_learning_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  event_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  sample_count INTEGER,
  confidence_level TEXT,
  deviation_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.algorithm_learning_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read learning log"
  ON public.algorithm_learning_log FOR SELECT USING (true);
