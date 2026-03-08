-- Add season_year to crops
ALTER TABLE public.crops ADD COLUMN season_year integer DEFAULT EXTRACT(YEAR FROM now())::integer;

-- Update existing crops to derive year from sow_date or created_at
UPDATE public.crops SET season_year = EXTRACT(YEAR FROM COALESCE(sow_date, created_at))::integer;

-- Garden layouts table
CREATE TABLE public.garden_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id uuid NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  season_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  layout_type text NOT NULL DEFAULT 'grid',
  rows integer DEFAULT 4,
  cols integer DEFAULT 6,
  photo_url text,
  zones jsonb DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(garden_id, season_year)
);

-- Crop placements on layout
CREATE TABLE public.crop_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid NOT NULL REFERENCES public.garden_layouts(id) ON DELETE CASCADE,
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  zone_id text,
  cell_row integer,
  cell_col integer,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(layout_id, crop_id)
);

-- RLS for garden_layouts
ALTER TABLE public.garden_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own layouts" ON public.garden_layouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own layouts" ON public.garden_layouts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own layouts" ON public.garden_layouts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own layouts" ON public.garden_layouts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for crop_placements
ALTER TABLE public.crop_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own placements" ON public.crop_placements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own placements" ON public.crop_placements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own placements" ON public.crop_placements
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own placements" ON public.crop_placements
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_garden_layouts_updated_at BEFORE UPDATE ON public.garden_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();