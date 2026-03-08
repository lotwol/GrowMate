-- Swedish crop tips table
CREATE TABLE public.swedish_crop_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  crop_name_latin TEXT,
  category TEXT NOT NULL,
  zone TEXT NOT NULL,
  sow_indoor_start INTEGER,
  sow_indoor_end INTEGER,
  sow_outdoor_start INTEGER,
  sow_outdoor_end INTEGER,
  harvest_start INTEGER,
  harvest_end INTEGER,
  days_to_harvest INTEGER,
  spacing_cm INTEGER,
  difficulty TEXT,
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.swedish_crop_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crop tips" ON public.swedish_crop_tips FOR SELECT USING (true);

-- Community growing data (anonymous)
CREATE TABLE public.community_growing_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  sow_date DATE,
  harvest_date DATE,
  success_rating INTEGER,
  garden_type TEXT,
  notes_public TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_growing_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can contribute anonymously" ON public.community_growing_data FOR INSERT WITH CHECK (true);

-- Community insights (aggregated, read-only)
CREATE TABLE public.community_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  sample_count INTEGER DEFAULT 0,
  avg_success_rating NUMERIC(3,2),
  typical_sow_month_start INTEGER,
  typical_sow_month_end INTEGER,
  typical_harvest_month_start INTEGER,
  typical_harvest_month_end INTEGER,
  common_notes TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(crop_name, zone)
);

ALTER TABLE public.community_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insights" ON public.community_insights FOR SELECT USING (true);